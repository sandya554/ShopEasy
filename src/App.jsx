import { Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { OrdersProvider } from "./context/OrdersContext.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import SessionNotice from "./components/SessionNotice.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import Loading from "./components/Loading.jsx";
import { BASE_URL } from "./utils/baseUrl.js";
import WelcomeHome from "./components/WelcomeHome.jsx";
import Home from "./components/Home.jsx";
import Cart from "./components/Cart.jsx";
import Login from "./components/Login.jsx";
// (a) + (b) These pages are loaded on demand (see routes/lazyPages.js)
import {
  ProductDetailPage, Checkout, OrderConfirmation, Orders, OrdersCurrent, OrdersHistory,
  ProductManager, Signup,
} from "./routes/lazyPages.js";

// (e) Page titles: screen readers announce the title when the page changes.
const TITLES = [
  ["/products/", "Product details"], ["/products", "Products"], ["/admin/products", "Manage products"],
  ["/cart", "Cart"], ["/checkout", "Checkout"], ["/order-confirmation", "Order confirmed"],
  ["/orders", "Your orders"], ["/login", "Login"], ["/signup", "Sign up"],
];
const titleFor = (pathname) => TITLES.find(([p]) => pathname === p || pathname.startsWith(p + (p.endsWith("/") ? "" : "/")))?.[1] || "Home";

const whenIdle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn) : setTimeout(fn, 1500));
const cancelIdle = (id) => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));

function AppContent() {
  const location = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  // (e) After a page change, set the title and move keyboard focus to the main
  // area, so keyboard and screen-reader users start at the top of the new page.
  useEffect(() => {
    document.title = `${titleFor(location.pathname)} | ShopEasy`;
    if (firstRender.current) { firstRender.current = false; return; }
    mainRef.current?.focus({ preventScroll: false });
  }, [location.pathname]);

  // (a) Prefetch the next likely page while the browser is idle, so opening it
  // feels instant even though it is a separate chunk.
  useEffect(() => {
    let task;
    if (location.pathname === "/products") task = whenIdle(() => ProductDetailPage.preload());
    if (location.pathname === "/cart") task = whenIdle(() => Checkout.preload());
    return () => { if (task !== undefined) cancelIdle(task); };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* (e) First thing a keyboard user can Tab to: jump past the navigation */}
      <a
        href="#main-content"
        onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-indigo-700 focus:px-3 focus:py-2 focus:rounded focus:shadow"
      >
        Skip to main content
      </a>
      <Header />
      <OfflineBanner />
      <SessionNotice />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none">
        {/* key resets the boundary when the user navigates to another page */}
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<Loading label="Loading page..." />}>
            <Routes>
              <Route path="/" element={<WelcomeHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Everything below requires login */}
              <Route path="/products" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
              {/* Admin only: customers are redirected to /products */}
              <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductManager /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>}>
                <Route index element={<OrdersCurrent />} />
                <Route path="current" element={<OrdersCurrent />} />
                <Route path="history" element={<OrdersHistory />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter basename={BASE_URL}>
        <AuthProvider>
          <OrdersProvider><AppContent /></OrdersProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
