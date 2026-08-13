import React, { useState, useEffect } from 'react';
import { getDelivered } from "../api/delivered";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import LeelamayiLoader from "../components/LeelamayiLoader";
import ExportPDF from "../components/ExportPDF";


export default function DeliveredStocksList() {
  // Filters State
  const [filters, setFilters] = useState({
    search: ''
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [stocks, setStocks] = useState([]);

  const [totalDelivered, setTotalDelivered] = useState(0);
  const [todayDelivered, setTodayDelivered] = useState(0);
  const [monthDelivered, setMonthDelivered] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);

  // Loading State
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);
  useEffect(() => {
    setCurrentPage(1);

    if (!debouncedSearch.trim()) {
      setSearchLoading(false);
    }
  }, [debouncedSearch]);
  // delviers api 
  const fetchDelivered = async () => {
    const searchQuery = debouncedSearch.trim();

    try {
      if (!hasLoadedOnce) {
        setLoading(true);
      } else if (searchQuery) {
        setSearchLoading(true);
      } else {
        setPaginationLoading(true);
        setLoading(false);
      }

      const response = await getDelivered(
        currentPage,
        rowsPerPage,
        null,
        null,
        null,
        searchQuery
      );
      let data = response.data;

      if (searchQuery && (!data.items || data.items.length === 0)) {
        const fallbackResponse = await getDelivered(
          1,
          1000,
          null,
          null,
          null,
          ""
        );
        const fallbackData = fallbackResponse.data;

        const fallbackItems = fallbackData.items || [];

        const normalizedQuery = normalizeSearchValue(searchQuery)
          .replace(/\s+/g, "");

        const filteredItems = fallbackItems.filter((item) => {
          const searchableText = [
            item.Frame,
            item["Engine No/Motor No"],
            item["Product Name"],
            item["Model Variant"],
            item["Model Name"],
            item.Color,
            item.Location,
          ]
            .filter(Boolean)
            .map((value) =>
              normalizeSearchValue(value)
            )
            .join(" ")
            .replace(/\s+/g, "");

          return searchableText.includes(normalizedQuery);
        });

        data = {
          ...fallbackData,
          items: filteredItems,
          filtered_total: filteredItems.length,
        };
      }

      setTotalDelivered(data.total_delivered);
      setTodayDelivered(data.today_delivered);
      setMonthDelivered(data.month_delivered);
      setFilteredTotal(data.filtered_total);

      const list = data.items.map((item) => ({
        id: item.id,
        frameNo: item.Frame,
        engineNo: item["Engine No/Motor No"],
        variant: item["Model Variant"],
        product: item["Product Name"],
        model: item["Model Name"],
        colourName: item.Color,
        mfgDate: item["Manufacturing Date"],
        location: item.Location,
        deliveredDateTime: item["Delivered DateTime"],
      }));

      setStocks(list);
      setHasLoadedOnce(true);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setPaginationLoading(false);
    }
  };
  useEffect(() => {
    fetchDelivered();
  }, [currentPage, rowsPerPage, debouncedSearch]);
  // color mapping - same as Inventory
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

    return null;
  };

  //help words 
  const normalizeSearchValue = (value = "") =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getSearchableFields = (item) => [
    item.frameNo,
    item.engineNo,
    item.product,
    item.variant,
    item.colourName,
    item.location,
  ];

  const matchesSearch = (item, search) => {
    const query = normalizeSearchValue(search);

    if (!query) return true;

    const searchableText = getSearchableFields(item)
      .map((field) => normalizeSearchValue(field))
      .join(" ");

    const normalizedQuery = query.replace(/\s+/g, "");

    const normalizedText = searchableText.replace(/\s+/g, "");

    return normalizedText.includes(normalizedQuery);
  };
  // Filtered Logic for Dynamic Rendering
  const filteredStocks = stocks;

  const totalPages = Math.ceil(filteredTotal / rowsPerPage);

  // Date Formatter Helper
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) {
      return { date: "-", time: "" };
    }

    const dateObj = new Date(dateTimeStr);

    if (isNaN(dateObj.getTime())) {
      return { date: dateTimeStr, time: "" };
    }

    const date = dateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const time = dateObj.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return { date, time };
  };

  // Status Round Badge Helper
  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'in transit':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
      case 'failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Delivered PDF configuration
  const deliveredPDFColumns = [
    { header: "Frame No", value: "frameNo", width: 34 },
    { header: "Engine No", value: "engineNo", width: 34 },
    { header: "Product Name", value: "product", width: 38 },
    { header: "Model Variant", value: "variant", width: 42 },
    { header: "Color", value: "colourName", width: 32 },
    { header: "Location", value: "location", width: 30 },
    { header: "MFG Date", value: "mfgDate", width: 30 },
    {
      header: "Transfer Date",
      value: (item) => {
        const { date, time } = formatDateTime(item.deliveredDateTime);
        return time ? `${date}\n${time}` : date;
      },
      width: 38,
    },
  ];

  const fetchDeliveredPDFPage = async (page, pageSize) => {
    const response = await getDelivered(
      page,
      pageSize,
      null,
      null,
      null,
      debouncedSearch.trim()
    );

    return {
      ...response,
      data: {
        ...response.data,
        stocks: response.data?.items || [],
      },
    };
  };

  const mapDeliveredPDFData = (items = []) =>
    items.map((item) => ({
      id: item.id,
      frameNo: item.Frame,
      engineNo: item["Engine No/Motor No"],
      product: item["Product Name"],
      variant: item["Model Variant"],
      colourName: item.Color,
      location: item.Location,
      mfgDate: item["Manufacturing Date"],
      deliveredDateTime: item["Delivered DateTime"],
    }));

  if (loading && !hasLoadedOnce) {
    return (
      <LeelamayiLoader
        loading={loading}
        message="Loading Delivered Stocks"
      />
    );
  }

  return (
    <>
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-white border-slate-200 text-slate-700"
              }`}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}

            {toast.type === "error" && (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}

            {toast.type === "loading" && (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            )}

            <span>{toast.message}</span>

            <button
              onClick={() =>
                setToast({
                  show: false,
                  message: "",
                  type: "success",
                })
              }
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-3 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* TOP HEADER - COMPACT SINGLE-LINE ORIENTED */}
          <header className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                Delivered Stocks
              </h1>
              <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                Manage and monitor all successfully delivered vehicles.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto w-full md:w-auto">

              {/* Search */}
              <div className="relative w-full md:w-[300px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  placeholder="Search Frame No / Engine / Model..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-800"
                />
                {searchLoading && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
                )}
              </div>

              {/* Export PDF */}
              <ExportPDF
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={rowsPerPage}
                fetchPage={fetchDeliveredPDFPage}
                mapData={mapDeliveredPDFData}
                columns={deliveredPDFColumns}
                title="Delivered Stocks Report"
                fileName="LeelaHonda_Delivered_Stocks_Report.pdf"
                onExportStart={() => {
                  setToast({
                    show: true,
                    message: "Preparing delivered stocks PDF...",
                    type: "loading",
                  });
                }}
                onExportSuccess={() => {
                  setToast({
                    show: true,
                    message: "Delivered stocks PDF downloaded successfully.",
                    type: "success",
                  });
                }}
                onExportError={() => {
                  setToast({
                    show: true,
                    message: "Failed to generate delivered stocks PDF.",
                    type: "error",
                  });
                }}
              />

            </div>
          </header>

          {/* STATISTICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Delivered
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalDelivered}</h3>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5 whitespace-nowrap">
                  Total Delivered Vehicles
                </p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Delivered Today
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{todayDelivered}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                  Today's Delivered Vehicles
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  This Month
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{monthDelivered}</h3>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5 whitespace-nowrap">
                  On target
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Total Records
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {filteredTotal}
                </h3>
                <p className="text-[11px] text-blue-600 font-medium mt-0.5 whitespace-nowrap">
                  Available Records
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
          {/* SINGLE-LINE TABLE WITH COMPACT HEADERS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="relative overflow-hidden">

              <div
                className={`transition-all duration-200 ${paginationLoading || searchLoading
                    ? "opacity-50 blur-[1px]"
                    : "opacity-100 blur-0"
                  }`}
              >
                <table className="w-full table-fixed text-left border-collapse">

                  {/* Header */}
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="w-[13%] py-2.5 px-3 text-left whitespace-nowrap">
                        Frame No
                      </th>

                      <th className="w-[13%] py-2.5 px-3 text-left whitespace-nowrap">
                        Engine No
                      </th>

                      <th className="w-[14%] py-2.5 px-3 text-left whitespace-nowrap">
                        Product Name
                      </th>

                      <th className="w-[16%] py-2.5 px-3 text-left whitespace-nowrap">
                        Model Variant
                      </th>

                      <th className="w-[11%] py-2.5 px-3 text-left whitespace-nowrap">
                        Color
                      </th>

                      <th className="w-[10%] py-2.5 px-3 text-left whitespace-nowrap">
                        Location
                      </th>

                      <th className="w-[9%] py-2.5 px-3 text-left whitespace-nowrap">
                        MFG Date
                      </th>

                      <th className="w-[11%] py-2.5 px-3 text-left whitespace-nowrap">
                        Transfer Date
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredStocks.length > 0 ? (
                      filteredStocks.map((item) => {

                        const { date, time } = formatDateTime(item.deliveredDateTime);
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/80 transition-colors duration-150"
                          >
                            {/* Frame No */}
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 truncate">
                              {item.frameNo || "-"}
                            </td>

                            {/* Engine No */}
                            <td className="py-2.5 px-3 font-mono text-slate-500 truncate">
                              {item.engineNo || "-"}
                            </td>

                            {/* Product Name */}
                            <td className="py-2.5 px-3 font-semibold text-slate-900 truncate">
                              {item.product || "-"}
                            </td>

                            {/* Model Variant */}
                            <td className="py-2.5 px-3 text-slate-600 font-medium uppercase truncate">
                              {item.variant || "-"}
                            </td>


                            {/* Color */}
                            <td className="py-2.5 px-3 text-[11px] font-medium text-slate-700">
                              {item.colourName ? (
                                <div className="flex items-center gap-2">
                                  {getClosestColor(item.colourName) && (
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 border border-slate-300 shadow-sm"
                                      style={{
                                        backgroundColor: getClosestColor(item.colourName),
                                      }}
                                    />
                                  )}

                                  <span className="leading-tight whitespace-normal break-words">
                                    {item.colourName}
                                  </span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* Location */}
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                {item.location || "-"}
                              </span>
                            </td>

                            {/* MFG Date */}
                            <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                              {item.mfgDate || "-"}
                            </td>


                            {/* Transfer Date */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-medium text-slate-900 leading-tight">
                                {date}
                              </div>

                              <div className="text-[10px] text-slate-400 leading-tight">
                                {time}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9" className="py-6 text-center text-slate-400 text-xs whitespace-nowrap">
                          No delivered stock records found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {(paginationLoading || searchLoading) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20">
                  <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-slate-200">
                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />

                    <span className="text-xs font-semibold text-emerald-700">
                      {searchLoading ? "Loading delivered stocks..." : "Loading page..."}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* PAGINATION FOOTER */}
            <div className="bg-white px-3 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="whitespace-nowrap">
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {filteredTotal === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(currentPage * rowsPerPage, filteredTotal)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {filteredTotal}
                </span>{" "}
                entries
              </div>

              <div className="flex items-center space-x-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-1 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${currentPage === i + 1
                      ? "bg-slate-900 text-white border border-slate-900"
                      : "bg-white text-slate-700 border border-slate-300"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-1 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}