// ShopEasy API  (Experiment 4: authentication + protected routes)
//
//   Public      POST /auth/register   POST /auth/login   GET /products[/:id]
//   Protected   GET  /auth/me
//               GET/PUT /cart
//               GET/POST /orders  GET /orders/:id
//   Admin only  POST/PUT/PATCH/DELETE /products...
//
// Protected routes need the header   Authorization: Bearer <JWT>
// Data is stored in server/db.json (lowdb, via json-server).
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import jsonServer from "json-server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const ttlArg = process.argv.find((a) => a.startsWith("--ttl="))?.split("=")[1];
const TOKEN_TTL = ttlArg || process.env.TOKEN_TTL || "30m"; // how long a login stays valid
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
if (!process.env.JWT_SECRET) console.warn("[auth] JWT_SECRET not set - using an insecure development secret.");
// (f) A guessable secret would let anyone forge login tokens, so production refuses to start without one.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("[auth] JWT_SECRET must be set when NODE_ENV=production.");
  process.exit(1);
}
const JWT_ALGORITHM = "HS256"; // fixed, so a token cannot choose a weaker algorithm (e.g. "none")

const app = jsonServer.create();
app.disable("x-powered-by"); // do not advertise the server software
const router = jsonServer.router(path.join(__dirname, "db.json"));
const db = router.db;

// ------------------------------------------------------------ admin account
// Customers use the shop; admins (store staff) manage the product catalogue.
// One admin is created on first start if none exists. Change the password
// with the ADMIN_PASSWORD environment variable before first start.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@shopeasy.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
if (!db.get("users").find({ role: "admin" }).value()) {
  db.get("users").push({
    id: randomUUID(), name: "Store Admin", email: ADMIN_EMAIL, role: "admin",
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10), createdAt: new Date().toISOString(),
  }).write();
  console.log(`[auth] Admin account created: ${ADMIN_EMAIL}${process.env.ADMIN_PASSWORD ? "" : " / Admin@1234 (default password)"}`);
}

// ---------------------------------------------------------------- helpers

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role || "customer" });

function signToken(user) {
  // The payload is readable by anyone (it is only signed, not encrypted),
  // so it holds nothing secret: user id, name, email. Expiry is the "exp" claim.
  return jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role || "customer" }, JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: JWT_ALGORITHM });
}

const fail = (res, status, message, code) => res.status(status).json({ message, ...(code && { code }) });

// Middleware: lets the request through only with a valid, unexpired token.
function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return fail(res, 401, "Please log in to continue.", "NO_TOKEN");
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    const user = db.get("users").find({ id: payload.sub }).value();
    if (!user) return fail(res, 401, "Your session is invalid. Please log in again.", "TOKEN_INVALID");
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return fail(res, 401, "Your session has expired. Please log in again.", "TOKEN_EXPIRED");
    return fail(res, 401, "Your session is invalid. Please log in again.", "TOKEN_INVALID");
  }
}

// Same pricing rules as src/store/cartSlice.js. The server recalculates totals
// itself, so the client can never choose its own price.
function calculateTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  let discount = 0;
  let delivery = subtotal === 0 ? 0 : 19;
  if (subtotal > 3000) { discount = 300; delivery = 59; }
  else if (subtotal > 2000) { discount = 150; delivery = 39; }
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

// [{id, quantity}] from the client -> full product rows from the database.
function hydrate(lines, { strict }) {
  if (!Array.isArray(lines)) return { error: "items must be a list." };
  const merged = new Map();
  for (const l of lines) {
    const id = Number(l?.id);
    const quantity = Number(l?.quantity);
    if (!Number.isInteger(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: "Each item needs a product id and a quantity between 1 and 99." };
    }
    merged.set(id, (merged.get(id) || 0) + quantity);
  }
  const items = [];
  for (const [id, quantity] of merged) {
    const product = db.get("products").find({ id }).value();
    if (!product) {
      if (strict) return { error: `Product #${id} is no longer available.` };
      continue; // cart: quietly drop products that were deleted
    }
    items.push({ ...product, quantity: Math.min(quantity, 99) });
  }
  return { items };
}

const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ------------------------------------------------------------- middleware

// Request log: shows in the terminal whether each call carried a token.
app.use((req, res, next) => {
  const t = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}  ${req.headers.authorization ? "[token]" : "[no token]"}  ${Date.now() - t}ms`);
  });
  next();
});
// (f) Security headers on every response. The API only returns JSON, so the CSP forbids everything else.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  // Private data (login, cart, orders) must never be stored by the browser, a proxy or the service worker.
  if (/^\/(auth|cart|orders)(\/|$)/.test(req.path)) res.setHeader("Cache-Control", "no-store");
  next();
});

// (f) CORS: only listed websites may call the API from a browser (the app itself uses the
// same-origin /api proxy, so it needs no CORS). Set ALLOWED_ORIGINS="https://shop.example.com,..." to change.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4173")
  .split(",").map((o) => o.trim()).filter(Boolean);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// (f) Refuse very large request bodies before they are read (json-server's own limit is much higher).
const MAX_BODY_BYTES = 100 * 1024;
app.use((req, res, next) => {
  if (Number(req.headers["content-length"] || 0) > MAX_BODY_BYTES) return fail(res, 413, "The request is too large.");
  next();
});

// (f) Simple in-memory rate limit (per IP address) for the login and sign-up routes,
// to slow down password guessing. A real deployment would use a shared store (e.g. Redis).
function rateLimit({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, h] of hits) if (h.reset <= now) hits.delete(key);
  }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    let h = hits.get(req.ip);
    if (!h || h.reset <= now) { h = { count: 0, reset: now + windowMs }; hits.set(req.ip, h); }
    h.count += 1;
    if (h.count > max) {
      res.setHeader("Retry-After", Math.ceil((h.reset - now) / 1000));
      return fail(res, 429, "Too many attempts. Please wait a few minutes and try again.", "RATE_LIMITED");
    }
    next();
  };
}
const RATE_MAX = Number(process.env.AUTH_RATE_LIMIT) || 20;
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: RATE_MAX });

// gzip + JSON body parser (static serving is pointed at an empty path: this server is API-only).
// CORS is handled above, so json-server's allow-everything CORS is switched off.
app.use(jsonServer.defaults({ logger: false, bodyParser: true, noCors: true, static: path.join(__dirname, "no-static") }));

// ---------------------------------------------------------- authentication

app.post("/auth/register", authLimiter, (req, res) => {
  const { name, email, password } = req.body || {};
  const mail = String(email || "").trim().toLowerCase();
  if (!isStr(name, 2) || name.trim().length > 60) return fail(res, 400, "Name must be between 2 and 60 characters.");
  if (!EMAIL_RE.test(mail) || mail.length > 254) return fail(res, 400, "Enter a valid email address.");
  if (typeof password !== "string" || password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return fail(res, 400, "Password needs 8+ characters with an uppercase letter, a lowercase letter and a number.");
  }
  if (db.get("users").find({ email: mail }).value()) {
    return fail(res, 409, "An account with this email already exists. Please login instead.");
  }
  // Passwords are stored as bcrypt hashes, never as plain text.
  // Everyone who signs up is a customer. Admin accounts are never created through this route.
  const user = { id: randomUUID(), name: name.trim(), email: mail, role: "customer", passwordHash: bcrypt.hashSync(password, 10), createdAt: new Date().toISOString() };
  db.get("users").push(user).write();
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

app.post("/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const mail = String(email || "").trim().toLowerCase();
  const user = db.get("users").find({ email: mail }).value();
  // Always run one bcrypt comparison and give one generic message, so the
  // response doesn't reveal whether the email is registered.
  const ok = bcrypt.compareSync(String(password || ""), user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) return fail(res, 401, "Incorrect email or password.", "BAD_CREDENTIALS");
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Used by the app on start-up to check that a stored token is still good.
app.get("/auth/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// -------------------------------------------------------------------- cart

app.get("/cart", requireAuth, (req, res) => {
  const row = db.get("carts").find({ userId: req.user.id }).value();
  const { items } = hydrate(row?.items || [], { strict: false });
  res.json({ items });
});

app.put("/cart", requireAuth, (req, res) => {
  const { items, error } = hydrate(req.body?.items, { strict: false });
  if (error) return fail(res, 400, error);
  const lines = items.map(({ id, quantity }) => ({ id, quantity }));
  const carts = db.get("carts");
  if (carts.find({ userId: req.user.id }).value()) carts.find({ userId: req.user.id }).assign({ items: lines }).write();
  else carts.push({ userId: req.user.id, items: lines }).write();
  res.json({ items });
});

// ------------------------------------------------------------------ orders

const PAYMENT_METHODS = ["Cash on Delivery", "UPI", "Card"];

function orderError({ customer: c, deliveryAddress: a, paymentMethod }) {
  if (!isStr(c?.name, 2) || c.name.trim().length > 60) return "Customer name is required (2 to 60 characters).";
  if (!EMAIL_RE.test(String(c?.email || "").trim())) return "A valid customer email is required.";
  if (!/^[6-9]\d{9}$/.test(String(c?.phone || ""))) return "Phone must be a 10-digit mobile number.";
  if (!isStr(a?.address, 10) || a.address.trim().length > 200) return "Delivery address must be 10 to 200 characters.";
  if (!isStr(a?.city, 2) || a.city.trim().length > 60) return "City is required.";
  if (!/^[1-9]\d{5}$/.test(String(a?.pincode || ""))) return "Pincode must be 6 digits.";
  if (!PAYMENT_METHODS.includes(paymentMethod)) return "Select a valid payment method.";
  return "";
}

const publicOrder = ({ userId, ...order }) => order;

app.get("/orders", requireAuth, (req, res) => {
  const mine = db.get("orders").filter({ userId: req.user.id }).value();
  res.json(mine.map(publicOrder).sort((a, b) => b.placedAt.localeCompare(a.placedAt)));
});

app.get("/orders/:id", requireAuth, (req, res) => {
  const order = db.get("orders").find({ id: req.params.id, userId: req.user.id }).value();
  if (!order) return fail(res, 404, "Order not found.");
  res.json(publicOrder(order));
});

app.post("/orders", requireAuth, (req, res) => {
  const b = req.body || {};
  const problem = orderError(b);
  if (problem) return fail(res, 400, problem);
  const { items, error } = hydrate(b.items, { strict: true });
  if (error) return fail(res, 400, error);
  if (items.length === 0) return fail(res, 400, "Your cart is empty.");

  const order = {
    id: "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
    userId: req.user.id,
    placedAt: new Date().toISOString(),
    items,
    totals: calculateTotals(items),
    customer: { name: b.customer.name.trim(), email: b.customer.email.trim(), phone: b.customer.phone },
    deliveryAddress: { address: b.deliveryAddress.address.trim(), city: b.deliveryAddress.city.trim(), pincode: b.deliveryAddress.pincode },
    paymentMethod: b.paymentMethod, // card / UPI details are never sent or stored
  };
  db.get("orders").push(order).write();
  db.get("carts").remove({ userId: req.user.id }).write(); // the cart is emptied once the order is placed
  res.status(201).json(publicOrder(order));
});

// ---------------------------------------------------------------- products
// Anyone can browse (GET). Changing the catalogue needs an admin's token.

function productErrors(b, partial) {
  const e = [];
  const check = (key, bad, msg) => { if ((!partial || b[key] !== undefined) && bad) e.push(msg); };
  check("name", !isStr(b.name, 3), "name must be at least 3 characters");
  check("category", !isStr(b.category), "category is required");
  check("brand", !isStr(b.brand), "brand is required");
  check("price", typeof b.price !== "number" || !(b.price > 0), "price must be a number above 0");
  check("rating", typeof b.rating !== "number" || b.rating < 0 || b.rating > 5, "rating must be between 0 and 5");
  check("image", !/^https?:\/\/\S+$/i.test(String(b.image || "")), "image must be an http(s) URL");
  return e;
}

app.use("/products", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  requireAuth(req, res, () => {
    // Logged in is not enough: only admins may change the catalogue.
    if (req.user.role !== "admin") return fail(res, 403, "Only store admins can change products.", "FORBIDDEN");
    if (req.method === "DELETE") return next();
    const errors = productErrors(req.body || {}, req.method === "PATCH");
    if (errors.length) return fail(res, 400, `Invalid product: ${errors.join("; ")}.`);
    const { name, category, brand, price, rating, image } = req.body;
    req.body = Object.fromEntries(Object.entries({ name, category, brand, price, rating, image }).filter(([, v]) => v !== undefined));
    next();
  });
});

// Only /products is exposed by the generic json-server router. Everything else
// (users, carts, orders) is reachable only through the routes above.
app.use((req, res, next) => (req.path.startsWith("/products") ? next() : fail(res, 404, "Not found.")));
app.use(router);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === "entity.parse.failed") return fail(res, 400, "The request body is not valid JSON.");
  console.error(err);
  fail(res, 500, "Internal server error.");
});

app.listen(PORT, () => console.log(`ShopEasy API on http://localhost:${PORT}  (tokens valid for ${TOKEN_TTL})`));
