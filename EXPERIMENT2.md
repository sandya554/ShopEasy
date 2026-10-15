# ShopEasy – Unit 5, Experiment 2: Optimize E-Commerce Application

**Topics:** Performance, Lazy Loading, Code Splitting, PWA, Accessibility, Security
(Continues from Experiment 1. The app's features are unchanged; this experiment makes it faster, installable, accessible and safer.)

## Run it

```bash
npm install
npm test                       # Experiment 1 tests + the new Experiment 2 tests
npm run server                 # terminal 1: API on :3001
npm run build && npm run preview   # terminal 2: production build on http://localhost:4173
```

The service worker and the Content-Security-Policy are **production-only**, so use `build` + `preview` (not `npm run dev`) to see the PWA and the split files. `preview` forwards `/api` to the API server the same way `dev` does.

## Where each task is done

| Task | What was done | Where |
|---|---|---|
| **a) Lazy loading** | Product details, checkout, order confirmation, orders, admin product manager and sign-up are loaded with `React.lazy` + `Suspense` (spinner "Loading page..."). `.preload()` fetches the next likely page while the browser is idle (checkout from the cart page, product details from the product list). | `src/routes/lazyPages.js`, `src/utils/lazyWithPreload.js`, `src/App.jsx` |
| **b) Code splitting** | Every lazy page is its own file in the build. Libraries are grouped into `react-vendor`, `redux-vendor` and `http-vendor` files that rarely change, so they stay cached across updates. A failed chunk download shows "Reload page". | `vite.config.js` (`manualChunks`), `src/components/ErrorBoundary.jsx` |
| **c) Images and API rendering** | **Images:** one `ProductImage` component: `loading="lazy"`, `decoding="async"`, width/height (no layout jump), first 4 cards and the detail photo load early (`fetchpriority="high"`), placeholder when the picture is missing or the URL is unsafe. **Rendering:** `ProductCard` is `memo`-ised and no longer re-renders on every cart change; the list draws 8 products at a time ("Show more"); `content-visibility: auto` skips off-screen cards. **API:** categories are not downloaded again once in the store; an existing list stays on screen while a new search loads (no spinner flash). | `src/components/ProductImage.jsx`, `ProductCard.jsx`, `ProductList.jsx`, `src/store/productsSlice.js` |
| **d) PWA** | Web app manifest (name, icons, theme colour, start URL, shortcuts). `public/sw.js`: app shell saved at install; pages network-first with offline fallback (`offline.html`); hashed `/assets` cache-first; product API network-first with last good copy. **Login, cart and order requests are never cached.** Offline banner in the app. | `public/site.webmanifest`, `public/sw.js`, `public/offline.html`, `src/registerServiceWorker.js`, `src/components/OfflineBanner.jsx` |
| **e) Keyboard and accessible labels** | "Skip to main content" link; focus moves to the page content and the page title changes on every navigation; `/` jumps to the search box (search no longer steals focus on load); every filter/sort control has a name; form errors are linked to their field (`aria-describedby`, `aria-invalid`) and focus jumps to the first invalid field on submit; `fieldset`/`legend` groups in checkout; "+", "-", "x" and "Add"/"View" buttons announce which product they belong to; cart count is announced; visible focus outline; reduced-motion support; error text and the green button darkened for contrast. | `App.jsx`, `Header.jsx`, `SearchBar.jsx`, `FilterPanel.jsx`, `Input.jsx`, `Checkout.jsx`, `Cart.jsx`, `useForm.js`, `index.css` |
| **f) Secure input and safe API use** | **Client:** text is cleaned while typing (control characters removed, max lengths); product id from the URL must be a whole number and is URL-encoded in API paths; only `http(s)` image URLs are used and no Referer is sent; after login only in-app paths are accepted (no open redirect); correct `autocomplete` values; Content-Security-Policy added to the production `index.html`; Axios refuses oversized responses. **Server:** security headers, `no-store` on private routes, CORS allow-list (`ALLOWED_ORIGINS`), request size limit, login/sign-up rate limit, JWT algorithm pinned to HS256, `JWT_SECRET` required in production, length limits on name/address/city/password. | `src/utils/sanitize.js`, `Checkout.jsx`, `Login.jsx`, `Signup.jsx`, `ProductDetailPage.jsx`, `productApi.js`, `apiClient.js`, `vite.config.js`, `server/server.js` |

## How to check each task (for your output / screenshots)

- **a/b:** `npm run build` lists the files with sizes (`index-*.js`, `react-vendor-*.js`, `Checkout-*.js`, `ProductDetailPage-*.js` ...). In the browser, open DevTools → Network → JS, load `/products`, then click **View** and watch the detail file load.
- **c:** DevTools → Network → Img: only the first cards' pictures load at once; scroll and the rest follow. Lighthouse → Performance (check LCP and CLS).
- **d:** DevTools → Application → Manifest (installable) and Service Workers (activated). Tick **Offline** under Network and reload: the app opens, visited product lists still show, and the offline banner appears. Lighthouse → PWA / Installable.
- **e:** Put the mouse aside and use only **Tab**, **Shift+Tab**, **Enter**, **Space** and **/**. Lighthouse → Accessibility; a screen reader (NVDA / VoiceOver) reads the labels.
- **f:** In the production build, DevTools → Network → the `/api/auth/*` response has `Cache-Control: no-store`; ten quick wrong logins past the limit return HTTP 429; `/products/..%2Forders` shows "Product not found" without calling the API.

## Tests

`npm test` still runs the 10 Experiment 1 test files. New files: `sanitize.test.js`, `lazyWithPreload.test.js`, `ProductImage.test.jsx`, `ProductListPaging.test.jsx`, `Accessibility.test.jsx`. Accessible names of existing buttons and links ("Add", "View", "+", "-", "x") were kept on purpose, so the Experiment 1 tests describe the same screens.

## Known limits (worth mentioning in a report)

- Product photos are hot-linked from other sites, so they cannot be resized or converted. The next step would be to host them yourself as WebP/AVIF with `srcset`.
- The service worker does not cache those other-site photos (the browser's own cache handles them) and does not save lazy page files that were never opened while online.
- The login token is kept in `localStorage`, which a script injected into the page could read. The CSP and React's escaping reduce that risk; the stronger fix is an `HttpOnly` cookie plus CSRF protection.
- The rate limiter is in memory (one server process); a real deployment would use a shared store.
