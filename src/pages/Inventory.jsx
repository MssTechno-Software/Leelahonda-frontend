import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LeelamayiLoader from "../components/LeelamayiLoader";
import ExportPDF from "../components/ExportPDF";
import {
  Search,
  Plus,
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
  updateStockLocation,
  bulkUploadStocks,
  bulkDeleteStocks,
} from "../api/stocks";
import AddNewStock from "../components/AddNewStock";
import logo from "../assets/logo.png";

const Inventory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLoader, setShowLoader] = useState(
    location.state?.showLoader || false,
  );
  // --- Search & Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState(10);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // --- Delete Modal & Mode State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Self-Contained Toast State ---
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // --- Inline Location Edit State ---
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocation, setEditingLocation] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);
  const [recentlySavedLocationId, setRecentlySavedLocationId] = useState(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

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
  const [searchLoading, setSearchLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  // --- Header Checkbox Ref for Indeterminate State ---
  const headerCheckboxRef = useRef(null);
 const searchRequestIdRef = useRef(0);
const previousSearchRef = useRef("");
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
    setLocationDropdownOpen(true);
  };

  const handleCancelEditLocation = () => {
    if (savingLocation) return;
    setEditingLocationId(null);
    setEditingLocation("");
    setLocationDropdownOpen(false);
  };

  const handleLocationSave = async (stockId, locationName) => {
    try {
      setSavingLocation(true);

      await updateStockLocation(stockId, locationName);

      await fetchStocks();

      setEditingLocationId(null);
      setEditingLocation("");
      setRecentlySavedLocationId(stockId);
      setLocationDropdownOpen(false);

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
    if (isDeleting || selectedIds.length === 0) return;
    try {
      setIsDeleting(true);
      const count = selectedIds.length;
      await bulkDeleteStocks(selectedIds);
      setSelectedIds([]);
      showToast(`Deleted ${count} stock records successfully.`, "success");
      await fetchStocks();
      setShowDeleteModal(false);
      setDeleteMode(null);
    } catch (error) {
      console.error(error);
      showToast("Unable to delete selected stock records.", "error");
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
  const handleBulkUpload = async (file, onProgress) => {
    try {
      const response = await bulkUploadStocks(file, onProgress);

      await fetchStocks();

      showToast(
        "Bulk upload completed successfully.",
        "success"
      );

      return response.data;
    } catch (error) {
      console.error(error);

      showToast(
        "Bulk upload failed.",
        "error"
      );

      throw error;
    }
  };
  //color mapping
  const getClosestColor = (colorName = "") => {
    const name = colorName.toLowerCase().trim();

    // BLUE
    if (name.includes("blue")) {
      if (name.includes("pearl") && name.includes("shallow")) {
        return "#6B8FB5";
      }

      if (name.includes("pearl")) {
        return "#4F7198";
      }

      if (name.includes("athletic")) {
        return "#315D91";
      }

      if (name.includes("decent")) {
        return "#3F6F98";
      }

      if (name.includes("marvel")) {
        return "#315F91";
      }

      if (name.includes("metal") || name.includes("metall")) {
        return "#35658F";
      }

      if (name.includes("deep") || name.includes("dark")) {
        return "#1E3A8A";
      }

      return "#2563EB";
    }

    // BLACK
    if (name.includes("black")) {
      if (name.includes("yellow")) {
        return "#252525";
      }

      if (name.includes("metal") || name.includes("metall")) {
        return "#30343B";
      }

      return "#171717";
    }

    // GRAY / GREY
    if (name.includes("gray") || name.includes("grey")) {
      if (name.includes("metal") || name.includes("metall")) {
        return "#737980";
      }

      return "#6B7280";
    }

    // GROUND / DEEP GROUND
    if (name.includes("ground")) {
      if (name.includes("pearl") || name.includes("deep")) {
        return "#4B4F52";
      }

      return "#62666A";
    }

    // WHITE
    if (name.includes("white")) {
      if (name.includes("pearl") && name.includes("misty")) {
        return "#E9E8E3";
      }

      if (name.includes("pearl")) {
        return "#F2F2EE";
      }

      return "#FFFFFF";
    }

    // RED
    if (name.includes("red")) {
      if (name.includes("sangria")) {
        return "#7F2630";
      }

      if (name.includes("imperial")) {
        return "#9E3030";
      }

      if (name.includes("rebel")) {
        return "#A52A2A";
      }

      if (name.includes("metal") || name.includes("metall")) {
        return "#9E3030";
      }

      return "#C62828";
    }

    // YELLOW
    if (name.includes("yellow")) {
      return "#D4A72C";
    }

    // PINK
    if (name.includes("pink")) {
      return "#D9468A";
    }

    // GREEN
    if (name.includes("green")) {
      return "#3F7D55";
    }

    // ORANGE
    if (name.includes("orange")) {
      return "#D97732";
    }

    // DEFAULT
    return null;
  };

  //search items     
  const getSearchableFields = (item) => [
    item.Frame,
    item["Engine No/Motor No"],
    item["Product Name"],
    item["Model Variant"],
    item.Color,
    item.Location,
  ];

const matchesSearch = (item, search) => {
  const normalize = (value = "") =>
    String(value)
      .toLowerCase()
      .replace(/\s+/g, "");

  const query = normalize(search);
  if (!query) return true;
  const searchableText = getSearchableFields(item)
    .map((field) => normalize(field))
    .join("");
  return searchableText.includes(query);
};

 // --- Fetch Stocks API ---
const fetchStocks = async () => {
  const requestId = ++searchRequestIdRef.current;
  const searchQuery = debouncedSearch.trim();
  const isSearchRequest = searchQuery.length > 0;

  try {
    if (isSearchRequest) {
      setSearchLoading(true);
    } else if (inventory.length === 0) {
      setLoading(true);
    } else {
      setPaginationLoading(true);
    }

    let finalStocks = [];
    let finalTotal = 0;
    let firstData = null;

    // =========================================================
    // SEARCH MODE
    // =========================================================
    // =========================================================
// SEARCH MODE
// =========================================================
if (isSearchRequest) {
 const response = await getStocks(
  "all",
  searchQuery,
  currentPage,
  selectedRows
);

if (requestId !== searchRequestIdRef.current) {
  return;
}

const data = response?.data || {};

  firstData = data;

  finalStocks = (data.stocks || []).filter(
    (item) =>
      String(item?.Location || "").toLowerCase() !==
      "delivered"
  );

  finalTotal =
    data.filtered_total ??
    data.total_remaining ??
    finalStocks.length;
}
    else {
      // =========================================================
      // NORMAL MODE
      // Backend pagination remains unchanged
      // =========================================================
      const response = await getStocks(
        "all",
        "",
        currentPage,
        selectedRows
      );

      const data = response?.data || {};

      firstData = data;

      finalStocks = (data?.stocks || []).filter(
        (item) =>
          String(item?.Location || "").toLowerCase() !==
          "delivered"
      );

      finalTotal =
        data?.filtered_total ??
        data?.total_remaining ??
        0;
    }

    // ===========================================================
    // TOTAL
    // ===========================================================
    setTotalItems(finalTotal);

    // ===========================================================
    // WAREHOUSE SUMMARY
    // ===========================================================
    const totalRemaining =
      Number(firstData?.total_remaining) || 0;

    setWarehouseClusters(
      (firstData?.by_location || []).map((item) => ({
        name: item.location,
        units: Number(item.count) || 0,
        percentage:
          totalRemaining > 0
            ? Number(
                (
                  ((Number(item.count) || 0) /
                    totalRemaining) *
                  100
                ).toFixed(1)
              )
            : 0,
      }))
    );

    // ===========================================================
    // INVENTORY MAPPING
    // ===========================================================
    const mappedStocks = finalStocks.map((item) => ({
      id: item.id,
      frameNo: item.Frame,
      engineNo: item["Engine No/Motor No"],
      modelName: item["Model Name"],
      modelVariant: item["Model Variant"],
      productName: item["Product Name"],
      colorName: item.Color,
      location: item.Location,
      mfgDate: item["Manufacturing Date"],
      transferDate:
        item["Stock Trasnfer Date"] || "",
    }));

    setInventory(mappedStocks);

  } catch (error) {
    console.error(
      "Failed to fetch inventory:",
      error
    );

    setInventory([]);
    setTotalItems(0);

    showToast(
      "Failed to fetch inventory.",
      "error"
    );

  } finally {
    setLoading(false);
    setSearchLoading(false);
    setPaginationLoading(false);
  }
};
  
 useEffect(() => {
  const searchChanged =
    previousSearchRef.current !== debouncedSearch;

  previousSearchRef.current = debouncedSearch;

  // Whenever a new search starts, always go to page 1 first.
  if (searchChanged && currentPage !== 1) {
    setCurrentPage(1);
    return;
  }

  fetchStocks();

  if (location.state?.showLoader) {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 2200);

    return () => clearTimeout(timer);
  }
}, [
  currentPage,
  selectedRows,
  debouncedSearch,
]);
  // Reset pagination to page 1 whenever the visible row count changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRows, debouncedSearch]);

  const filteredInventory = inventory;

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
      {((loading && !searchLoading) || showLoader) && (
        <LeelamayiLoader
          loading={loading || showLoader}
          message="Loading Inventory"
        />
      )}
      {/* ================= Toast Notification ================= */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : toast.type === "loading"
                  ? "bg-white border-slate-200 text-slate-700"
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
            {toast.type === "loading" && (
              <Loader2 className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
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
        className={`p-8 space-y-8 bg-[#F8FAFC] min-h-full transition-all duration-500 ${loading || showLoader ? "blur-sm pointer-events-none" : ""
          }`}
      >
        {/* ================= Top Bar ================= */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${searchLoading
                ? "text-slate-300"
                : "text-slate-400"
                }`}
            />

            <input
              type="text"
              placeholder="Search by Frame, Engine, Product, Model, Color, or Location..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-2xs transition-all"
            />

            {searchLoading && (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
            )}

            {!searchLoading && searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
                Stock Locations
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
                    className={`w-8 h-8 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center justify-center transition-colors ${cardStartIndex === 0
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
                    className={`w-8 h-8 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center justify-center transition-colors ${cardStartIndex + 4 >= warehouseClusters.length
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
                  className={`w-4 h-4 transition-transform ${viewAllRegions ? "rotate-180" : ""
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

                  <div className="w-9 h-9 rounded-lg border border-blue-200 bg-blue-50 flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-blue-600" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-end text-[11px] font-semibold text-slate-600 mb-1.5">
                    {cluster.percentage}%
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4F7FF7] h-full rounded-full transition-all duration-500"
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
              {/*pdf export*/}
              <div className="flex items-center gap-3">
                <ExportPDF
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={selectedRows}

                  onExportStart={() =>
                    showToast(
                      "Preparing inventory PDF...",
                      "loading"
                    )
                  }

                  onExportSuccess={() =>
                    showToast(
                      "Inventory PDF downloaded successfully.",
                      "success"
                    )
                  }

                  onExportError={() =>
                    showToast(
                      "Failed to generate inventory PDF.",
                      "error"
                    )
                  }

                  fetchPage={async (page, limit) => {
                    return await getStocks(
                      "all",
                      "",
                      page,
                      limit
                    );
                  }}
                  mapData={(stocks = []) =>
                    stocks.map((item) => ({
                      frameNo: item.Frame,
                      engineNo: item["Engine No/Motor No"],
                      productName: item["Product Name"],
                      modelVariant: item["Model Variant"],
                      color: item.Color,
                      location: item.Location,
                      mfgDate: item["Manufacturing Date"],
                      transferDate:
                        item["Stock Trasnfer Date"] || "",
                    }))
                  }

                  filterData={(data) =>
                    data.filter(
                      (item) =>
                        item.location !== "Delivered"
                    )
                  }

                  columns={[
                    {
                      header: "Frame No",
                      value: "frameNo",
                      width: 30,
                    },
                    {
                      header: "Engine No",
                      value: "engineNo",
                      width: 30,
                    },
                    {
                      header: "Actions",
                      value: () => "",
                      width: 20,
                      align: "center",
                    },
                    {
                      header: "Product Name",
                      value: "productName",
                      width: 32,
                    },
                    {
                      header: "Model Variant",
                      value: "modelVariant",
                      width: 32,
                    },
                    {
                      header: "Color",
                      value: "color",
                      width: 27,
                    },
                    {
                      header: "Location",
                      value: "location",
                      width: 30,
                    },
                    {
                      header: "MFG Date",
                      value: "mfgDate",
                      width: 25,
                      align: "center",
                    },
                    {
                      header: "Transfer Date",
                      value: "transferDate",
                      width: 25,
                      align: "center",
                    },
                  ]}
                  title="Inventory Report"
                  fileName="LeelaHonda_Inventory_Report.pdf"
                />
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
            <div className="relative overflow-hidden">
              <div
                className={`transition-opacity duration-200 ${paginationLoading ? "opacity-60" : "opacity-100"
                  }`}
              >
                <table className="w-full table-fixed text-left border-collapse">

                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                      <th className="py-3  px-4 w-[4%]">
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
                      <th className="py-3.5 px-3 w-[11%] whitespace-nowrap">
                        Frame No
                      </th>

                      <th className="py-3.5 px-3 w-[10%] whitespace-nowrap">
                        Engine No
                      </th>

                      <th className="py-3.5 px-3 w-[7%] text-center whitespace-nowrap">
                        Actions
                      </th>

                      <th className="py-3.5 px-3 w-[14%] whitespace-nowrap">
                        Product Name
                      </th>

                      <th className="py-3.5 px-3 w-[14%] whitespace-nowrap">
                        Model Variant
                      </th>

                      <th className="py-3.5 px-3 w-[13%] whitespace-nowrap">
                        Color
                      </th>

                      <th className="py-3.5 px-7 w-[16%] whitespace-nowrap">
                        Location
                      </th>

                      <th className="py-3.5 px-2 w-[9%] text-center whitespace-nowrap">
                        MFG Date
                      </th>

                      <th className="py-3.5 px-2.9 w-[9%] text-center whitespace-nowrap">
                        Transfer Date
                      </th>
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
                            className={`transition-colors duration-150 ${isSelected
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
                            <td className="py-3 px-4 font-semibold text-slate-800 font-mono text-[11px]">
                              {item.frameNo}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 font-mono text-[11px]">
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
                            <td className="py-3 px-4 text-[11px] font-semibold text-slate-800 leading-tight">
                              {item.productName || "-"}
                            </td>

                            <td className="py-3 px-4 text-[11px] font-medium text-slate-700 leading-tight">
                              {item.modelVariant || "-"}
                            </td>
                            <td className="py-3 px-4 text-[11px] font-medium text-slate-700 min-w-[170px]">
                              {item.colorName ? (
                                <div className="flex items-center gap-2">
                                  {getClosestColor(item.colorName) && (
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 border border-slate-300 shadow-sm mt-0.5"
                                      style={{
                                        backgroundColor: getClosestColor(item.colorName),
                                      }}
                                    />
                                  )}

                                  <span className="leading-tight whitespace-normal">
                                    {item.colorName}
                                  </span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* Inline Editable Location Cell */}
                            <td className="py-2.5 px-4 text-slate-700 select-none align-middle">
                              <div className="relative w-full">
                                {editingLocationId === item.id ? (
                                  <div
                                    className="relative"
                                    tabIndex={-1}
                                    onBlur={(e) => {
                                      if (
                                        !e.currentTarget.contains(e.relatedTarget) &&
                                        !savingLocation
                                      ) {
                                        setLocationDropdownOpen(false);
                                        handleCancelEditLocation();
                                      }
                                    }}
                                  >

                                    <div className="flex items-center gap-1">

                                      <div className="relative flex-1">

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setLocationDropdownOpen((prev) => !prev)
                                          }
                                          disabled={savingLocation}
                                          className="w-full h-9 flex items-center justify-between gap-2 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all disabled:opacity-50"
                                        >
                                          <span className="truncate">
                                            {editingLocation || "Select Location"}
                                          </span>

                                          <ChevronDown
                                            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${locationDropdownOpen ? "rotate-180" : ""
                                              }`}
                                          />
                                        </button>

                                        {locationDropdownOpen && (
                                          <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-50 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 p-1.5">                                          {warehouseClusters.map((cluster, i) => (
                                            <button
                                              key={i}
                                              type="button"
                                              onClick={() => {
                                                setEditingLocation(cluster.name);
                                                setLocationDropdownOpen(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${editingLocation === cluster.name
                                                ? "bg-slate-100 text-slate-900"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                            >
                                              <span className="truncate">
                                                {cluster.name}
                                              </span>

                                              {editingLocation === cluster.name && (
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              )}
                                            </button>
                                          ))}

                                            <div className="my-1 border-t border-slate-100" />

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingLocation("Delivered");
                                                setLocationDropdownOpen(false);
                                              }}
                                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${editingLocation === "Delivered"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                }`}
                                            >
                                              <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Delivered
                                              </span>

                                              {editingLocation === "Delivered" && (
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                              )}
                                            </button>

                                          </div>
                                        )}

                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleLocationSave(
                                            item.id,
                                            editingLocation
                                          )
                                        }
                                        disabled={savingLocation}
                                        title="Save Location"
                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer"
                                      >
                                        {savingLocation ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLocationDropdownOpen(false);
                                          handleCancelEditLocation();
                                        }}
                                        disabled={savingLocation}
                                        title="Cancel"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>

                                    </div>

                                  </div>

                                ) : recentlySavedLocationId === item.id ? (

                                  <div className="flex items-center justify-between h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 w-full">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <div className="min-w-0">
                                        <span className="block text-xs font-bold truncate">
                                          {item.location || "Unassigned"}
                                        </span>

                                      </div>
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
                                    className={`group flex items-center justify-between gap-2 h-8 px-3 rounded-lg border border-slate-200/80 bg-slate-50/70 text-slate-700 w-full transition-all ${editingLocationId !== null &&
                                      editingLocationId !== item.id
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-slate-100/80 hover:border-slate-300 hover:shadow-2xs cursor-pointer"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                                      <div className="min-w-0">
                                        <span className="block text-xs font-bold text-slate-800 truncate">
                                          {item.location || "Unassigned"}
                                        </span>

                                      </div>
                                    </div>

                                    <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-all shrink-0" />
                                  </button>

                                )}

                              </div>
                            </td>

                            <td className="py-3 px-2 text-slate-500 font-medium text-[10px] whitespace-nowrap text-center">
                              {item.mfgDate || "-"}
                            </td>

                            <td className="py-3 px-2 text-slate-500 font-medium text-[10px] whitespace-nowrap text-center">
                              {item.transferDate || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {paginationLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                  <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-slate-200">
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span className="text-xs font-semibold text-emerald-700">
                      Loading page...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ================= Table Pagination ================= */}
            {/* ================= Table Pagination ================= */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs font-medium text-slate-600">

              {/* Showing Count */}
              <div className="whitespace-nowrap">
                Showing {totalItems === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + filteredInventory.length, totalItems)} of{" "}
                {totalItems} entries
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-1 whitespace-nowrap">

                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors ${currentPage === 1
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-50 cursor-pointer"
                    }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {(() => {
                  const pages = [];

                  // Always show first page
                  pages.push(1);

                  // Left ellipsis
                  if (currentPage > 4) {
                    pages.push("left-ellipsis");
                  }

                  // Pages around current page
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);

                  for (let page = start; page <= end; page++) {
                    if (!pages.includes(page)) {
                      pages.push(page);
                    }
                  }

                  // Right ellipsis
                  if (currentPage < totalPages - 3) {
                    pages.push("right-ellipsis");
                  }

                  // Always show last page
                  if (totalPages > 1 && !pages.includes(totalPages)) {
                    pages.push(totalPages);
                  }

                  return pages.map((page, index) => {
                    if (typeof page === "string") {
                      return (
                        <span
                          key={`${page}-${index}`}
                          className="px-2 py-1.5 text-slate-400"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${currentPage === page
                          ? "bg-[#0F172A] text-white border-[#0F172A]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(prev + 1, totalPages)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors ${currentPage === totalPages
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
                  Delete Selected Stocks
                </h2>
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete the selected stock records? This action cannot be undone.
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
      </div>
    </>
  );
};
export default Inventory;