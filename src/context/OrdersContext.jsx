import { createContext, useContext } from "react";
import useOrders from "../hooks/useOrders.js";
import { useAuthContext } from "./AuthContext.jsx";

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const { isLoggedIn, authReady } = useAuthContext();
  // Orders are only requested once a login has been confirmed by the server.
  return <OrdersContext.Provider value={useOrders(isLoggedIn && authReady)}>{children}</OrdersContext.Provider>;
}

export function useOrdersContext() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrdersContext must be used within an OrdersProvider");
  return ctx;
}
