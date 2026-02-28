// src/modules/auth/auth.routes.js  (ou routes/auth.js selon ton projet)
const router = require("express").Router();

const ctrl = require("./auth.controller");
const { authJwt } = require("../../middlewares/authJwt");
const { ok } = require("../../shared/response");

// ✅ Ensure you have cookie-parser enabled in app.js/server.js:
// app.use(require("cookie-parser")());

/**
 * Core auth routes
 */
router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);

/**
 * Me (JWT-protected)
 * Works for classic login (Authorization: Bearer accessToken)
 */
router.get("/me", authJwt, (req, res) => ok(res, { user: req.user }));

/**
 * GET /api/auth/google
 * Starts Google OAuth.
 * Optional: ?redirect=http://localhost:3000/oauth/callback
 */
router.get("/google", (req, res) => {
  const { google } = require("googleapis");

  // Optional: save redirect in cookie (so callback can read it)
  const redirect = req.query.redirect;
  if (redirect) {
    res.cookie("oauth_redirect", redirect, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: "/api/auth",
    });
  }

  // ✅ MUST be the backend callback, on port 5000 in dev
  const callbackUrl =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
  });

  return res.redirect(url);
});

/**
 * GET /api/auth/google/callback
 * Google redirects here with ?code=...
 * We exchange code -> tokens, fetch user profile,
 * create/login user, issue { accessToken, refreshCookie }.
 *
 * Then we send an HTML page that posts message to opener and closes.
 * ✅ Must match frontend listener: "OAUTH_GOOGLE_SUCCESS"
 */
router.get("/google/callback", async (req, res, next) => {
  try {
    const { google } = require("googleapis");
    const authService = require("./auth.service");
    const env = require("../../config/env");

    // ✅ MUST be the backend callback, on port 5000 in dev
    const callbackUrl =
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback";

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );

    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch Google user
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    // Create/login local user + issue tokens
    const { user, accessToken, refreshTokenRaw } =
      await authService.loginOrCreateFromProvider({
        provider: "google",
        providerId: data.id,
        email: data.email,
        first_name: data.given_name,
        last_name: data.family_name,
      });

    // Set refresh cookie (httpOnly)
    res.cookie(env.jwt.refreshCookieName, refreshTokenRaw, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth",
      maxAge: env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
    });

    // ✅ Parent origin (React app)
    const clientOrigin =
      process.env.CLIENT_REDIRECT_URL ||
      process.env.CORS_ORIGIN ||
      "http://localhost:3000";

    // Optional redirect cookie (not required for postMessage flow)
    const redirectFromCookie = req.cookies?.oauth_redirect;
    if (redirectFromCookie) {
      res.clearCookie("oauth_redirect", { path: "/api/auth" });
    }

    // ✅ Send message that your Login.jsx expects
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Authentication complete</title>
  </head>
  <body>
    <script>
      (function () {
        try {
          var accessToken = ${JSON.stringify(accessToken)};
          var user = ${JSON.stringify(user)};
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: "OAUTH_GOOGLE_SUCCESS", accessToken: accessToken, user: user },
              ${JSON.stringify(clientOrigin)}
            );
          }
        } catch (e) {}
        setTimeout(function () { window.close(); }, 200);
      })();
    </script>
    <p>Authentication complete. You can close this window.</p>
  </body>
</html>`;

    return res.send(html);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;