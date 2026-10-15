import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import Loading from "./Loading.jsx";

// Wrap any page with this to require login.
//  - While the saved token is being checked with the server, show a spinner.
//  - If there is no (valid) login, send the user to /login and remember where
//    they were headed. This also happens when a token expires mid-session.
//  - With adminOnly, logged-in customers are sent back to the products page.
function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin, authReady } = useAuthContext();
  const location = useLocation();

  if (!authReady) return <Loading label="Checking your session..." />;
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && !isAdmin) return <Navigate to="/products" replace />;
  return children;
}

export default ProtectedRoute;
