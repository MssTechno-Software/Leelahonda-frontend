import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import logo from "../assets/logo.png";
import bgImage from "../assets/background.png";
import { loginUser } from "../api/auth";
import LeelamayiLoader from "../components/LeelamayiLoader";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Field level validation error states
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    keepSignedIn: false,
  });

  // Email format validation helper regex
  const validateEmailFormat = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isForgotModalOpen) {
        setIsForgotModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isForgotModalOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    // Remove field errors dynamically as user types valid input
    if (name === "email") {
      const email = value.trim();

      if (email.includes("@") && validateEmailFormat(email)) {
        setErrors((prev) => ({
          ...prev,
          email: "",
        }));
      }
    }

    if (name === "password") {
      if (value.length > 0) {
        setErrors((prev) => ({ ...prev, password: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      newErrors.email = "Email is required.";
      isValid = false;
    } else if (
      !trimmedEmail.includes("@") ||
      !validateEmailFormat(trimmedEmail)
    ) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    // 2. Password validation
    if (!formData.password) {
      newErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return { isValid, trimmedEmail };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // 4. Perform client validation before making API call
    const { isValid, trimmedEmail } = validateForm();
    if (!isValid) return;

    setLoading(true);
    setShowLoader(true);

    try {
      const data = await loginUser(trimmedEmail, formData.password);

      if (data) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_type", data.token_type);
      }

      setSuccessMessage("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/inventory");
      }, 1000);
    } catch (err) {
      setShowLoader(false);
      // 7. Backend status-code mapping
      const statusCode = err.response?.status;

      if (statusCode === 401 || statusCode === 400) {
        setError("Invalid email or password.");
      } else if (statusCode === 403) {
        setError("You don't have access to this application.");
      } else {
        const backendError = err.response?.data?.detail;
        if (typeof backendError === "string") {
          setError(backendError);
        } else if (Array.isArray(backendError) && backendError[0]?.msg) {
          setError(backendError[0].msg);
        } else {
          setError("Invalid email or password.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {showLoader && (
   <LeelamayiLoader
  loading={showLoader}
  disableBackdropBlur={true}
/>
)}
    <div
  className="min-h-screen w-full flex items-center justify-center bg-no-repeat bg-center relative"
  style={{
    backgroundImage: `url(${bgImage})`,
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
  }}
>
        {/* Main Form Container */}
        <div className="w-full max-w-md flex flex-col items-center md:-translate-y-10 px-4">
          {/* Header / Branding */}
          <div className="text-center mb-3 flex flex-col items-center">
            <img
              src={logo}
              alt="Leelamayi Honda Logo"
              className="h-24 sm:h-28 md:h-32 w-auto object-contain"
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Sign in to access the Warehouse Management System
            </p>
          </div>

          {/* Glassmorphism Card */}
          <div className="w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 sm:p-8">
            {/* Notification Messages */}

            {successMessage && (
              <div className="mb-4 p-3 rounded bg-green-100 border border-green-400 text-green-700 text-xs sm:text-sm font-medium text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Username Field */}
              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10">
                    <FiUser />
                  </span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder=" "
                    className={`peer w-full h-14 pl-11 pr-4 text-sm bg-white/70 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-800 ${errors.username
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-500/20"
                      }`}
                  />

                  <label
                    htmlFor="email"
                    className="absolute left-11 top-1/2 -translate-y-1/2 bg-white px-1 text-gray-400 text-sm transition-all duration-200 pointer-events-none
      peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-600
      peer-[&:not(:placeholder-shown)]:-top-2
      peer-[&:not(:placeholder-shown)]:left-3
      peer-[&:not(:placeholder-shown)]:text-xs
      peer-[&:not(:placeholder-shown)]:text-blue-600"
                  >
                    Email Address
                  </label>
                </div>

                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>
              {/* Password Field */}

              <div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg z-10">
                    <FiLock />
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder=" "
                    className={`peer w-full h-14 pl-11 pr-11 text-sm bg-white/70 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-800 ${errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-blue-600 focus:ring-blue-500/20"
                      }`}
                  />

                  <label
                    htmlFor="password"
                    className="absolute left-11 top-1/2 -translate-y-1/2 bg-white px-1 text-gray-400 text-sm transition-all duration-200 pointer-events-none
      peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-600
      peer-[&:not(:placeholder-shown)]:-top-2
      peer-[&:not(:placeholder-shown)]:left-3
      peer-[&:not(:placeholder-shown)]:text-xs
      peer-[&:not(:placeholder-shown)]:text-blue-600"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg focus:outline-none"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {errors.password}
                  </p>
                )}
              </div>
              {/* Checkbox & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label
                  htmlFor="keepSignedIn"
                  className="flex items-center text-xs sm:text-sm text-gray-700 cursor-pointer select-none font-medium"
                >
                  <input
                    id="keepSignedIn"
                    type="checkbox"
                    name="keepSignedIn"
                    checked={formData.keepSignedIn}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600"
                  />
                  <span className="ml-2">Keep me signed in</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs sm:text-sm font-semibold text-blue-700 hover:text-red-600 transition-colors focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.99] tracking-wide uppercase text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <footer className="text-center mt-6 text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">Version 1.0.0</p>
            <p>
              © 2026{" "}
              <span className="font-semibold text-red-600">
                Leelamayi Honda
              </span>
            </p>
          </footer>
        </div>

        {/* Forgot Password Modal */}
        {isForgotModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn"
            onClick={() => setIsForgotModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-6 sm:p-8 transform transition-all animate-scaleUp text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close (×) Button */}
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100/50 transition-colors focus:outline-none"
              >
                <FiX className="text-xl" />
              </button>

              {/* Warning Icon Header */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-inner">
                <FiAlertTriangle className="text-2xl" />
              </div>

              {/* Modal Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Forgot Password
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 font-medium">
                Please contact your Super Admin to reset your password.
              </p>

              {/* Prominent Access Message */}
              <div className="my-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-medium leading-relaxed shadow-sm">
                <p className="font-semibold text-amber-900">
                  You don't have access to reset your password.
                </p>
                <p className="mt-0.5 text-amber-800">
                  Please contact your Super Admin.
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn">
          <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-6 sm:p-8 transform transition-all animate-scaleUp text-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setError("")}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100/50 transition-colors"
            >
              <FiX className="text-xl" />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
              <FiAlertTriangle className="text-2xl" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Login Failed
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Invalid username or password.
            </p>

            {/* Message Box */}
            <div className="my-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              Please check your email address and password and try again.
            </div>

            {/* Button */}
            <button
              onClick={() => setError("")}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
