// src/api/axiosClient.js
import axios from "axios";
import { clearStoredAuth, readStoredToken, writeStoredToken } from "../auth/authStorage";
import { extractAccessToken } from "./apiResponse";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

const shouldBypassRefresh = (config = {}) => {
  const url = config.url || "";

  return (
    config.skipAuthRefresh ||
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/google")
  );
};

axiosClient.interceptors.request.use((config) => {
  const token = readStoredToken();

  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      shouldBypassRefresh(originalRequest)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: { "Content-Type": "application/json" },
            }
          )
          .then((response) => {
            const accessToken = extractAccessToken(response);
            if (!accessToken) {
              throw new Error("Refresh did not return an access token.");
            }

            writeStoredToken(accessToken);
            return accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const accessToken = await refreshPromise;

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${accessToken}`,
      };

      return axiosClient(originalRequest);
    } catch (refreshError) {
      clearStoredAuth();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
      }

      return Promise.reject(refreshError);
    }
  }
);

export default axiosClient;
