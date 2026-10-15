import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCart } from "../services/cartApi.js";
import { getErrorMessage } from "../services/apiClient.js";

// ---- Pricing rules (subtotal, discount, delivery charge, final amount) ----
export function calculateTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  let discount = 0;
  let delivery = subtotal === 0 ? 0 : 19;
  if (subtotal > 3000) {
    discount = 300;
    delivery = 59;
  } else if (subtotal > 2000) {
    discount = 150;
    delivery = 39;
  }
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

// Loads the logged-in user's saved cart from the server (protected: GET /cart).
export const loadCart = createAsyncThunk("cart/load", async (_, { rejectWithValue }) => {
  try {
    return await fetchCart();
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

// The cart lives on the server (one per account). Redux holds the working copy.
const initialState = { items: [], error: "" };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) existing.quantity += 1;
      else state.items.push({ ...product, quantity: 1 });
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    // payload: { id, quantity }. A quantity below 1 removes the item.
    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      if (quantity < 1) {
        state.items = state.items.filter((i) => i.id !== id);
        return;
      }
      const item = state.items.find((i) => i.id === id);
      if (item) item.quantity = quantity;
    },
    clearCart(state) {
      state.items = [];
    },
    // Wipes the local copy only (used on logout / after an order). Unlike
    // clearCart it is not synced to the server.
    resetCart() {
      return initialState;
    },
    // Error state: set by the sync middleware when saving to the server fails.
    syncFailed(state, action) {
      state.error = action.payload;
    },
    syncRecovered(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.fulfilled, (state, action) => { state.items = action.payload; state.error = ""; })
      .addCase(loadCart.rejected, (state, action) => {
        if (!action.meta.aborted) state.error = action.payload || "We couldn't load your saved cart.";
      });
  },
});

export const {
  addToCart, removeFromCart, updateQuantity, clearCart, resetCart, syncFailed, syncRecovered,
} = cartSlice.actions;

// ---- Selectors ----
export const selectCartItems = (state) => state.cart.items;
export const selectCartError = (state) => state.cart.error;
export const selectCartTotals = createSelector([selectCartItems], calculateTotals);
export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((sum, i) => sum + i.quantity, 0)
);

export default cartSlice.reducer;
