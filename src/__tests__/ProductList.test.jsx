// Component test (React Testing Library): ProductList
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import ProductList from "../components/ProductList.jsx";
import { PRODUCTS, loadedProductsState } from "../test/testData.js";

const renderList = (filters) =>
  renderWithProviders(<ProductList />, { preloadedState: { products: loadedProductsState(PRODUCTS, filters) } });
const shownNames = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

test("shows a card for every product, and only the matching ones when filters and sorting are set", () => {
  // no filters: all four products, each with an Add button
  const first = renderList();
  expect(shownNames()).toEqual(["Running Sneakers", "Leather Sandals", "Cotton T-Shirt", "Smart Watch"]);
  expect(screen.getAllByRole("button", { name: "Add" })).toHaveLength(4);
  first.unmount();

  // rating 4+ and price up to ₹1500, most expensive first
  renderList({ minRating: 4, maxPrice: 1500, sort: "high-low" });
  expect(shownNames()).toEqual(["Running Sneakers", "Cotton T-Shirt"]);
});
