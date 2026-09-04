import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";
import LeelamayiLoader from "../components/LeelamayiLoader";
import {
  validatePasswordSetupToken,
  setPassword,
} from "../api/auth";

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // Validate activation token when page opens
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError(
          "This password setup link is invalid or missing."
        );
        setIsValidating(false);
        return;
      }

      try {
        setIsValidating(true);

        await validatePasswordSetupToken(token);

        setTokenValid(true);
      } catch (error) {
        console.error("Password Setup Token Error:", error);

        const backendMessage =
          error?.response?.data?.detail ||
          error?.response?.data?.message;

        setTokenValid(false);
        setTokenError(
          typeof backendMessage === "string"
            ? backendMessage
            : "This password setup link is invalid or has expired."
        );
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters long.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setTokenError(
        "This password setup link is invalid."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setTokenError("");

      // Backend expects:
      // token
      // password
      // confirm_password
      await setPassword(
        token,
        formData.password,
        formData.confirmPassword
      );

      setSuccessMessage(
        "Your password has been created successfully."
      );

      setFormData({
        password: "",
        confirmPassword: "",
      });


    } catch (error) {
      console.error("Set Password Error:", error);

      const backendMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message;

      let message =
        "Unable to set your password. The link may have expired or already been used.";

      if (typeof backendMessage === "string") {
        message = backendMessage;
      } else if (Array.isArray(backendMessage)) {
        message = backendMessage
          .map((item) => item?.msg || String(item))
          .join(", ");
      }

      setTokenError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <LeelamayiLoader
          loading={true}
          disableBackdropBlur={true}
        />
      </div>
    );
  }

  // Invalid / expired token
  if (!tokenValid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white shadow-2xl p-7 text-center">

            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <FiAlertCircle className="w-8 h-8 text-rose-500" />
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-800">
              Link Unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {tokenError}
            </p>

            <p className="mt-3 text-xs text-slate-400">
              Please contact your administrator and request a
              new password setup link.
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 w-full h-11 rounded-xl bg-[#0B1E48] hover:bg-[#071330] text-white text-sm font-semibold transition-all shadow-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <LeelamayiLoader
        loading={isSubmitting}
        message="Setting Password"
        subMessage="Please wait while we secure your account..."
      />

      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">

        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-6">

            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0B1E48] flex items-center justify-center shadow-lg">
              <FiLock className="w-7 h-7 text-white" />
            </div>

            <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Set Your Password
            </h1>

            <p className="mt-2 text-sm text-slate-500 leading-6">
              Create a secure password for your account.
            </p>
          </div>

          {/* Card */}
          <div className="w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white p-6 sm:p-8">

            {/* Success */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">

                <div className="flex items-start gap-2">
                  <FiCheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#0B1E48] hover:bg-[#081738] py-2.5 rounded-lg transition"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </button>

              </div>
            )}

            {/* Error */}
            {tokenError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-start gap-2">
                <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                <span>{tokenError}</span>
              </div>
            )}

            {!successMessage && (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                    <span className="text-rose-500 ml-1">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      className={`w-full h-11 pl-10 pr-11 text-sm bg-slate-50 border ${errors.password
                        ? "border-rose-500 focus:ring-rose-200"
                        : "border-slate-200 focus:border-[#0B1E48] focus:ring-[#0B1E48]/10"
                        } rounded-xl focus:outline-none focus:ring-2 transition text-slate-800`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-600">
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.password}</span>
                    </div>
                  )}

                  {!errors.password && (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Use at least 8 characters.
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                    <span className="text-rose-500 ml-1">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      className={`w-full h-11 pl-10 pr-11 text-sm bg-slate-50 border ${errors.confirmPassword
                        ? "border-rose-500 focus:ring-rose-200"
                        : "border-slate-200 focus:border-[#0B1E48] focus:ring-[#0B1E48]/10"
                        } rounded-xl focus:outline-none focus:ring-2 transition text-slate-800`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-600">
                      <FiAlertCircle className="w-3.5 h-3.5" />
                      <span>
                        {errors.confirmPassword}
                      </span>
                    </div>
                  )}
                </div>

                {/* Security note */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <div className="flex gap-2.5">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Secure account setup
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Your password is private and can only
                        be created by you. Administrators cannot
                        view your password.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[#0B1E48] hover:bg-[#071330] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Setting Password..."
                    : "Set Password"}
                </button>

              </form>
            )}

          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-400 mt-5">
            Your password is securely stored and never visible
            to administrators.
          </p>

        </div>
      </div>
    </>
  );
}
