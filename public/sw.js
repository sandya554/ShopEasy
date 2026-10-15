/* ShopEasy service worker (PWA, experiment 2 part d)
 *
 *  App shell (index.html + its JS/CSS)  -> saved at install, so the app opens offline
 *  Page navigations                     -> network first (always the newest app), cached page when offline
 *  /assets/*  (hashed JS/CSS chunks)    -> cache first (file names change when the code changes)
 *  GET /api/products...                 -> network first, last good copy when offline
 *  Everything else, especially /api/auth, /api/cart and /api/orders
 *  (login tokens, carts, orders)        -> NEVER cached, goes straight to the network
 *  Other websites (product photos)      -> not touched by the service worker
 */
// The folder the site is served from: "/" normally, "/ShopEasy/" on GitHub Pages.
const BASE = new URL("./", self.location).pathname;
const VERSION = "v1";
const SHELL = `shopeasy-shell-${VERSION}`;
const ASSETS = `shopeasy-assets-${VERSION}`;
const API = `shopeasy-api-${VERSION}`;
const KEEP = [SHELL, ASSETS, API];
const MAX_ASSETS = 60;
const MAX_API = 30;

const SHELL_FILES = [
  "offline.html", "site.webmanifest", "favicon.ico", "favicon-32x32.png", "favicon-16x16.png",
  "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png", "placeholder-product.svg",
].map((f) => BASE + f);
const PUBLIC_API = /^api\/products(\/\d+)?\/?$/; // the only API responses that may be stored (path after BASE)

// Saves each file separately, so one missing file does not make the install fail.
const precache = (cache, urls) => Promise.allSettled(urls.map((u) => cache.add(u)));

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await precache(shell, SHELL_FILES);
    try {
      // Save the home page and every /assets/ file it loads (the hashed names come from the HTML).
      const res = await fetch(BASE, { cache: "reload" });
      if (res.ok) {
        await shell.put(BASE, res.clone());
        const html = await res.text();
        const files = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await precache(await caches.open(ASSETS), files);
      }
    } catch { /* offline during install: runtime caching will fill the cache later */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith("shopeasy-") && !KEEP.includes(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

const cacheable = (res) => res && res.ok && res.type === "basic";

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(request).then((r) => { clearTimeout(timer); resolve(r); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

async function networkFirst(request, cacheName, { max, fallbackKey, offlinePage } = {}) {
  try {
    const res = await fetchWithTimeout(request, 5000);
    if (cacheable(res)) {
      const cache = await caches.open(cacheName);
      await cache.put(fallbackKey || request, res.clone());
      if (max) trim(cacheName, max);
    }
    return res;
  } catch (err) {
    const cached = await caches.match(fallbackKey || request);
    if (cached) return cached;
    if (offlinePage) { const page = await caches.match(offlinePage); if (page) return page; }
    throw err;
  }
}

async function cacheFirst(request, cacheName, max) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (cacheable(res)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, res.clone());
    if (max) trim(cacheName, max);
  }
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const update = fetch(request).then((res) => { if (cacheable(res)) cache.put(request, res.clone()); return res; });
  if (cached) { update.catch(() => {}); return cached; }
  return update;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;               // never touch POST / PUT / PATCH / DELETE
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;    // other websites (and an API on another host): leave to the browser
  if (!url.pathname.startsWith(BASE)) return;
  const rel = url.pathname.slice(BASE.length);        // path inside the app, e.g. "assets/x.js"

  if (rel.startsWith("api/")) {
    if (PUBLIC_API.test(rel)) event.respondWith(networkFirst(request, API, { max: MAX_API }));
    return;                                           // private API calls are never cached
  }
  if (request.mode === "navigate") {
    // Single-page app: every page is index.html, so offline we fall back to the saved home page.
    event.respondWith(networkFirst(request, SHELL, { fallbackKey: BASE, offlinePage: BASE + "offline.html" }));
    return;
  }
  if (rel.startsWith("assets/")) { event.respondWith(cacheFirst(request, ASSETS, MAX_ASSETS)); return; }
  if (/\.(png|ico|svg|webmanifest)$/.test(rel)) event.respondWith(staleWhileRevalidate(request, SHELL));
});
