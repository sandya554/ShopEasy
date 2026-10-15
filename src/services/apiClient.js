import axios from "axios";
import { getToken } from "./tokenStorage.js";

// One Axios instance for the whole app. In development Vite proxies /api/* to
// the API server (vite.config.js). Set VITE_API_URL to use another server.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  // (f) Safe API practices: no cookies are sent to other sites (the login token goes in
  // the Authorization header instead), and oversized responses / requests are refused.
  withCredentials: false,
  maxContentLength: 2 * 1024 * 1024,
  maxBodyLength: 256 * 1024,
});

// ---- Request interceptor: attach the token --------------------------------
// Runs before every request, so no component has to remember to send the token.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.sentToken = token; // remembered so a late 401 can be matched to this login
  }
  return config;
});

// ---- Response interceptor: invalid / expired token -----------------------
// AuthContext registers what to do when the server says "401 Unauthorized".
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
  return () => { if (onUnauthorized === fn) onUnauthorized = null; };
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const cfg = error.config || {};
    const status = error.response?.status;
    // Ignore: login/register calls (a 401 there just means wrong credentials)
    // and 401s for a token that was already replaced or removed (e.g. an old
    // request finishing after the user logged out and back in).
    if (status === 401 && !cfg.skipAuthHandler && cfg.sentToken && cfg.sentToken === getToken()) {
      onUnauthorized?.(error.response.data?.code);
    }
    return Promise.reject(error);
  }
);

// Turns an Axios error into a message that is safe to show to the user.
export function getErrorMessage(err) {
  if (err.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (err.response) {
    const { status, data } = err.response;
    const serverMsg = typeof data?.message === "string" ? data.message : "";
    if (status === 401) return serverMsg || "Please log in to continue.";
    if (status === 403) return serverMsg || "You don't have permission to do that.";
    if (status === 404) return serverMsg || "We couldn't find that. It may have been deleted.";
    if (status === 409 || status === 422) return serverMsg || "That conflicts with existing data.";
    if (status === 400) return serverMsg || "The server rejected the data. Please check the form and try again.";
    if (status >= 500) return `Server error (${status}). Make sure the API server is running (npm run server), then try again.`;
    return `Request failed (${status}). Please try again.`;
  }
  if (err.request) return "Network error. Check your connection and make sure the API server is running.";
  return err.message || "Something went wrong.";
}
