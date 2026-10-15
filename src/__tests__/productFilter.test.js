// Unit test (Jest only): product filtering and sorting logic
import { selectVisibleProducts } from "../store/productsSlice.js";
import { PRODUCTS, loadedProductsState } from "../test/testData.js";

const visible = (filters) => selectVisibleProducts({ products: loadedProductsState(PRODUCTS, filters) }).map((p) => p.name);

test("brand, price, rating and sort filters each work, and they combine", () => {
  expect(visible()).toHaveLength(4);
  expect(visible({ brand: "Walkwell" })).toEqual(["Leather Sandals"]);
  expect(visible({ maxPrice: 499 })).toEqual(["Leather Sandals", "Cotton T-Shirt"]);
  expect(visible({ minRating: 4 })).toEqual(["Running Sneakers", "Cotton T-Shirt", "Smart Watch"]); // 4.0 counts
  expect(visible({ sort: "low-high" })).toEqual(["Cotton T-Shirt", "Leather Sandals", "Running Sneakers", "Smart Watch"]);
  expect(visible({ minRating: 4, maxPrice: 1500, sort: "high-low" })).toEqual(["Running Sneakers", "Cotton T-Shirt"]);
  expect(visible({ brand: "Walkwell", minRating: 4.5 })).toEqual([]);
});
