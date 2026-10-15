import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";

function WelcomeHome() {
  const { isLoggedIn } = useAuthContext();

  return (
    <div className="bg-indigo-50 min-h-[80vh] flex items-center justify-center">
      <div className="text-center px-4 py-20">
        <h1 className="text-4xl font-bold mb-3 text-indigo-900">Welcome to ShopEasy</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Footwear, clothing, electronics, and accessories — all in one place.
        </p>

        {isLoggedIn ? (
          <Link to="/products" className="bg-indigo-600 text-white px-6 py-3 rounded font-semibold">
            Browse Products
          </Link>
        ) : (
          <div className="flex justify-center gap-3">
            <Link to="/signup" className="bg-indigo-600 text-white px-6 py-3 rounded font-semibold">
              Get Started
            </Link>
            <Link to="/login" className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded font-semibold">
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default WelcomeHome;
