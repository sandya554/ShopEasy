import { NavLink, Outlet } from "react-router-dom";
import { useOrdersContext } from "../context/OrdersContext.jsx";
import Loading from "./Loading.jsx";
import ErrorMessage from "./ErrorMessage.jsx";

function Orders() {
  const { loading, error, retry } = useOrdersContext();
  const linkClass = ({ isActive }) => "px-3 py-1 rounded border " + (isActive ? "bg-indigo-600 text-white" : "hover:bg-gray-100");

  let content;
  if (loading) content = <Loading label="Loading your orders..." />;
  else if (error) content = <ErrorMessage message={error} onRetry={retry} />;
  else content = <Outlet />;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="font-bold text-lg mb-3">Orders</h2>
      <nav className="flex gap-2 mb-4">
        <NavLink to="current" className={linkClass}>Current</NavLink>
        <NavLink to="history" className={linkClass}>History</NavLink>
      </nav>
      {content}
    </div>
  );
}

export default Orders;
