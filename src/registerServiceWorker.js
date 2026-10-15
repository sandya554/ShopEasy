import { BASE_URL } from "./utils/baseUrl.js";

// (d) PWA: registers public/sw.js.
// Only in the production build: during `npm run dev` a service worker would
// keep serving old files and make development confusing.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${BASE_URL}sw.js`, { scope: BASE_URL }).catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
