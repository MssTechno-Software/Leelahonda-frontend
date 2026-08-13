import React, { useState } from "react";
import {
  Download,
  ChevronDown,
  Loader2,
} from "lucide-react";

import { generatePDF } from "../utils/pdfExport";
import logo from "../assets/logo.png";

const ExportPDF = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  fetchPage,
  mapData,
  columns,
  filterData = (data) => data,
  title = "Inventory Report",
  fileName = "LeelaHonda_Inventory_Report.pdf",

  // Toast callbacks
  onExportStart,
  onExportSuccess,
  onExportError,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadPage = async (page) => {
    const response = await fetchPage(page, pageSize);

    const stocks =
      response?.data?.stocks ||
      response?.stocks ||
      [];

    return mapData(stocks);
  };

  const handleExport = async (type) => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      setShowOptions(false);

      // Show toast in Inventory.jsx
      onExportStart?.();

      let exportData = [];

      // --------------------------------
      // CURRENT PAGE
      // --------------------------------
      if (type === "current") {
        exportData = await loadPage(currentPage);
      }

      // --------------------------------
      // ALL PAGES
      // --------------------------------
      else if (type === "all") {
        for (let page = 1; page <= totalPages; page += 1) {
          const pageData = await loadPage(page);

          exportData = [
            ...exportData,
            ...pageData,
          ];
        }
      }

      // --------------------------------
      // SPECIFIC PAGE
      // --------------------------------
      else if (type.startsWith("page-")) {
        const selectedPage = Number(
          type.replace("page-", "")
        );

        exportData = await loadPage(selectedPage);
      }

      // --------------------------------
      // FILTER DATA
      // --------------------------------
      exportData = filterData(exportData);

      // --------------------------------
      // GENERATE PDF
      // --------------------------------
      generatePDF({
        data: exportData,
        columns,
        logo,
        title,
        fileName,
      });

      // Show success toast
      onExportSuccess?.();

    } catch (error) {
      console.error("PDF export failed:", error);

      // Show error toast
      onExportError?.();

    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">

      {/* ================================
          EXPORT PDF BUTTON
      ================================= */}
      <button
        type="button"
        onClick={() =>
          setShowOptions((prev) => !prev)
        }
        disabled={isExporting}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs uppercase tracking-wider cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 text-slate-500" />
        )}

        {isExporting
          ? "Preparing..."
          : "Export PDF"}

        {!isExporting && (
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${
              showOptions
                ? "rotate-180"
                : ""
            }`}
          />
        )}
      </button>

      {/* ================================
          EXPORT OPTIONS
      ================================= */}
      {showOptions && !isExporting && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 p-1.5">

          {/* CURRENT PAGE */}
          <button
            type="button"
            onClick={() =>
              handleExport("current")
            }
            className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Current Page
          </button>

          {/* ALL PAGES */}
          <button
            type="button"
            onClick={() =>
              handleExport("all")
            }
            className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            All Pages
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* PAGE TITLE */}
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Page
          </div>

          {/* PAGE LIST */}
          <div className="max-h-52 overflow-y-auto">
            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() =>
                  handleExport(`page-${page}`)
                }
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  page === currentPage
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Page {page}

                {page === currentPage && (
                  <span className="ml-2 text-[9px] text-slate-400">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportPDF;