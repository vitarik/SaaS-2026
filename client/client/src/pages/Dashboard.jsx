// src/components/Dashboard.jsx
import React from "react";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ marginTop: 6 }}>
          Welcome <b>{user?.first_name || user?.email || "User"}</b>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Auth status</div>
          <div>✅ Email/password login</div>
          <div>✅ Google OAuth</div>
          <div>✅ Persisted session</div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>User</div>
          <div style={{ fontSize: 14 }}>
            <div><b>Email:</b> {user?.email || "-"}</div>
            <div>
              <b>Name:</b>{" "}
              {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "-"}
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Next (template)</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Profile page</li>
            <li>Settings page</li>
            <li>Sidebar layout</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;