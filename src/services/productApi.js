import { api, getErrorMessage } from "./apiClient.js";

// REST API for products (see server/server.js).
//   GET    /products        -> list              (public)
//   GET    /products/:id    -> one product       (public)
//   POST   /products        -> create            (needs login token)
//   PUT    /products/:id    -> replace           (needs login token)
//   PATCH  /products/:id    -> partial update    (needs login token)
//   DELETE /products/:id    -> remove            (needs login token)
// The shared Axios client (apiClient.js) adds the token automatically.
export { getErrorMessage };

// ---------- READ (GET) ----------

async function getAll(signal) {
  const { data } = await api.get("/products", { signal });
  if (!Array.isArray(data)) throw new Error("Unexpected response from the product API.");
  return data;
}

// Search + category filtering on the data returned by the API
export async function fetchProducts({ q = "", category = "All", signal } = {}) {
  const all = await getAll(signal);
  const term = q.trim().toLowerCase();
  return all
    .filter((p) => p.name.toLowerCase().includes(term))
    .filter((p) => category === "All" || p.category === category);
}

// Category list derived from the API data
export async function fetchCategories(signal) {
  const all = await getAll(signal);
  return [...new Set(all.map((p) => p.category))];
}

// Single product by id (GET /products/:id; a missing id comes back as a 404).
// (f) ids are URL-encoded so odd characters cannot change the API path.
export async function fetchProductById(id, signal) {
  const { data } = await api.get(`/products/${encodeURIComponent(id)}`, { signal });
  return data;
}

// ---------- CREATE (POST) ----------
// The server assigns the new id and returns the saved product.
export async function createProduct(product) {
  const { data } = await api.post("/products", product);
  return data;
}

// ---------- UPDATE (PUT / PATCH) ----------
// PUT replaces the whole product, so send every field.
export async function updateProduct(id, product) {
  const { data } = await api.put(`/products/${encodeURIComponent(id)}`, product);
  return data;
}

// PATCH changes only the fields that are sent, e.g. { price: 999 }.
export async function patchProduct(id, changes) {
  const { data } = await api.patch(`/products/${encodeURIComponent(id)}`, changes);
  return data;
}

// ---------- DELETE ----------
export async function deleteProduct(id) {
  await api.delete(`/products/${encodeURIComponent(id)}`);
  return id;
}
