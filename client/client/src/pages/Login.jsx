// src/pages/Login.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import apiService from "../api/apiService";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeError = (err) => {
    const data = err?.response?.data;

    if (typeof data?.error === "string") return data.error;
    if (data?.error && typeof data.error === "object") {
      return data.error.message || JSON.stringify(data.error);
    }
    if (typeof data?.message === "string") return data.message;
    if (typeof err?.message === "string") return err.message;

    return "Server error";
  };

  // ✅ Only accept messages from backend origin (where popup lands)
  const backendOrigin = useMemo(
    () => process.env.REACT_APP_API_ORIGIN || "http://localhost:5000",
    []
  );

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== backendOrigin) return;

      const payload = event.data;
      if (!payload || typeof payload !== "object") return;

      if (payload.type === "OAUTH_GOOGLE_SUCCESS") {
        const { accessToken, user } = payload;

        if (user) setAuth(user, accessToken);

        setGoogleLoading(false);
        navigate("/", { replace: true });
        return;
      }

      if (payload.type === "OAUTH_GOOGLE_ERROR") {
        setGoogleLoading(false);
        setError(payload.message || "Google sign-in failed. Please try again.");
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [backendOrigin, navigate, setAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await apiService.login({ email, password });

      const accessToken =
        res?.data?.accessToken || res?.data?.data?.accessToken;
      const user = res?.data?.user || res?.data?.data?.user || { email };

      setAuth(user, accessToken);

      navigate("/", { replace: true });
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("");
    setGoogleLoading(true);

    const width = 500;
    const height = 650;
    const left = Math.round(window.screen.width / 2 - width / 2);
    const top = Math.round(window.screen.height / 2 - height / 2);

    // Backend should redirect popup to a backend page that postMessages back.
    const redirectTo5000 = `${backendOrigin}/oauth/done`;

    const authUrl = `${backendOrigin}/api/auth/google?redirect=${encodeURIComponent(
      redirectTo5000
    )}`;

    const popup = window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      setGoogleLoading(false);
      setError("Popup blocked. Allow popups and try again.");
      return;
    }

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setGoogleLoading(false);
      }
    }, 400);
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <section className="auth-hero">
          <span className="auth-hero__badge">Universal starter</span>
          <div>
            <h1 className="auth-hero__title">Authentication screens that still feel product-ready.</h1>
            <p className="auth-hero__body">
              This template is intentionally neutral: clean enough for client work,
              modern enough for internal tools, and easy to adapt to a new brand.
            </p>
          </div>

          <div className="auth-checks">
            <div className="auth-check">
              <div className="auth-check__icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>Email, JWT, and OAuth foundation</strong>
                <div className="page-copy">Production-shaped auth flow without heavy branding.</div>
              </div>
            </div>
            <div className="auth-check">
              <div className="auth-check__icon">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong>Responsive by default</strong>
                <div className="page-copy">Single-column mobile layout and a stronger desktop presentation.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card__header">
            <span className="kicker">Login</span>
            <h2 className="auth-card__title">Welcome back</h2>
            <p className="page-copy">Use your email and password or continue with Google.</p>
          </div>

          {error && (
            <div className="feedback feedback--error" style={{ whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          )}

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email" className="field__label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field__input"
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="field__label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field__input"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="button button--primary button--full"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="button button--secondary button--full"
          >
            {googleLoading ? "Opening Google..." : "Sign in with Google"}
          </button>

          <p className="auth-footer">
            No account yet? <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
