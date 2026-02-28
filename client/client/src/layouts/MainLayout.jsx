import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Settings } from "lucide-react";

const STORAGE_KEY = "ui.sidebarCollapsed";

const Layout = ({ children }) => {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "1";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const itemStyle = (path) => {
    const active = location.pathname === path;
    return {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 10,
      textDecoration: "none",
      color: "#111",
      background: active ? "#eaeaea" : "transparent",
      fontWeight: active ? 800 : 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
    };
  };

  const iconBox = {
    width: 34,
    height: 34,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    border: "1px solid #e1e1e1",
    background: "#fff",
    flex: "0 0 auto",
  };

  const labelStyle = {
    opacity: collapsed ? 0 : 1,
    width: collapsed ? 0 : "auto",
    overflow: "hidden",
    transition: "opacity 150ms ease",
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>
      <aside
        style={{
          width: collapsed ? 80 : 240,
          transition: "width 200ms ease",
          borderRight: "1px solid #ddd",
          padding: 14,
          background: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            marginBottom: 14,
          }}
        >
          {!collapsed && <div style={{ fontWeight: 900, fontSize: 18 }}>Menu</div>}

          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand menu" : "Collapse menu"}
            style={{
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontWeight: 700,
            }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          <Link to="/" style={itemStyle("/")}>
            <div style={iconBox}>
              <LayoutDashboard size={18} />
            </div>
            <span style={labelStyle}>Dashboard</span>
          </Link>

          <Link to="/profile" style={itemStyle("/profile")}>
            <div style={iconBox}>
              <User size={18} />
            </div>
            <span style={labelStyle}>Profile</span>
          </Link>

          <Link to="/settings" style={itemStyle("/settings")}>
            <div style={iconBox}>
              <Settings size={18} />
            </div>
            <span style={labelStyle}>Settings</span>
          </Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: 20 }}>{children}</main>
    </div>
  );
};

export default Layout;