const db = require("../../config/db");

async function getUserById(userId) {
  const { rows } = await db.query(
    "SELECT id, email, first_name, last_name, provider, created_at, updated_at FROM users WHERE id = $1",
    [userId]
  );
  return rows[0] || null;
}

async function updateMe(userId, { first_name, last_name }) {
  const { rows } = await db.query(
    `UPDATE users
     SET first_name = COALESCE($2, first_name),
         last_name  = COALESCE($3, last_name),
         updated_at = now()
     WHERE id = $1
     RETURNING id, email, first_name, last_name, provider, created_at, updated_at`,
    [userId, first_name ?? null, last_name ?? null]
  );
  return rows[0] || null;
}

module.exports = { getUserById, updateMe };
