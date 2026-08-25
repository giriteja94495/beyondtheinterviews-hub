const handlers = require("./_lib/handlers");
const { readJsonBody, send } = require("./_lib/http");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return send(res, 405, { error: "Method not allowed" });
  }
  try {
    const body = await readJsonBody(req);
    const result = await handlers.createOrderHandler(body);
    send(res, result.status, result.body);
  } catch (e) {
    send(res, 400, { error: e.message || "Bad request" });
  }
};
