# ShopEasy – Unit 5, Experiment 1: Testing E-Commerce Components

> **Experiment 2 (optimization, PWA, accessibility, security)** is documented in [`EXPERIMENT2.md`](EXPERIMENT2.md).

> **Experiment 3 (deployment)** steps are in [`DEPLOY.md`](DEPLOY.md).

**Topics:** Jest, React Testing Library
(Continues from Experiment 4. The app itself is unchanged; this experiment adds the tests.)

## Commands

```bash
npm install             # once
npm test                # run all tests (10 files, 10 tests)
npm run test:report     # run + list every test name with a tick (use this to show the output)
npm run test:coverage   # optional: also show how much of the code the tests touch
npm run test:watch      # re-run automatically while you edit (press q to quit)
npx jest Cart           # run only one file, e.g. Cart
```

The tests do not need the API server or a browser. Jest uses a fake browser (jsdom) and the HTTP client is replaced inside the tests.
`TEST_RESULTS.txt` has the output of the last `npm run test:report`: **10 test files, 10 tests, all passed.**

## The 10 test files (one test in each)

| # | File | Type | What the test checks |
|---|---|---|---|
| 1 | `ProductCard.test.jsx` | component (RTL) | shows name, brand, rating, price and image; **Add** puts it in the cart and a second click raises the quantity |
| 2 | `ProductList.test.jsx` | component (RTL) | a card for every product; filters (rating, price) and sorting keep only the matching ones |
| 3 | `Home.test.jsx` | component (RTL) | loading indicator, then products; typing in the search box filters the list |
| 4 | `Cart.test.jsx` | component (RTL) | + and - change quantity, **x** removes an item, totals and discounts update |
| 5 | `Checkout.test.jsx` | component (RTL) | empty form shows errors; valid form places the order, empties the cart and opens the confirmation page |
| 6 | `cartReducer.test.js` | unit (Jest) | add-to-cart (new, same product again) and remove-from-cart logic |
| 7 | `cartQuantity.test.js` | unit (Jest) | quantity update, quantity below 1 removes the item, unknown id changes nothing |
| 8 | `calculateTotals.test.js` | unit (Jest) | subtotal, discount and delivery at each price band (₹2000 and ₹3000 limits) |
| 9 | `productFilter.test.js` | unit (Jest) | brand, price, rating and sort filters, alone and combined |
| 10 | `productApi.test.js` | unit (Jest) | `GET /products` with search text and category filtering, and API failure |

## Where each topic is covered

| Topic | Tests |
|---|---|
| a) ProductCard, ProductList, Cart, Checkout | files 1, 2, 4, 5 (and 3, the page that holds the list) |
| b) Product rendering and filtering | 1 and 2 (rendering), 2, 3, 9, 10 (filtering) |
| c) Add-to-cart and remove-from-cart | 1 (add), 4 (remove), 6 (logic) |
| d) Quantity modification and total calculation | 4 (on screen), 7 (quantity logic), 8 (totals) |
| e) Jest unit testing | 6, 7, 8, 9, 10 |
| f) React Testing Library component interaction | 1, 2, 3, 4, 5 (click, type and read the screen like a user) |
| g) Verify all test results | `npm run test:report`, saved in `TEST_RESULTS.txt` |

Helpers used by the tests are in `src/test/` (`renderWithProviders.jsx` renders a component with a fresh Redux store and router; `testData.js` has the sample products).

## How the results were verified

All 10 tests pass. To check they detect real bugs, six bugs were put into the app on purpose (wrong discount, quantity going up by 2, a dead "+" button, a wrong rating filter, a dead Add button, the cart not emptied after an order). Every one made at least one test fail, then the code was restored.

`babel.config.cjs`, `jest.config.cjs` and `src/test/` are used only by Jest; the Vite build is not affected.

---

# ShopEasy – Experiment 4: E-Commerce Authentication and Token Management

**Topics:** Authentication, Token Management, Protected API, Middleware
(This project builds on Experiment 3. The product CRUD page at `/admin/products` is the **admin** side of the store.)

## Run

```bash
npm install
npm run dev          # API (port 3001) + React app (port 5173) together
```

Open http://localhost:5173 and sign up as a shopper.

**Admin login** (to use **Manage** and the product CRUD from Experiment 3): `admin@shopeasy.com` / `Admin@1234`.
This account is created automatically on first start; set `ADMIN_PASSWORD` before the first start to choose your own. Run them separately with `npm run server` and `npm run web`.

**See token expiry quickly:** `npm run dev:short` makes tokens last only 30 seconds
(normal lifetime is 30 minutes; override with `TOKEN_TTL=2h`). Set `JWT_SECRET` to your own secret for anything beyond a lab.

## Where each topic is implemented

| Topic | Where |
|---|---|
| a) Login component using API authentication | `Login.jsx` / `Signup.jsx` → `login()` / `signup()` in `AuthContext.jsx` → `POST /auth/login`, `POST /auth/register` (`server/server.js`) |
| b) Store the token after login | `setToken()` in `src/services/tokenStorage.js` (localStorage key `shopeasy_token`), called from `startSession()` in `AuthContext.jsx` |
| c) Use the token for authenticated requests | Cart (`cartApi.js`), orders (`orderApi.js`), product writes (`productApi.js`) and `GET /auth/me` all go through the shared client and are sent as `Authorization: Bearer <token>` |
| d) Axios interceptors | `src/services/apiClient.js` – the **request interceptor** attaches the token; the **response interceptor** reacts to 401 |
| e) Protect cart, checkout and order operations | **Server:** `requireAuth` middleware guards `/cart`, `/orders`, `/auth/me` and product writes. **Client:** `ProtectedRoute.jsx` guards `/cart`, `/checkout`, `/orders`, and `/admin/products` (admin only). Each user has their own server-side cart and orders; prices are recalculated on the server |
| f) Logout and token removal | `logout()` in `AuthContext.jsx`: saves any unsaved cart change, removes the token, empties the local cart. Other open tabs are logged out too |
| g) Invalid or expired tokens | Server answers `401` with a code (`TOKEN_EXPIRED`, `TOKEN_INVALID`, `NO_TOKEN`). The interceptor calls `endSession()`, which removes the token and redirects protected pages to `/login`. A timer also logs out at the token's `exp` time, a bad stored token is cleared at start-up, and `SessionNotice.jsx` shows why |

## Demo guide (showing it to your teacher)

Start with `npm run dev`, open http://localhost:5173.

1. **Protected pages:** while logged out, open `/cart` or `/orders`. You are sent to the login page.
2. **Login + token (a, b):** sign up or log in. Press F12 → **Application** → **Local Storage** → `http://localhost:5173`. The `shopeasy_token` entry is the JWT.
3. **Token on requests (c, d):** F12 → **Network**, add a product to the cart, click the `cart` request → **Headers** → `Authorization: Bearer ...` (added by the Axios interceptor).
4. **Protected cart / checkout / orders (e):** the cart is saved per user on the server; place an order and see it in **Orders**. Log in as another user: their cart and orders are separate.
5. **Admin (Experiment 3 CRUD):** log in as `admin@shopeasy.com` / `Admin@1234`. You land on `/admin/products` and **Manage** appears in the menu. Shoppers cannot open it.
6. **Logout (f):** click Logout. The `shopeasy_token` entry disappears from Local Storage.
7. **Invalid token (g):** log in, then in Local Storage edit `shopeasy_token` (change a few letters at the end) and refresh. You are logged out and the yellow notice "Your session is invalid" appears. It stays until you click **Dismiss** or log in again.
8. **Expired token (g):** stop the servers, run `npm run dev:short` (tokens last 30 seconds), log in and wait. After 30 seconds you are logged out automatically and the notice "Your session has expired" appears.

## API

| Method | URL | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | public (returns `{ token, user }`) |
| GET | `/auth/me` | token |
| GET | `/products`, `/products/:id` | public |
| POST / PUT / PATCH / DELETE | `/products...` | **admin** token (customers get 403) |
| GET / PUT | `/cart` | token (that user's cart) |
| GET / POST | `/orders`, GET `/orders/:id` | token (that user's orders) |

## How the login flow works

1. `POST /auth/login` with email + password. The server compares against the **bcrypt hash** and returns a signed **JWT** (user id, name, email, expiry).
2. The app stores the token, then loads the user's cart from the server.
3. The request interceptor adds `Authorization: Bearer <token>` to every request.
4. The server's `requireAuth` middleware verifies the signature and expiry before running a protected route.
5. On start-up the app calls `GET /auth/me` to confirm the saved token is still accepted.

## Notes

- The token is kept in `localStorage`, which is simple and fine for this lab. Production apps often prefer httpOnly cookies, since script-readable storage is exposed if a page has an XSS bug.
- Roles: everyone who signs up is a `customer`. Only the `admin` sees **Manage**, and the server enforces it (403) so hiding the link is not the only protection. The role is stored in the token.
- Accounts, carts and orders are stored in `server/db.json`. Restart the API after editing it by hand.

---

# Included from Experiment 3: Product CRUD Operations using APIs

**Topics:** REST API, Axios/Fetch, CRUD operations. All of this still works in this project and is what the admin uses at `/admin/products`.

| Topic | Where |
|---|---|
| a) Retrieve products using **GET** | `fetchProducts`, `fetchProductById` in `src/services/productApi.js`; list shown on `/admin/products` and `/products` |
| b) Add products using **POST** | `createProduct` → `addProduct` thunk → "Add product" form (`ProductForm.jsx`) |
| c) Update using **PUT / PATCH** | `updateProduct` (PUT, "Edit" form) and `patchProduct` (PATCH, quick "Price" edit in `ProductRow.jsx`) |
| d) Delete using **DELETE** | `deleteProduct` → `removeProduct` thunk → "Delete" with Yes/No confirmation |
| e) Asynchronous responses | Axios + `async/await`; Redux `createAsyncThunk` (`src/store/productsSlice.js`) with pending / fulfilled / rejected cases |
| f) Loading indicators | `<Loading />` while the list loads; "Saving..." / "Deleting..." on buttons and rows during writes |
| g) API error handling | `getErrorMessage()` in `src/services/apiClient.js` maps timeout / 400 / 401 / 403 / 404 / 5xx / network errors to friendly text, shown with `<ErrorMessage />`, in the form, or in a banner; form fields are validated before any request is sent |

What Experiment 4 adds on top: the product write calls (POST / PUT / PATCH / DELETE) now need an **admin** token, which the Axios request interceptor attaches automatically. Browsing products (GET) stays public.
