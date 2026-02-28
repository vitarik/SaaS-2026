import React, { useEffect, useState } from "react";
import { BadgeCheck, RefreshCw, Save, Shield, UserRound } from "lucide-react";
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

const Profile = () => {
  const { user, setUserData } = useAuth();
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const [form, setForm] = useState({ first_name: "", last_name: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
    });
  }, [user?.first_name, user?.last_name]);

  useEffect(() => {
    if (!user?.id || user?.created_at) return undefined;

    let active = true;

    const loadProfile = async () => {
      try {
        const response = await apiService.getCurrentUser();
        const nextUser = extractUser(response);
        if (active && nextUser?.id) {
          setUserData(nextUser);
        }
      } catch {
        // Ignore auto-refresh failures here; explicit actions surface errors.
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id, user?.created_at, setUserData]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleRefresh = async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const response = await apiService.getCurrentUser();
      const nextUser = extractUser(response);

      if (!nextUser?.id) {
        throw new Error("No user returned from the API.");
      }

      setUserData(nextUser);
      setSuccess("Profile data synchronized.");
    } catch (err) {
      setError(normalizeApiError(err, "Unable to load profile."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");
      setSaving(true);

      const response = await apiService.updateCurrentUser({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      const nextUser = extractUser(response);

      if (!nextUser?.id) {
        throw new Error("No user returned after saving.");
      }

      setUserData(nextUser);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(normalizeApiError(err, "Unable to update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="page-section">
        <div className="page-header">
          <span className="kicker">Profile</span>
          <h2 className="page-title">Account identity</h2>
          <p className="page-subtitle">
            A simple profile surface that can expand into account editing, security,
            organizations, and role management.
          </p>
        </div>
      </section>

      <section className="grid grid--2">
        <article className="profile-card">
          <div className="card-header">
            <div>
              <div className="metric-card__icon">
                <UserRound size={20} />
              </div>
              <h3 className="section-title">Edit profile</h3>
              <p className="page-copy">
                This page now saves directly to `PATCH /api/users/me`.
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={handleRefresh}
              disabled={loading || saving}
            >
              <RefreshCw size={16} />
              {loading ? "Refreshing..." : "Reload"}
            </button>
          </div>

          {error && <div className="feedback feedback--error">{error}</div>}
          {success && <div className="feedback feedback--success">{success}</div>}

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="first_name" className="field__label">
                First name
              </label>
              <input
                id="first_name"
                className="field__input"
                value={form.first_name}
                onChange={handleChange("first_name")}
                placeholder="Add a first name"
              />
            </div>

            <div className="field">
              <label htmlFor="last_name" className="field__label">
                Last name
              </label>
              <input
                id="last_name"
                className="field__input"
                value={form.last_name}
                onChange={handleChange("last_name")}
                placeholder="Add a last name"
              />
            </div>

            <div className="field">
              <label htmlFor="email" className="field__label">
                Email
              </label>
              <input
                id="email"
                className="field__input"
                value={user?.email || ""}
                readOnly
              />
              <p className="field__hint">Email remains read-only in the starter template.</p>
            </div>

            <div className="button-row">
              <button
                type="submit"
                className="button button--primary"
                disabled={saving || loading}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </article>

        <article className="profile-card">
          <div className="metric-card__icon">
            <Shield size={20} />
          </div>
          <h3 className="section-title">Account status</h3>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Provider</strong>
              <span>{user?.provider || "Email credentials"}</span>
            </div>
            <div className="settings-row">
              <strong>Session</strong>
              <span>Active</span>
            </div>
            <div className="settings-row">
              <strong>User ID</strong>
              <span><code>{user?.id || "-"}</code></span>
            </div>
            <div className="settings-row">
              <strong>Created</strong>
              <span>{formatDate(user?.created_at)}</span>
            </div>
            <div className="settings-row">
              <strong>Updated</strong>
              <span>{formatDate(user?.updated_at)}</span>
            </div>
            <div className="settings-row">
              <strong>Display name</strong>
              <span>{fullName || user?.email || "-"}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card">
        <span className="section-badge">
          <BadgeCheck size={14} />
          Future profile module
        </span>
        <h3 className="section-title">Good next additions</h3>
        <p className="page-copy">
          Profile editing, avatar upload, password reset, linked providers, and team membership
          are natural follow-ups that fit this page structure cleanly.
        </p>
      </section>
    </>
  );
};

export default Profile;
