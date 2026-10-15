import { isAnyOf } from "@reduxjs/toolkit";
import { addToCart, removeFromCart, updateQuantity, clearCart, syncFailed, syncRecovered } from "../cartSlice.js";
import { saveCart } from "../../services/cartApi.js";
import { getToken } from "../../services/tokenStorage.js";
import { getErrorMessage } from "../../services/apiClient.js";

// Saves the cart to the server (PUT /cart) shortly after a cart action changes it.
// Rapid clicks on + / - are batched into one request. If the save fails, the
// message goes into state.cart.error so the cart page can tell the user.
const isCartAction = isAnyOf(addToCart, removeFromCart, updateQuantity, clearCart);
const DELAY_MS = 300;

let timer = null;
let pending = null; // latest items waiting to be saved

// Sends the waiting cart right now. Called by the timer, and by logout so the
// last change isn't lost while the token is still valid.
export async function flushCartSave(store) {
  clearTimeout(timer);
  timer = null;
  if (!pending) return;
  const items = pending;
  pending = null;
  try {
    await saveCart(items);
    if (store?.getState().cart.error) store.dispatch(syncRecovered());
  } catch (err) {
    store?.dispatch(syncFailed(`Your cart couldn't be saved: ${getErrorMessage(err)}`));
  }
}

const cartPersistence = (store) => (next) => (action) => {
  const before = store.getState().cart.items;
  const result = next(action);

  if (isCartAction(action) && store.getState().cart.items !== before && getToken()) {
    pending = store.getState().cart.items;
    clearTimeout(timer);
    timer = setTimeout(() => flushCartSave(store), DELAY_MS);
  }
  return result;
};

export default cartPersistence;
