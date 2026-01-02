import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth";

// In production (Docker/nginx), use relative URLs so nginx can proxy
// In development (Vite), use the backend URL directly or rely on Vite proxy
const API_URL = import.meta.env.VITE_API_URL || "";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Check if we're on a public auth page (no API auth handling needed)
 */
function isOnAuthPage() {
  const currentPath = window.location.pathname;
  return (
    currentPath === "/login" ||
    currentPath === "/register" ||
    currentPath.startsWith("/auth/callback")
  );
}

// Track if we're currently clearing auth to prevent multiple clears
let isClearing = false;

/**
 * Clear auth state from both localStorage AND zustand in-memory store
 * This ensures the app immediately reflects the unauthenticated state
 * Uses setTimeout to avoid state updates during React render cycles
 */
function performLogout() {
  if (isClearing) return;
  isClearing = true;

  // Use setTimeout to defer the state update and avoid React render cycle issues
  setTimeout(() => {
    // Call zustand's logout which clears both localStorage and in-memory state
    useAuthStore.getState().logout();
  }, 0);

  // Reset after a delay to allow future auth clears
  setTimeout(() => {
    isClearing = false;
  }, 1000);
}

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't process auth errors when on auth pages - just reject immediately
    if (isOnAuthPage()) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } =
            response.data.tokens;

          localStorage.setItem("access_token", access_token);
          localStorage.setItem("refresh_token", newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token failed - logout and let React Router handle redirect
          performLogout();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - logout and let React Router handle redirect
        performLogout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
