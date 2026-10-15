import { useOrdersContext } from "../context/OrdersContext.jsx";

function OrdersCurrent() {
  const { currentOrders } = useOrdersContext();

  if (currentOrders.length === 0) {
    return <p className="text-sm text-gray-500">No current orders</p>;
  }

  return (
    <div>
      {currentOrders.map((o) => (
        <div key={o.id} className="border-b py-2 text-sm">
          <div className="flex justify-between font-medium">
            <span>{o.id}</span>
            <span>{o.status}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>{new Date(o.placedAt).toLocaleDateString()}</span>
            <span>{o.items.reduce((s, i) => s + i.quantity, 0)} item(s)</span>
            <span>₹{o.totals.total}</span>
          </div>
          <p className="text-gray-400 text-xs">{o.paymentMethod}</p>
        </div>
      ))}
    </div>
  );
}

export default OrdersCurrent;
