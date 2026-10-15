import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart.js";
import { useOrdersContext } from "../context/OrdersContext.jsx";
import { useAuthContext } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/apiClient.js";
import useForm from "../hooks/useForm.js";
import {
  validateName, validateEmail, validatePhone, validateAddress, validateCity, validatePincode,
  validatePaymentMethod, validateUpiId, validateCardNumber, validateExpiry, validateCvv,
} from "../utils/validators.js";
import { cleanText, limitText } from "../utils/sanitize.js";
import Input from "./Input.jsx";
import Button from "./Button.jsx";

const PAYMENT_METHODS = ["Cash on Delivery", "UPI", "Card"];

const digits = (max) => (v) => v.replace(/\D/g, "").slice(0, max);
// (f) Everything typed is cleaned while typing: digits only where numbers are expected,
// no control characters and a maximum length for free text.
const sanitizers = {
  name: (v) => limitText(v, 60),
  email: (v) => limitText(v, 254),
  address: (v) => limitText(v, 200),
  city: (v) => limitText(v, 60),
  upiId: (v) => limitText(v, 60),
  phone: digits(10),
  pincode: digits(6),
  cvv: digits(3),
  cardNumber: (v) => digits(16)(v).replace(/(\d{4})(?=\d)/g, "$1 "), // 1234 5678 ...
  expiry: (v) => {
    const d = digits(4)(v);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  },
};

const validate = (v) => {
  const checks = {
    name: validateName(v.name),
    email: validateEmail(v.email),
    phone: validatePhone(v.phone),
    address: validateAddress(v.address),
    city: validateCity(v.city),
    pincode: validatePincode(v.pincode),
    paymentMethod: validatePaymentMethod(v.paymentMethod, PAYMENT_METHODS),
    // Extra details are only validated for the chosen method
    upiId: v.paymentMethod === "UPI" ? validateUpiId(v.upiId) : "",
    cardNumber: v.paymentMethod === "Card" ? validateCardNumber(v.cardNumber) : "",
    expiry: v.paymentMethod === "Card" ? validateExpiry(v.expiry) : "",
    cvv: v.paymentMethod === "Card" ? validateCvv(v.cvv) : "",
  };
  const errors = {};
  Object.entries(checks).forEach(([k, msg]) => { if (msg) errors[k] = msg; });
  return errors;
};

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, totals, resetCart } = useCart();
  const { addOrder } = useOrdersContext();
  const { user } = useAuthContext();
  const [cartError, setCartError] = useState("");
  const [placing, setPlacing] = useState(false);

  const { values, errorFor, handleChange, handleBlur, handleSubmit } = useForm(
    {
      name: user?.name || "", email: user?.email || "", phone: "", address: "", city: "", pincode: "",
      paymentMethod: "", upiId: "", cardNumber: "", expiry: "", cvv: "",
    },
    validate,
    sanitizers
  );

  // (e) Placing an order is a protected request: POST /orders with the login token.
  const onValid = async (v) => {
    if (cartItems.length === 0) return setCartError("Your cart is empty");
    setCartError("");
    setPlacing(true);
    try {
      // Payment details (UPI ID / card number) are validated but never sent or stored.
      const orderId = await addOrder({
        items: cartItems,
        customer: { name: cleanText(v.name, 60), email: v.email.trim(), phone: v.phone },
        deliveryAddress: { address: cleanText(v.address, 200), city: cleanText(v.city, 60), pincode: v.pincode },
        paymentMethod: v.paymentMethod,
      });
      resetCart(); // the server has already emptied the saved cart
      navigate("/order-confirmation", { state: { orderId } });
    } catch (err) {
      // An expired token is handled globally (the user is sent to Login).
      setCartError(getErrorMessage(err));
      setPlacing(false);
    }
  };

  const field = (name, label, props = {}) => (
    <Input
      label={label} name={name} placeholder={label}
      value={values[name]} onChange={handleChange} onBlur={handleBlur}
      error={errorFor(name)} disabled={placing} {...props}
    />
  );

  return (
    <div className="max-w-sm mx-auto p-4">
      <form onSubmit={handleSubmit(onValid)} noValidate aria-busy={placing} className="bg-white rounded p-4 border">
        <h1 className="font-bold text-lg mb-2">Checkout</h1>

        <fieldset>
          <legend className="text-xs font-semibold text-gray-600 mt-2 mb-1 p-0">Customer Details</legend>
          {field("name", "Full Name", { autoComplete: "name" })}
          {field("email", "Email", { type: "email", autoComplete: "email" })}
          {field("phone", "Phone", { inputMode: "numeric", autoComplete: "tel-national" })}
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold text-gray-600 mt-3 mb-1 p-0">Delivery Address</legend>
          {field("address", "Address", { autoComplete: "street-address" })}
          <div className="flex gap-2">
            <div className="w-1/2">{field("city", "City", { autoComplete: "address-level2" })}</div>
            <div className="w-1/2">{field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code" })}</div>
          </div>
        </fieldset>

        <fieldset>
        <legend className="text-xs font-semibold text-gray-600 mt-3 mb-1 p-0">Payment Method</legend>
        <div className="space-y-1 mb-2">
          {PAYMENT_METHODS.map((method) => (
            <label key={method} className="flex items-center gap-2 text-sm">
              <input
                type="radio" name="paymentMethod" value={method}
                checked={values.paymentMethod === method}
                onChange={handleChange} onBlur={handleBlur}
                aria-describedby={errorFor("paymentMethod") ? "paymentMethod-error" : undefined}
              />
              {method}
            </label>
          ))}
          {errorFor("paymentMethod") && <p id="paymentMethod-error" aria-live="polite" className="text-red-600 text-xs">{errorFor("paymentMethod")}</p>}
        </div>

        </fieldset>

        {values.paymentMethod === "UPI" && field("upiId", "UPI ID (e.g. name@upi)", { autoComplete: "off", autoCapitalize: "none", spellCheck: false })}
        {values.paymentMethod === "Card" && (
          <>
            {field("cardNumber", "Card Number", { inputMode: "numeric", autoComplete: "cc-number" })}
            <div className="flex gap-2">
              <div className="w-1/2">{field("expiry", "Expiry (MM/YY)", { inputMode: "numeric", autoComplete: "cc-exp" })}</div>
              <div className="w-1/2">{field("cvv", "CVV", { type: "password", inputMode: "numeric", autoComplete: "cc-csc" })}</div>
            </div>
          </>
        )}

        {cartError && <p className="text-red-600 text-xs mt-2" role="alert">{cartError}</p>}
        <div className="text-sm mt-2 space-y-0.5">
          <p>Subtotal: ₹{totals.subtotal}</p>
          <p>Discount: -₹{totals.discount}</p>
          <p>Delivery: ₹{totals.delivery}</p>
          <p className="font-bold">Total: ₹{totals.total}</p>
        </div>
        <Button type="submit" variant="success" fullWidth className="mt-2" disabled={placing}>
          {placing ? "Placing order..." : "Place Order"}
        </Button>
        <Link to="/cart" className="block text-center text-indigo-600 underline text-sm mt-2">Back to cart</Link>
      </form>
    </div>
  );
}

export default Checkout;
