const { PRODUCTS, publicCatalog } = require("./products");
const razorpay = require("./razorpay");

function json(status, body) {
  return { status, body };
}

function healthHandler() {
  return json(200, {
    ok: true,
    service: "beyond-the-interviews-api",
    razorpayConfigured: razorpay.isConfigured(),
    time: new Date().toISOString()
  });
}

function productsHandler() {
  return json(200, { products: publicCatalog() });
}

async function createOrderHandler(body) {
  if (!razorpay.isConfigured()) {
    return json(503, { error: "Payments are not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
  }
  const sku = body && body.sku;
  const product = PRODUCTS[sku];
  if (!product) {
    return json(400, { error: "Unknown product." });
  }
  if (!Number.isInteger(product.amount_paise) || product.amount_paise < 100) {
    return json(400, { error: "Invalid product amount." });
  }
  try {
    const order = await razorpay.createOrder({
      amountPaise: product.amount_paise,
      receipt: razorpay.newReceipt(sku),
      notes: { sku, product: product.name }
    });
    return json(200, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpay.credentials().keyId,
      productName: product.name,
      receipt: order.receipt
    });
  } catch (e) {
    console.error("[create-order]", e.status || "", e.message);
    if (e.status === 401) {
      return json(401, { error: "Payment gateway authentication failed. Check API keys." });
    }
    return json(e.status && e.status >= 400 && e.status < 500 ? e.status : 502, {
      error: "Payment gateway error. Please retry."
    });
  }
}

async function verifyPaymentHandler(body) {
  if (!razorpay.isConfigured()) {
    return json(503, { valid: false, error: "Payments are not configured yet." });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sku } = body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !sku || !PRODUCTS[sku]) {
    return json(400, { valid: false, error: "Missing verification fields." });
  }
  let signatureValid = false;
  try {
    signatureValid = razorpay.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });
  } catch (e) {
    console.error("[verify-payment] hmac error", e.message);
    return json(500, { valid: false, error: "Verification error." });
  }
  if (!signatureValid) {
    console.warn("[verify-payment] INVALID signature", { orderId: razorpay_order_id, paymentId: razorpay_payment_id });
    return json(400, { valid: false, error: "Signature verification failed." });
  }
  let order;
  try {
    order = await razorpay.fetchOrder(razorpay_order_id);
  } catch (e) {
    console.error("[verify-payment] order fetch failed", e.message);
    return json(502, { valid: false, error: "Could not confirm order with gateway." });
  }
  const product = PRODUCTS[sku];
  const paid = order.status === "paid" && order.amount === product.amount_paise && order.amount_paid === product.amount_paise;
  if (!paid) {
    console.warn("[verify-payment] order not settled as expected", {
      orderId: razorpay_order_id,
      status: order.status,
      expected: product.amount_paise,
      got: order.amount
    });
    return json(409, { valid: false, error: "Payment not confirmed for this product." });
  }
  console.log("[verify-payment] OK", JSON.stringify({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, sku }));
  return json(200, {
    valid: true,
    productName: product.name,
    downloadUrl: product.download_url
  });
}

async function webhookHandler(headers, rawBodyBuffer) {
  const signature = headers["x-razorpay-signature"];
  if (!signature) {
    return json(400, { received: false, error: "Missing signature header." });
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set; rejecting");
    return json(503, { received: false, error: "Webhook secret not configured." });
  }
  let valid = false;
  try {
    valid = razorpay.verifyWebhookSignature(rawBodyBuffer, signature);
  } catch (e) {
    console.error("[webhook] hmac error", e.message);
  }
  if (!valid) {
    console.warn("[webhook] INVALID signature — possible spoof attempt");
    return json(400, { received: false, error: "Invalid signature." });
  }
  let event;
  try {
    event = JSON.parse(rawBodyBuffer.toString("utf8"));
  } catch (e) {
    return json(400, { received: false, error: "Malformed payload." });
  }
  console.log(
    "[webhook]",
    JSON.stringify({
      eventId: event.id,
      type: event.event,
      paymentId: event.payload && event.payload.payment && event.payload.payment.entity ? event.payload.payment.entity.id : undefined,
      orderId: event.payload && event.payload.order && event.payload.order.entity ? event.payload.order.entity.id : undefined
    })
  );
  if (event.event === "payment.captured" || event.event === "order.paid") {
    deliverBackupCopy(event);
  }
  return json(200, { received: true });
}

function deliverBackupCopy(event) {
  console.log(
    "[webhook] FULFILMENT HOOK",
    JSON.stringify({
      action: "email-backup-download",
      note: "Wire your email provider / automation here. Dedupe on eventId before acting.",
      eventId: event.id
    })
  );
}

module.exports = {
  healthHandler,
  productsHandler,
  createOrderHandler,
  verifyPaymentHandler,
  webhookHandler
};
