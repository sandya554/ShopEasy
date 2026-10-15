// Unit test (Jest only): retrieving products with GET (Axios), then search + category filtering
import { fetchProducts } from "../services/productApi.js";
import { api } from "../services/apiClient.js";
import { PRODUCTS } from "../test/testData.js";

// The real HTTP client is replaced: the test never talks to a server.
jest.mock("../services/apiClient.js", () => ({
  api: { get: jest.fn() },
  getErrorMessage: jest.fn((err) => err.message),
}));

test("fetchProducts calls GET /products, filters by search text and category, and passes failures on", async () => {
  api.get.mockResolvedValue({ data: PRODUCTS });

  expect(await fetchProducts()).toHaveLength(4);
  expect(api.get).toHaveBeenCalledWith("/products", expect.anything());
  expect((await fetchProducts({ q: "  WATCH " })).map((p) => p.id)).toEqual([6]); // case-insensitive, spaces ignored
  expect((await fetchProducts({ category: "Footwear" })).map((p) => p.id)).toEqual([1, 2]);
  expect(await fetchProducts({ q: "leather", category: "Clothing" })).toEqual([]);

  api.get.mockRejectedValue(new Error("Network Error"));
  await expect(fetchProducts()).rejects.toThrow("Network Error");
});
