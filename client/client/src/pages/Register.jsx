// src/pages/Register.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Layers3 } from "lucide-react";
import apiService from "../api/apiService";
import { extractAccessToken, extractUser, normalizeApiError } from "../api/apiResponse";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(""); // always string
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    try {
      setLoading(true);

      const res = await apiService.register({ email, password });
      const user = extractUser(res) || { email };
      const token = extractAccessToken(res);

      setAuth(user, token);

      setSuccess("Account created. Redirecting to dashboard...");
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    const width = 500;
    const height = 650;
    const left = Math.round(window.screen.width / 2 - width / 2);
    const top = Math.round(window.screen.height / 2 - height / 2);

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
          <span className="auth-hero__badge">Launch faster</span>
          <div>
            <h1 className="auth-hero__title">A starter account flow you can hand to almost any new project.</h1>
            <p className="auth-hero__body">
              The design stays understated on purpose. It gives future projects a solid
              interface foundation without forcing a strong visual identity too early.
            </p>
          </div>

          <div className="auth-checks">
            <div className="auth-check">
              <div className="auth-check__icon">
                <Layers3 size={18} />
              </div>
              <div>
                <strong>Template-first layout</strong>
                <div className="page-copy">Structured sections, cards, and spacing that can be rebranded quickly.</div>
              </div>
            </div>
            <div className="auth-check">
              <div className="auth-check__icon">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong>Ready for product-specific modules</strong>
                <div className="page-copy">Swap copy, colors, or navigation without rewriting the page composition.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card__header">
            <span className="kicker">Create account</span>
            <h2 className="auth-card__title">Set up your workspace</h2>
            <p className="page-copy">Register with email/password or continue with Google.</p>
          </div>

          {error && (
            <div className="feedback feedback--error" style={{ whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          )}

          {success && <div className="feedback feedback--success">{success}</div>}

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
                autoComplete="new-password"
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
              {loading ? "Creating..." : "Register"}
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
            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
