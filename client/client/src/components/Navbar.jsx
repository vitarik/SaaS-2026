// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Menu } from "lucide-react";
import apiService from "../api/apiService";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      // If your backend has /auth/logout (cookie clearing), keep this:
      await apiService.logout();
    } catch (e) {
      // even if backend fails, we still clear local state
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const handleOpenSidebar = () => {
    window.dispatchEvent(new CustomEvent("app-shell:toggle-sidebar"));
  };

  const displayName = user?.first_name || user?.email || "User";
  const initials = (displayName || "U").slice(0, 1).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="brand">
          <div className="brand__mark">S</div>
          <div className="brand__text">
            <span className="brand__eyebrow">Starter UI</span>
            <span className="brand__title">SaaS Template</span>
          </div>
        </Link>

        <div className="topbar__actions">
          {user ? (
            <>
              <button
                className="button button--secondary topbar__menu-trigger"
                type="button"
                onClick={handleOpenSidebar}
              >
                <Menu size={17} />
                Menu
              </button>
              <div className="user-chip">
                <div className="user-chip__avatar">{initials}</div>
                <div className="user-chip__meta">
                  <span className="user-chip__label">Workspace</span>
                  <span className="user-chip__value">{displayName}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="button button--ghost"
                type="button"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button button--secondary">
                Login
              </Link>
              <Link to="/register" className="button button--primary">
                Register
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
