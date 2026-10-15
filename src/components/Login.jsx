import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";
import useForm from "../hooks/useForm.js";
import { validateEmail, validatePassword } from "../utils/validators.js";
import Input from "./Input.jsx";
import Button from "./Button.jsx";
import { safeRedirectPath } from "../utils/sanitize.js";

const validate = (v) => {
  const errors = {};
  const email = validateEmail(v.email);
  const password = validatePassword(v.password);
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthContext();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { values, errorFor, handleChange, handleBlur, handleSubmit } = useForm(
    { email: "", password: "" },
    validate
  );

  // Where to go after login: the page the user was trying to open, otherwise
  // the admin goes to the product admin page and shoppers to the products list.
  // (f) only in-app paths are accepted as the place to go after login
  const wantedPage = safeRedirectPath(location.state?.from?.pathname, "");

  // (a) Send the credentials to the API; on success the token is saved by AuthContext.
  const onValid = async ({ email, password }) => {
    setSubmitting(true);
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.message);
      setSubmitting(false);
      return;
    }
    navigate(wantedPage || (result.user?.role === "admin" ? "/admin/products" : "/products"), { replace: true });
  };

  return (
    <div className="max-w-sm mx-auto p-4">
      <form onSubmit={handleSubmit(onValid)} noValidate className="bg-white rounded p-4 border">
        <h1 className="font-bold text-lg mb-2">Login</h1>
        {location.state?.from && (
          <p className="text-xs text-gray-600 mb-2">Please log in to continue.</p>
        )}
        <Input
          label="Email" name="email" type="email" placeholder="Email" autoComplete="username" maxLength={254}
          value={values.email}
          onChange={(e) => { handleChange(e); setError(""); }}
          onBlur={handleBlur}
          error={errorFor("email")} disabled={submitting}
        />
        <Input
          label="Password" name="password" type="password" placeholder="Password" autoComplete="current-password" maxLength={128}
          value={values.password}
          onChange={(e) => { handleChange(e); setError(""); }}
          onBlur={handleBlur}
          error={errorFor("password")} disabled={submitting}
        />
        {error && <p className="text-red-600 text-xs mt-2" role="alert">{error}</p>}
        <Button type="submit" fullWidth className="mt-2" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-3">
          New here? <Link to="/signup" state={location.state} className="text-indigo-600 underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
