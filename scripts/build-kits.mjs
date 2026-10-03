// Assembles the downloadable kits from the fetched Substack archive + authored
// markdown, renders multi-page PDFs into downloads/, and writes the kit manifest
// consumed by api/_lib/products.js.
//
// Usage: node scripts/build-kits.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse as parseHtml } from "./lib/html-to-blocks.mjs";
import { PdfDoc, assemblePdf, layout, toWinAnsi } from "./lib/pdf.mjs";
import { decodePng, downscale, prepareImageData } from "./lib/png.mjs";
import { createRequire } from "node:module";

// jpeg-js is a *build-time* dependency only (devDependency). The deployed site
// and every api/*.js function stay zero-dependency.
const require = createRequire(import.meta.url);
let jpegDecode = null;
try {
  jpegDecode = require("jpeg-js").decode;
} catch {
  throw new Error(
    "Missing build dependency 'jpeg-js'. Run: npm install  (build-time only; not deployed)"
  );
}

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(ROOT, "content", "substack");
const OUT_DIR = path.join(ROOT, "downloads");
const MANIFEST = path.join(ROOT, "api", "_lib", "kits.json");

const BRAND = "Beyond The Interviews";
const AUTHOR = "Pradyumna Chippigiri";
const SOURCE = "Evolving Engineer \u2014 pradyumnachippigiri.substack.com";

const CACHE_DIR = path.join(ROOT, "content", ".image-cache");
const IMAGE_MAX_DIM = 900;

// Substack serves resized derivatives; request a bounded PNG so we can decode
// it deterministically instead of guessing at JPEG/WebP variants.
function normalizeImageUrl(src) {
  const marker = "image/fetch/";
  const at = src.indexOf(marker);
  if (at === -1) return src;
  const originAt = src.indexOf("/https://", at);
  if (originAt === -1) return src;
  const idPrefix = src.slice(0, src.indexOf(",", at + marker.length));
  const original = src.slice(originAt + 1);
  // Only the width transform is honoured reliably; f_png and fm=png both fall
  // back to the source format, so request the S3 original and decode whatever
  // we actually get.
  return `${idPrefix},w_${IMAGE_MAX_DIM},c_limit/${original}`;
}

const decoded = new Map(); // url -> img | null

// Decode PNG (own reader) or JPEG (jpeg-js, build-time only).
function decodeImageBuffer(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) {
    const out = jpegDecode(buf, { useTArray: true, formatAsRGBA: false, tolerantDecoding: true });
    if (!out || !out.width) return null;
    return { width: out.width, height: out.height, colorspace: "DeviceRGB", data: Buffer.from(out.data) };
  }
  return decodePng(buf);
}

async function loadImage(url) {
  if (decoded.has(url)) return decoded.get(url);
  const target = normalizeImageUrl(url);
  const key = crypto.createHash("sha1").update(target).digest("hex");
  const cachePath = path.join(CACHE_DIR, `${key}.bin`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  let buf;
  try {
    if (fs.existsSync(cachePath)) {
      buf = fs.readFileSync(cachePath);
    } else {
      const res = await fetch(target, {
        headers: { "User-Agent": "Mozilla/5.0 beyondtheinterviews-builder", Accept: "image/*" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(cachePath, buf);
    }
  } catch (err) {
    console.warn(`  ! image fetch failed: ${err.message}`);
    decoded.set(url, null);
    return null;
  }

  const img = decodeImageBuffer(buf);
  if (!img) {
    console.warn(`  ! unsupported image format for ${path.basename(cachePath)}`);
    decoded.set(url, null);
    return null;
  }
  const scaled = downscale(img, IMAGE_MAX_DIM);
  const prepared = prepareImageData(scaled);
  decoded.set(url, prepared);
  return prepared;
}

async function prefetchImages(chapters) {
  const urls = new Set();
  for (const ch of chapters) {
    for (const b of ch.blocks) {
      if (b.t === "figure" && b.src) urls.add(b.src);
    }
  }
  const list = [...urls];
  let done = 0;
  const limit = 6;
  let cursor = 0;
  async function worker() {
    while (cursor < list.length) {
      const url = list[cursor++];
      await loadImage(url);
      done++;
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  const ok = list.filter((u) => decoded.get(u)).length;
  return { total: list.length, ok, done };
}

function fmtDate(d) {
  return `Compiled ${d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`;
}

// ---------------------------------------------------------------- loading

function loadPosts() {
  const posts = new Map();
  for (const file of fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".json"))) {
    const raw = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));
    posts.set(raw.slug, {
      slug: raw.slug,
      title: raw.title.trim(),
      subtitle: (raw.subtitle || "").trim(),
      date: raw.date,
      canonical: raw.canonical,
      blocks: parseHtml(raw.body_html)
    });
  }
  return posts;
}

// Tiny markdown reader: #/##/### headings, - bullets, ``` fences, paragraphs.
function parseMarkdown(md) {
  const blocks = [];
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let fence = null;

  const flushPara = (buf) => {
    const text = buf.join(" ").trim();
    if (text) blocks.push({ t: "p", text });
    buf.length = 0;
  };

  const para = [];
  while (i < lines.length) {
    const line = lines[i];

    if (fence) {
      if (line.trim().startsWith("```")) {
        blocks.push({ t: "pre", text: fence.lines.join("\n") });
        fence = null;
      } else {
        fence.lines.push(line);
      }
      i++;
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushPara(para);
      fence = { lines: [] };
      i++;
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(para);
      blocks.push({ t: "h", lvl: Math.min(4, Math.max(2, h[1].length)), text: h[2].trim() });
      i++;
      continue;
    }
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) {
      // Group consecutive bullets into one list so numbering depth stays sane.
      flushPara(para);
      let depth = 0;
      let ordered = false;
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        depth = Math.min(2, Math.floor(m[1].length / 2));
        ordered = /\d/.test(m[2]) || ordered;
        blocks.push({ t: "li", text: m[3].trim(), ordered, depth });
        i++;
      }
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushPara(para);
      blocks.push({ t: "hr" });
      i++;
      continue;
    }
    if (!line.trim()) {
      flushPara(para);
      i++;
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flushPara(para);
  return blocks;
}

// ---------------------------------------------------------------- flow

function flowBlocks(doc, blocks, imageIds) {
  let bulletIndex = 1;
  let lastWasBullet = false;

  for (const b of blocks) {
    if (b.t !== "li") lastWasBullet = false;
    switch (b.t) {
      case "h":
        if (lastWasBullet) bulletIndex = 1;
        doc.heading(b.text, b.lvl);
        break;
      case "p":
        doc.paragraph(b.text);
        break;
      case "li": {
        if (!lastWasBullet) bulletIndex = 1;
        doc.bullet(b.text, { ordered: b.ordered, index: bulletIndex, depth: b.depth || 0 });
        bulletIndex++;
        lastWasBullet = true;
        break;
      }
      case "pre":
        doc.code(b.text);
        break;
      case "quote":
        doc.quote(b.text);
        break;
      case "figure": {
        const img = b.src ? decoded.get(b.src) : null;
        if (img) {
          let id = imageIds.get(b.src);
          if (!id) {
            id = doc.registerImage(img);
            imageIds.set(b.src, id);
          }
          doc.image(id);
        } else if (b.alt) {
          doc.figure(b.alt);
        }
        break;
      }
      case "hr":
        doc.rule();
        break;
      default:
        break;
    }
  }
}

// ---------------------------------------------------------------- covers

function paintCover(doc, kit) {
  const ops = doc.pages[0];
  const W = layout.PAGE_W;
  const H = layout.PAGE_H;
  const push = (op) => ops.push(op);

  const BAND_H = 214;

  // Accent band across the top of the page (top-down coordinates).
  push({ k: "rect", x: 0, y: 0, w: W, h: BAND_H, fill: 0.078 });
  push({ k: "rect", x: 0, y: BAND_H, w: W, h: 6, fill: 0.62, stroke: 0.62 });

  push({ k: "text", str: toWinAnsi(BRAND.toUpperCase()), font: "F2", size: 9, x: layout.MARGIN_L, y: 62, leading: 11, color: 0.72 });

  let y = 112;
  for (const line of layout.wrap("F2", 27, kit.title, layout.CONTENT_W)) {
    push({ k: "text", str: toWinAnsi(line), font: "F2", size: 27, x: layout.MARGIN_L, y, leading: 32, color: 1 });
    y += 32;
  }
  if (kit.tagline) {
    push({ k: "text", str: toWinAnsi(kit.tagline), font: "F3", size: 11, x: layout.MARGIN_L, y: y + 6, leading: 14, color: 0.82 });
  }

  let my = BAND_H + 46;
  const meta = [
    `${kit.chapters.length} chapters \u00b7 compiled from the ${SOURCE}`,
    `By ${AUTHOR}`,
    fmtDate(new Date())
  ];
  for (const line of meta) {
    push({ k: "text", str: toWinAnsi(line), font: "F1", size: 9.4, x: layout.MARGIN_L, y: my, leading: 13, color: 0.42 });
    my += 15;
  }

  my += 16;
  push({ k: "text", str: "WHAT'S INSIDE", font: "F2", size: 9, x: layout.MARGIN_L, y: my, leading: 11, color: 0.55 });
  my += 20;
  for (const ch of kit.chapters) {
    if (my > H - 24) break;
    for (const line of layout.wrap("F1", 9, `\u2022  ${ch.title}`, layout.CONTENT_W)) {
      push({ k: "text", str: toWinAnsi(line), font: "F1", size: 9, x: layout.MARGIN_L, y: my, leading: 11, color: 0.24 });
      my += 13.5;
    }
  }

  push({
    k: "text", str: toWinAnsi(`\u00a9 ${new Date().getFullYear()} ${AUTHOR}. Personal-use licence.`),
    font: "F1", size: 8, x: layout.MARGIN_L, y: H - 22, leading: 10, color: 0.5
  });
}

function paintToc(doc, kit, startPage, entriesPerPage) {
  entriesPerPage.forEach((entries, page) => {
    if (entries.length === 0) return;
    const ops = doc.pages[startPage + page];
    let y = layout.MARGIN_TOP + 6;
    const push = (op) => ops.push(op);

    push({ k: "text", str: "CONTENTS", font: "F2", size: 15, x: layout.MARGIN_L, y, leading: 18, color: 0.1 });
    y -= 30;

    for (const e of entries) {
      const num = String(e.page + 1);
      const numW = layout.textWidth("F1", 9.4, num);
      const titleW = layout.CONTENT_W - numW - 14;
      const lines = layout.wrap("F1", 9.4, e.title, titleW);

      lines.forEach((line, i) => {
        push({ k: "text", str: toWinAnsi(line), font: i === 0 ? "F2" : "F1", size: 9.4, x: layout.MARGIN_L, y, leading: 12, color: 0.12 });
        if (i === 0) {
          push({ k: "text", str: num, font: "F1", size: 9.4, x: layout.MARGIN_L + titleW + 14, y, leading: 12, color: 0.3 });
        }
        y -= 13.5;
      });
      if (e.subtitle) {
        for (const line of layout.wrap("F1", 8.3, e.subtitle, layout.CONTENT_W - 16)) {
          push({ k: "text", str: toWinAnsi(line), font: "F3", size: 8.3, x: layout.MARGIN_L + 8, y, leading: 10.5, color: 0.48 });
          y -= 10.5;
        }
      }
      y -= 7;
    }
  });
}

// Paginate TOC entries, mirroring paintToc's vertical math.
function paginateToc(kit) {
  const capacity = layout.BODY_BOTTOM - (layout.MARGIN_TOP + 6) - 30;
  const pages = [[]];
  let used = 0;
  for (const ch of kit.chapters) {
    let h = layout.wrap("F1", 9.4, ch.title, layout.CONTENT_W - 40).length * 13.5 + 7;
    if (ch.subtitle) h += layout.wrap("F1", 8.3, ch.subtitle, layout.CONTENT_W - 16).length * 10.5;
    if (used + h > capacity && pages[pages.length - 1].length) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push({ title: ch.title, subtitle: ch.subtitle });
    used += h;
  }
  return pages;
}

// ---------------------------------------------------------------- kits

const CH = {
  dsaAuthored: { id: "authored:dsa", kind: "authored", title: "The 40-Pattern DSA Decoder", subtitle: "Recognition-first pattern catalogue", date: "2026" },
  skipLists: { id: "skip-lists-data-structure" },
  inverted: { id: "engineering-fast-search-with-inverted" },

  caching: { id: "caching-playbook-for-system-design" },
  cap: { id: "a-simple-proof-of-the-cap-theorem" },
  hashing: { id: "easy-explanation-of-consistent-hashing" },
  concurrency: { id: "concurrency-controls-pessimistic" },
  proxy: { id: "client-side-proxy-vs-server-side" },
  bloom: { id: "the-power-of-bloom-filters-in-system" },
  kafka: { id: "apache-kafka-basics" },

  disk: { id: "how-databases-store-data-on-the-disk" },
  scaling: { id: "scaling-the-databases-choosing-the" },
  sharding: { id: "nail-sharding-in-system-design-interviews" },
  sqlnosql: { id: "sql-vs-nosql-a-simple-checklist-to" },
  acid1: { id: "relational-databases-and-acid-transactions" },
  acid2: { id: "relational-database-and-acid-transactions" },
  wal: { id: "how-does-the-database-guarantee-reliability" },

  agents: { id: "zero-to-one-learning-agents-and-agentic" },
  rag1: { id: "everything-you-need-to-know-about" },
  rag2: { id: "everything-you-need-to-know-about-f99" },
  rag3: { id: "everything-you-need-to-know-about-9be" },
  semantic: { id: "semantic-caching" },
  supabase: { id: "a-supa-explanation-of-supabase-the" },
  shell: { id: "shell-scripting-for-devops-beginners-626" }
};

const KITS = [
  {
    sku: "dsa-decoder",
    file: "dsa-decoder.pdf",
    title: "The 40-Pattern DSA Decoder",
    tagline: "Recognition-first DSA \u2014 plus the data structures that power real systems.",
    chapters: [CH.dsaAuthored, CH.skipLists, CH.inverted]
  },
  {
    sku: "offer-stack",
    file: "offer-stack.pdf",
    title: "AI & LLM Systems Playbook",
    tagline: "RAG, agents, semantic caching and the backend stack behind production AI.",
    chapters: [CH.agents, CH.rag1, CH.rag2, CH.rag3, CH.semantic, CH.supabase, CH.shell]
  },
  {
    sku: "company-vault",
    file: "company-vault.pdf",
    title: "Database & Storage Deep Dive",
    tagline: "How databases really store, scale, shard and stay reliable under load.",
    chapters: [CH.disk, CH.scaling, CH.sharding, CH.sqlnosql, CH.acid1, CH.acid2, CH.wal]
  },
  {
    sku: "system-design",
    file: "system-design.pdf",
    title: "System Design Interview Vault",
    tagline: "Caching, CAP, consistent hashing and the patterns interviewers probe.",
    chapters: [CH.caching, CH.cap, CH.hashing, CH.concurrency, CH.proxy, CH.bloom, CH.kafka]
  },
  {
    sku: "complete-system",
    file: "complete-system.pdf",
    title: "The Complete Interview System",
    tagline: "Every kit in one bundle \u2014 DSA, databases, distributed systems and AI.",
    chapters: [
      CH.dsaAuthored, CH.skipLists, CH.inverted,
      CH.disk, CH.scaling, CH.sharding, CH.sqlnosql, CH.acid1, CH.acid2, CH.wal,
      CH.caching, CH.cap, CH.hashing, CH.concurrency, CH.proxy, CH.bloom, CH.kafka,
      CH.agents, CH.rag1, CH.rag2, CH.rag3, CH.semantic, CH.supabase, CH.shell
    ]
  }
];

// ---------------------------------------------------------------- main

const posts = loadPosts();
const authoredPath = path.join(ROOT, "content", "01-dsa-decoder.md");
const authoredBlocks = fs.existsSync(authoredPath)
  ? parseMarkdown(fs.readFileSync(authoredPath, "utf8"))
  : [];
// The authored doc opens with its own H1; drop it and use the chapter title.
if (authoredBlocks[0]?.t === "h" && authoredBlocks[0].lvl === 2) authoredBlocks.shift();

function resolve(ch) {
  if (ch.kind === "authored") {
    return {
      title: ch.title,
      subtitle: ch.subtitle,
      date: ch.date,
      canonical: "Authored for Beyond The Interviews",
      blocks: authoredBlocks
    };
  }
  const p = posts.get(ch.id);
  if (!p) throw new Error(`missing post: ${ch.id}`);
  return p;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = {};

for (const kit of KITS) {
  const chapters = kit.chapters.map(resolve);
  const tocPages = paginateToc({ ...kit, chapters });

  const { total: imgTotal, ok: imgOk } = await prefetchImages(chapters);
  if (imgTotal) console.log(`  images: ${imgOk}/${imgTotal} embedded`);

  const doc = new PdfDoc({ title: kit.title, author: AUTHOR, footer: `${kit.title} \u00b7 ${BRAND}` });
  paintCover(doc, { ...kit, chapters });

  // Reserve TOC pages so chapter page indices are final before we paint them.
  for (let i = 0; i < tocPages.length; i++) doc.newPage();

  const chapterStarts = [];
  const imageIds = new Map();
  chapters.forEach((ch, i) => {
    doc.pageBreak();
    chapterStarts.push(doc.pageIndex);
    doc.title(ch.title, 19);
    doc.paragraph(`${ch.date}${ch.subtitle ? "  \u00b7  " + ch.subtitle : ""}`, {
      font: "F3", size: 8.6, color: 0.46, after: 4, leading: 11.5
    });
    doc.paragraph(`Source: ${ch.canonical}`, { font: "F1", size: 7.6, color: 0.55, after: 6, leading: 10 });
    doc.rule();
    flowBlocks(doc, ch.blocks, imageIds);
  });

  // Paint the TOC now that chapter starts are known.
  const flat = chapters.map((ch, i) => ({ title: ch.title, subtitle: ch.subtitle, page: chapterStarts[i] }));
  const painted = [];
  for (const pageEntries of tocPages) {
    painted.push(flat.splice(0, pageEntries.length));
  }
  paintToc(doc, kit, 1, painted);

  // Footers on every page.
  const total = doc.pages.length;
  doc.pages.forEach((ops, i) => {
    if (i === 0) return; // cover has its own footer
    const f = doc.buildFooter(i + 1, total, `${kit.title}`);
    ops.push(...f);
  });

  const streams = doc.pages.map((ops) => doc.pageStream(ops));
  const pdf = assemblePdf({ streams, footer: kit.title, images: doc.images });
  fs.writeFileSync(path.join(OUT_DIR, kit.file), pdf);

  manifest[kit.sku] = {
    file: kit.file,
    title: kit.title,
    tagline: kit.tagline,
    pages: total,
    chapters: chapters.map((ch) => ({
      title: ch.title,
      subtitle: ch.subtitle || "",
      date: ch.date,
      source: ch.canonical
    }))
  };

  console.log(`wrote ${kit.file}  (${total} pages, ${chapters.length} chapters, ${(pdf.length / 1024).toFixed(0)} KB)`);
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nwrote ${path.relative(ROOT, MANIFEST)}`);
