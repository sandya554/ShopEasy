// Unit tests: input / URL safety helpers (Experiment 2, part f)
import { cleanText, limitText, safeImageUrl, isValidId, safeRedirectPath } from "../utils/sanitize.js";

describe("cleanText / limitText", () => {
  test("cleanText removes control characters, collapses spaces and trims", () => {
    expect(cleanText("  Asha   Rao \u0000\u0007")).toBe("Asha Rao");
  });
  test("cleanText cuts the text to the maximum length", () => {
    expect(cleanText("a".repeat(300), 10)).toBe("aaaaaaaaaa");
  });
  test("limitText keeps spaces so the user can keep typing", () => {
    expect(limitText("12 Main St ", 50)).toBe("12 Main St ");
  });
  test("limitText removes control characters and cuts to the maximum", () => {
    expect(limitText("ab\u0001cd", 50)).toBe("abcd");
    expect(limitText("abcdef", 3)).toBe("abc");
  });
});

describe("safeImageUrl", () => {
  test("accepts http and https addresses", () => {
    expect(safeImageUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(safeImageUrl("http://example.com/a.png")).toBe("http://example.com/a.png");
  });
  test.each(["javascript:alert(1)", "data:text/html,<script>1</script>", "file:///etc/passwd", "not a url", ""])(
    "rejects %s", (bad) => expect(safeImageUrl(bad)).toBe("")
  );
  test("rejects a missing value", () => {
    expect(safeImageUrl(undefined)).toBe("");
    expect(safeImageUrl(null)).toBe("");
  });
});

describe("isValidId", () => {
  test("accepts positive whole numbers", () => {
    expect(isValidId("1")).toBe(true);
    expect(isValidId("12")).toBe(true);
  });
  test.each(["0", "-1", "1.5", "../orders", "1 OR 1=1", "", undefined])("rejects %p", (bad) => expect(isValidId(bad)).toBe(false));
});

describe("safeRedirectPath", () => {
  test("accepts in-app paths", () => expect(safeRedirectPath("/cart")).toBe("/cart"));
  test.each(["//evil.com", "https://evil.com", "/\\evil.com", "cart", undefined])("rejects %p", (bad) => {
    expect(safeRedirectPath(bad)).toBe("/products");
  });
  test("uses the given fallback", () => expect(safeRedirectPath("//x", "")).toBe(""));
});
