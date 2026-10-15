// Component test (React Testing Library): products page with search.
// Only the HTTP client is replaced; the real hook, Redux store, search bar and list run.
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";
import Home from "../components/Home.jsx";
import { api } from "../services/apiClient.js";
import { PRODUCTS } from "../test/testData.js";

jest.mock("../services/apiClient.js", () => ({
  api: { get: jest.fn() },
  getErrorMessage: jest.fn((err) => err.message),
}));

const shownNames = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

test("shows a loading indicator, then the products, and typing in the search box filters them", async () => {
  api.get.mockResolvedValue({ data: PRODUCTS });
  const user = userEvent.setup();
  renderWithProviders(<Home />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading products...");
  await screen.findByText("Running Sneakers");
  expect(shownNames()).toHaveLength(4);

  await user.type(screen.getByPlaceholderText("Search products..."), "watch");
  await waitFor(() => expect(shownNames()).toEqual(["Smart Watch"]));
});
