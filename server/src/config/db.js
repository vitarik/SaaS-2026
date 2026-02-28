const { Pool } = require("pg");
const env = require("./env");

function createPool() {
  if (env.db.databaseUrl) {
    return new Pool({ connectionString: env.db.databaseUrl, ssl: env.db.pg.ssl });
  }
  return new Pool({
    user: env.db.pg.user,
    host: env.db.pg.host,
    database: env.db.pg.database,
    password: env.db.pg.password,
    port: env.db.pg.port,
    ssl: env.db.pg.ssl,
  });
}

const pool = createPool();

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
