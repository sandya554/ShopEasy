import { api } from "./apiClient.js";

// All order calls are protected (token added by the Axios interceptor).
export async function fetchOrders(signal) {
  const { data } = await api.get("/orders", { signal });
  return data;
}

// The server works out prices and totals itself, so only ids and quantities
// are sent for the items.
export async function createOrder({ items, customer, deliveryAddress, paymentMethod }) {
  const { data } = await api.post("/orders", {
    items: items.map(({ id, quantity }) => ({ id, quantity })),
    customer, deliveryAddress, paymentMethod,
  });
  return data;
}
