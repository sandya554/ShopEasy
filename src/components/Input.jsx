// Reusable text input with label and error message.
// (e) aria-invalid / aria-describedby link the error text to the field, and the
// error is announced politely when it appears. `required` marks it for screen readers.
function Input({ label, name, error, required = true, className = "", ...rest }) {
  const errorId = `${name}-error`;
  return (
    <div className={`mb-2 ${className}`}>
      {label && <label htmlFor={name} className="block text-xs text-gray-600 mb-1">{label}</label>}
      <input
        id={name}
        name={name}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`border w-full p-2 rounded ${error ? "border-red-600" : ""}`}
        {...rest}
      />
      {error && <p id={errorId} aria-live="polite" className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default Input;
