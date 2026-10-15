// Each validator returns an error message (string) or "" when the value is valid.

export const validateRequired = (value, label = "This field") =>
  String(value ?? "").trim() ? "" : `${label} is required`;

export function validateName(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Full name is required";
  if (v.length < 2) return "Name must be at least 2 characters";
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return "Name can only contain letters and spaces";
  return "";
}

export function validateEmail(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address (e.g. name@example.com)";
  return "";
}

// Indian mobile number: 10 digits, starting with 6-9
export function validatePhone(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Phone number is required";
  if (!/^\d+$/.test(v)) return "Phone number can only contain digits";
  if (v.length !== 10) return "Phone number must be exactly 10 digits";
  if (!/^[6-9]/.test(v)) return "Phone number must start with 6, 7, 8 or 9";
  return "";
}

export function validatePassword(value) {
  const v = String(value ?? "");
  if (!v) return "Password is required";
  if (v.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(v)) return "Password needs at least one uppercase letter";
  if (!/[a-z]/.test(v)) return "Password needs at least one lowercase letter";
  if (!/\d/.test(v)) return "Password needs at least one number";
  return "";
}

export function validateConfirmPassword(value, password) {
  if (!value) return "Please confirm your password";
  if (value !== password) return "Passwords do not match";
  return "";
}

export function validateAddress(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Address is required";
  if (v.length < 10) return "Address is too short (minimum 10 characters)";
  return "";
}

export function validateCity(value) {
  const v = String(value ?? "").trim();
  if (!v) return "City is required";
  if (!/^[A-Za-z][A-Za-z .'-]+$/.test(v)) return "Enter a valid city name";
  return "";
}

export function validatePincode(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Pincode is required";
  if (!/^[1-9]\d{5}$/.test(v)) return "Pincode must be 6 digits and cannot start with 0";
  return "";
}

// ---- Payment ----
export function validatePaymentMethod(value, allowed) {
  if (!value) return "Please select a payment method";
  if (!allowed.includes(value)) return "Selected payment method is not available";
  return "";
}

export function validateUpiId(value) {
  const v = String(value ?? "").trim();
  if (!v) return "UPI ID is required";
  if (!/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(v)) return "Enter a valid UPI ID (e.g. name@upi)";
  return "";
}

export function validateCardNumber(value) {
  const v = String(value ?? "").replace(/\s/g, "");
  if (!v) return "Card number is required";
  if (!/^\d{16}$/.test(v)) return "Card number must be 16 digits";
  return "";
}

export function validateExpiry(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Expiry date is required";
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return "Use MM/YY format";
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return "Month must be between 01 and 12";
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return "Card has expired";
  }
  return "";
}

export function validateCvv(value) {
  const v = String(value ?? "");
  if (!v) return "CVV is required";
  if (!/^\d{3}$/.test(v)) return "CVV must be 3 digits";
  return "";
}

// ---- Product (add / edit form) ----
export function validateProductName(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Product name is required";
  if (v.length < 3) return "Product name must be at least 3 characters";
  return "";
}

export const validateCategory = (value) => validateRequired(value, "Category");
export const validateBrand = (value) => validateRequired(value, "Brand");

export function validatePrice(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Price is required";
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return "Enter a valid price (e.g. 499 or 499.50)";
  if (Number(v) <= 0) return "Price must be greater than 0";
  return "";
}

export function validateRating(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Rating is required";
  if (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > 5) return "Rating must be between 0 and 5";
  return "";
}

export function validateImageUrl(value) {
  const v = String(value ?? "").trim();
  if (!v) return "Image URL is required";
  if (!/^https?:\/\/\S+$/i.test(v)) return "Enter a valid image URL starting with http:// or https://";
  return "";
}
