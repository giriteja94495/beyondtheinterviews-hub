import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const handlers = require("./api/_lib/handlers.js");

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json"
};

function serveStatic(res, urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname === "/" || pathname === "") pathname = "/index.html";
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      return res.end("Not found");
    }
    res.setHeader("Content-Type", MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    res.end(data);
  });
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Razorpay-Signature");
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || "").split("?")[0];
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Razorpay-Signature");
    return res.end();
  }
  try {
    if (req.method === "GET" && url === "/api/health") {
      const r = handlers.healthHandler();
      return send(res, r.status, r.body);
    }
    if (req.method === "GET" && url === "/api/products") {
      const r = handlers.productsHandler();
      return send(res, r.status, r.body);
    }
    const raw = await readRaw(req);
    const text = raw.toString("utf8");
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return send(res, 400, { error: "Invalid JSON" });
    }
    if (req.method === "POST" && url === "/api/create-order") {
      const r = await handlers.createOrderHandler(body);
      return send(res, r.status, r.body);
    }
    if (req.method === "POST" && url === "/api/verify-payment") {
      const r = await handlers.verifyPaymentHandler(body);
      return send(res, r.status, r.body);
    }
    if (req.method === "POST" && url === "/api/webhook") {
      const r = await handlers.webhookHandler(req.headers, raw);
      return send(res, r.status, r.body);
    }
    if (req.method === "GET") {
      return serveStatic(res, url);
    }
    send(res, 404, { error: "Not found" });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "Internal error" });
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`BTI local API on http://localhost:${port}`);
});
