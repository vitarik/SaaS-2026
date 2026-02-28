// src/components/OAuthCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiService from "../api/apiService";
import { extractAccessToken, extractUser, normalizeApiError } from "../api/apiResponse";
import { useAuth } from "../context/AuthContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Finishing Google sign-in...");
  const { setAuth } = useAuth();

  useEffect(() => {
    const sendError = (message) => {
      if (window.opener) {
        try {
          window.opener.postMessage(
            { type: "OAUTH_GOOGLE_ERROR", message },
            window.location.origin
          );
        } catch {}
        window.close();
        return;
      }

      navigate("/login", { replace: true });
    };

    const sendSuccess = ({ accessToken, user }) => {
      if (window.opener) {
        try {
          window.opener.postMessage(
            { type: "OAUTH_GOOGLE_SUCCESS", accessToken, user },
            window.location.origin
          );
        } catch {}
        window.close();
        return;
      }

      if (user) setAuth(user, accessToken);
      navigate("/", { replace: true });
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

      if (!accessToken || !user) {
        try {
          setMsg("Fetching session...");
          const refreshRes = await apiService.refresh();
          const nextAccessToken = extractAccessToken(refreshRes) || accessToken;
          const meRes = await apiService.getCurrentUser();
          const meUser = extractUser(meRes);

          if (!meUser?.id) return sendError("No user returned from the active session.");

          return sendSuccess({ accessToken: nextAccessToken, user: meUser });
        } catch (e) {
          return sendError(normalizeApiError(e, "Google sign-in failed."));
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
