import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice.js";
import productsReducer from "./productsSlice.js";
import cartMonitor from "./middleware/cartMonitor.js";
import cartPersistence, { flushCartSave } from "./middleware/cartPersistence.js";

export const store = configureStore({
  reducer: { cart: cartReducer, products: productsReducer },
  // The cart is loaded from the server after login (see AuthContext).
  middleware: (getDefault) => getDefault().concat(cartMonitor, cartPersistence),
});

// Lets AuthContext push any unsaved cart change to the server before logout.
export const flushPendingCart = () => flushCartSave(store);
