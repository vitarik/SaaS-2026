const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { AppError } = require("../../shared/errors");
const authSql = require("./auth.sql");

function signAccessToken(user) {
  return jwt.sign(
    { email: user.email },
    env.jwt.accessSecret,
    { subject: String(user.id), expiresIn: env.jwt.accessExpiresIn }
  );
}

function signRefreshToken(user) {
  // refresh token is opaque random string; we store hash in DB
  const raw = crypto.randomBytes(48).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000);
  return { raw, tokenHash, expiresAt };
}

function hashRefreshCookie(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function register({ email, password, first_name, last_name }) {
  const existing = await authSql.findUserByEmail(email);
  if (existing) throw new AppError(409, "EMAIL_IN_USE", "Email already in use.");

  const password_hash = await bcrypt.hash(password, 12);
  const user = await authSql.createUser({ email, password_hash, first_name, last_name });

  const accessToken = signAccessToken(user);
  const { raw, tokenHash, expiresAt } = signRefreshToken(user);
  await authSql.insertRefreshToken({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

  return { user, accessToken, refreshTokenRaw: raw };
}

async function login({ email, password }) {
  const user = await authSql.findUserByEmail(email);
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");

  // if user was created via provider-only, password_hash may be null/empty
  if (!user.password_hash) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");

  const accessToken = signAccessToken(user);
  const { raw, tokenHash, expiresAt } = signRefreshToken(user);
  await authSql.insertRefreshToken({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

  // return safe user
  const safeUser = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name };
  return { user: safeUser, accessToken, refreshTokenRaw: raw };
}

async function refresh({ refreshCookieRaw }) {
  if (!refreshCookieRaw) throw new AppError(401, "REFRESH_REQUIRED", "Missing refresh token.");

  const tokenHash = hashRefreshCookie(refreshCookieRaw);
  const found = await authSql.findRefreshToken(tokenHash);
  if (!found) throw new AppError(401, "REFRESH_INVALID", "Invalid refresh token.");

  if (new Date(found.expires_at).getTime() < Date.now()) {
    await authSql.deleteRefreshToken(tokenHash);
    throw new AppError(401, "REFRESH_EXPIRED", "Refresh token expired.");
  }

  // Rotate token
  await authSql.deleteRefreshToken(tokenHash);

  const user = { id: found.user_id, email: found.email };
  const accessToken = signAccessToken(user);
  const { raw, tokenHash: newHash, expiresAt } = signRefreshToken(user);
  await authSql.insertRefreshToken({ user_id: user.id, token_hash: newHash, expires_at: expiresAt });

  return { accessToken, refreshTokenRaw: raw };
}

async function logout({ refreshCookieRaw }) {
  if (refreshCookieRaw) {
    const tokenHash = hashRefreshCookie(refreshCookieRaw);
    await authSql.deleteRefreshToken(tokenHash);
  }
  return { ok: true };
}

async function loginOrCreateFromProvider({ provider, providerId, email, first_name, last_name }) {
  // 1) Try find by provider id
  let user = null;
  const foundByProvider = await authSql.findUserByProvider(provider, providerId);
  if (foundByProvider) {
    user = { id: foundByProvider.id, email: foundByProvider.email, first_name: foundByProvider.first_name, last_name: foundByProvider.last_name };
  }

  // 2) Link to existing account by email if provider not found
  if (!user && email) {
    const foundByEmail = await authSql.findUserByEmail(email);
    if (foundByEmail) {
      // link provider to existing local account
      await authSql.linkProviderToUser(foundByEmail.id, provider, providerId);
      user = { id: foundByEmail.id, email: foundByEmail.email, first_name: foundByEmail.first_name, last_name: foundByEmail.last_name };
    }
  }

  // 3) Create new user if still not found
  if (!user) {
    const created = await authSql.createUser({ email, password_hash: '', first_name, last_name, provider, provider_id: providerId });
    user = created;
  }

  const accessToken = signAccessToken(user);
  const { raw, tokenHash, expiresAt } = signRefreshToken(user);
  await authSql.insertRefreshToken({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

  const safeUser = { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name };
  return { user: safeUser, accessToken, refreshTokenRaw: raw };
}

module.exports = { register, login, refresh, logout, loginOrCreateFromProvider };
