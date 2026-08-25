const crypto = require("crypto");

function credentials() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ""
  };
}

function isConfigured() {
  const { keyId, keySecret } = credentials();
  return Boolean(keyId && keySecret);
}

function basicAuthHeader() {
  const { keyId, keySecret } = credentials();
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

async function createOrder({ amountPaise, receipt, notes }) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error && data.error.description ? data.error.description : "Razorpay order creation failed");
  }
  return data;
}

async function fetchOrder(orderId) {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: basicAuthHeader() }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error && data.error.description ? data.error.description : "Order lookup failed");
  }
  return data;
}

function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const { keySecret } = credentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function verifyWebhookSignature(rawBodyBuffer, signature) {
  const { webhookSecret } = credentials();
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBodyBuffer).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

function newReceipt(sku) {
  const rand = crypto.randomBytes(6).toString("hex");
  return `bti_${sku}_${Date.now().toString(36)}_${rand}`.slice(0, 40);
}

module.exports = {
  credentials,
  isConfigured,
  createOrder,
  fetchOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  newReceipt
};
