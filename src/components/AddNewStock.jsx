import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Upload,
  FileText,
  Download,
  Trash2,
  Info,
  AlertTriangle,
  FileSpreadsheet,
  CloudUpload,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const AddNewStock = ({
  onClose,
  onSave,
  onBulkUpload,
  editData,
  isEditMode,
  warehouses,
  onRefreshList, // Callback to refresh inventory list on success
  showToast, // Optional toast notification callback (message, type)
}) => {
  const [activeTab, setActiveTab] = useState("manual"); // "manual" | "bulk"
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // State for post-upload API response analysis
  const [uploadResult, setUploadResult] = useState(null);

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null); // Ref to hold active upload request for cancellation/memory leak protection

  // Auto-hide error popup after 4.5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const [form, setForm] = useState({
    frameNo: "",
    engineNo: "",
    product: "",
    model: "",
    variant: "",
    colorName: "",
    location: "",
    mfgDate: "",
    transferDate: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Cleanup pending network request on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (isEditMode && editData) {
      setForm({
        frameNo: editData.frameNo || "",
        engineNo: editData.engineNo || "",
        product: editData.product || "",
        model: editData.model || "",
        variant: editData.variant || "",
        colorName: editData.colorName || "",
        location: editData.location || "",
        mfgDate: editData.mfgDate || "",
        transferDate: editData.transferDate || "",
      });
    } else {
      setForm({
        frameNo: "",
        engineNo: "",
        product: "",
        model: "",
        variant: "",
        colorName: "",

        location: "",
        mfgDate: "",
        transferDate: "",
      });
    }
  }, [editData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error on user edit
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    const newErrors = {};
    if (!form.frameNo.trim()) newErrors.frameNo = "Frame number is required";
    if (!form.engineNo.trim()) newErrors.engineNo = "Engine number is required";
    if (!form.product.trim()) newErrors.product = "Product name is required";
    if (!form.model.trim()) newErrors.model = "Model / Series is required";
    if (!form.location) newErrors.location = "Please select a warehouse location";
    if (!form.mfgDate)
      newErrors.mfgDate = "Manufacturing date is required";

    if (!form.transferDate)
      newErrors.transferDate = "Transfer date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Call onSave callback with filled data
    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  // Helper validation for file selection
  const validateAndSetFile = (file) => {
    setFileError("");
    setErrorMessage("");
    setUploadResult(null);

    if (!file) return;

    const isCsv = file.type === "text/csv" || file.name.endsWith(".csv");
    const isExcel =
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    if (!isCsv && !isExcel) {
      setFileError("unsupported");
      return;
    }

    const maxSizeInBytes = 100 * 1024 * 1024; // 100 MB limit
    if (file.size > maxSizeInBytes) {
      setFileError("oversize");
      return;
    }

    setSelectedFile(file);
  };

  // Drag and drop handlers for Bulk Upload
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;

    if (e.dataTransfer.files) {
      if (e.dataTransfer.files.length > 1) {
        setErrorMessage("Please select only one file at a time.");
        return;
      }
      if (e.dataTransfer.files[0]) {
        validateAndSetFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = (e) => {
    if (uploading) return;
    if (e.target.files) {
      if (e.target.files.length > 1) {
        setErrorMessage("Please select only one file at a time.");
        return;
      }
      if (e.target.files[0]) {
        validateAndSetFile(e.target.files[0]);
      }
    }
  };

  const handleRemoveFile = () => {
    if (uploading) return;
    setSelectedFile(null);
    setFileError("");
    setErrorMessage("");
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvHeader = "Frame,Engine No,Product Name,Model,Variant,Color,Location,Manufacturing Date,Transfer Date\n";
    const sampleRow = "ME4KC253EK00912,ENG-9923841-X,SUV Electric,Series X 2026,AWD Luxury,Midnight Black,Main Warehouse,2026-01-15,2026-02-01\n";
    const blob = new Blob([csvHeader + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample_stock_import.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status message helper mapping standard HTTP error codes
  const getHttpStatusErrorMessage = (status, responseData) => {
    if (responseData && (responseData.message || responseData.error)) {
      return responseData.message || responseData.error;
    }

    switch (status) {
      case 400:
        return "Bad request. Please verify the spreadsheet format and column headers.";
      case 401:
        return "Unauthorized session. Please re-login to perform this action.";
      case 403:
        return "Forbidden. You do not have permission to upload stock inventory.";
      case 404:
        return "The upload endpoint could not be found. Please contact system admin.";
      case 409:
        return "Conflict detected. Some duplicate records conflict with existing inventory.";
      case 413:
        return "The uploaded file exceeds the maximum allowed server payload size.";
      case 422:
        return "Unprocessable record entity. Validation failed on template fields.";
      case 429:
        return "Too many upload attempts. Please wait a moment before trying again.";
      case 500:
      default:
        return "Server encountered an internal error while processing the inventory file.";
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate triggers or submission without valid file
    if (!selectedFile || uploading || fileError) return;

    setUploading(true);
    setUploadProgress(0);
    setErrorMessage("");
    setUploadResult(null);

    // If consumer passed an external handler onBulkUpload prop, execute it as priority
    if (onBulkUpload) {
      try {
        const res = await onBulkUpload(selectedFile);
        if (res) setUploadResult(res);
        if (showToast) showToast("Inventory uploaded successfully", "success");
        if (onRefreshList) onRefreshList();

        // Modal reset & close
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onClose();
      } catch (err) {
        let msg = "";

        switch (err?.response?.status) {
          case 400:
            msg =
              "Invalid inventory file. Please upload the correct CSV/Excel file using the official Inventory Template.";
            break;

          case 401:
            msg = "Your session has expired. Please login again.";
            break;

          case 403:
            msg = "You don't have permission to upload inventory.";
            break;

          case 404:
            msg = "Upload service is currently unavailable.";
            break;

          case 413:
            msg = "The selected file is too large.";
            break;

          case 500:
            msg =
              "Server error occurred while importing inventory. Please try again.";
            break;

          default:
            msg =
              err?.response?.data?.message ||
              "Unable to upload the inventory file.";
        }

        setErrorMessage(msg);

        if (showToast) {
          showToast(msg, "error");
        }
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }

      return;
    }
    // Default API Execution to POST /stock/upload-excel-binary using XMLHttpRequest for progress tracking
    try {
      const formData = new FormData();
      // Standard binary form payload key
      formData.append("file", selectedFile);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.addEventListener("load", () => {
          xhrRef.current = null;
          let parsedResponse = null;
          try {
            parsedResponse = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          } catch (pErr) {
            parsedResponse = {};
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsedResponse);
          } else {
            const errorText = getHttpStatusErrorMessage(xhr.status, parsedResponse);
            reject({ status: xhr.status, message: errorText, response: parsedResponse });
          }
        });

        xhr.addEventListener("error", () => {
          xhrRef.current = null;
          reject({ status: 0, message: "Network error occurred during upload. Please check connection." });
        });

        xhr.addEventListener("abort", () => {
          xhrRef.current = null;
          reject({ status: 0, message: "Upload operation was cancelled." });
        });

        xhr.open("POST", "/stock/upload-excel-binary", true);

        // Authorization token attachment if available in localStorage/sessionStorage
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        if (token) {
          xhr.setRequestHeader("Authorization", token.startsWith("Bearer ") ? token : `Bearer ${token}`);
        }

        xhr.send(formData);
      });

      // Handle Success
      if (showToast) showToast("Inventory records uploaded successfully", "success");
      if (onRefreshList) onRefreshList();

      // State Cleanup & Modal Close
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadProgress(0);
      onClose();

    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred during inventory import.");
      if (err.response) {
        setUploadResult(err.response);
      }
      if (showToast) showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      xhrRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={uploading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 transform transition-all my-auto z-10 flex flex-col">

        {/* Floating Error Toast Popup (Top-Center over Modal Content) */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between gap-3 p-3.5 bg-red-600 text-white rounded-xl shadow-xl border border-red-500/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertCircle className="w-5 h-5 shrink-0 text-white" />
                <p className="text-xs font-semibold leading-snug truncate">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0 focus:outline-none"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? "Edit Vehicle" : "Add New Stock"}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {isEditMode
                ? "Update vehicle information."
                : "Register new vehicles into the enterprise inventory ledger."}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={uploading || saving}
            type="button"
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Only visible when not editing) */}
        {!isEditMode && (
          <div className="px-8 pt-4 pb-0 bg-slate-50/50 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => setActiveTab("manual")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${activeTab === "manual"
                    ? "bg-white text-slate-900 border-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60"
                  } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setActiveTab("bulk")}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${activeTab === "bulk"
                    ? "bg-white text-slate-900 border-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60"
                  } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Bulk CSV Upload
              </button>
            </div>
          </div>
        )}

        {/* Tab Content: Manual Entry */}
        {activeTab === "manual" ? (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto flex-1">

              {/* Frame Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Frame Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="frameNo"
                  placeholder="e.g. ME4KC253EK00912"
                  value={form.frameNo}
                  onChange={(e) => {
                    const hex = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      colorHex: hex,
                    }));
                  }}
                  readOnly={isEditMode}
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.frameNo
                    ? "border-red-500 focus:ring-red-200"
                    : "border-slate-200 focus:border-slate-800 focus:ring-slate-900/10"
                    } rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all ${isEditMode ? "cursor-not-allowed bg-slate-100" : ""
                    }`}
                />
                {errors.frameNo && (
                  <p className="text-xs text-red-500 font-medium">{errors.frameNo}</p>
                )}
              </div>

              {/* Engine Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Engine Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="engineNo"
                  placeholder="e.g. ENG-9923841-X"
                  value={form.engineNo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.engineNo ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-slate-800 focus:ring-slate-900/10"
                    } rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                />
                {errors.engineNo && (
                  <p className="text-xs text-red-500 font-medium">{errors.engineNo}</p>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product"
                  placeholder="e.g. SUV Electric"
                  value={form.product}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.product ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-slate-800 focus:ring-slate-900/10"
                    } rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                />
                {errors.product && (
                  <p className="text-xs text-red-500 font-medium">{errors.product}</p>
                )}
              </div>

              {/* Model / Series */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Model / Series <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  placeholder="e.g. Series X 2026"
                  value={form.model}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.model ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-slate-800 focus:ring-slate-900/10"
                    } rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                />
                {errors.model && (
                  <p className="text-xs text-red-500 font-medium">{errors.model}</p>
                )}
              </div>

              {/* Variant */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Variant
                </label>
                <input
                  type="text"
                  name="variant"
                  placeholder="e.g. AWD Luxury Edition"
                  value={form.variant}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:bg-white transition-all"
                />
              </div>
<div className="space-y-1.5">
  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
    Color
  </label>

  <input
    type="text"
    name="colorName"
    placeholder="e.g. Midnight Black"
    value={form.colorName}
    onChange={handleChange}
    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:bg-white transition-all"
  />

  {errors.colorName && (
    <p className="text-xs text-red-500 font-medium">
      {errors.colorName}
    </p>
  )}
</div>

              {/* Warehouse Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 appearance-none bg-slate-50/50 border ${errors.location ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-slate-800 focus:ring-slate-900/10"
                      } rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                  >
                    <option value="">Select Warehouse Location</option>

                    {warehouses?.map((warehouse) => (
                      <option
                        key={warehouse.name}
                        value={warehouse.name}
                      >
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.location && (
                  <p className="text-xs text-red-500 font-medium">{errors.location}</p>
                )}
              </div>

              {/* Manufacturing Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Manufacturing Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="mfgDate"
                    value={form.mfgDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:bg-white transition-all"
                  />
                  {errors.mfgDate && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.mfgDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Transfer Date */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Transfer Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="transferDate"
                    value={form.transferDate}
                    onChange={handleChange}
                    className="w-full md:w-1/2 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-900/10 focus:bg-white transition-all"
                  />{errors.transferDate && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.transferDate}
                    </p>
                  )}

                </div>
              </div>

            </div>

            {/* Modal Footer (Manual Mode) */}
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {isEditMode ? "Update Vehicle" : "Save Stock"}
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Tab Content: Bulk CSV Upload */
          <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-8 overflow-y-auto space-y-6 flex-1">

              {/* Upload Progress & Loading State Notice */}
              {uploading && (
                <div className="sticky top-0 z-20 p-4 bg-blue-50/95 backdrop-blur-sm border border-blue-200 rounded-xl space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                      <p className="text-xs font-bold text-blue-900">
                        Uploading inventory... ({uploadProgress}%)
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-700">{uploadProgress}%</span>
                  </div>

                  <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  <p className="text-xs text-blue-700">
                    Please wait while we validate and import your records.
                  </p>
                </div>
              )}

              {/* Validation Warning Messages */}
              {fileError === "unsupported" && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl transition-all animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-red-800">Unsupported file type.</h5>
                    <p className="text-xs text-red-600 mt-0.5">
                      Please upload a valid CSV or Excel inventory file.
                    </p>
                  </div>
                </div>
              )}

              {fileError === "oversize" && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl transition-all animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800">File size warning</h5>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Selected file exceeds the maximum upload size.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Upload Container - Transforms between Drop Zone and Selected File View */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[300px] ${selectedFile
                    ? "border-emerald-500 bg-emerald-50/20"
                    : dragActive
                      ? "border-blue-600 bg-blue-50/50 scale-[0.99]"
                      : "border-slate-300 bg-slate-50/40 hover:border-blue-400 hover:bg-blue-50/20"
                  } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="csv-file-input"
                />

                {!selectedFile ? (
                  /* State 1: Drop Zone */
                  <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shadow-sm mb-3.5 group-hover:scale-105 transition-transform">
                      <CloudUpload className="w-7 h-7 text-blue-600" />
                    </div>

                    <h3 className="text-base font-bold text-slate-800 mb-1">
                      Drop your inventory file here
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mb-5">
                      Drag &amp; Drop or browse from your computer
                    </p>

                    <label
                      htmlFor="csv-file-input"
                      className={`px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all shadow-md hover:shadow-blue-500/20 active:scale-[0.98] inline-flex items-center gap-2 ${uploading ? "pointer-events-none opacity-50" : ""
                        }`}
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </label>

                    {/* Formats & File Size Badges */}
                    <div className="mt-6 pt-5 border-t border-slate-200/60 w-full max-w-lg flex flex-wrap items-center justify-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accepted Formats:</span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">CSV</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">XLSX</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800">XLS</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maximum Size:</span>
                        <span className="text-xs font-bold text-slate-700">100 MB</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 italic">
                      * Availability depends on backend configuration.
                    </p>
                  </div>
                ) : (
                  /* State 2: Selected File Preview Inside Container */
                  <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200 w-full max-w-md">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md mb-3 text-white">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold tracking-tight mb-2">
                      Ready to Upload
                    </span>

                    <h3 className="text-base font-bold text-slate-900 truncate max-w-full px-4 mb-1">
                      {selectedFile.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-bold uppercase tracking-wider">
                        {selectedFile.name.split(".").pop()}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">
                        Modified: {selectedFile.lastModified ? new Date(selectedFile.lastModified).toLocaleDateString() : "N/A"}
                      </span>
                    </div>

                    {/* Action Buttons Inside Upload Container */}
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="csv-file-input"
                        className={`px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5 ${uploading ? "pointer-events-none opacity-50" : ""
                          }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        Change File
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={uploading}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Download Card */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-emerald-100/80 rounded-xl shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Inventory Import Template</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Download the official template before uploading your inventory.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  disabled={uploading}
                  className="px-4 py-2 bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 shrink-0 active:scale-[0.98] disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Download Template
                </button>
              </div>

              {/* Backend API Detailed Response Summary & Error Report Download */}
              {uploadResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Import Breakdown Summary
                  </h5>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {"importedCount" in uploadResult || "imported_count" in uploadResult ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Imported</p>
                        <p className="text-base font-bold text-emerald-600">
                          {uploadResult.importedCount ?? uploadResult.imported_count ?? 0}
                        </p>
                      </div>
                    ) : null}

                    {"duplicateCount" in uploadResult || "duplicate_count" in uploadResult ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Duplicates</p>
                        <p className="text-base font-bold text-amber-600">
                          {uploadResult.duplicateCount ?? uploadResult.duplicate_count ?? 0}
                        </p>
                      </div>
                    ) : null}

                    {"skippedCount" in uploadResult || "skipped_count" in uploadResult ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Skipped</p>
                        <p className="text-base font-bold text-slate-600">
                          {uploadResult.skippedCount ?? uploadResult.skipped_count ?? 0}
                        </p>
                      </div>
                    ) : null}

                    {"failedCount" in uploadResult || "failed_count" in uploadResult ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-center">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Failed</p>
                        <p className="text-base font-bold text-red-600">
                          {uploadResult.failedCount ?? uploadResult.failed_count ?? 0}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Download Error Report Button (If provided by API) */}
                  {(uploadResult.error_report_url || uploadResult.error_file) && (
                    <div className="pt-2 flex justify-end">
                      <a
                        href={uploadResult.error_report_url || uploadResult.error_file}
                        download="inventory_import_error_report.csv"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-red-600" />
                        Download Error Report
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer (Bulk Mode) */}
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <p className="text-xs text-slate-500 text-center sm:text-left leading-relaxed">
                Uploading large inventory files may take a few minutes.<br />
                Please do not close this window during upload.
              </p>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedFile || uploading || !!fileError}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98] min-w-[170px]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4 text-blue-100" />
                      Upload Inventory
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default AddNewStock;