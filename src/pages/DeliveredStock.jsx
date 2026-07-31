import React, { useState, useEffect } from 'react';
import { getDelivered } from "../api/delivered";
import {
  Download,
  Filter,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LeelamayiLoader from "../components/LeelamayiLoader";

export default function DeliveredStocksList() {
  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    variant: '',
    model: ''
  });

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [stocks, setStocks] = useState([]);

  const [totalDelivered, setTotalDelivered] = useState(0);
  const [todayDelivered, setTodayDelivered] = useState(0);
  const [monthDelivered, setMonthDelivered] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);

  const [loading, setLoading] = useState(false);

  // Filter Reset
  const handleResetFilters = () => {
    setFilters({
      search: '',
      variant: '',
      model: ''
    });
  };

  // delviers api 
  const fetchDelivered = async () => {
    try {
      setLoading(true);

      const response = await getDelivered(
        currentPage,
        rowsPerPage
      );
      const data = response.data;

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
        colourHex: item.Color,
        mfgDate: item["Manufacturing Date"],
        location: item.Location,
        deliveredDateTime: item["Delivered DateTime"],
        status: "Delivered",
      }));

      setStocks(list);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDelivered();
  }, [currentPage, rowsPerPage]);

  // Dynamic filter dropdown options
  const variants = [...new Set(stocks.map(item => item.variant).filter(Boolean))];
  const models = [...new Set(stocks.map(item => item.model).filter(Boolean))];

  // Filtered Logic for Dynamic Rendering
  const filteredStocks = stocks.filter((stock) => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch =
      !filters.search ||
      (stock.frameNo && stock.frameNo.toLowerCase().includes(searchLower)) ||
      (stock.engineNo && stock.engineNo.toLowerCase().includes(searchLower)) ||
      (stock.product && stock.product.toLowerCase().includes(searchLower)) ||
      (stock.model && stock.model.toLowerCase().includes(searchLower));

    const matchesVariant = !filters.variant || stock.variant === filters.variant;
    const matchesModel = !filters.model || stock.model === filters.model;

    return matchesSearch && matchesVariant && matchesModel;
  });

  const totalPages = Math.ceil(filteredTotal / rowsPerPage);

  // Date Formatter Helper
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: '-', time: '' };
    const dateObj = new Date(dateTimeStr.replace(' ', 'T'));
    if (isNaN(dateObj.getTime())) {
      const parts = dateTimeStr.split(' ');
      return { date: parts[0] || '-', time: parts[1] || '' };
    }
    const date = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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

  // Export Bulk Table Data PDF Header Button Logic
  const handleExportAllPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("AUTOMOBILE ERP - DELIVERED STOCKS SUMMARY REPORT", 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Exported On: ${new Date().toLocaleString()} | Total Records: ${filteredStocks.length}`, 14, 24);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 28, 283, 28);

    const tableHeaders = [
      ["Frame", "Engine No/Motor No", "Model Variant", "Product Name", "Model Name", "Color", "Manufacturing Date", "Status", "Delivered Datetime"]
    ];

    const tableRows = filteredStocks.map(item => [
      item.frameNo,
      item.engineNo,
      item.variant,
      item.product,
      item.model,
      item.colourName,
      item.mfgDate,
      item.status,
      item.deliveredDateTime
    ]);

    autoTable(doc, {
      startY: 32,
      head: tableHeaders,
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      }
    });

    doc.save(`Delivered_Stocks_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <LeelamayiLoader
        loading={loading}
        message="Loading Delivered Stocks"
      />
    );
  }

  return (
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

          <div className="flex items-center space-x-2 self-start md:self-auto whitespace-nowrap">
            <button
              onClick={handleExportAllPDF}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Export PDF</span>
            </button>
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

        {/* SEARCH & FILTERS SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[320px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Frame No / Engine / Model..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-800"
              />
            </div>


            {/* Model Variant Filter */}
            <div className="w-64 shrink-0">
              <select
                value={filters.variant}
                onChange={(e) => setFilters({ ...filters, variant: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-700"
              >
                <option value="">All Model Variants</option>
                {variants.map((variant) => (
                  <option key={variant} value={variant}>
                    {variant}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Filter */}
            <div>
              <select
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white text-slate-700"
              >
                <option value="">All Models</option>
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            <div className="flex items-center">
              <button
                onClick={handleResetFilters}
                className="w-full inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

          </div>
        </div>

        {/* SINGLE-LINE TABLE WITH COMPACT HEADERS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">

              {/* Header */}
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 whitespace-nowrap">Frame</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Engine No/Motor No</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Model Variant</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Product Name</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Model Name</th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Color</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Manufacturing Date</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Delivered Datetime</th>
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
                        {/* Frame */}
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {item.frameNo}
                        </td>

                        {/* Engine No/Motor No */}
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {item.engineNo}
                        </td>

                        {/* Model Variant */}
                        <td className="py-2.5 px-3 text-slate-600 font-medium uppercase whitespace-nowrap">
                          {item.variant}
                        </td>

                        {/* Product Name */}
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {item.product}
                        </td>

                        {/* Model Name */}
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {item.model}
                        </td>

                        {/* Color */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            <span
                              className="w-3 h-3 rounded-full border border-slate-300 shadow-xs inline-block"
                              style={{ backgroundColor: item.colourHex }}
                            />
                            <span className="text-[11px] text-slate-600 font-medium">{item.colourName}</span>
                          </div>
                        </td>

                        {/* Manufacturing Date */}
                        <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                          {item.mfgDate}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Delivered Datetime */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900 leading-tight">{date}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{time}</div>
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
  );
}