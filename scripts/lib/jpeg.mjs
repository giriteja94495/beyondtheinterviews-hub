// Minimal baseline + progressive JPEG decoder producing packed RGB.
// Supports 8-bit precision, greyscale and YCbCr with any sampling factors,
// including progressive scans (spectral selection + successive approximation).
// Not supported: 12-bit, CMYK/Adobe, arithmetic coding, restart markers.

const ZIGZAG = new Int32Array([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5,
  12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28,
  35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51,
  58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63
]);

const IDCT = [];
for (let x = 0; x < 8; x++) {
  IDCT[x] = new Float32Array(8);
  for (let u = 0; u < 8; u++) {
    IDCT[x][u] = Math.cos(((2 * x + 1) * u * Math.PI) / 16) * (u === 0 ? Math.SQRT1_2 : 1);
  }
}

function clamp8(v) {
  v = Math.round(v);
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

export function isJpeg(buf) {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
}

function buildHuff(counts, values) {
  const table = Array.from({ length: 17 }, () => ({}));
  let code = 0, k = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < counts[len - 1]; i++) table[len][code++] = values[k++];
    code <<= 1;
  }
  return table;
}

export function decodeJpeg(buf) {
  if (!isJpeg(buf)) return null;

  const frame = { width: 0, height: 0, progressive: false, components: [], maxH: 0, maxV: 0 };
  const quantTables = [];
  const huffTables = [];

  let bitPos = 0;
  let entropyBits = null; // de-stuffed entropy bytes for the current scan
  let eobrun = 0;

  const resetBits = () => { bitPos = 0; eobrun = 0; };

  // Entropy segments byte-stuff 0xFF as 0xFF 0x00; removing the pad bytes up
  // front keeps bit extraction trivial and avoids alignment mistakes.
  function setEntropy(start, end) {
    const bytes = [];
    for (let i = start; i < end; i++) {
      bytes.push(buf[i]);
      if (buf[i] === 0xff && buf[i + 1] === 0x00) i++;
    }
    entropyBits = Buffer.from(bytes);
    bitPos = 0;
  }

  function receiveBit() {
    if ((bitPos >> 3) >= entropyBits.length) return 0;
    const byte = entropyBits[bitPos >> 3];
    const bit = (byte >> (7 - (bitPos & 7))) & 1;
    bitPos++;
    return bit;
  }

  function receiveExtend(s) {
    if (s === 0) return 0;
    let v = 0;
    for (let i = 0; i < s; i++) v = (v << 1) | receiveBit();
    const vt = 1 << (s - 1);
    return v < vt ? v - (1 << s) + 1 : v;
  }

  function decodeHuff(table) {
    let code = 0;
    for (let len = 1; len <= 16; len++) {
      code = (code << 1) | receiveBit();
      const entry = table[len][code];
      if (entry !== undefined) return entry;
    }
    return 0;
  }

  const EMPTY_HUFF = Array.from({ length: 17 }, () => ({}));
  // Progressive streams sometimes reference table slot 1 for AC when only
  // slot 0 was defined; fall back rather than decoding nothing.
  const dcTable = (id) => huffTables[0 + id] || huffTables[0] || EMPTY_HUFF;
  const acTable = (id) => huffTables[4 + id] || huffTables[4] || EMPTY_HUFF;

  // ---- block decoders ----

  function decodeBaseline(comp, block) {
    block.fill(0);
    const s = decodeHuff(dcTable(comp.dcHuff));
    comp.dcPred = (comp.dcPred || 0) + receiveExtend(s);
    block[0] = comp.dcPred;

    let k = 1;
    while (k < 64) {
      const rs = decodeHuff(acTable(comp.acHuff));
      const r = rs >> 4;
      const size = rs & 15;
      if (size === 0) {
        if (r === 15) { k += 16; continue; }
        break;
      }
      k += r;
      if (k > 63) break;
      block[ZIGZAG[k]] = receiveExtend(size);
      k++;
    }
  }

  function decodeDcFirst(comp, block) {
    const s = decodeHuff(dcTable(comp.progDC));
    comp.dcPred = (comp.dcPred || 0) + receiveExtend(s);
    block[0] = comp.dcPred << comp.progAl;
  }

  function refineDc(comp, block) {
    if (receiveBit()) block[0] |= 1 << comp.progAl;
  }
  function decodeAcFirst(comp, block) {
    if (eobrun > 0) { eobrun--; return; }
    let k = comp.progSs;
    while (k <= comp.progSe) {
      const rs = decodeHuff(acTable(comp.progAC));
      const r = rs >> 4;
      const s = rs & 15;
      if (s === 0) {
        if (r < 15) {
          eobrun = (1 << r) - 1;
          if (r > 0) {
            let extra = 0;
            for (let i = 0; i < r; i++) extra = (extra << 1) | receiveBit();
            eobrun += extra;
          }
          return;
        }
        k += 16;
        continue;
      }
      k += r;
      if (k > comp.progSe) break;
      block[ZIGZAG[k]] = receiveExtend(s) << comp.progAl;
      k++;
    }
  }

  function refineAc(comp, block) {
    let k = comp.progSs;
    const bit = 1 << comp.progAl;

    if (eobrun > 0) {
      // Consume only refinement bits for already-nonzero coefficients.
      while (k <= comp.progSe) {
        const idx = ZIGZAG[k];
        if (block[idx] !== 0 && receiveBit()) {
          block[idx] += block[idx] > 0 ? bit : -bit;
        }
        k++;
      }
      eobrun--;
      return;
    }

    while (k <= comp.progSe) {
      const rs = decodeHuff(acTable(comp.progAC));
      let r = rs >> 4;
      const s = rs & 15;

      if (s === 0) {
        if (r < 15) {
          // End of this block's band, plus a run of following blocks.
          eobrun = (1 << r) - 1;
          if (r > 0) {
            let extra = 0;
            for (let i = 0; i < r; i++) extra = (extra << 1) | receiveBit();
            eobrun += extra;
          }
          // Refine the remaining coefficients in this block, then stop.
          while (k <= comp.progSe) {
            const idx = ZIGZAG[k];
            if (block[idx] !== 0 && receiveBit()) {
              block[idx] += block[idx] > 0 ? bit : -bit;
            }
            k++;
          }
          eobrun--;
          return;
        }
        // ZRL: advance over 16 *zero* coefficients, but existing nonzeros in
        // that span still consume a refinement bit each.
        let skipped = 0;
        while (k <= comp.progSe && skipped < 16) {
          const idx = ZIGZAG[k];
          if (block[idx] !== 0) {
            if (receiveBit()) block[idx] += block[idx] > 0 ? bit : -bit;
          } else {
            skipped++;
          }
          k++;
        }
        continue;
      }

      if (s !== 1) return; // malformed for a refinement scan

      // Copy zero-run: refine existing nonzeros, then place one new +-bit.
      while (k <= comp.progSe) {
        const idx = ZIGZAG[k];
        if (block[idx] !== 0) {
          if (receiveBit()) block[idx] += block[idx] > 0 ? bit : -bit;
        } else {
          if (r === 0) break;
          r--;
        }
        k++;
      }
      if (k > comp.progSe) return;
      block[ZIGZAG[k]] = receiveBit() ? bit : -bit;
      k++;
    }
  }

  const decodeProgressive = (comp, block) => {
    if (comp.progSs === 0) {
      if (comp.progAh === 0) decodeDcFirst(comp, block);
      else refineDc(comp, block);
    } else if (comp.progAh === 0) {
      decodeAcFirst(comp, block);
    } else {
      refineAc(comp, block);
    }
  };

  // ---- marker scan ----
  let pos = 2;

  while (pos < buf.length) {
    if (buf[pos] !== 0xff) { pos++; continue; }
    let marker = buf[pos + 1];
    pos += 2;

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01
      || (marker >= 0xd0 && marker <= 0xd7)) continue;

    if (marker === 0xff) continue; // fill byte
    const len = (buf[pos] << 8) | buf[pos + 1];
    if (len < 2) return null;
    const segStart = pos + 2;
    const segEnd = pos + len;

    if (marker === 0xda) {
      // ---- SOS ----
      const ns = buf[segStart];
      let p = segStart + 1;
      const scanComps = [];
      for (let i = 0; i < ns; i++) {
        const id = buf[p];
        const tables = buf[p + 1];
        p += 2;
        const comp = frame.components.find((c) => c.id === id);
        if (!comp) return null;
        // Table byte: high nibble selects the DC table, low nibble the AC table.
        comp.dcHuff = tables >> 4;
        comp.acHuff = tables & 15;
        comp.progDC = tables >> 4;
        comp.progAC = tables & 15;
        scanComps.push(comp);
      }
      const ss = buf[p];
      const se = buf[p + 1];
      const a = buf[p + 2];
      pos = p + 3;

      for (const comp of scanComps) {
        comp.progSs = ss;
        comp.progSe = se;
        comp.progAh = a >> 4;
        comp.progAl = a & 15;
      }
      const entropyStart = pos;
      let scan = pos;
      while (scan < buf.length - 1) {
        if (buf[scan] === 0xff) {
          const next = buf[scan + 1];
          if (next !== 0x00 && !(next >= 0xd0 && next <= 0xd7)) break;
        }
        scan++;
      }
      const entropyEnd = scan;
      setEntropy(entropyStart, entropyEnd);
      resetBits();

      // DC prediction and the EOB run counter reset at the start of every scan.
      for (const comp of scanComps) comp.dcPred = 0;
      eobrun = 0;

      const interleaved = scanComps.length > 1;
      if (interleaved) {
        const mcusX = Math.ceil(frame.width / (8 * frame.maxH));
        const mcusY = Math.ceil(frame.height / (8 * frame.maxV));
        const scratch = new Float32Array(64);
        for (let my = 0; my < mcusY; my++) {
          for (let mx = 0; mx < mcusX; mx++) {
            for (const comp of scanComps) {
              for (let v = 0; v < comp.v; v++) {
                for (let h = 0; h < comp.h; h++) {
                  const bx = mx * comp.h + h;
                  const by = my * comp.v + v;
                  if (bx >= comp.bw || by >= comp.bh) {
                    scratch.fill(0);
                    frame.progressive ? decodeProgressive(comp, scratch) : decodeBaseline(comp, scratch);
                    continue;
                  }                  const off = (by * comp.bw + bx) * 64;
                  const view = comp.plane.coeffs.subarray(off, off + 64);
                  if (!frame.progressive) {
                    comp.dcPred = comp.plane.preds[by * comp.bw + bx];
                    decodeBaseline(comp, view);
                    comp.plane.preds[by * comp.bw + bx] = comp.dcPred;
                  } else {
                    decodeProgressive(comp, view);
                  }
                }
              }
            }
          }
        }
      } else {
        const comp = scanComps[0];
        for (let by = 0; by < comp.bh; by++) {
          for (let bx = 0; bx < comp.bw; bx++) {
            const off = (by * comp.bw + bx) * 64;
            const view = comp.plane.coeffs.subarray(off, off + 64);
            if (!frame.progressive) {
              comp.dcPred = comp.plane.preds[by * comp.bw + bx];
              decodeBaseline(comp, view);
              comp.plane.preds[by * comp.bw + bx] = comp.dcPred;
            } else {
              decodeProgressive(comp, view);
            }
          }
        }
      }

      pos = entropyEnd;
      continue;
    }

    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (buf[segStart] !== 8) return null; // 12-bit not supported
      frame.height = (buf[segStart + 1] << 8) | buf[segStart + 2];
      frame.width = (buf[segStart + 3] << 8) | buf[segStart + 4];
      const nc = buf[segStart + 5];
      frame.progressive = marker === 0xc2 || marker === 0xc6 || marker === 0xca || marker === 0xce;

      frame.components = [];
      let p = segStart + 6;
      for (let i = 0; i < nc; i++) {
        frame.components.push({
          id: buf[p], h: buf[p + 1] >> 4, v: buf[p + 1] & 15, tq: buf[p + 2]
        });
        p += 3;
      }
      frame.maxH = Math.max(...frame.components.map((c) => c.h));
      frame.maxV = Math.max(...frame.components.map((c) => c.v));

      for (const c of frame.components) {
        c.bw = Math.ceil((frame.width * c.h) / (8 * frame.maxH));
        c.bh = Math.ceil((frame.height * c.v) / (8 * frame.maxV));
        c.plane = {
          coeffs: new Float32Array(c.bw * c.bh * 64),
          preds: new Int32Array(c.bw * c.bh)
        };
      }
    } else if (marker === 0xc4) {
      let p = segStart;
      while (p < segEnd) {
        const tc = buf[p] >> 4;
        const th = buf[p] & 15;
        const counts = Array.from(buf.subarray(p + 1, p + 17));
        const total = counts.reduce((a, b) => a + b, 0);
        const values = Array.from(buf.subarray(p + 17, p + 17 + total));
        huffTables[tc * 4 + th] = buildHuff(counts, values);
        p += 17 + total;
      }
    } else if (marker === 0xdb) {
      let p = segStart;
      while (p < segEnd) {
        const pq = buf[p] >> 4;
        const tq = buf[p] & 15;
        const table = new Float32Array(64);
        if (pq === 0) {
          for (let i = 0; i < 64; i++) table[i] = buf[p + 1 + i];
          p += 65;
        } else {
          for (let i = 0; i < 64; i++) table[i] = (buf[p + 1 + i * 2] << 8) | buf[p + 2 + i * 2];
          p += 129;
        }
        quantTables[tq] = table;
      }
    }

    pos = segEnd;
  }

  if (!frame.width || !frame.height || !frame.components.length) return null;
  if (!quantTables.some(Boolean)) return null;

  // ---- IDCT + colour conversion ----
  const { width, height, components, maxH, maxV } = frame;
  const rgb = Buffer.alloc(width * height * 3);
  const planes = [];

  for (const comp of components) {
    const qt = quantTables[comp.tq] || quantTables[0] || new Float32Array(64).fill(1);
    const out = new Float32Array(comp.bw * 8 * comp.bh * 8);
    const stride = comp.bw * 8;
    const blk = new Float32Array(64);
    const tmp = new Float32Array(64);

    for (let by = 0; by < comp.bh; by++) {
      for (let bx = 0; bx < comp.bw; bx++) {
        const off = (by * comp.bw + bx) * 64;
        for (let i = 0; i < 64; i++) blk[i] = comp.plane.coeffs[off + i] * qt[i];

        // Separable IDCT. Pass 1 is unscaled; pass 2 applies the 1/4 that the
        // JPEG spec places in front of the double sum. blk is raster-ordered:
        // blk[v*8 + u]. Odd pass 0 output at DC gives F/8 as the spec requires.
        for (let u = 0; u < 8; u++) {
          for (let y = 0; y < 8; y++) {
            let sum = 0;
            for (let v = 0; v < 8; v++) sum += C_QUANT[v] * IDCT[y][v] * blk[v * 8 + u];
            tmp[y * 8 + u] = sum;
          }
        }
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            let sum = 0;
            for (let u = 0; u < 8; u++) sum += C_QUANT[u] * IDCT[x][u] * tmp[y * 8 + u];
            out[(by * 8 + y) * stride + bx * 8 + x] = sum / 2 + 128;
          }
        }
      }
    }
    planes.push({ out, stride, cols: comp.bw * 8, rows: comp.bh * 8, h: comp.h, v: comp.v });
  }

  const sample = (plane, x, y) => {
    let sx = Math.floor((x * plane.h) / maxH);
    let sy = Math.floor((y * plane.v) / maxV);
    if (sx >= plane.cols) sx = plane.cols - 1;
    if (sy >= plane.rows) sy = plane.rows - 1;
    return plane.out[sy * plane.stride + sx];
  };

  if (components.length === 1) {
    const p = planes[0];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = clamp8(sample(p, x, y));
        const i = (y * width + x) * 3;
        rgb[i] = rgb[i + 1] = rgb[i + 2] = v;
      }
    }
  } else {
    const [py, pcb, pcr] = planes;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const Y = sample(py, x, y);
        const Cb = sample(pcb, x, y) - 128;
        const Cr = sample(pcr, x, y) - 128;
        const i = (y * width + x) * 3;
        rgb[i] = clamp8(Y + 1.402 * Cr);
        rgb[i + 1] = clamp8(Y - 0.344136 * Cb - 0.714136 * Cr);
        rgb[i + 2] = clamp8(Y + 1.772 * Cb);
      }
    }
  }

  return { width, height, colorspace: "DeviceRGB", data: rgb, grayscale: false };
}

const C_QUANT = new Float32Array(8);
for (let u = 0; u < 8; u++) C_QUANT[u] = u === 0 ? Math.SQRT1_2 : 1;
