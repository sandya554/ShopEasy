// Component tests: ProductList draws products in batches (Experiment 2, part c)
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import ProductList from "../components/ProductList.jsx";
import { loadedProductsState } from "../test/testData.js";

const many = Array.from({ length: 11 }, (_, i) => ({
  id: i + 1, name: `Item ${i + 1}`, category: "Misc", brand: "Brand", price: 100 + i, rating: 4, image: "https://example.com/i.png",
}));
const shownNames = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

test("shows the first 8 products, then the rest after 'Show more'", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ProductList />, { preloadedState: { products: loadedProductsState(many) } });
  expect(shownNames()).toHaveLength(8);

  await user.click(screen.getByRole("button", { name: /Show more/ }));
  expect(shownNames()).toHaveLength(11);
  expect(screen.queryByRole("button", { name: /Show more/ })).not.toBeInTheDocument();
});

test("no 'Show more' button when everything fits in the first batch", () => {
  renderWithProviders(<ProductList />, { preloadedState: { products: loadedProductsState(many.slice(0, 5)) } });
  expect(shownNames()).toHaveLength(5);
  expect(screen.queryByRole("button", { name: /Show more/ })).not.toBeInTheDocument();
});
