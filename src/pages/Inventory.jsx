import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LeelamayiLoader from "../components/LeelamayiLoader";

import {
  Search,
  Plus,
  Filter,
  Download,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MapPinned,
  Check,
  X,
  Loader2,
  ShieldCheck,
  Building,
  CheckCircle2,
  MapPin,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import {
  getStocks,
  createStock,
  updateStock,
  deleteStock,
  updateStockLocation,
  bulkUploadStocks,
  bulkDeleteStocks,
} from "../api/stocks";
import AddNewStock from "../components/AddNewStock";
import FilterModal from "../components/FilterModal";
import logo from "../assets/logo.png";

const Inventory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLoader, setShowLoader] = useState(
    location.state?.showLoader || false,
  );

  // --- Search & Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState(10);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // --- Delete Modal & Mode State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(null); // 'single' | 'bulk'
  const [stockToDelete, setStockToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Self-Contained Toast State ---
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [filters, setFilters] = useState({
    warehouse: "",
    product: "",
    model: "",
    variant: "",
    color: "",
    location: "",
    mfgFrom: "",
    mfgTo: "",
    transferFrom: "",
    transferTo: "",
  });

  // --- Inline Location Edit State ---
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocation, setEditingLocation] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [recentlySavedLocationId, setRecentlySavedLocationId] = useState(null);

  // --- UI Enhancements State ---
  const [cardStartIndex, setCardStartIndex] = useState(0);
  const [viewAllRegions, setViewAllRegions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // --- Warehouse Data ---
  const [warehouseClusters, setWarehouseClusters] = useState([]);

  // --- Live Inventory Stock Data ---
  const [inventory, setInventory] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Header Checkbox Ref for Indeterminate State ---
  const headerCheckboxRef = useRef(null);

  // --- Toast Helper ---
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // --- Inline Location Handlers ---
  const handleStartEditLocation = (item) => {
    if (savingLocation) return;
    setEditingLocationId(item.id);
    setEditingLocation(item.location || "");
  };

  const handleCancelEditLocation = () => {
    if (savingLocation) return;
    setEditingLocationId(null);
    setEditingLocation("");
  };

  const handleLocationSave = async (stockId, locationName) => {
    try {
      setSavingLocation(true);
      await updateStockLocation(stockId, locationName);
      await fetchStocks();

      setEditingLocationId(null);
      setEditingLocation("");
      setRecentlySavedLocationId(stockId);

      setTimeout(() => {
        setRecentlySavedLocationId(null);
      }, 1000);
    } catch (error) {
      console.error("Failed to update location:", error);
      showToast("Failed to update location.", "error");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleKeyDownLocation = (e, stockId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLocationSave(stockId, editingLocation);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEditLocation();
    }
  };

  // --- Delete Trigger Handlers ---
  const handleSingleDeleteClick = (id) => {
    setStockToDelete(id);
    setDeleteMode("single");
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) {
      showToast("Please select at least one stock record.", "warning");
      return;
    }
    setDeleteMode("bulk");
    setShowDeleteModal(true);
  };

  // --- Unified Delete Confirmation Execution ---
  const confirmDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      if (deleteMode === "single") {
        await deleteStock(stockToDelete);
        showToast("Deleted 1 stock record successfully.", "success");
      } else if (deleteMode === "bulk") {
        const count = selectedIds.length;
        await bulkDeleteStocks(selectedIds);
        setSelectedIds([]);
        showToast(`Deleted ${count} stock records successfully.`, "success");
      }

      await fetchStocks();
      setShowDeleteModal(false);
      setStockToDelete(null);
      setDeleteMode(null);
    } catch (error) {
      console.error(error);
      showToast(
        deleteMode === "bulk"
          ? "Unable to delete selected stock records."
          : "Some records could not be deleted.",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingStock(vehicle);
    setIsEditMode(true);
    setShowAddStock(true);
  };

  const handleTrack = (frameNo) => {
    navigate(`/track?frame=${frameNo}`);
  };

  // --- Add/Update Stock API ---
  const handleSaveStock = async (stock) => {
    try {
      const payload = {
        Frame: stock.frameNo,
        "Engine No/Motor No": stock.engineNo,
        "Product Name": stock.product,
        "Model Name": stock.model,
        "Model Variant": stock.variant,
        Color: stock.colorName,
        "Manufacturing Date": stock.mfgDate,
        Location: stock.location,
        "Stock Trasnfer Date": stock.transferDate,
      };

      if (isEditMode) {
        await updateStock(editingStock.id, payload);
        showToast("Stock updated successfully.", "success");
      } else {
        await createStock(payload);
        showToast("Stock added successfully.", "success");
      }

      await fetchStocks();

      setShowAddStock(false);
      setEditingStock(null);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to save stock record.", "error");
    }
  };

  // --- Bulk Upload ---
  const handleBulkUpload = async (file) => {
    try {
      const response = await bulkUploadStocks(file);
      await fetchStocks();
      showToast("Bulk upload completed successfully.", "success");
      return response.data;
    } catch (error) {
      console.error(error);
      showToast("Bulk upload failed.", "error");
      throw error;
    }
  };

  // --- Fetch Stocks API ---
  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await getStocks("all", currentPage, selectedRows);
      const data = response.data;
      setTotalItems(data.total_remaining);

      const total = data.stocks.length;

      setWarehouseClusters(
        data.by_location.map((item) => ({
          name: item.location,
          units: item.count,
          percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
        })),
      );

      const stocks = data.stocks.map((item) => ({
        id: item.id,
        frameNo: item.Frame,
        engineNo: item["Engine No/Motor No"],
        product: item["Product Name"],
        model: item["Model Name"],
        variant: item["Model Variant"],
        colorName: item.Color,
        colorHex: item.Color,
        location: item.Location,
        mfgDate: item["Manufacturing Date"],
        transferDate: item["Stock Trasnfer Date"],
      }));

      setInventory(stocks);
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch inventory.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();

    if (location.state?.showLoader) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [currentPage, selectedRows]);

  // Reset pagination to page 1 whenever search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, selectedRows]);

  // --- Export PDF Logic ---
  const exportPDF = () => {
    const doc = new jsPDF("landscape", "mm", "a4");

    doc.addImage(logo, "PNG", 10, 6, 30, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("LEELA HONDA PVT. LTD.", 40, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Inventory Management System", 40, 23);

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(12, 32, 285, 32);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, 36, 273, 22, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    doc.text("Report", 18, 44);
    doc.text("Generated On", 90, 44);
    doc.text("Generated By", 170, 44);
    doc.text("Total Records", 240, 44);

    doc.setFont("helvetica", "normal");
    doc.text("Inventory Report", 18, 51);
    doc.text(new Date().toLocaleString(), 90, 51);
    doc.text("Administrator", 170, 51);
    doc.text(String(filteredInventory.length), 248, 51);

    autoTable(doc, {
      startY: 65,
      head: [
        [
          "Frame No",
          "Engine No",
          "Product",
          "Model",
          "Variant",
          "Warehouse",
          "MFG Date",
          "Transfer Date",
        ],
      ],
      body: filteredInventory.map((item) => [
        item.frameNo,
        item.engineNo,
        item.product,
        item.model,
        item.variant,
        item.location,
        item.mfgDate,
        item.transferDate,
      ]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
        overflow: "hidden",
        valign: "middle",
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        halign: "center",
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 32 },
        4: { cellWidth: 30 },
        5: { cellWidth: 35 },
        6: { cellWidth: 28 },
        7: { cellWidth: 30 },
      },
      margin: {
        left: 12,
        right: 12,
      },
      didDrawPage: () => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height;
        const pageWidth = pageSize.width;

        doc.setDrawColor(220);
        doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);
        doc.setFontSize(9);
        doc.setTextColor(120);

        doc.text(
          "Generated by Leela Honda Inventory Management System",
          12,
          pageHeight - 6,
        );

        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          pageWidth - 25,
          pageHeight - 6,
        );
      },
    });

    doc.save("LeelaHonda_Inventory_Report.pdf");
  };

  const filteredInventory = inventory.filter((item) => {
    const searchMatch =
      item.frameNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.engineNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase());

    const warehouseMatch =
      !filters.warehouse || item.location === filters.warehouse;

    const productMatch = !filters.product || item.product === filters.product;

    const modelMatch = !filters.model || item.model === filters.model;

    const variantMatch = !filters.variant || item.variant === filters.variant;

    const colorMatch = !filters.color || item.colorName === filters.color;

    // ================= Date Filters =================

    const mfgDate = item.mfgDate ? new Date(item.mfgDate) : null;
    const transferDate = item.transferDate ? new Date(item.transferDate) : null;

    const mfgFromMatch =
      !filters.mfgFrom || (mfgDate && mfgDate >= new Date(filters.mfgFrom));

    const mfgToMatch =
      !filters.mfgTo || (mfgDate && mfgDate <= new Date(filters.mfgTo));

    const transferFromMatch =
      !filters.transferFrom ||
      (transferDate && transferDate >= new Date(filters.transferFrom));

    const transferToMatch =
      !filters.transferTo ||
      (transferDate && transferDate <= new Date(filters.transferTo));

    return (
      searchMatch &&
      warehouseMatch &&
      productMatch &&
      modelMatch &&
      variantMatch &&
      colorMatch &&
      mfgFromMatch &&
      mfgToMatch &&
      transferFromMatch &&
      transferToMatch
    );
  });

  // --- Carousel & View All Helpers ---
  const visibleClusters = viewAllRegions
    ? warehouseClusters
    : warehouseClusters.slice(cardStartIndex, cardStartIndex + 4);

  const handleNextCards = () => {
    if (cardStartIndex + 4 < warehouseClusters.length) {
      setCardStartIndex((prev) => prev + 4);
    }
  };

  const handlePrevCards = () => {
    if (cardStartIndex - 4 >= 0) {
      setCardStartIndex((prev) => prev - 4);
    }
  };

  const handleToggleViewAll = () => {
    if (viewAllRegions) {
      setViewAllRegions(false);
      setCardStartIndex(0);
    } else {
      setViewAllRegions(true);
    }
  };

  // --- Pagination Logic ---
  const totalPages = Math.ceil(totalItems / selectedRows) || 1;
  const startIndex = (currentPage - 1) * selectedRows;
  const paginatedInventory = filteredInventory;

  // --- Indeterminate Header Checkbox Effect ---
  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    const paginatedIds = paginatedInventory.map((item) => item.id);
    const selectedPaginatedCount = paginatedIds.filter((id) =>
      selectedIds.includes(id),
    ).length;

    const allSelected =
      paginatedInventory.length > 0 &&
      selectedPaginatedCount === paginatedInventory.length;
    const someSelected =
      selectedPaginatedCount > 0 &&
      selectedPaginatedCount < paginatedInventory.length;

    headerCheckboxRef.current.checked = allSelected;
    headerCheckboxRef.current.indeterminate = someSelected;
  }, [paginatedInventory, selectedIds]);

  return (
    <>
      {(loading || showLoader) && (
        <LeelamayiLoader
          loading={loading || showLoader}
          message="Loading Inventory"
        />
      )}

      {/* ================= Toast Notification ================= */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {toast.type === "error" && (
              <X className="w-4 h-4 text-red-600 shrink-0" />
            )}
            {toast.type === "warning" && (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() =>
                setToast({ show: false, message: "", type: "success" })
              }
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div
        className={`p-8 space-y-8 bg-[#F8FAFC] min-h-full transition-all duration-500 ${
          loading || showLoader ? "blur-sm pointer-events-none" : ""
        }`}
      >
        {/* ================= Top Bar ================= */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Frame No, Engine, or Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-2xs transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddStock(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 transition-all active:scale-[0.98] font-semibold text-xs tracking-wider uppercase shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Stock
            </button>
          </div>
        </div>

        {/* ================= Warehouse Clusters Header & Cards ================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Warehouse Clusters
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Global overview of current stock levels across all regions
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!viewAllRegions && warehouseClusters.length > 4 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevCards}
                    disabled={cardStartIndex === 0}
                    className={`w-8 h-8 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center justify-center transition-colors ${
                      cardStartIndex === 0
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-slate-50 text-slate-700 cursor-pointer"
                    }`}
                    title="Previous Cards"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextCards}
                    disabled={cardStartIndex + 4 >= warehouseClusters.length}
                    className={`w-8 h-8 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center justify-center transition-colors ${
                      cardStartIndex + 4 >= warehouseClusters.length
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-slate-50 text-slate-700 cursor-pointer"
                    }`}
                    title="Next Cards"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={handleToggleViewAll}
                className="flex items-center gap-1 text-xs font-semibold text-slate-900 hover:text-slate-700 tracking-wider uppercase cursor-pointer"
              >
                {viewAllRegions ? "Back to Inventory" : "View All Regions"}
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    viewAllRegions ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleClusters.map((cluster, idx) => (
              <div
                key={idx}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {cluster.name}
                    </p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold text-slate-900 tracking-tight">
                        {cluster.units}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                        UNITS
                      </span>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50/80 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-slate-600" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-end text-[11px] font-semibold text-slate-600 mb-1.5">
                    {cluster.percentage}%
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F172A] h-full rounded-full transition-all duration-500"
                      style={{ width: `${cluster.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= Live Inventory Stock Table ================= */}
        {!viewAllRegions && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Live Inventory Stock
                </h2>

                <span
                  style={{
                    height: "36px",
                    borderRadius: "999px",
                    paddingLeft: "18px",
                    paddingRight: "18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Live Sync Active
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilter(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs uppercase tracking-wider cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  Filter
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs uppercase tracking-wider cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Export PDF
                </button>

                {/* Requirement 5 & 9: Dynamic Delete Toolbar Button */}
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteClick}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 active:scale-[0.97] transition-all shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedIds.length})
                  </button>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium ml-2">
                  <span>ROWS:</span>
                  <div className="relative">
                    <select
                      value={selectedRows}
                      onChange={(e) => setSelectedRows(Number(e.target.value))}
                      className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    <th className="py-3 px-4 w-10">
                      {/* Requirement 4: Modern checkable & indeterminate Header Checkbox */}
                      <input
                        type="checkbox"
                        ref={headerCheckboxRef}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const paginatedIds = paginatedInventory.map(
                              (x) => x.id,
                            );
                            setSelectedIds((prev) =>
                              Array.from(new Set([...prev, ...paginatedIds])),
                            );
                          } else {
                            const paginatedIds = paginatedInventory.map(
                              (x) => x.id,
                            );
                            setSelectedIds((prev) =>
                              prev.filter((id) => !paginatedIds.includes(id)),
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500/20 cursor-pointer transition-all hover:border-red-400 accent-red-600"
                      />
                    </th>
                    <th className="py-3.5 px-4">Frame No</th>
                    <th className="py-3.5 px-4">Engine No</th>
                    <th className="py-3.5 px-4">Actions</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Model</th>
                    <th className="py-3.5 px-4">Variant</th>
                    <th className="py-3.5 px-4">Color</th>
                    <th className="py-3.5 px-15">Location</th>
                    <th className="py-3.5 px-4">MFG Date</th>
                    <th className="py-3.5 px-4">Transfer Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                  {paginatedInventory.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="py-16">
                        <div className="flex flex-col items-center justify-center">
                          <Building className="w-10 h-10 text-slate-300 mb-3" />

                          <h3 className="text-sm font-semibold text-slate-700">
                            No Inventory Found
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {searchTerm.trim()
                              ? "No inventory matches your search."
                              : "There are no inventory records available."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedInventory.map((item) => {
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr
                          key={item.frameNo}
                          className={`transition-colors duration-150 ${
                            isSelected
                              ? "bg-red-50/60 hover:bg-red-50/80"
                              : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="py-3 px-4">
                            {/* Requirement 4: Modern row checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds((prev) => [...prev, item.id]);
                                } else {
                                  setSelectedIds((prev) =>
                                    prev.filter((id) => id !== item.id),
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500/20 cursor-pointer transition-all hover:border-red-400 accent-red-600"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                            {item.frameNo}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {item.engineNo}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setEditingStock(item);
                                  setIsEditMode(true);
                                  setShowAddStock(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                                title="Edit Vehicle"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleSingleDeleteClick(item.id)}
                                className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                                title="Delete Vehicle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* Track */}
                              <button
                                onClick={() => handleTrack(item.frameNo)}
                                className="text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                title="Track Vehicle"
                              >
                                <MapPinned className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {item.product}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {item.model}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {item.variant}
                          </td>
                          <td className="py-3.5 px-4">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs"
                              style={{ backgroundColor: item.colorHex }}
                              title={item.colorName}
                            ></div>
                          </td>

                          {/* Inline Editable Location Cell */}
                          <td className="py-2.5 px-4 text-slate-700 select-none align-middle">
                            <div className="w-48 max-w-full">
                              {editingLocationId === item.id ? (
                                <div
                                  className="relative flex items-center justify-between gap-1 bg-white h-9 px-2 rounded-lg border border-slate-300 shadow-2xs focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400 w-full"
                                  tabIndex={-1}
                                  onBlur={(e) => {
                                    if (
                                      !e.currentTarget.contains(
                                        e.relatedTarget,
                                      ) &&
                                      !savingLocation
                                    ) {
                                      handleCancelEditLocation();
                                    }
                                  }}
                                >
                                  <div className="relative flex-1 flex items-center min-w-0">
                                    <select
                                      autoFocus
                                      value={editingLocation}
                                      onChange={(e) =>
                                        setEditingLocation(e.target.value)
                                      }
                                      onKeyDown={(e) =>
                                        handleKeyDownLocation(e, item.id)
                                      }
                                      disabled={savingLocation}
                                      className="w-full bg-transparent text-xs font-semibold text-slate-800 pr-5 outline-none cursor-pointer disabled:opacity-50 appearance-none truncate"
                                    >
                                      <option value="" disabled>
                                        Select Location
                                      </option>
                                      {warehouseClusters.map((cluster, i) => (
                                        <option key={i} value={cluster.name}>
                                          {cluster.name}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  </div>

                                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleLocationSave(
                                          item.id,
                                          editingLocation,
                                        )
                                      }
                                      disabled={savingLocation}
                                      title="Save Location (Enter)"
                                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      {savingLocation ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleCancelEditLocation}
                                      disabled={savingLocation}
                                      title="Cancel (Esc)"
                                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : recentlySavedLocationId === item.id ? (
                                <div className="flex items-center justify-between h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 w-full transition-all duration-200">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-semibold truncate">
                                      {item.location || "Unassigned"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditLocation(item)}
                                  disabled={
                                    editingLocationId !== null &&
                                    editingLocationId !== item.id
                                  }
                                  className={`group flex items-center justify-between gap-2 h-9 px-3 rounded-lg border border-slate-200/80 bg-slate-50/70 text-slate-700 w-full transition-all duration-200 ${
                                    editingLocationId !== null &&
                                    editingLocationId !== item.id
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-slate-100/80 hover:border-slate-300 hover:shadow-2xs cursor-pointer"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                      {item.location || "Unassigned"}
                                    </span>
                                  </div>

                                  {savingLocation &&
                                  editingLocationId === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin shrink-0" />
                                  ) : (
                                    <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:scale-110 transition-all duration-200 shrink-0" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {item.mfgDate}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {item.transferDate}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ================= Table Pagination ================= */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Showing {totalItems === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + filteredInventory.length, totalItems)} of{" "}
                {totalItems} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors ${
                    currentPage === 1
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? "bg-[#0F172A] text-white border-[#0F172A]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors ${
                    currentPage === totalPages
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddStock && (
          <AddNewStock
            onClose={() => {
              setShowAddStock(false);
              setEditingStock(null);
              setIsEditMode(false);
            }}
            onSave={handleSaveStock}
            onBulkUpload={handleBulkUpload}
            editData={editingStock}
            isEditMode={isEditMode}
            warehouses={warehouseClusters}
          />
        )}

        {/* ================= Requirement 1, 2, 3, 9, 10: Dynamic Delete Modal ================= */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {deleteMode === "bulk"
                    ? "Delete Selected Stocks"
                    : "Delete Stock Record"}
                </h2>
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                {deleteMode === "bulk"
                  ? "Are you sure you want to delete the selected stock records? This action cannot be undone."
                  : "Are you sure you want to delete this stock record? This action cannot be undone."}
              </p>

              {deleteMode === "bulk" && (
                <div className="mt-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 inline-block">
                  Selected records: {selectedIds.length}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isDeleting) return;
                    setShowDeleteModal(false);
                    setStockToDelete(null);
                    setDeleteMode(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : deleteMode === "bulk" ? (
                    "Delete Selected"
                  ) : (
                    "Delete Record"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <FilterModal
          isOpen={showFilter}
          inventory={inventory}
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilter(false)}
        />
      </div>
    </>
  );
};

export default Inventory;
