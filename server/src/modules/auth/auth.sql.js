const db = require("../../config/db");

async function findUserByEmail(email) {
  const { rows } = await db.query(
    "SELECT id, email, password_hash, first_name, last_name, provider, provider_id FROM users WHERE email = $1",
    [email]
  );
  return rows[0] || null;
}

async function findUserByProvider(provider, provider_id) {
  const { rows } = await db.query(
    "SELECT id, email, password_hash, first_name, last_name, provider, provider_id FROM users WHERE provider = $1 AND provider_id = $2",
    [provider, provider_id]
  );
  return rows[0] || null;
}

async function createUser({ email, password_hash, first_name, last_name, provider, provider_id }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, provider, provider_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name, provider, provider_id, created_at`,
    [email, password_hash ?? null, first_name ?? null, last_name ?? null, provider ?? null, provider_id ?? null]
  );
  return rows[0];
}

async function linkProviderToUser(user_id, provider, provider_id) {
  await db.query(
    `UPDATE users SET provider = $1, provider_id = $2 WHERE id = $3`,
    [provider, provider_id, user_id]
  );
}

async function insertRefreshToken({ user_id, token_hash, expires_at }) {
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user_id, token_hash, expires_at]
  );
}

async function findRefreshToken(token_hash) {
  const { rows } = await db.query(
    `SELECT rt.user_id, rt.expires_at, u.email
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [token_hash]
  );
  return rows[0] || null;
}

async function deleteRefreshToken(token_hash) {
  await db.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [token_hash]);
}

async function deleteRefreshTokensForUser(user_id) {
  await db.query("DELETE FROM refresh_tokens WHERE user_id = $1", [user_id]);
}

module.exports = {
  findUserByEmail,
  findUserByProvider,
  createUser,
  linkProviderToUser,
  insertRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensForUser,
};
