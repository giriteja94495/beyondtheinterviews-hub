// Zero-dependency multi-page PDF writer (PDF 1.4, base-14 fonts, WinAnsi).
// Supports flowing paragraphs, headings, lists, code blocks, quotes, rules,
// embedded images, an auto-generated table of contents, and page footers.
import zlib from "node:zlib";

const PAGE_W = 595;   // A4 @ 72dpi
const PAGE_H = 842;
const MARGIN_L = 58;
const MARGIN_R = 58;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 62;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const BODY_BOTTOM = PAGE_H - MARGIN_BOTTOM;

// ---------------------------------------------------------------- encoding

const WIN_EXTRA = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f]
]);

// Characters Windows-1252 cannot represent -> readable ASCII stand-ins.
const ASCII_FALLBACK = new Map([
  [0x2192, "->"], [0x2190, "<-"], [0x21d2, "=>"], [0x2264, "<="], [0x2265, ">="],
  [0x2260, "!="], [0x2248, "~="], [0x221e, "inf"], [0x00b5, "u"], [0x20b9, "Rs."],
  [0x2713, "v"], [0x2717, "x"], [0x2500, "-"], [0x2502, "|"], [0x2514, "\\"],
  [0x251c, "|"], [0x2534, "-"], [0x256d, "+"], [0x256e, "+"], [0x256f, "+"],
  [0x2570, "+"], [0x2588, "#"], [0x25b6, ">"], [0x2023, ">"], [0x2043, "-"],
  [0x3000, " "], [0x2060, ""], [0x200b, ""], [0xfeff, ""]
]);

export function toWinAnsi(str) {
  let out = "";
  for (const ch of String(str)) {
    const c = ch.codePointAt(0);
    if (c < 0x80) { out += ch; continue; }
    const ext = WIN_EXTRA.get(c);
    if (ext !== undefined) { out += String.fromCharCode(ext); continue; }
    if (c <= 0xff) { out += ch; continue; }
    const fb = ASCII_FALLBACK.get(c);
    if (fb !== undefined) { out += fb; continue; }
    if (c >= 0x2000 && c <= 0x200f) { out += " "; continue; } // stray spaces/dashes
    out += "?";
  }
  return out;
}

// ---------------------------------------------------------------- metrics

const HELV = [
  278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
  1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,
  667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
  333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,
  556,556,333,500,278,556,500,722,500,500,500,334,260,334,584
];

const HELV_BOLD = [
  278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,
  975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,
  667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,
  333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,
  611,611,389,556,333,611,556,778,556,556,500,389,280,389,584
];

const FONTS = {
  F1: { base: "Helvetica", widths: HELV },
  F2: { base: "Helvetica-Bold", widths: HELV_BOLD },
  F3: { base: "Helvetica-Oblique", widths: HELV },
  F4: { base: "Courier", widths: null } // monospace: every glyph is 600
};

function charWidth(font, code) {
  const f = FONTS[font];
  if (!f.widths) return 600;
  if (code < 32 || code > 126) return f.widths[63]; // '?' width for high bytes
  return f.widths[code - 32];
}

function textWidth(font, size, str) {
  let w = 0;
  for (const ch of str) w += charWidth(font, ch.codePointAt(0));
  return (w / 1000) * size;
}

function wrap(font, size, str, maxWidth) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(font, size, candidate) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// Break long unbroken tokens (URLs, hashes) so they do not overflow.
function hardBreak(font, size, line, maxWidth) {
  if (textWidth(font, size, line) <= maxWidth) return [line];
  const out = [];
  let cur = "";
  for (const ch of line) {
    if (textWidth(font, size, cur + ch) > maxWidth && cur) {
      out.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ---------------------------------------------------------------- document

export class PdfDoc {
  constructor({ title = "", subtitle = "", author = "", footer = "" } = {}) {
    this.meta = { title, subtitle, author, footer };
    this.pages = [];
    this.newPage();
    this.headings = []; // { text, lvl, pageIndex }
    this.toc = [];      // { text, lvl }
    this.images = [];   // compressed XObjects
    this.y = MARGIN_TOP;
  }

  // Register an image and return its 1-based resource id.
  registerImage({ width, height, colorspace, data }) {
    this.images.push({
      width, height, colorspace,
      data: zlib.deflateSync(data, { level: 9 }),
      raw: data.length
    });
    return this.images.length;
  }

  newPage() {
    this.pages.push([]);
    this.y = MARGIN_TOP;
  }

  get pageIndex() { return this.pages.length - 1; }

  ensure(height) {
    if (this.y + height > BODY_BOTTOM) this.newPage();
  }

  raw(op) { this.pages[this.pageIndex].push(op); }

  text(str, { font = "F1", size = 10, x = MARGIN_L, leading = 0, color = null } = {}) {
    return { k: "text", str: toWinAnsi(str), font, size, x, y: this.y, leading, color };
  }

  // ---- public flow API -------------------------------------------------

  title(text, size = 22) {
    this.ensure(size + 24);
    this.y += 6;
    for (const line of wrap("F2", size, text, CONTENT_W)) {
      this.ensure(size * 1.25);
      this.raw(this.text(line, { font: "F2", size, leading: size * 1.25 }));
      this.y += size * 1.25;
    }
    this.y += 8;
  }

  heading(text, lvl = 2) {
    const spec = {
      2: { size: 14.5, before: 16, after: 7 },
      3: { size: 12, before: 13, after: 5 },
      4: { size: 10.5, before: 11, after: 4 }
    }[Math.min(4, Math.max(2, lvl))];

    // Never orphan a heading at the page bottom.
    if (this.y + spec.before + spec.size * 1.3 + 24 > BODY_BOTTOM) this.newPage();

    this.recordHeading(text, lvl);
    this.y += spec.before;
    for (const line of wrap("F2", spec.size, text, CONTENT_W)) {
      this.ensure(spec.size * 1.3);
      this.raw(this.text(line, { font: "F2", size: spec.size, leading: spec.size * 1.3 }));
      this.y += spec.size * 1.3;
    }
    this.y += spec.after;
  }

  recordHeading(text, lvl) {
    this.headings.push({ text, lvl, pageIndex: this.pageIndex });
  }

  paragraph(text, { size = 9.6, leading = 13.4, indent = 0, font = "F1", color = null, after = 6.5 } = {}) {
    const maxW = CONTENT_W - indent;
    for (const line of wrap(font, size, text, maxW)) {
      const parts = hardBreak(font, size, line, maxW);
      for (const p of parts) {
        this.ensure(leading);
        this.raw(this.text(p, { font, size, x: MARGIN_L + indent, leading, color }));
        this.y += leading;
      }
    }
    this.y += after;
  }

  bullet(text, { ordered = false, index = 1, depth = 0, size = 9.6, leading = 13.4 } = {}) {
    const indent = 14 + depth * 14;
    const marker = ordered ? `${index}.` : "\u2022";
    const markerW = textWidth("F1", size, `${marker} `);
    const maxW = CONTENT_W - indent - markerW;
    const lines = wrap("F1", size, text, maxW);

    lines.forEach((line, i) => {
      this.ensure(leading);
      const x = MARGIN_L + indent;
      if (i === 0) this.raw(this.text(marker, { font: ordered ? "F2" : "F1", size, x }));
      this.raw(this.text(line, { font: "F1", size, x: x + markerW, leading }));
      this.y += leading;
    });
    this.y += 2.5;
  }

  code(text, { size = 8.2, leading = 11 } = {}) {
    const maxChars = Math.max(20, Math.floor((CONTENT_W - 16) / (size * 0.6)));
    const wrapped = [];
    for (const rawLine of String(text).split("\n")) {
      if (!rawLine.trim()) { wrapped.push(""); continue; }
      let line = rawLine.replace(/\t/g, "    ").replace(/\s+$/, "");
      while (line.length > maxChars) {
        wrapped.push(line.slice(0, maxChars));
        line = line.slice(maxChars);
      }
      wrapped.push(line);
    }

    // Keep short code blocks together; split long ones across pages.
    const padY = 7;
    const blockH = wrapped.length * leading + padY * 2;
    if (blockH <= BODY_BOTTOM - MARGIN_TOP && this.y + blockH + 8 > BODY_BOTTOM) {
      this.newPage();
    }

    this.y += 6;
    let runStart = null;
    let runLines = 0;

    const flushRun = () => {
      if (runStart === null) return;
      const top = runStart - padY;                    // top edge in flow space
      const bottom = this.y + padY;                   // bottom edge in flow space
      this.pages[this.pageIndex].push({
        k: "rect",
        x: MARGIN_L,
        y: top,
        w: CONTENT_W,
        h: Math.max(0, bottom - top),
        fill: 0.955
      });
      runStart = null;
      runLines = 0;
    };

    for (const line of wrapped) {
      this.ensure(leading + padY);
      if (runStart === null) runStart = this.y;
      this.raw(this.text(line || " ", {
        font: "F4",
        size,
        x: MARGIN_L + 8,
        leading,
        color: 0.16
      }));
      this.y += leading;
      runLines++;
      if (this.y + padY > BODY_BOTTOM) {
        flushRun();
        this.newPage();
      }
    }
    flushRun();
    this.y += 8;
  }

  quote(text) {
    const indent = 16;
    const lines = wrap("F3", 9.6, text, CONTENT_W - indent);
    const top = this.y;
    for (const line of lines) {
      this.ensure(13.4);
      this.raw(this.text(line, { font: "F3", size: 9.6, x: MARGIN_L + indent, leading: 13.4, color: 0.32 }));
      this.y += 13.4;
    }
    this.pages[this.pageIndex].push({
      k: "rect", x: MARGIN_L + 4, y: top - 3, w: 2, h: Math.max(0, this.y - top + 6), fill: 0.72
    });
    this.y += 7;
  }

  // Flow an embedded image, scaled to fit the content width.
  image(id, { maxHeight = 420 } = {}) {
    const img = this.images[id - 1];
    if (!img) return;
    let w = CONTENT_W;
    let h = (img.height / img.width) * w;
    if (h > maxHeight) {
      h = maxHeight;
      w = (img.width / img.height) * h;
    }
    const x = MARGIN_L + (CONTENT_W - w) / 2;

    // Don't strand a tall image at the page bottom.
    if (this.y + h + 10 > BODY_BOTTOM) {
      if (h <= BODY_BOTTOM - MARGIN_TOP) this.newPage();
      else this.ensure(h);
    }

    this.y += 5;
    const top = this.y;
    this.raw({ k: "image", id, x, y: top, w, h });
    this.y = top + h + 9;
  }

  figure(alt) {
    const label = alt || "Figure";
    const lines = wrap("F3", 8.6, label, CONTENT_W - 24);
    const h = lines.length * 11.5 + 16;
    this.ensure(h + 8);
    const top = this.y;
    this.pages[this.pageIndex].push({
      k: "rect", x: MARGIN_L, y: top, w: CONTENT_W, h, fill: 0.945, stroke: 0.86
    });
    this.raw(this.text("[figure]", { font: "F3", size: 7.5, x: MARGIN_L + 12, y: top + 11, color: 0.55 }));
    let y = top + 22;
    for (const line of lines) {
      this.raw(this.text(line, { font: "F3", size: 8.6, x: MARGIN_L + 12, y, color: 0.42 }));
      y += 11.5;
    }
    this.y = top - h - 8;
  }

  rule() {
    this.ensure(14);
    this.y += 5;
    this.pages[this.pageIndex].push({
      k: "rect", x: MARGIN_L, y: this.y, w: CONTENT_W, h: 0.7, fill: 0.84
    });
    this.y += 9;
  }

  spacer(h = 8) { this.y += h; }

  pageBreak() { this.newPage(); }

  // ---- assembly --------------------------------------------------------

  buildFooter(pageNum, total, label) {
    const left = toWinAnsi(label || "");
    const right = `${pageNum} / ${total}`;
    const baseY = PAGE_H - MARGIN_BOTTOM + 30; // near the bottom edge, flow space
    return [
      { k: "rect", x: MARGIN_L, y: baseY, w: CONTENT_W, h: 0.6, fill: 0.88 },
      { k: "text", str: left, font: "F1", size: 7.4, x: MARGIN_L, y: baseY + 14, leading: 8, color: 0.52 },
      { k: "text", str: right, font: "F1", size: 7.4, x: PAGE_W - MARGIN_R - textWidth("F1", 7.4, right), y: baseY + 14, leading: 8, color: 0.52 }
    ];
  }

  render({ skipFooterOnFirst = true } = {}) {
    const streams = this.pages.map((ops, i) => this.pageStream(ops));
    return { streams, pageCount: this.pages.length };
  }

  pageStream(ops) {
    let s = "";
    // Flow layout tracks a top-down `y`; PDF's origin is bottom-left, so flip.
    const fy = (y) => PAGE_H - y;
    for (const op of ops) {
      if (op.k === "rect") {
        // Flow rects store their top edge; PDF needs the bottom-left corner.
        const py = PAGE_H - (op.y + op.h);
        s += op.stroke !== undefined
          ? `${op.fill} ${op.stroke} ${op.stroke} rg ${op.x.toFixed(2)} ${py.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re B\n`
          : `${op.fill} g ${op.x.toFixed(2)} ${py.toFixed(2)} ${op.w.toFixed(2)} ${op.h.toFixed(2)} re f\n`;
        s += "0 g\n";
      } else if (op.k === "text") {
        if (op.color !== null && op.color !== undefined) s += `${op.color} g\n`;
        s += `BT /${op.font} ${op.size} Tf ${op.x.toFixed(2)} ${fy(op.y).toFixed(2)} Td (${escapePdf(op.str)}) Tj ET\n`;
        if (op.color !== null && op.color !== undefined) s += "0 g\n";
      } else if (op.k === "image") {
        // Flow image y is its top edge; PDF wants the bottom-left corner.
        s += `q ${op.w.toFixed(2)} 0 0 ${op.h.toFixed(2)} ${op.x.toFixed(2)} ${(PAGE_H - (op.y + op.h)).toFixed(2)} cm /Im${op.id} Do Q\n`;
      } else if (op.k === "raw") {
        s += op.s;
      }
    }
    return s;
  }
}

function escapePdf(s) {
  // Note: WinAnsi bytes 0x80-0x9F must be written as octal, not literal.
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (ch === "\\") out += "\\\\";
    else if (ch === "(") out += "\\(";
    else if (ch === ")") out += "\\)";
    else if (code >= 0x80) out += "\\" + code.toString(8).padStart(3, "0");
    else out += ch;
  }
  return out;
}

// Assemble the final PDF bytes from rendered page streams.
export function assemblePdf({ streams, footer, images = [] }) {
  const objects = [];
  const n = streams.length;
  const pageIds = streams.map((_, i) => 4 + i * 2);
  const contentIds = streams.map((_, i) => 5 + i * 2);

  // Font and image ids are allocated after the page objects to avoid collisions.
  const fontBase = 4 + n * 2;
  const fontIds = { F1: fontBase, F2: fontBase + 1, F3: fontBase + 2, F4: fontBase + 3 };
  const imageBase = fontBase + 4;
  const imageIds = images.map((_, i) => imageBase + i);

  const xobject = images.length
    ? ` /XObject << ${imageIds.map((id, i) => `/Im${i + 1} ${id} 0 R`).join(" ")} >>`
    : "";

  objects.push({ id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" });
  objects.push({
    id: 2,
    body: `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${n} >>`
  });
  objects.push({
    id: 3,
    body: `<< /Font << /F1 ${fontIds.F1} 0 R /F2 ${fontIds.F2} 0 R /F3 ${fontIds.F3} 0 R /F4 ${fontIds.F4} 0 R >>${xobject} >>`
  });

  streams.forEach((stream, i) => {
    const pid = pageIds[i];
    const cid = contentIds[i];
    objects.push({
      id: pid,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] `
        + `/Resources 3 0 R /Contents ${cid} 0 R >>`
    });
    objects.push({ id: cid, body: `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream` });
  });

  objects.push({ id: fontIds.F1, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>" });
  objects.push({ id: fontIds.F2, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>" });
  objects.push({ id: fontIds.F3, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>" });
  objects.push({ id: fontIds.F4, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>" });

  images.forEach((img, i) => {
    const body = `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} `
      + `/ColorSpace /${img.colorspace} /BitsPerComponent 8 /Filter /FlateDecode /Length ${img.data.length} >>\n`
      + `stream\n${img.data.toString("latin1")}\nendstream`;
    objects.push({ id: imageIds[i], body });
  });

  objects.sort((a, b) => a.id - b.id);

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  const maxId = objects[objects.length - 1].id;
  pdf += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxId; id++) {
    const off = offsets[objects.findIndex((o) => o.id === id)];
    pdf += off === undefined
      ? "0000000000 65535 f \n"
      : `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export const layout = {
  PAGE_W, PAGE_H, MARGIN_L, MARGIN_R, MARGIN_TOP, MARGIN_BOTTOM, CONTENT_W, BODY_BOTTOM,
  textWidth, wrap
};
