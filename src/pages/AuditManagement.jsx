import React, { useState, useMemo, useEffect } from "react";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiShield
} from 'react-icons/fi';
import { getAuditLogs } from "../api/audit";
import LeelamayiLoader from "../components/LeelamayiLoader";

// Sample Audit Detail Log Records

export default function AuditManagement() {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);

// Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, rowsPerPage]);
  //api 
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      const response = await getAuditLogs(currentPage, rowsPerPage);

      const data = response.data.map((item, index) => ({
        id: (currentPage - 1) * rowsPerPage + index + 1,
        action: item.action,
        frameNumber: item.frame || "N/A",
        details: item.details || "N/A",
        username: item.username,
        doneBy: item.done_by,
        updatedDate: new Date(item.at).toLocaleString(),
      }));

      setAuditData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

 

  // Pagination Calculations
  const paginatedData = auditData;

  // Color Mapping Helper for Status Text
  const renderColoredStatus = (status) => {
    let textClass = "font-semibold ";
    switch (status.toLowerCase()) {
      case "validated":
      case "passed":
        textClass += "text-emerald-600";
        break;
      case "delivered":
        textClass += "text-red-600";
        break;
      case "pending":
        textClass += "text-amber-500";
        break;
      case "scanned":
        textClass += "text-blue-600";
        break;
      default:
        textClass += "text-slate-700";
    }
    return <span className={textClass}>{status}</span>;
  };

  return (
    <>
      {loading && (
        <LeelamayiLoader
          loading={loading}
          message="Loading Audit Logs"

        />
      )}

      <div
        className={`w-full h-full min-h-full p-6 text-slate-800 font-sans transition-all duration-500 ${loading ? "blur-sm pointer-events-none" : ""
          }`}
      >
        {/* Top Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0B1E48] transition mb-1.5"
            >
              <FiArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="text-2xl font-bold text-[#0B1E48] tracking-tight uppercase">
              AUDIT DETAIL
            </h1>
          </div>

          {/* Top Status Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Delivered / Completed
            </span>
          </div>
        </div>

        {/* Main Audit Detail Table Card */}
        <div
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full"
          style={{ boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)' }}
        >
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0B1E48] text-white text-[11px] font-bold tracking-wider uppercase">
                  <th className="py-3.5 px-4">Actions</th>
                  <th className="py-3.5 px-4">Frame Number</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Done By</th>
                  <th className="py-3.5 px-4">Updated Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16">
                      <div className="flex flex-col items-center justify-center">
                        <FiShield className="w-10 h-10 text-slate-300 mb-3" />

                        <h3 className="text-sm font-semibold text-slate-700">
                          No Audit Logs Found
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          There are no audit records available.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-semibold text-[#0B1E48]">
                        <span
                          className={`font-semibold ${row.action?.toUpperCase() === "CREATE"
                            ? "text-emerald-600"
                            : row.action?.toUpperCase() === "READ"
                              ? "text-cyan-600"
                              : row.action?.toUpperCase() === "UPDATE"
                                ? "text-blue-600"
                                : row.action?.toUpperCase() === "DELETE"
                                  ? "text-red-600"
                                  : row.action?.toUpperCase() === "BULK_DELETE"
                                    ? "text-red-600"
                                    : row.action?.toUpperCase() === "UPLOAD"
                                      ? "text-emerald-600"
                                      : "text-slate-700"
                            }`}
                        >
                          {row.action?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-blue-50 text-blue-900 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
                          {row.frameNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {row.details}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {row.username}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {row.doneBy}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {row.updatedDate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600">
            <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-wider">
              <FiShield className="w-4 h-4 text-emerald-600" />
              SECURE LEDGER VERIFIED
            </div>
            <div className="font-bold text-slate-700 tracking-wider">
              ROW COUNT : {auditData.length}
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows Per Page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B1E48]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2 text-slate-400">
              Showing {auditData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
              to {(currentPage - 1) * rowsPerPage + auditData.length}
              entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="First Page"
            >
              <FiChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="Previous Page"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-[#0B1E48] text-white font-semibold rounded">
              {currentPage}
            </span>
            <button
              onClick={() => {
                if (auditData.length === rowsPerPage) {
                  setCurrentPage((prev) => prev + 1);
                }
              }}
              disabled={auditData.length < rowsPerPage}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="Next Page"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
            <button
              disabled={true}
              className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition"
              title="Last Page"
            >
              <FiChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}