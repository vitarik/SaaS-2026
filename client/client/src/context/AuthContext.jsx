// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiService from "../api/apiService";
import { extractAccessToken, extractUser } from "../api/apiResponse";
import {
  clearStoredAuth,
  readStoredUser,
  writeStoredToken,
  writeStoredUser,
} from "../auth/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncSession = async () => {
    const refreshRes = await apiService.refresh();
    const accessToken = extractAccessToken(refreshRes);

    if (!accessToken) {
      throw new Error("No access token returned during session refresh.");
    }

    writeStoredToken(accessToken);

    const meRes = await apiService.getCurrentUser();
    const nextUser = extractUser(meRes);

    if (!nextUser?.id) {
      throw new Error("No user returned during session refresh.");
    }

    writeStoredUser(nextUser);
    setUser(nextUser);

    return nextUser;
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        if (active) setSyncing(true);
        await syncSession();
      } catch {
        clearStoredAuth();
        if (active) setUser(null);
      } finally {
        if (active) {
          setHydrated(true);
          setSyncing(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      clearStoredAuth();
      setUser(null);
    };

    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, []);

  const setAuth = (nextUser, accessToken) => {
    if (typeof accessToken !== "undefined") writeStoredToken(accessToken);
    writeStoredUser(nextUser);
    setUser(nextUser);
  };

  const setUserData = (nextUser) => {
    writeStoredUser(nextUser);
    setUser(nextUser);
  };

  const refreshSession = async () => {
    try {
      setSyncing(true);
      return await syncSession();
    } catch (error) {
      clearStoredAuth();
      setUser(null);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      hydrated,
      syncing,
      setAuth,
      setUserData,
      refreshSession,
      logout,
    }),
    [user, hydrated, syncing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
