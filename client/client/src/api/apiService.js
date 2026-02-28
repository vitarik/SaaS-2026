// src/api/apiService.js
import api from "./axiosClient";

const apiService = {
  // Auth (email/password)
  login: (payload) => api.post("/auth/login", payload),
  register: (payload) => api.post("/auth/register", payload),
  logout: () => api.post("/auth/logout"),

  // Refresh cookie -> new access token
  refresh: () => api.post("/auth/refresh", {}),

  // Session / user
  me: () => api.get("/auth/me"),
  getCurrentUser: () => api.get("/users/me"),
  updateCurrentUser: (payload) => api.patch("/users/me", payload),
};

export default apiService;
