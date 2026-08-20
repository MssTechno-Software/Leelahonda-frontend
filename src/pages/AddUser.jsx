import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from "../api/users";
import { getStocks } from "../api/stocks";
import LeelamayiLoader from "../components/LeelamayiLoader";
import {
  FiArrowLeft,
  FiUser,
  FiRotateCcw,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiXCircle,
} from 'react-icons/fi';

export default function AddUser() {
  const navigate = useNavigate();

  // Form Field State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    warehouse: ''
  });

  // Password Visibility Toggle State
  const [showPassword, setShowPassword] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Validation Errors State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dropdown Static Options
  const roleOptions = [
    { label: "Admin", value: "admin" },
    { label: "User", value: "user" },
  ];
  //for loactions 
  const fetchLocations = async () => {
    try {
      setLocationsLoading(true);

      const response = await getStocks("all");

      const locationList = response?.data?.by_location || [];

      const locationNames = locationList
        .map((item) => item?.location)
        .filter(Boolean);

      setLocations([...new Set(locationNames)]);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };
  useEffect(() => {
    fetchLocations();
  }, []);
  // Input Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validation Logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formData.username.trim()) newErrors.username = 'Username is required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.role) newErrors.role = 'Role selection is required.';
    if (!formData.warehouse) newErrors.warehouse = 'Warehouse selection is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Success Navigation
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/users");
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.email,
        password: formData.password,
        phone_no: formData.phone,
        location: formData.warehouse,
        role: formData.role,
      };

      await createUser(payload);

      setShowSuccessModal(true);

      setTimeout(() => {
        handleSuccessClose();
      }, 2000);

    } catch (error) {
      console.error("Create User Error:", error);
      setErrorMessage(
        error?.response?.data?.detail || "Failed to create user. Please try again."
      );
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Reset
  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      warehouse: ''
    });
    setErrors({});
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      <LeelamayiLoader
        loading={isSubmitting}
        message="Creating User"
        subMessage="Please wait while we create the user..."
      />

      <div className="w-full h-full min-h-full p-6 text-slate-800 font-sans flex flex-col justify-between">
        <div>
          {/* 1. Header Section */}
          <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/users')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1E48] transition mb-1.5"
              >
                <FiArrowLeft className="w-4 h-4" /> Back to Users
              </button>

              <h1 className="text-2xl font-bold text-[#0B1E48] tracking-tight uppercase">
                ADD NEW USER
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a new user account and assign access permissions.
              </p>
            </div>
          </div>

          {/* 2. Compact Form Card */}
          <form onSubmit={handleSubmit} noValidate>
            <div
              className="bg-white rounded-2xl border border-gray-200 p-6 w-full"
              style={{ boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                <FiUser className="w-4 h-4 text-[#0B1E48]" />
                <h2 className="text-sm font-bold text-[#0B1E48] uppercase tracking-wide">
                  User Details
                </h2>
              </div>

              {/* 2-Column Clean Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Row 1: First Name & Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.firstName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  />
                  {errors.firstName && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.firstName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.lastName ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.lastName}</span>
                    </div>
                  )}
                </div>

                {/* Row 2: Username & Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="john.doe"
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.username ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  />
                  {errors.username && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.username}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@warehouse.com"
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.email ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                {/* Row 3: Phone Number & Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border font-mono ${errors.phone ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  />
                  {errors.phone && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.phone}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border ${errors.password ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                        } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition"
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                {/* Row 4: Role & Warehouse */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.role ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  >
                    <option value="">Select Role</option>
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.role}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Locations <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.warehouse ? 'border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:ring-[#0B1E48]/20 focus:border-[#0B1E48]'
                      } rounded-lg focus:outline-none focus:ring-2 transition text-slate-800`}
                  >
                    <option value="">
                      {locationsLoading ? "Loading Locations..." : "Select Location"}
                    </option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {errors.warehouse && (
                    <div className="flex items-center gap-1.5 text-[12px] text-rose-600 bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-lg mt-1.5 animate-fade-in">
                      <FiAlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors.warehouse}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons at Bottom Right */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <FiRotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0B1E48] hover:bg-[#071330] rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating...
                  </span>
                ) : (
                  <>
                    <FiSave className="w-3.5 h-3.5" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-[3px] animate-fade-in">
          <div className="w-full max-w-[380px] bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">

            {/* Success Icon */}
            <div className="pt-7 flex justify-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pt-4 pb-6 text-center">

              <h3 className="text-[15px] font-bold text-slate-800">
                User Created Successfully
              </h3>

              <p className="mt-2 text-[12px] leading-5 text-slate-500">
                The new user has been created successfully.
              </p>

              <button
                type="button"
                onClick={handleSuccessClose}
                className="mt-5 w-full h-10 rounded-lg bg-[#0B1E48] hover:bg-[#071330] text-white text-xs font-semibold shadow-sm transition-all duration-200"
              >
                OK
              </button>

            </div>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiXCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Failed to Create User
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}