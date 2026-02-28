// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiService from "../api/apiService";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const res = await apiService.register({ email, password });

      const user = res?.data?.user || res?.data?.data?.user || { email };
      const token = res?.data?.accessToken || res?.data?.data?.accessToken;

      // ✅ single source of truth (context + storage)
      setAuth(user, token);

      setSuccess("Account created. Redirecting to dashboard...");
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("");
    setSuccess("");

    const width = 500;
    const height = 600;
    const left = Math.round(window.screen.width / 2 - width / 2);
    const top = Math.round(window.screen.height / 2 - height / 2);

    const popup = window.open(
      "/api/auth/google",
      "google_oauth",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    if (!popup) {
      setError("Popup blocked. Allow popups and try again.");
      return;
    }

    setGoogleLoading(true);

    function onMessage(e) {
      try {
        const serverOrigin =
          process.env.REACT_APP_SERVER_ORIGIN || "http://localhost:5000";
        if (e.origin !== serverOrigin) return;
        if (!e.data || e.data.type !== "oauth") return;

        const { payload } = e.data;
        const user = payload?.user;
        const accessToken = payload?.accessToken;

        if (user) {
          // ✅ context handles storage + state
          setAuth(user, accessToken);
        }

        window.removeEventListener("message", onMessage);
        if (!popup.closed) popup.close();

        setGoogleLoading(false);
        navigate("/");
      } catch {
        // ignore
      }
    }

    window.addEventListener("message", onMessage);

    const poll = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(poll);
          window.removeEventListener("message", onMessage);
          setGoogleLoading(false);
          return;
        }

        // exchange refresh cookie -> access token
        const refreshRes = await apiService.refresh();
        const accessToken =
          refreshRes?.data?.accessToken || refreshRes?.data?.data?.accessToken;

        if (!accessToken) return;

        // fetch user using access token
        const meRes = await apiService.me(accessToken);
        const user = meRes?.data?.user || meRes?.data?.data?.user;

        if (user) {
          setAuth(user, accessToken);

          clearInterval(poll);
          window.removeEventListener("message", onMessage);
          if (!popup.closed) popup.close();

          setGoogleLoading(false);
          navigate("/");
        }
      } catch {
        // ignore until auth completes
      }
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Register</h1>

      {error && (
        <div style={{ color: "red", marginBottom: 10, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: "green", marginBottom: 10 }}>{success}</div>
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
            autoComplete="new-password"
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
          {loading ? "Creating..." : "Register"}
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
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;