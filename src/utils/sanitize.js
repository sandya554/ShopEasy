// (f) Helpers for handling user input and untrusted data safely.
// React already escapes text it renders, so these are a second line of defence:
// they clean what is typed and refuse URLs / paths that could do harm.

// Removes control characters (except tab / newline) and collapses long runs of
// whitespace. Optionally cuts the text to `max` characters.
export function cleanText(value, max = 200) {
  return String(value ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, max);
}

// For text boxes while the user is typing: removes control characters and cuts
// the text to `max`. It does NOT trim, so spaces can still be typed.
export function limitText(value, max = 200) {
  return String(value ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max);
}

// Only full http(s) image addresses are allowed. Anything else
// (javascript:, data:, file:, malformed text) returns "".
export function safeImageUrl(url) {
  try {
    const u = new URL(String(url)); // no base URL: relative text like "undefined" is rejected
    return u.protocol === "http:" || u.protocol === "https:" ? String(url) : "";
  } catch {
    return "";
  }
}

// A product id from the URL must be a positive whole number. This stops values
// like "../orders" from being placed into an API path.
export function isValidId(id) {
  return /^[1-9]\d{0,9}$/.test(String(id ?? ""));
}

// Where to go after login. Only in-app paths are accepted ("/cart"), never
// "//evil.com" or "https://evil.com" (an "open redirect").
export function safeRedirectPath(path, fallback = "/products") {
  return typeof path === "string" && /^\/(?![\/\\])/.test(path) ? path : fallback;
}
