import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart.js";

function Cart() {
  const navigate = useNavigate();
  const { cartItems, totals, cartError, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="font-bold text-lg mb-3">Cart</h1>

      {cartError && (
        <p role="alert" className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs rounded p-2 mb-3">{cartError}</p>
      )}

      {cartItems.length === 0 && (
        <div>
          <p className="mb-3">Your cart is empty</p>
          <Link to="/products" className="text-indigo-600 underline text-sm">Continue shopping</Link>
        </div>
      )}

      {/* (e) aria-describedby lets a screen reader say which item a "+", "-" or "x" button belongs to */}
      {cartItems.map((item) => (
        <div key={item.id} className="flex justify-between items-center border-b py-2 text-sm">
          <span id={`cart-item-${item.id}`}>{item.name}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-describedby={`cart-item-${item.id}`} className="border px-3 py-1">-</button>
            <span aria-live="polite">{item.quantity}</span>
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-describedby={`cart-item-${item.id}`} className="border px-3 py-1">+</button>
            <button onClick={() => removeFromCart(item.id)} aria-describedby={`cart-item-${item.id}`} className="text-red-600 ml-1 px-2 py-1">x</button>
          </div>
        </div>
      ))}

      {cartItems.length > 0 && (
        <div className="mt-3 text-sm" aria-live="polite">
          <p>Subtotal: ₹{totals.subtotal}</p>
          <p>Discount: -₹{totals.discount}</p>
          <p>Delivery: ₹{totals.delivery}</p>
          <p className="font-bold">Total: ₹{totals.total}</p>
          <button onClick={() => navigate("/checkout")} className="bg-indigo-600 text-white w-full rounded p-2 mt-2">Checkout</button>
          <button onClick={clearCart} className="border w-full rounded p-2 mt-2">Clear Cart</button>
          <Link to="/products" className="block text-center text-indigo-600 underline text-sm mt-2">Continue shopping</Link>
        </div>
      )}
    </div>
  );
}

export default Cart;
