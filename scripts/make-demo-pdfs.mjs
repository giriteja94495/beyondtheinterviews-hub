import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "downloads");

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makePdf(lines) {
  const content = [
    "BT",
    "/F1 22 Tf",
    "72 740 Td",
    "28 TL",
    ...lines.flatMap((l, i) => (i === 0 ? [`(${esc(l)}) Tj`] : ["T*", `(${esc(l)}) Tj`])),
    "ET"
  ].join("\n");

  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
  );
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

const files = {
  "dsa-decoder.pdf": [
    "The 40-Pattern DSA Decoder",
    "SAMPLE PREVIEW - DEMO BUILD",
    "",
    "This placeholder proves the purchase -> download flow works.",
    "Replace this file with the real product PDF before go-live.",
    "Pattern 01: Sliding Window -> recognition cue: contiguous subarray",
    "Pattern 02: Monotonic Stack -> next greater/smaller element",
    "Pattern 03: Two Heaps -> running median..."
  ],
  "company-vault.pdf": [
    "Product Company Vault",
    "SAMPLE PREVIEW - DEMO BUILD",
    "",
    "Replace with the real company-wise question bank."
  ],
  "system-design.pdf": [
    "System Design for Indian Product Companies",
    "SAMPLE PREVIEW - DEMO BUILD",
    "",
    "Replace with the real worked-designs playbook."
  ],
  "offer-stack.pdf": [
    "The Offer Stack",
    "SAMPLE PREVIEW - DEMO BUILD",
    "",
    "Replace with the real resume + negotiation kit."
  ],
  "complete-system.pdf": [
    "The Complete Interview System",
    "SAMPLE PREVIEW - DEMO BUILD",
    "",
    "Replace with the real bundle (all four kits + master schedule)."
  ]
};

fs.mkdirSync(OUT, { recursive: true });
Object.entries(files).forEach(([name, lines]) => {
  fs.writeFileSync(path.join(OUT, name), makePdf(lines));
  console.log("wrote", name);
});
