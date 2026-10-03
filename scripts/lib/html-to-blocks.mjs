// Minimal zero-dependency HTML -> block model, tuned for Substack post bodies.
// Produces a flat list of blocks that the PDF layout engine can flow.
//
// Block shapes:
//   { t: "h",  lvl: 2|3|4, text }
//   { t: "p",  text }
//   { t: "li", text, ordered: bool, depth: 0..n }
//   { t: "pre", text }
//   { t: "quote", text }
//   { t: "figure", alt }
//   { t: "hr" }

const NOISE = new Set([
  "button", "svg", "form", "input", "select", "textarea", "style", "script"
]);

const BLOCK_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6",
  "li", "pre", "blockquote", "figcaption", "caption",
  "div", "section", "article", "main", "aside", "header", "footer"
]);

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026",
  lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201C", rdquo: "\u201D",
  bull: "\u2022", middot: "\u00B7", copy: "\u00A9", reg: "\u00AE",
  trade: "\u2122", deg: "\u00B0", times: "\u00D7",
  laquo: "\u00AB", raquo: "\u00BB", eacute: "\u00E9"
};

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, g) => {
    if (g[0] === "#") {
      const code = g[1] === "x" || g[1] === "X"
        ? parseInt(g.slice(2), 16)
        : parseInt(g.slice(1), 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        return String.fromCodePoint(code);
      }
      return "";
    }
    const hit = ENTITIES[g] ?? ENTITIES[g.toLowerCase()];
    return hit === undefined ? m : hit;
  });
}

function cleanText(raw) {
  return decodeEntities(raw.replace(/<[^>]*>/g, " "))
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

function removeNoise(html) {
  let out = html;
  for (const tag of NOISE) {
    out = out.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, "gi"), " ");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/?>`, "gi"), " ");
  }
  return out;
}

export function parse(html) {
  const src = removeNoise(String(html || ""));
  const blocks = [];
  const stack = [{ tag: "root", buf: "", hasChild: false }];
  const listStack = []; // open ul/ol containers
  const top = () => stack[stack.length - 1];

  const appendText = (txt) => {
    for (let i = stack.length - 1; i >= 1; i--) {
      if (!stack[i].hasChild) {
        stack[i].buf += txt;
        return;
      }
    }
    stack[0].buf += txt;
  };

  const flush = (ctx) => {
    const text = cleanText(ctx.buf);
    ctx.buf = "";
    if (!text) return;

    switch (ctx.tag) {
      case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
        blocks.push({ t: "h", lvl: Math.min(4, Math.max(2, Number(ctx.tag[1]))), text });
        break;
      case "li":
        blocks.push({ t: "li", text, ordered: !!ctx.meta.ordered, depth: ctx.meta.depth || 0 });
        break;
      case "pre":
        blocks.push({ t: "pre", text: text.replace(/\n{3,}/g, "\n\n") });
        break;
      case "blockquote":
        blocks.push({ t: "quote", text });
        break;
      case "figcaption": case "caption":
        blocks.push({ t: "figcaption", text });
        break;
      default:
        // div/section/figure wrappers that only held inline text read as paragraphs.
        blocks.push({ t: "p", text });
    }
  };

  const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  let m;
  let last = 0;
  while ((m = TAG_RE.exec(src))) {
    // Text sitting between the previous tag and this one carries the prose.
    if (m.index > last) appendText(decodeEntities(src.slice(last, m.index)));
    last = m.index + m[0].length;

    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrs = m[3] || "";

    if (tag === "br") { appendText("\n"); continue; }
    if (tag === "hr") { blocks.push({ t: "hr" }); continue; }
    if (tag === "img") {
      const alt = /alt\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]
        || /alt\s*=\s*'([^']*)'/i.exec(attrs)?.[1] || "";
      const src = /src\s*=\s*"([^"]*)"/i.exec(attrs)?.[1]
        || /src\s*=\s*'([^']*)'/i.exec(attrs)?.[1] || "";
      blocks.push({ t: "figure", alt: decodeEntities(alt).trim(), src: decodeEntities(src).trim() });
      continue;
    }

    // List containers are not block contexts themselves, but they decide
    // whether the <li>s inside them render as bullets or numbers.
    if (tag === "ul" || tag === "ol") {
      if (closing) listStack.pop();
      else listStack.push(tag);
      continue;
    }

    if (!BLOCK_TAGS.has(tag)) continue; // inline tag: its text flows through

    if (!closing) {
      const parent = top();
      if (BLOCK_TAGS.has(parent.tag) && parent.tag !== "root") parent.hasChild = true;

      const meta = tag === "li"
        ? { ordered: listStack[listStack.length - 1] === "ol", depth: Math.max(0, listStack.length - 1) }
        : {};
      stack.push({ tag, buf: "", hasChild: false, meta });
      continue;
    }

    // Closing tag: unwind to the matching open context.
    let idx = -1;
    for (let i = stack.length - 1; i >= 1; i--) {
      if (stack[i].tag === tag) { idx = i; break; }
    }
    if (idx === -1) continue;

    // Orphaned wrappers (e.g. an unclosed <div>) get flushed as paragraphs.
    while (stack.length - 1 > idx) {
      const orphan = top();
      if (orphan.tag !== "root") flush(orphan);
      stack.pop();
    }
    flush(stack.pop());
  }

  if (last < src.length) appendText(decodeEntities(src.slice(last)));
  while (stack.length > 1) flush(stack.pop());

  // Drop empties and consecutive duplicates (Substack double-wraps often).
  const out = [];
  for (const b of blocks) {
    if (b.t === "figcaption") continue;
    if (b.t === "p" && !b.text) continue;
    const prev = out[out.length - 1];
    if (prev && prev.t === b.t && prev.text === b.text) continue;
    out.push(b);
  }
  return out;
}
