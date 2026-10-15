import { api } from "./apiClient.js";

// Both calls are protected: the interceptor adds the token, and the server
// keeps one cart per logged-in user.

// GET /cart -> products (with current prices) + quantities
export async function fetchCart(signal) {
  const { data } = await api.get("/cart", { signal });
  return data.items;
}

// PUT /cart -> replace the saved cart. Only ids and quantities are sent.
export async function saveCart(items) {
  await api.put("/cart", { items: items.map(({ id, quantity }) => ({ id, quantity })) });
}
