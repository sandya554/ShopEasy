import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { fetchOrders, createOrder } from "../services/orderApi.js";
import { getErrorMessage } from "../services/apiClient.js";

const SHIP_AFTER_MS = 4000;    // demo: becomes "Shipped" 4s after placing
const DELIVER_AFTER_MS = 8000; // demo: becomes "Delivered" 8s after placing

// Status is worked out from how much time has passed since the order was
// placed (placedAt is set by the server), so an order still reaches
// "Delivered" even if the confirmation page was closed early.
function statusOf(order) {
  const elapsed = Date.now() - new Date(order.placedAt).getTime();
  if (elapsed >= DELIVER_AFTER_MS) return "Delivered";
  if (elapsed >= SHIP_AFTER_MS) return "Shipped";
  return "Placed";
}

// Orders come from the protected API (GET /orders returns only the logged-in
// user's orders). `enabled` is true once a user is logged in.
function useOrders(enabled) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | succeeded | failed
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) { setOrders([]); setStatus("idle"); setError(""); return undefined; }
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    fetchOrders(controller.signal)
      .then((data) => { setOrders(data); setStatus("succeeded"); })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError(getErrorMessage(err));
        setStatus("failed");
      });
    return () => controller.abort();
  }, [enabled, reloadKey]);

  // Recheck statuses every second so an open Orders page updates live.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // POST /orders. Resolves with the new order id; rejects with the API error
  // (the caller shows the message).
  const addOrder = useCallback(async (payload) => {
    const order = await createOrder(payload);
    setOrders((prev) => [order, ...prev]);
    return order.id;
  }, []);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const ordersWithStatus = useMemo(
    () => orders.map((o) => ({ ...o, status: statusOf(o) })),
    [orders, tick]
  );
  const getOrder = useCallback((id) => ordersWithStatus.find((o) => o.id === id), [ordersWithStatus]);
  const currentOrders = useMemo(() => ordersWithStatus.filter((o) => o.status !== "Delivered"), [ordersWithStatus]);
  const historyOrders = useMemo(() => ordersWithStatus.filter((o) => o.status === "Delivered"), [ordersWithStatus]);

  return {
    orders: ordersWithStatus, addOrder, getOrder, currentOrders, historyOrders,
    loading: status === "loading", error, retry,
  };
}

export default useOrders;
