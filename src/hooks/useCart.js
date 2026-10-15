import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart, removeFromCart, updateQuantity, clearCart, resetCart,
  selectCartItems, selectCartTotals, selectCartCount, selectCartError,
} from "../store/cartSlice.js";

// Single entry point to the cart in the Redux store.
// Used by ProductCard, ProductDetailPage, Cart, Checkout and Header.
function useCart() {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const totals = useSelector(selectCartTotals);
  const cartCount = useSelector(selectCartCount);
  const cartError = useSelector(selectCartError);

  return {
    cartItems, totals, cartCount, cartError,
    addToCart: useCallback((product) => dispatch(addToCart(product)), [dispatch]),
    removeFromCart: useCallback((id) => dispatch(removeFromCart(id)), [dispatch]),
    updateQuantity: useCallback((id, quantity) => dispatch(updateQuantity({ id, quantity })), [dispatch]),
    clearCart: useCallback(() => dispatch(clearCart()), [dispatch]),
    // empties the local cart without a server save (the server already emptied it when the order was placed)
    resetCart: useCallback(() => dispatch(resetCart()), [dispatch]),
  };
}

export default useCart;
