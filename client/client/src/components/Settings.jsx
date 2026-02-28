import React, { useEffect, useState } from "react";
import { Bell, PanelsTopLeft, RefreshCw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import apiService from "../api/apiService";
import { extractUser, normalizeApiError } from "../api/apiResponse";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "Not available yet";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const Settings = () => {
  const { user, setUserData, refreshSession, syncing } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user?.id || user?.created_at) return undefined;

    let active = true;

    const loadSettingsData = async () => {
      try {
        const response = await apiService.getCurrentUser();
        const nextUser = extractUser(response);
        if (active && nextUser?.id) {
          setUserData(nextUser);
        }
      } catch {
        // Ignore silent preload errors; manual actions surface feedback.
      }
    };

    loadSettingsData();

    return () => {
      active = false;
    };
  }, [user?.id, user?.created_at, setUserData]);

  const handleReloadAccount = async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const response = await apiService.getCurrentUser();
      const nextUser = extractUser(response);

      if (!nextUser?.id) {
        throw new Error("No account data returned.");
      }

      setUserData(nextUser);
      setSuccess("Account data reloaded.");
    } catch (err) {
      setError(normalizeApiError(err, "Unable to reload account data."));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    try {
      setError("");
      setSuccess("");
      await refreshSession();
      setSuccess("Session refreshed and account synchronized.");
    } catch (err) {
      setError(normalizeApiError(err, "Unable to refresh the session."));
    }
  };

  return (
    <>
      <section className="page-section">
        <div className="page-header">
          <span className="kicker">Settings</span>
          <h2 className="page-title">Platform defaults</h2>
          <p className="page-subtitle">
            This screen now reads live account data and gives you a real session refresh
            control, while still leaving room for future product-specific settings.
          </p>
        </div>
      </section>

      {(error || success) && (
        <section className="surface-card">
          {error && <div className="feedback feedback--error">{error}</div>}
          {success && <div className="feedback feedback--success">{success}</div>}
        </section>
      )}

      <section className="grid grid--3">
        <article className="settings-card">
          <div className="metric-card__icon">
            <SlidersHorizontal size={20} />
          </div>
          <h3 className="section-title">Session controls</h3>
          <p className="page-copy">
            Keep the active account in sync with the refresh cookie and current API state.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={handleRefreshSession}
              disabled={syncing || loading}
            >
              <RefreshCw size={16} />
              {syncing ? "Refreshing..." : "Refresh session"}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleReloadAccount}
              disabled={loading || syncing}
            >
              <ShieldCheck size={16} />
              {loading ? "Reloading..." : "Reload account"}
            </button>
          </div>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Status</strong>
              <span>{syncing ? "Syncing" : "Healthy"}</span>
            </div>
            <div className="settings-row">
              <strong>Auth model</strong>
              <span>JWT + refresh cookie</span>
            </div>
          </div>
        </article>

        <article className="settings-card">
          <div className="metric-card__icon">
            <Bell size={20} />
          </div>
          <h3 className="section-title">Account record</h3>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Email</strong>
              <span>{user?.email || "-"}</span>
            </div>
            <div className="settings-row">
              <strong>Provider</strong>
              <span>{user?.provider || "Email credentials"}</span>
            </div>
            <div className="settings-row">
              <strong>Created</strong>
              <span>{formatDate(user?.created_at)}</span>
            </div>
            <div className="settings-row">
              <strong>Updated</strong>
              <span>{formatDate(user?.updated_at)}</span>
            </div>
          </div>
        </article>

        <article className="settings-card">
          <div className="metric-card__icon">
            <PanelsTopLeft size={20} />
          </div>
          <h3 className="section-title">Next settings modules</h3>
          <p className="page-copy">
            With the session plumbing live, the next layer is product-specific settings.
          </p>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Notifications</strong>
              <span>Email and in-app</span>
            </div>
            <div className="settings-row">
              <strong>Workspace defaults</strong>
              <span>Teams, regions, locales</span>
            </div>
            <div className="settings-row">
              <strong>Billing</strong>
              <span>Plans and invoices</span>
            </div>
          </div>
        </article>
      </section>
    </>
  );
};

export default Settings;
