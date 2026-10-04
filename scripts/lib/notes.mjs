// Reads the Obsidian-flavoured markdown notes in content/notes/ and converts
// them to the block model consumed by the PDF engine.
//
// Handles: YAML frontmatter, #/##/### headings, - bullets and 1. lists,
// ``` fences, | tables |, ![[image.png]] embeds, [[note]] links, > quotes.
import fs from "node:fs";
import path from "node:path";

export function parseFrontmatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  const lines = m[1].split(/\r?\n/);
  let currentKey = null;
  for (const line of lines) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv) {
      currentKey = kv[1];
      const v = kv[2].trim();
      meta[currentKey] = v ? [v] : [];
      if (!v) meta[currentKey] = [];
      continue;
    }
    const item = /^\s*-\s*(.+)$/.exec(line);
    if (item && currentKey) meta[currentKey].push(item[1].trim());
  }
  return { meta, body: src.slice(m[0].length) };
}

// `![[image.png]]` -> image embed; strips any `|width` suffix.
function imageRef(raw) {
  const target = raw.split("|")[0].trim();
  return target;
}

export function parseNoteMarkdown(md) {
  const blocks = [];
  const lines = String(md).replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let fence = null;
  const para = [];

  const flushPara = () => {
    const text = para.join(" ").trim();
    if (text) blocks.push({ t: "p", text });
    para.length = 0;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (fence) {
      if (/^\s*```/.test(line)) {
        blocks.push({ t: "pre", text: fence.lines.join("\n") });
        fence = null;
      } else {
        fence.lines.push(line);
      }
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      flushPara();
      const lang = line.replace(/^\s*```/, "").trim();
      fence = { lines: [], lang };
      i++;
      continue;
    }

    // Image embed: ![[file.png]]
    const embed = /^\s*!\[\[([^\]]+)\]\]\s*$/.exec(line);
    if (embed) {
      flushPara();
      const file = imageRef(embed[1]);
      const isVideo = /\.(mov|mp4|webm|gif)$/i.test(file);
      blocks.push({ t: "figure", src: isVideo ? "" : file, alt: isVideo ? `${file} (video — see the online note)` : "" });
      i++;
      continue;
    }

    // Heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      blocks.push({ t: "h", lvl: Math.min(4, Math.max(2, h[1].length)), text: h[2].trim() });
      i++;
      continue;
    }

    // Table: consecutive lines starting with |
    if (/^\s*\|/.test(line)) {
      flushPara();
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        // Skip markdown alignment separators like |---|---|
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      if (rows.length) blocks.push({ t: "table", rows });
      continue;
    }

    // Bullets / ordered lists
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      flushPara();
      const ordered = /\d/.test(li[2]);
      let depth = 0;
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        depth = Math.min(2, Math.floor(m[1].length / 2));
        blocks.push({ t: "li", text: m[3].trim(), ordered, depth });
        i++;
      }
      continue;
    }

    // Horizontal rule (---, ____, or long dashes used as separators)
    if (/^\s*(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
      flushPara();
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushPara();
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ t: "quote", text: quote.join(" ").trim() });
      continue;
    }

    if (!line.trim()) {
      flushPara();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();
  return blocks;
}

// Convert Obsidian links/tags into plain readable text for print.
export function cleanInline(text) {
  return String(text)
    // [[Note Name|label]] -> label ; [[Note Name]] -> Note Name
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, (_, t) => t.split("|")[0])
    // [label](url) -> label (url) is noise in print; keep the label only
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    // Inline code stays as-is minus the backticks
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function loadNotes(dir) {
  const notes = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const title = file.replace(/\.md$/, "");
    let blocks = parseNoteMarkdown(body);
    blocks = blocks.map((b) => (b.text ? { ...b, text: cleanInline(b.text) } : b));
    notes.push({
      title,
      file,
      topics: meta.topics || [],
      categories: meta.categories || [],
      updated: Array.isArray(meta.updated) ? meta.updated[0] : (meta.updated || ""),
      blocks
    });
  }
  return notes;
}
