// src/pages/Login.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Login</h1>

      {error && (
        <div style={{ color: "red", marginBottom: 10, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label htmlFor="email" style={{ display: "block" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label htmlFor="password" style={{ display: "block" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
        >
          {googleLoading ? "Opening Google..." : "Sign in with Google"}
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;