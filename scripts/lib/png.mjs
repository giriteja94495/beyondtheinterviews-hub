// Minimal PNG decoder (8-bit, non-interlaced, colour types 0/2/3/4/6).
// Flattens alpha over white and returns packed RGB, ready for PDF FlateDecode.
import zlib from "node:zlib";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function decodePng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIG)) return null;

  let pos = 8;
  let ihdr = null;
  const idat = [];
  let palette = null;
  let trns = null;

  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const dataStart = pos + 8;
    const dataEnd = dataStart + len;
    if (dataEnd > buf.length) break;

    if (type === "IHDR") {
      ihdr = {
        width: buf.readUInt32BE(dataStart),
        height: buf.readUInt32BE(dataStart + 4),
        bitDepth: buf[dataStart + 8],
        colorType: buf[dataStart + 9],
        interlace: buf[dataStart + 12]
      };
    } else if (type === "PLTE") {
      palette = buf.subarray(dataStart, dataEnd);
    } else if (type === "tRNS") {
      trns = buf.subarray(dataStart, dataEnd);
    } else if (type === "IDAT") {
      idat.push(buf.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    pos = dataEnd + 4;
  }

  if (!ihdr || !idat.length) return null;
  if (ihdr.interlace !== 0) return null;
  if (ihdr.bitDepth !== 8) return null;

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colorType];
  if (!channels) return null;

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width, height } = ihdr;
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);

  // Undo per-scanline filters.
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[rp + x];
      const a = x >= channels ? out[rowStart + x - channels] : 0;
      const b = y > 0 ? out[prevStart + x] : 0;
      const c = x >= channels && y > 0 ? out[prevStart + x - channels] : 0;
      let val;
      switch (filter) {
        case 0: val = rawByte; break;
        case 1: val = rawByte + a; break;
        case 2: val = rawByte + b; break;
        case 3: val = rawByte + ((a + b) >> 1); break;
        case 4: val = rawByte + paeth(a, b, c); break;
        default: return null;
      }
      out[rowStart + x] = val & 0xff;
    }
    rp += stride;
  }

  // Flatten to RGB (or grayscale if the image has no chroma).
  const rgb = Buffer.alloc(width * height * 3);
  let grayscale = true;
  const px = (x, y) => {
    const o = y * stride + x * channels;
    let r, g, b, al = 255;
    switch (ihdr.colorType) {
      case 0: r = g = b = out[o]; break;
      case 4: r = g = b = out[o]; al = out[o + 1]; break;
      case 2: r = out[o]; g = out[o + 1]; b = out[o + 2]; break;
      case 6: r = out[o]; g = out[o + 1]; b = out[o + 2]; al = out[o + 3]; break;
      case 3: {
        const i = out[o] * 3;
        r = palette[i]; g = palette[i + 1]; b = palette[i + 2];
        break;
      }
      default: r = g = b = 0;
    }
    if (al < 255) {
      const t = al / 255;
      r = Math.round(r * t + 255 * (1 - t));
      g = Math.round(g * t + 255 * (1 - t));
      b = Math.round(b * t + 255 * (1 - t));
    }
    return [r, g, b];
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = px(x, y);
      const i = (y * width + x) * 3;
      rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b;
      if (grayscale && !(r === g && g === b)) grayscale = false;
    }
  }

  if (grayscale) {
    const gray = Buffer.alloc(width * height);
    for (let i = 0; i < width * height; i++) gray[i] = rgb[i * 3];
    return { width, height, colorspace: "DeviceGray", data: gray, grayscale: true };
  }
  return { width, height, colorspace: "DeviceRGB", data: rgb, grayscale: false };
}

// Convert decoded image data into the bottom-up row order PDF expects, and
// pick a grayscale colour space when every pixel is neutral (much smaller).
export function prepareImageData({ width, height, colorspace, data }) {
  const channels = colorspace === "DeviceGray" ? 1 : 3;

  // Detect effectively-grayscale RGB (JPEG often carries neutral chroma).
  let useGray = channels === 1;
  if (channels === 3) {
    useGray = true;
    for (let i = 0; i < data.length; i += 3) {
      if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) { useGray = false; break; }
    }
  }

  const rowBytes = width * (useGray ? 1 : 3);
  // jpeg-js already yields top-down rows and PDF images are drawn top-down
  // within their placement rect, so only channel packing is needed here.
  const packed = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const src = y * width * channels;
    const dst = y * rowBytes;
    if (useGray) {
      if (channels === 1) {
        data.copy(packed, dst, src, src + width);
      } else {
        for (let x = 0; x < width; x++) packed[dst + x] = data[src + x * 3];
      }
    } else {
      data.copy(packed, dst, src, src + rowBytes);
    }
  }
  return { width, height, colorspace: useGray ? "DeviceGray" : "DeviceRGB", data: packed };
}
export function downscale(img, maxDim) {
  const { width, height, data, colorspace } = img;
  const channels = colorspace === "DeviceGray" ? 1 : 3;
  const longest = Math.max(width, height);
  if (longest <= maxDim) return img;

  const scale = maxDim / longest;
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const out = Buffer.alloc(w * h * channels);

  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y * height) / h);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / h));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * width) / w);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / w));
      const sums = [0, 0, 0];
      let n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const o = (sy * width + sx) * channels;
          for (let c = 0; c < channels; c++) sums[c] += data[o + c];
          n++;
        }
      }
      const o = (y * w + x) * channels;
      for (let c = 0; c < channels; c++) out[o + c] = Math.round(sums[c] / n);
    }
  }
  return { width: w, height: h, colorspace, data: out, grayscale: colorspace === "DeviceGray" };
}
