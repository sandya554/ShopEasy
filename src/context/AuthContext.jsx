import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { api, getErrorMessage, setUnauthorizedHandler } from "../services/apiClient.js";
import {
  TOKEN_KEY, getToken, setToken, clearToken, decodeToken, readSession, clearLegacyAuthData,
  getSessionNotice, setSessionNotice,
} from "../services/tokenStorage.js";
import { loadCart, resetCart } from "../store/cartSlice.js";
import { flushPendingCart } from "../store/store.js";

const AuthContext = createContext(null);

const MESSAGES = {
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  TOKEN_INVALID: "Your session is invalid. Please log in again.",
  NO_TOKEN: "Please log in to continue.",
};
const DEFAULT_SESSION_MESSAGE = "Your session is no longer valid. Please log in again.";

// What the app knows at start-up, based on the token saved in the browser.
function initialAuth() {
  clearLegacyAuthData();
  const s = readSession();
  // A saved, unexpired token: stay logged in, but confirm with the server first (ready: false).
  if (s.status === "valid") return { user: s.user, exp: s.exp, ready: false, message: "" };
  // Logged out: show the notice from an earlier forced logout until it is dismissed.
  if (s.status === "none") return { user: null, exp: 0, ready: true, message: getSessionNotice() };
  clearToken(); // expired or garbage token left over from earlier
  const message = s.status === "expired" ? MESSAGES.TOKEN_EXPIRED : MESSAGES.TOKEN_INVALID;
  setSessionNotice(message);
  return { user: null, exp: 0, ready: true, message };
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [auth, setAuth] = useState(initialAuth);

  // Ends the session locally: remove the token, empty the cart, remember why.
  const endSession = useCallback((message = "") => {
    clearToken();
    dispatch(resetCart());
    setSessionNotice(message);
    setAuth({ user: null, exp: 0, ready: true, message });
  }, [dispatch]);

  // (g) The Axios response interceptor calls this when the server answers 401.
  useEffect(
    () => setUnauthorizedHandler((code) => endSession(MESSAGES[code] || DEFAULT_SESSION_MESSAGE)),
    [endSession]
  );

  // On page load: ask the server whether the saved token is still accepted,
  // and fetch this user's cart.
  useEffect(() => {
    if (auth.ready) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        await dispatch(loadCart());
        if (!cancelled) setAuth((a) => ({ ...a, user: data.user, ready: true }));
      } catch {
        // A 401 is handled by the interceptor (it ends the session). For other
        // problems (e.g. server offline) keep the user logged in.
        if (!cancelled && getToken()) setAuth((a) => ({ ...a, ready: true }));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (g) Log out automatically the moment the token expires.
  useEffect(() => {
    if (!auth.user || !auth.exp) return undefined;
    const ms = Math.min(Math.max(auth.exp * 1000 - Date.now(), 0), 2 ** 31 - 1);
    const t = setTimeout(() => endSession(MESSAGES.TOKEN_EXPIRED), ms);
    return () => clearTimeout(t);
  }, [auth.user, auth.exp, endSession]);

  // Keep several tabs in step: logging out in one tab logs out the others.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== TOKEN_KEY) return;
      if (!e.newValue) endSession("");
      else window.location.reload(); // logged in as someone (else) in another tab
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [endSession]);

  // (b) Save the token after a successful login / signup.
  const startSession = useCallback(async ({ token, user }) => {
    setToken(token);
    await dispatch(loadCart()); // requests from here on carry the new token
    setSessionNotice(""); // a fresh login clears any old "session expired" notice
    setAuth({ user, exp: decodeToken(token)?.exp || 0, ready: true, message: "" });
    return { success: true, user };
  }, [dispatch]);

  // (a) Login against the API.
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password }, { skipAuthHandler: true });
      return await startSession(data);
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, [startSession]);

  const signup = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", { name, email, password }, { skipAuthHandler: true });
      return await startSession(data);
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, [startSession]);

  // (f) Logout: save any unsaved cart change, then remove the token.
  const logout = useCallback(async () => {
    await flushPendingCart();
    endSession("");
  }, [endSession]);

  const clearSessionMessage = useCallback(() => { setSessionNotice(""); setAuth((a) => ({ ...a, message: "" })); }, []);

  const value = useMemo(() => ({
    isLoggedIn: !!auth.user,
    isAdmin: auth.user?.role === "admin",
    authReady: auth.ready,
    user: auth.user,
    currentEmail: auth.user?.email || "",
    sessionMessage: auth.message,
    clearSessionMessage,
    login, signup, logout,
  }), [auth, login, signup, logout, clearSessionMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
