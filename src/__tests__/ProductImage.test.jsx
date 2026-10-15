// Component tests: ProductImage (Experiment 2, parts c and f)
import { render, screen, fireEvent } from "@testing-library/react";
import ProductImage, { PLACEHOLDER } from "../components/ProductImage.jsx";

describe("ProductImage", () => {
  test("lazy loads, decodes asynchronously and sends no referrer", () => {
    render(<ProductImage src="https://example.com/a.png" alt="Shoe" />);
    const img = screen.getByAltText("Shoe");
    expect(img).toHaveAttribute("src", "https://example.com/a.png");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(img).toHaveAttribute("width");
    expect(img).toHaveAttribute("height");
  });

  test("a priority image loads right away", () => {
    render(<ProductImage src="https://example.com/a.png" alt="Shoe" priority />);
    const img = screen.getByAltText("Shoe");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
  });

  test("an unsafe address is replaced by the placeholder", () => {
    render(<ProductImage src="javascript:alert(1)" alt="Shoe" />);
    expect(screen.getByAltText("Shoe")).toHaveAttribute("src", PLACEHOLDER);
  });

  test("a picture that fails to load is replaced by the placeholder", () => {
    render(<ProductImage src="https://example.com/missing.png" alt="Shoe" />);
    fireEvent.error(screen.getByAltText("Shoe"));
    expect(screen.getByAltText("Shoe")).toHaveAttribute("src", PLACEHOLDER);
  });
});
