import { useLocation, useNavigate, Link } from "react-router-dom";
import { useOrdersContext } from "../context/OrdersContext.jsx";

const STAGES = ["Placed", "Shipped", "Delivered"];

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getOrder } = useOrdersContext();
  const orderId = location.state?.orderId;
  const order = orderId ? getOrder(orderId) : null;

  if (!order) {
    return (
      <div className="max-w-sm mx-auto p-4 text-center">
        <p className="mb-3">No recent order found.</p>
        <Link to="/orders" className="text-indigo-600 underline text-sm">View your orders</Link>
      </div>
    );
  }

  const stepIndex = STAGES.indexOf(order.status);

  return (
    <div className="max-w-sm mx-auto p-4">
      <div className="bg-white rounded p-4 border">
        <h2 className="font-bold text-lg mb-1">Order Confirmed</h2>
        <p className="text-xs text-gray-500 mb-2">{order.id}</p>
        {STAGES.map((stage, i) => (
          <p key={stage} className={i <= stepIndex ? "text-green-600 font-medium" : "text-gray-400"}>{i <= stepIndex ? "✓" : "○"} {stage}</p>
        ))}
        <p className="text-sm text-gray-500 mt-2">Payment: {order.paymentMethod}</p>
        <p className="font-bold">Total: ₹{order.totals.total}</p>
        <button onClick={() => navigate("/products")} className="bg-indigo-600 text-white w-full rounded p-2 mt-3">Continue Shopping</button>
      </div>
    </div>
  );
}

export default OrderConfirmation;
