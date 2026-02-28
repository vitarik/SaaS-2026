const env = require("../../config/env");
const { ok } = require("../../shared/response");
const { AppError } = require("../../shared/errors");
const authService = require("./auth.service");

function setRefreshCookie(res, refreshTokenRaw) {
  res.cookie(env.jwt.refreshCookieName, refreshTokenRaw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(env.jwt.refreshCookieName, { path: "/api/auth" });
}

async function register(req, res, next) {
  try {
    const { email, password, first_name, last_name } = req.body || {};
    if (!email || !password) throw new AppError(400, "VALIDATION_ERROR", "Email and password are required.");
    const { user, accessToken, refreshTokenRaw } = await authService.register({ email, password, first_name, last_name });
    setRefreshCookie(res, refreshTokenRaw);
    return ok(res, { user, accessToken });
  } catch (e) {
    return next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError(400, "VALIDATION_ERROR", "Email and password are required.");
    const { user, accessToken, refreshTokenRaw } = await authService.login({ email, password });
    setRefreshCookie(res, refreshTokenRaw);
    return ok(res, { user, accessToken });
  } catch (e) {
    return next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshCookieRaw = req.cookies?.[env.jwt.refreshCookieName];
    const { accessToken, refreshTokenRaw } = await authService.refresh({ refreshCookieRaw });
    setRefreshCookie(res, refreshTokenRaw);
    return ok(res, { accessToken });
  } catch (e) {
    return next(e);
  }
}

async function logout(req, res, next) {
  try {
    const refreshCookieRaw = req.cookies?.[env.jwt.refreshCookieName];
    await authService.logout({ refreshCookieRaw });
    clearRefreshCookie(res);
    return ok(res, { loggedOut: true });
  } catch (e) {
    return next(e);
  }
}

module.exports = { register, login, refresh, logout };
