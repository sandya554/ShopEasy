import { useState, useCallback } from "react";

// Small reusable form hook.
//  initialValues: { field: "" }
//  validate(values) -> { field: "error message" } (only fields with errors)
//  sanitizers: optional { field: (rawValue) => cleanedValue } applied while typing
function useForm(initialValues, validate, sanitizers = {}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});

  const errors = validate(values);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const clean = sanitizers[name] ? sanitizers[name](value) : value;
    setValues((prev) => ({ ...prev, [name]: clean }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  // Only show an error after the field was touched (or a submit was attempted).
  const errorFor = (name) => (touched[name] && errors[name]) || "";

  const handleSubmit = (onValid) => (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const firstInvalid = Object.keys(errors)[0];
    if (!firstInvalid) { onValid(values); return; }
    // (e) Accessibility: move keyboard focus to the first field with a problem
    const field = form?.elements?.namedItem?.(firstInvalid);
    const target = field && !field.tagName ? field[0] : field; // a radio group returns a list
    target?.focus?.();
  };

  return { values, errors, errorFor, handleChange, handleBlur, handleSubmit };
}

export default useForm;
