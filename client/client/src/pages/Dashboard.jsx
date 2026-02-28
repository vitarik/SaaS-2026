// src/components/Dashboard.jsx
import React from "react";
import { Check, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  return (
    <>
      <section className="page-section">
        <div className="page-header">
          <span className="kicker">Dashboard</span>
          <h2 className="page-title">Welcome {user?.first_name || user?.email || "User"}</h2>
          <p className="page-subtitle">
            This landing area is intentionally generic so it can become analytics,
            onboarding, CRM, operations, or internal tooling with minimal restructuring.
          </p>
        </div>
      </section>

      <section className="grid grid--3">
        <article className="metric-card">
          <div className="metric-card__icon">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h3 className="metric-card__title">Auth status</h3>
            <p className="page-copy">The template already includes the core account flow.</p>
          </div>
          <ul className="check-list">
            <li>
              <span className="check-icon">
                <Check size={15} />
              </span>
              Email and password login
            </li>
            <li>
              <span className="check-icon">
                <Check size={15} />
              </span>
              Google OAuth
            </li>
            <li>
              <span className="check-icon">
                <Check size={15} />
              </span>
              Session persistence
            </li>
          </ul>
        </article>

        <article className="metric-card">
          <div className="metric-card__icon">
            <UserRound size={20} />
          </div>
          <div>
            <h3 className="metric-card__title">Current user</h3>
            <p className="page-copy">Basic identity values are ready for account views and billing flows.</p>
          </div>
          <dl className="detail-list">
            <div className="detail-row">
              <dt>Email</dt>
              <dd>{user?.email || "-"}</dd>
            </div>
            <div className="detail-row">
              <dt>Name</dt>
              <dd>{fullName || "-"}</dd>
            </div>
            <div className="detail-row">
              <dt>Mode</dt>
              <dd>Template starter</dd>
            </div>
          </dl>
        </article>

        <article className="metric-card">
          <div className="metric-card__icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="metric-card__title">Suggested next modules</h3>
            <p className="page-copy">Drop one of these into the same shell without redesigning the app.</p>
          </div>
          <ul className="check-list">
            <li>
              <span className="check-icon">
                <Check size={15} />
              </span>
              Billing and plans
            </li>
            <li>
              <span className="check-icon">
                <Check size={15} />
              </span>
              Team and permissions
            </li>
            <li>
              <span className="check-icon">
                <Check size={15} />
              </span>
              Domain-specific dashboard cards
            </li>
          </ul>
        </article>
      </section>

      <section className="grid grid--2">
        <article className="surface-card">
          <span className="section-badge">Scalable structure</span>
          <h3 className="section-title">What this frontend now gives you</h3>
          <p className="page-copy">
            A responsive shell, stronger navigation, reusable surfaces, and form patterns
            that feel modern without pushing the project into a niche visual direction.
          </p>
        </article>

        <article className="surface-card">
          <span className="section-badge">Template note</span>
          <h3 className="section-title">Designed to be re-skinned</h3>
          <p className="page-copy">
            Swap the copy, accent color, or typography tokens and the same layout can
            support very different SaaS products.
          </p>
        </article>
      </section>
    </>
  );
};

export default Dashboard;
