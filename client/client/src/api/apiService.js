// src/api/apiService.js
import api from "./axiosClient";

const apiService = {
  // Auth (email/password)
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  logout: () => api.post("/auth/logout"),

  // Session / user
  me: (accessToken) =>
    api.get("/auth/me", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }),

  // Refresh cookie -> new access token
  refresh: () => api.post("/auth/refresh", {}),
};

export default apiService;