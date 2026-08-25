const handlers = require("./_lib/handlers");
const { send } = require("./_lib/http");

module.exports = async (req, res) => {
  const result = handlers.healthHandler();
  send(res, result.status, result.body);
};
