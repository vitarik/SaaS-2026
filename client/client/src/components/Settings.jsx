import React from "react";
import { Bell, PanelsTopLeft, SlidersHorizontal } from "lucide-react";

const Settings = () => {
  return (
    <>
      <section className="page-section">
        <div className="page-header">
          <span className="kicker">Settings</span>
          <h2 className="page-title">Platform defaults</h2>
          <p className="page-subtitle">
            Keep settings generic at template stage, then specialize them around notification,
            billing, workspace, or product behavior once the domain is clear.
          </p>
        </div>
      </section>

      <section className="grid grid--3">
        <article className="settings-card">
          <div className="metric-card__icon">
            <SlidersHorizontal size={20} />
          </div>
          <h3 className="section-title">Preferences</h3>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Theme token</strong>
              <span>Neutral starter</span>
            </div>
            <div className="settings-row">
              <strong>Density</strong>
              <span>Comfortable</span>
            </div>
          </div>
        </article>

        <article className="settings-card">
          <div className="metric-card__icon">
            <Bell size={20} />
          </div>
          <h3 className="section-title">Notifications</h3>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Email updates</strong>
              <span>Placeholder</span>
            </div>
            <div className="settings-row">
              <strong>Product alerts</strong>
              <span>Placeholder</span>
            </div>
          </div>
        </article>

        <article className="settings-card">
          <div className="metric-card__icon">
            <PanelsTopLeft size={20} />
          </div>
          <h3 className="section-title">Workspace</h3>
          <div className="settings-list">
            <div className="settings-row">
              <strong>Layout mode</strong>
              <span>Responsive shell</span>
            </div>
            <div className="settings-row">
              <strong>Starter profile</strong>
              <span>Reusable</span>
            </div>
          </div>
        </article>
      </section>
    </>
  );
};

export default Settings;
