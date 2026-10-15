import lazyWithPreload from "../utils/lazyWithPreload.js";

// (a) + (b) Pages that are not needed for the first screen are loaded on demand.
// Each import() becomes its own JavaScript file (chunk) in the production build,
// so the first page load only downloads the code it really uses.
export const ProductDetailPage = lazyWithPreload(() => import("../components/ProductDetailPage.jsx"));
export const Checkout = lazyWithPreload(() => import("../components/Checkout.jsx"));
export const OrderConfirmation = lazyWithPreload(() => import("../components/OrderConfirmation.jsx"));
export const Orders = lazyWithPreload(() => import("../components/Orders.jsx"));
export const OrdersCurrent = lazyWithPreload(() => import("../components/OrdersCurrent.jsx"));
export const OrdersHistory = lazyWithPreload(() => import("../components/OrdersHistory.jsx"));
export const ProductManager = lazyWithPreload(() => import("../components/ProductManager.jsx")); // admin only
export const Signup = lazyWithPreload(() => import("../components/Signup.jsx"));
