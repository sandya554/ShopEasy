// Where the login token (JWT) is kept in the browser, plus helpers to read it.
// A JWT is three base64 parts: header.payload.signature. The payload holds
// the user's id/name/email and the expiry time ("exp", in seconds).
export const TOKEN_KEY = "shopeasy_token";

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}
export function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked: the session just won't survive a refresh */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// Reads the payload WITHOUT verifying the signature. That is fine for showing
// the user's name or knowing when to log out; only the server can really
// verify a token (it does so on every protected request).
export function decodeToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.from(atob(base64), (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Looks at the stored token and says what state it is in:
//   none | invalid (not a real JWT) | expired | valid
export function readSession() {
  const token = getToken();
  if (!token) return { status: "none" };
  const p = decodeToken(token);
  if (!p?.sub || !p?.exp) return { status: "invalid" };
  if (p.exp * 1000 <= Date.now()) return { status: "expired" };
  return { status: "valid", token, exp: p.exp, user: { id: p.sub, name: p.name, email: p.email, role: p.role || "customer" } };
}

// Older versions of the app kept accounts (with plain-text passwords) and the
// cart in localStorage. Remove that data now that the server handles it.
export function clearLegacyAuthData() {
  try {
    ["shopeasy_users", "shopeasy_session", "shopeasy_cart_v2"].forEach((k) => localStorage.removeItem(k));
    Object.keys(localStorage).filter((k) => k.startsWith("shopeasy_orders_")).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// The "your session expired" notice is kept for the browser tab (sessionStorage)
// so it stays on screen after a refresh until the user dismisses it or logs in.
const NOTICE_KEY = "shopeasy_session_notice";
export function getSessionNotice() {
  try { return sessionStorage.getItem(NOTICE_KEY) || ""; } catch { return ""; }
}
export function setSessionNotice(message) {
  try { message ? sessionStorage.setItem(NOTICE_KEY, message) : sessionStorage.removeItem(NOTICE_KEY); } catch { /* ignore */ }
}
