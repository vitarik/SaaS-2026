// src/components/OAuthCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const OAuthCallback = ({ setUser }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Finishing Google sign-in...");

  useEffect(() => {
    const sendError = (message) => {
      try {
        window.opener?.postMessage(
          { type: "OAUTH_GOOGLE_ERROR", message },
          window.location.origin
        );
      } catch {}
      window.close();
    };

    const sendSuccess = ({ accessToken, user }) => {
      try {
        window.opener?.postMessage(
          { type: "OAUTH_GOOGLE_SUCCESS", accessToken, user },
          window.location.origin
        );
      } catch {}
      window.close();
    };

    const run = async () => {
      // Option A: backend redirected here with token/user in query
      const accessToken = params.get("token") || params.get("accessToken");

      // If backend also sent user as JSON (less common), parse it:
      let user = null;
      const userStr = params.get("user");
      if (userStr) {
        try {
          user = JSON.parse(decodeURIComponent(userStr));
        } catch {}
      }

      // Option B (recommended): backend sets session cookie,
      // then we call /api/auth/me to get user + token if you return it.
      if (!accessToken || !user) {
        try {
          setMsg("Fetching session...");
          const meRes = await axios.get("/api/auth/me", { withCredentials: true });

          const meUser = meRes?.data?.user;
          const meToken = meRes?.data?.accessToken; // if you return it

          if (!meUser) return sendError("No user returned from /api/auth/me.");

          // token optional if you rely on cookies only
          return sendSuccess({ accessToken: meToken || accessToken, user: meUser });
        } catch (e) {
          return sendError(
            e?.response?.data?.error?.message ||
              e?.response?.data?.message ||
              e?.message ||
              "Google sign-in failed."
          );
        }
      }

      // direct success
      return sendSuccess({ accessToken, user });
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user opened this page directly (not popup), navigate home
  useEffect(() => {
    const t = setTimeout(() => {
      if (!window.opener) navigate("/", { replace: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h2>Google OAuth</h2>
      <p>{msg}</p>
    </div>
  );
};

export default OAuthCallback;