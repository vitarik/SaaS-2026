const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { AppError } = require("../shared/errors");

function authJwt(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return next(new AppError(401, "AUTH_REQUIRED", "Missing or invalid Authorization header."));
  }
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (e) {
    return next(new AppError(401, "AUTH_INVALID", "Invalid or expired access token."));
  }
}

module.exports = { authJwt };
