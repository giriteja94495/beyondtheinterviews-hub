// Fetches all public posts from the Substack publication into content/substack/*.json
// Usage: node scripts/fetch-substack.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://pradyumnachippigiri.substack.com";
const OUT = path.join(ROOT, "content", "substack");

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 beyondtheinterviews-builder" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const archive = await getJson(`${BASE}/api/v1/archive?sort=new&search=&offset=0&limit=50`);
fs.mkdirSync(OUT, { recursive: true });

let n = 0;
for (const p of archive) {
  if (p.audience !== "everyone") continue;
  const slug = p.slug;
  const detail = await getJson(`${BASE}/api/v1/posts/${slug}`);
  const out = {
    slug,
    title: detail.title || p.title,
    subtitle: detail.subtitle || "",
    date: (detail.post_date || p.post_date || "").slice(0, 10),
    canonical: `${BASE}/p/${slug}`,
    body_html: detail.body_html || detail.body_json?.body_html || "",
  };
  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(out, null, 2));
  n++;
  console.log(`${String(n).padStart(2, "0")} ${out.date} ${slug} (${out.body_html.length} chars)`);
}
console.log(`\nfetched ${n} posts -> ${OUT}`);