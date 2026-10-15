// Small product list used by the tests (same shape as the API's products).
export const SNEAKERS = { id: 1, name: "Running Sneakers", category: "Footwear", brand: "Sportico", price: 1499, rating: 4.3, image: "https://example.com/sneakers.png" };
export const SANDALS  = { id: 2, name: "Leather Sandals",  category: "Footwear", brand: "Walkwell", price: 499,  rating: 3.8, image: "https://example.com/sandals.png" };
export const TSHIRT   = { id: 3, name: "Cotton T-Shirt",   category: "Clothing", brand: "UrbanThread", price: 149, rating: 4.0, image: "https://example.com/tshirt.png" };
export const WATCH    = { id: 6, name: "Smart Watch",      category: "Electronics", brand: "TechTime", price: 2999, rating: 4.6, image: "https://example.com/watch.png" };

export const PRODUCTS = [SNEAKERS, SANDALS, TSHIRT, WATCH];

// Starting state for the products slice with `items` already loaded.
import productsReducer from "../store/productsSlice.js";
export function loadedProductsState(items = PRODUCTS, filters = {}) {
  const base = productsReducer(undefined, { type: "@@init" });
  const highest = items.reduce((m, p) => Math.max(m, p.price), 0);
  return { ...base, status: "succeeded", items, filters: { ...base.filters, maxPrice: highest, ...filters } };
}
