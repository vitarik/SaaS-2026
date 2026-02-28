// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";

const ProtectedRoute = ({ children }) => {
  const { user, hydrated } = useAuth();

  if (!hydrated) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <MainLayout>{children}</MainLayout>;
};

export default ProtectedRoute;