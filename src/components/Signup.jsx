import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import useForm from "../hooks/useForm.js";
import {
  validateName, validateEmail, validatePassword, validateConfirmPassword,
} from "../utils/validators.js";
import Input from "./Input.jsx";
import Button from "./Button.jsx";
import { safeRedirectPath } from "../utils/sanitize.js";

const validate = (v) => {
  const errors = {};
  const checks = {
    name: validateName(v.name),
    email: validateEmail(v.email),
    password: validatePassword(v.password),
    confirmPassword: validateConfirmPassword(v.confirmPassword, v.password),
  };
  Object.entries(checks).forEach(([k, msg]) => { if (msg) errors[k] = msg; });
  return errors;
};

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuthContext();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { values, errorFor, handleChange, handleBlur, handleSubmit } = useForm(
    { name: "", email: "", password: "", confirmPassword: "" },
    validate
  );

  const redirectTo = safeRedirectPath(location.state?.from?.pathname, "/products"); // (f) in-app paths only

  const onValid = async ({ name, email, password }) => {
    setSubmitting(true);
    const result = await signup(name.trim(), email.trim(), password);
    if (!result.success) {
      setError(result.message);
      setSubmitting(false);
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  const change = (e) => { handleChange(e); setError(""); };

  return (
    <div className="max-w-sm mx-auto p-4">
      <form onSubmit={handleSubmit(onValid)} noValidate className="bg-white rounded p-4 border">
        <h1 className="font-bold text-lg mb-2">Sign Up</h1>
        <Input label="Full Name" name="name" placeholder="Full Name" autoComplete="name" maxLength={60} value={values.name} onChange={change} onBlur={handleBlur} error={errorFor("name")} disabled={submitting} />
        <Input label="Email" name="email" type="email" placeholder="Email" autoComplete="email" maxLength={254} value={values.email} onChange={change} onBlur={handleBlur} error={errorFor("email")} disabled={submitting} />
        <Input label="Password" name="password" type="password" placeholder="Min 8 chars, upper, lower, number" autoComplete="new-password" maxLength={128} value={values.password} onChange={change} onBlur={handleBlur} error={errorFor("password")} disabled={submitting} />
        <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm Password" autoComplete="new-password" maxLength={128} value={values.confirmPassword} onChange={change} onBlur={handleBlur} error={errorFor("confirmPassword")} disabled={submitting} />
        {error && (
          <p className="text-red-600 text-xs mt-2" role="alert">
            {error} {error.includes("login") && <Link to="/login" state={location.state} className="underline">Login</Link>}
          </p>
        )}
        <Button type="submit" fullWidth className="mt-2" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign Up"}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-3">
          Already have an account? <Link to="/login" state={location.state} className="text-indigo-600 underline">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
