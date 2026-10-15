// Reusable button. variant: "primary" | "success" | "outline"
const VARIANTS = {
  primary: "bg-indigo-600 text-white",
  success: "bg-green-700 text-white", // (e) green-700: white text stays readable (contrast about 5:1)
  outline: "border text-gray-700 bg-white",
};

function Button({ children, variant = "primary", fullWidth = false, className = "", type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={`rounded p-2 text-sm disabled:opacity-40 ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
