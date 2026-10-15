// Component test (React Testing Library): Checkout page.
// The logged-in user and the "place order" call are replaced with test doubles.
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, cartItem } from "../test/renderWithProviders.jsx";
import Checkout from "../components/Checkout.jsx";
import { useOrdersContext } from "../context/OrdersContext.jsx";
import { useAuthContext } from "../context/AuthContext.jsx";
import { SNEAKERS, TSHIRT } from "../test/testData.js";

jest.mock("../context/OrdersContext.jsx", () => ({ useOrdersContext: jest.fn() }));
jest.mock("../context/AuthContext.jsx", () => ({ useAuthContext: jest.fn() }));

test("shows validation errors for an empty form, then places the order when the details are valid", async () => {
  const addOrder = jest.fn().mockResolvedValue("ORD-TEST-1");
  useOrdersContext.mockReturnValue({ addOrder });
  useAuthContext.mockReturnValue({ user: { name: "Asha Rao", email: "asha@example.com" } });
  const items = [cartItem(SNEAKERS, 1), cartItem(TSHIRT, 2)]; // 1499 + 298 = 1797
  const user = userEvent.setup();
  const { store } = renderWithProviders(<Checkout />, {
    preloadedState: { cart: { items, error: "" } },
    routes: { "/order-confirmation": <p>Order confirmed page</p> },
  });
  expect(screen.getByText("Total: ₹1816")).toBeInTheDocument();

  // empty form: errors shown, no order sent
  await user.click(screen.getByRole("button", { name: "Place Order" }));
  expect(screen.getByText("Phone number is required")).toBeInTheDocument();
  expect(screen.getByText("Address is required")).toBeInTheDocument();
  expect(screen.getByText("Pincode is required")).toBeInTheDocument();
  expect(screen.getByText("Please select a payment method")).toBeInTheDocument();
  expect(addOrder).not.toHaveBeenCalled();

  // valid form: order sent, cart emptied, goes to the confirmation page
  await user.type(screen.getByLabelText("Phone"), "9876543210");
  await user.type(screen.getByLabelText("Address"), "12 Main Street, RS Puram");
  await user.type(screen.getByLabelText("City"), "Coimbatore");
  await user.type(screen.getByLabelText("Pincode"), "641002");
  await user.click(screen.getByLabelText("Cash on Delivery"));
  await user.click(screen.getByRole("button", { name: "Place Order" }));

  await waitFor(() => expect(screen.getByText("Order confirmed page")).toBeInTheDocument());
  expect(addOrder).toHaveBeenCalledWith({
    items,
    customer: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210" },
    deliveryAddress: { address: "12 Main Street, RS Puram", city: "Coimbatore", pincode: "641002" },
    paymentMethod: "Cash on Delivery",
  });
  expect(store.getState().cart.items).toEqual([]);
});
