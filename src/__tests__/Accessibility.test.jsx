// Component tests: keyboard use and accessible labels (Experiment 2, part e)
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterPanel from "../components/FilterPanel.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Input from "../components/Input.jsx";

const panelProps = {
  categories: ["Footwear"], category: "All", onCategory: () => {},
  brands: ["Sportico"], brand: "All", onBrand: () => {},
  highestPrice: 3000, maxPrice: 3000, onMaxPrice: () => {},
  minRating: 0, onMinRating: () => {}, sort: "none", onSort: () => {},
};

describe("FilterPanel labels", () => {
  test("every control has an accessible name", () => {
    render(<FilterPanel {...panelProps} />);
    expect(screen.getByRole("combobox", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Brand" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Minimum rating" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort by" })).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});

describe("SearchBar", () => {
  test("has a label and is not focused automatically", () => {
    render(<SearchBar keyword="" onSearch={() => {}} />);
    const box = screen.getByLabelText("Search products");
    expect(box).not.toHaveFocus();
  });

  test("pressing / moves focus to the search box", async () => {
    const user = userEvent.setup();
    render(<SearchBar keyword="" onSearch={() => {}} />);
    await user.keyboard("/");
    expect(screen.getByLabelText("Search products")).toHaveFocus();
  });
});

describe("Input errors", () => {
  test("the error is linked to the field", () => {
    render(<Input label="Email" name="email" error="Enter a valid email" />);
    const field = screen.getByLabelText("Email");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAttribute("aria-required", "true");
    expect(field).toHaveAccessibleDescription("Enter a valid email");
  });

  test("no error means no invalid state", () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
  });
});
