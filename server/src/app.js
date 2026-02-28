const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const { errorHandler } = require("./middlewares/errorHandler");

const healthRoutes = require("./modules/health/health.routes");
const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");

const app = express();

app.use(cors({
  origin: env.cors.origin,
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found." } }));

app.use(errorHandler);

module.exports = app;
