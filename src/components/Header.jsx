import { Link, NavLink, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart.js";
import { useAuthContext } from "../context/AuthContext.jsx";

function Header() {
  const { cartCount } = useCart();
  const { isLoggedIn, isAdmin, user, logout } = useAuthContext();
  const navigate = useNavigate();
  const linkClass = ({ isActive }) => "px-2 py-1 rounded " + (isActive ? "bg-indigo-800" : "hover:bg-indigo-700");

  // (f) Logout removes the token and empties the local cart (see AuthContext).
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="bg-indigo-600 text-white p-3 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">ShopEasy</Link>
      {/* (e) landmark with a name; NavLink adds aria-current="page" to the active link */}
      <nav aria-label="Main" className="flex items-center gap-1 text-sm">
        <NavLink to="/" end className={linkClass}>Home</NavLink>

        {isLoggedIn && <NavLink to="/products" className={linkClass}>Products</NavLink>}
        {isAdmin && <NavLink to="/admin/products" className={linkClass}>Manage</NavLink>}
        {isLoggedIn && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}

        {isLoggedIn && user?.name && (
          <span className="hidden sm:inline px-2 text-indigo-100">Hi, {user.name.split(" ")[0]}</span>
        )}
        {isLoggedIn ? (
          <button onClick={handleLogout} className="px-2 py-1 rounded hover:bg-indigo-700">Logout</button>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>Login</NavLink>
            <NavLink to="/signup" className="bg-white text-indigo-600 px-3 py-1 rounded ml-1 font-medium">Sign Up</NavLink>
          </>
        )}

        {isLoggedIn && (
          <NavLink to="/cart" className="bg-white text-indigo-600 px-3 py-1 rounded ml-2 font-medium">Cart ({cartCount})</NavLink>
        )}
      </nav>
      {/* (e) Spoken by screen readers whenever the number of cart items changes */}
      {isLoggedIn && (
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {cartCount === 1 ? "1 item in cart" : `${cartCount} items in cart`}
        </span>
      )}
    </header>
  );
}

export default Header;
