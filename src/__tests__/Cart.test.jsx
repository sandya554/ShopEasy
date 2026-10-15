// Component test (React Testing Library): Cart page
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, cartItem } from "../test/renderWithProviders.jsx";
import Cart from "../components/Cart.jsx";
import { SNEAKERS, TSHIRT } from "../test/testData.js";

const rowOf = (name) => screen.getByText(name).closest("div");
const button = (name, label) => within(rowOf(name)).getByRole("button", { name: label });

test("changing quantity and removing an item updates the cart and the totals", async () => {
  const user = userEvent.setup();
  const { store } = renderWithProviders(<Cart />, {
    preloadedState: { cart: { items: [cartItem(SNEAKERS, 1), cartItem(TSHIRT, 1)], error: "" } },
  });

  // starting totals: 1499 + 149 = 1648, ₹19 delivery
  expect(screen.getByText("Subtotal: ₹1648")).toBeInTheDocument();
  expect(screen.getByText("Total: ₹1667")).toBeInTheDocument();

  // quantity +  (2 x 1499 + 149 = 3147 -> above ₹3000: ₹300 off, ₹59 delivery)
  await user.click(button("Running Sneakers", "+"));
  expect(store.getState().cart.items[0].quantity).toBe(2);
  expect(screen.getByText("Subtotal: ₹3147")).toBeInTheDocument();
  expect(screen.getByText("Discount: -₹300")).toBeInTheDocument();
  expect(screen.getByText("Total: ₹2906")).toBeInTheDocument();

  // quantity -
  await user.click(button("Running Sneakers", "-"));
  expect(store.getState().cart.items[0].quantity).toBe(1);

  // remove-from-cart
  await user.click(button("Cotton T-Shirt", "x"));
  expect(screen.queryByText("Cotton T-Shirt")).not.toBeInTheDocument();
  expect(screen.getByText("Subtotal: ₹1499")).toBeInTheDocument();
  expect(screen.getByText("Total: ₹1518")).toBeInTheDocument();
});
