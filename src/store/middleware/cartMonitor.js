import { isAnyOf } from "@reduxjs/toolkit";
import { addToCart, removeFromCart, updateQuantity, clearCart, selectCartTotals, selectCartCount } from "../cartSlice.js";

// Middleware that monitors every cart action: it records the action with the
// cart before/after, warns about suspicious payloads, and logs to the console
// in development. The last 50 entries are kept and available in the browser
// console through  window.__cartLog()
const isCartAction = isAnyOf(addToCart, removeFromCart, updateQuantity, clearCart);
const MAX_ENTRIES = 50;
const history = [];

export const getCartLog = () => [...history];

function findProblem(action) {
  const p = action.payload;
  if (addToCart.match(action) && (!p || p.id == null || !Number.isFinite(p.price))) {
    return "addToCart called with an invalid product";
  }
  if (updateQuantity.match(action) && (!Number.isInteger(p?.quantity) || p?.id == null)) {
    return "updateQuantity called with an invalid id or quantity";
  }
  if (removeFromCart.match(action) && p == null) return "removeFromCart called without an id";
  return "";
}

const cartMonitor = (store) => (next) => (action) => {
  if (!isCartAction(action)) return next(action);

  const before = store.getState().cart.items;
  const problem = findProblem(action);
  if (problem) console.warn(`[cart monitor] ${problem}`, action);

  const result = next(action);

  const state = store.getState();
  const entry = {
    time: new Date().toISOString(),
    type: action.type,
    payload: action.payload,
    itemsBefore: before.length,
    itemsAfter: state.cart.items.length,
    count: selectCartCount(state),
    total: selectCartTotals(state).total,
    ...(problem && { warning: problem }),
  };
  history.push(entry);
  if (history.length > MAX_ENTRIES) history.shift();

  if (import.meta.env.DEV) {
    console.groupCollapsed(`[cart] ${action.type} — ${entry.count} item(s), total ₹${entry.total}`);
    console.log("payload      :", action.payload);
    console.log("prev cart    :", before);
    console.log("next cart    :", state.cart.items);
    console.groupEnd();
  }
  return result;
};

if (typeof window !== "undefined") window.__cartLog = getCartLog;

export default cartMonitor;
