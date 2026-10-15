// Component test (React Testing Library): ProductCard
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { SNEAKERS } from "../test/testData.js";

test("shows the product details and adds the product to the cart each time Add is clicked", async () => {
  const user = userEvent.setup();
  const { store } = renderWithProviders(<ProductCard product={SNEAKERS} />);

  // product rendering
  expect(screen.getByRole("heading", { name: "Running Sneakers" })).toBeInTheDocument();
  expect(screen.getByText("Sportico · 4.3★")).toBeInTheDocument();
  expect(screen.getByText("₹1499")).toBeInTheDocument();
  expect(screen.getByAltText("Running Sneakers")).toHaveAttribute("src", SNEAKERS.image);

  // add-to-cart
  expect(store.getState().cart.items).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Add" }));
  expect(store.getState().cart.items).toEqual([expect.objectContaining({ id: 1, quantity: 1 })]);
  await user.click(screen.getByRole("button", { name: "Add" }));
  expect(store.getState().cart.items).toEqual([expect.objectContaining({ id: 1, quantity: 2 })]);
});
