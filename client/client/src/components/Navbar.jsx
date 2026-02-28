// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
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

  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/" style={{ textDecoration: "none", fontWeight: 700 }}>
          MyApp
        </Link>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <div>
              Welcome{" "}
              <b>{user?.first_name || user?.email || "User"}</b>
            </div>
            <button onClick={handleLogout} style={{ cursor: "pointer" }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;