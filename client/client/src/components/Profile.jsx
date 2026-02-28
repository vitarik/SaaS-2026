import React from "react";
import { BadgeCheck, Shield, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

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
          <div className="metric-card__icon">
            <UserRound size={20} />
          </div>
          <h3 className="section-title">Profile details</h3>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Full name</dt>
              <dd>{fullName || "-"}</dd>
            </div>
            <div className="detail-row">
              <dt>Email</dt>
              <dd>{user?.email || "-"}</dd>
            </div>
            <div className="detail-row">
              <dt>First name</dt>
              <dd>{user?.first_name || "-"}</dd>
            </div>
            <div className="detail-row">
              <dt>Last name</dt>
              <dd>{user?.last_name || "-"}</dd>
            </div>
          </dl>
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
              <strong>Template scope</strong>
              <span>Ready for expansion</span>
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
