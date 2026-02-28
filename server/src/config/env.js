function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  db: {
    // Supports either DATABASE_URL or discrete PG_* vars
    databaseUrl: process.env.DATABASE_URL || null,
    pg: {
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: process.env.PG_PORT ? Number(process.env.PG_PORT) : undefined,
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    },
  },
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || 30),
    refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || "refresh_token",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};
