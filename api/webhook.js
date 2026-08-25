const handlers = require("./_lib/handlers");
const { readRawBody, send } = require("./_lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed" });
  }
  try {
    const rawBody = await readRawBody(req);
    const result = await handlers.webhookHandler(req.headers, rawBody);
    send(res, result.status, result.body);
  } catch (e) {
    send(res, 400, { received: false, error: e.message || "Bad request" });
  }
};
