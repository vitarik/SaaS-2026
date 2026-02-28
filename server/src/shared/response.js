function ok(res, data = null, meta = null) {
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.json(payload);
}

function fail(res, status, code, message, details = null) {
  const payload = { success: false, error: { code, message } };
  if (details) payload.error.details = details;
  return res.status(status).json(payload);
}

module.exports = { ok, fail };
