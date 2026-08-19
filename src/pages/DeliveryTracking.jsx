import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  MapPin,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  PackageSearch,
  Activity,
  Box,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import LeelamayiLoader from "../components/LeelamayiLoader";
import { getLocationLogs } from "../api/locationLogs";

export default function DeliveryTracking() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedFrameNo, setSearchedFrameNo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams] = useSearchParams();

  const frame = searchParams.get("frame");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);

  // api
  const handleVerify = async (e) => {
    e.preventDefault();

    const formattedQuery = searchQuery.trim();

    if (!formattedQuery) {
      setErrorMsg("Please enter a valid Frame Number.");
      return;
    }

    try {
      setLoading(true);

      const data = await getLocationLogs(formattedQuery);

      setTrackingData(data);
      setSearchedFrameNo(formattedQuery);
      setErrorMsg("");
    } catch (error) {
      setTrackingData(null);
      setSearchedFrameNo("");
      setErrorMsg(`No tracking data found for "${formattedQuery}".`);
    } finally {
      setLoading(false);
    }
  };

  // Preserved exact routing effect
  useEffect(() => {
    if (!frame) return;
    const fetchTracking = async () => {
      try {
        setLoading(true);
        const formattedFrame = frame;
        setSearchQuery(formattedFrame);
        const data = await getLocationLogs(formattedFrame);
        setTrackingData(data);
        setSearchedFrameNo(formattedFrame);
        setErrorMsg("");
      } catch (error) {
        setTrackingData(null);
        setSearchedFrameNo("");
        setErrorMsg(`No tracking data found for "${frame}".`);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [frame]);

  // Dynamic values derived directly from the API response format
  const hasRecords = trackingData && trackingData.records && trackingData.records.length > 0;
  const latestRecord = hasRecords ? trackingData.records[trackingData.records.length - 1] : null;
  const isDelivered =
    latestRecord?.location?.trim().toLowerCase() === "delivered";

  // Helper to format date string to "DD MMM YYYY"
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  //displaying time 
  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: "—", time: "—" };

    const [datePart, timePart] = timestamp.split(" ");

    if (!datePart || !timePart) {
      return { date: timestamp, time: "" };
    }

    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    const date = new Date(year, month - 1, day, hours, minutes);

    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };
  if (loading) {
    return (
      <LeelamayiLoader
        loading={loading}
        message="Loading Delivery Tracking..."
      />
    );
  }
  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 space-y-6 pb-12 px-0 font-sans text-slate-800 antialiased">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Delivery Tracking
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track real-time movement history and dispatch records using the vehicle frame number.
        </p>
      </div>

      {/* Sticky Search Card */}
      <div className="sticky top-3 sm:top-4 z-20 bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Frame Number (e.g. HONDA-DN-DD)"
              className="h-11 w-full pl-10 pr-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-xs active:scale-[0.98] shrink-0"
          >
            Verify Vehicle
          </button>
        </form>

        {errorMsg && (
          <p className="mt-2.5 text-xs font-medium text-rose-600 pl-1">{errorMsg}</p>
        )}
      </div>

      {/* Main Content Area */}
      {trackingData ? (
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 sm:gap-6 items-start min-w-0">
          {/* Left Side: Movement Timeline (70% on large screens) */}
          <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-xs min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 sm:pb-5 mb-5 sm:mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Movement Timeline
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {trackingData.records.length} Recorded Movements
              </span>
            </div>

            <div className="relative pl-0 sm:pl-2 md:pl-3 lg:pl-4 space-y-4 sm:space-y-5 lg:space-y-6 min-w-0">              {trackingData.records.map((record, index) => {
              const isLatest = index === trackingData.records.length - 1;
              const isLastInArray = index === trackingData.records.length - 1;

              return (
                <div
                  key={index}
                  className="relative flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 group min-w-0"
                >           
              {/* Vertical Connector Line */}
                  {!isLastInArray && (
                    <span
                      className="absolute left-[15px] top-8 w-[2px] h-[calc(100%+32px)] bg-slate-200 group-hover:bg-slate-300 transition-colors"
                      aria-hidden="true"
                    />
                  )}

                  {/* Timeline Dot / Indicator */}
                  <div className="shrink-0 relative z-10 pt-1">
                    {isLatest && isDelivered ? (

                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white ring-4 ring-emerald-50 shadow-sm shadow-emerald-500/20">
                        <Truck className="w-4 h-4" />
                      </div>
                    ) : isLatest ? (

                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                        <span className="absolute -inset-1 rounded-full bg-blue-500/20 animate-ping" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                    ) : (

                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white ring-4 ring-emerald-50">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Timeline Item Card */}
                  <div className="flex-1 min-w-0 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/70 rounded-xl p-3 sm:p-4 transition-all duration-200 hover:shadow-xs">
                    <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-200/50 sm:flex-row sm:items-center sm:justify-between sm:gap-2 md:gap-3">                                            <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight break-words">
                        {record.location}
                      </h3>
                    </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />

                        {(() => {
                          const dateTime = formatDateTime(record.timestamp_ist);

                          return (
                            <div className="flex flex-col items-start leading-tight min-w-[82px]">
                              <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                {dateTime.date}
                              </span>

                              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap mt-0.5">
                                {dateTime.time}
                              </span>
                            </div>
                          );
                        })()}
                      </div>                 
                     </div>
                    <div className="mt-3 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 text-xs text-slate-600">
                      <span className="text-slate-400 font-medium">Updated By</span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.updated_by || "System"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Right Side: Vehicle Overview Card (30% on large screens) */}
          <div className="xl:col-span-3 xl:sticky xl:top-24 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs min-w-0">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase tracking-wider text-slate-400">
                Vehicle Overview
              </h2>
              {isDelivered ? (
                // Delivered
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Delivered
                </span>
              ) : hasRecords ? (
                // In Transit
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600" />
                  </span>
                  In Transit
                </span>
              ) : (
                // No Tracking
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  No Tracking
                </span>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-1">                <span className="text-slate-500 font-medium">Frame Number</span>
                <span className="font-semibold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {trackingData.frame}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-1">                <span className="text-slate-500 font-medium">Current Location</span>
                <span className="font-semibold text-slate-900">
                  {latestRecord ? latestRecord.location : "—"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-1">                <span className="text-slate-500 font-medium">Last Updated</span>
                <span className="font-semibold text-slate-900">
                  {latestRecord
                    ? (() => {
                      const dateTime = formatDateTime(latestRecord.timestamp_ist);

                      return (
                        <div className="flex flex-col items-end leading-tight">
                          <span className="font-semibold text-slate-900">
                            {dateTime.date}
                          </span>

                          <span className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {dateTime.time}
                          </span>
                        </div>
                      );
                    })()
                    : "—"}                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-1">                <span className="text-slate-500 font-medium">Updated By</span>
                <span className="font-semibold text-slate-900">
                  {latestRecord ? latestRecord.updated_by : "—"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-1">                <span className="text-slate-500 font-medium">Total Movements</span>
                <span className="font-semibold text-slate-900">
                  {trackingData.records ? trackingData.records.length : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <PackageSearch className="w-8 h-8 text-slate-600" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Ready to Track Vehicle
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter a valid <span className="font-semibold text-slate-700">Frame Number</span>{" "}
              above and click <span className="font-semibold text-slate-700">Verify Vehicle</span>{" "}
              to view real-time location logs and transfer history.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left">
                <Truck className="w-4 h-4 text-slate-700 mb-1.5" />
                <h3 className="font-semibold text-xs text-slate-800">
                  Movement History
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Track full chain-of-custody transfer records.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left">
                <ArrowUpRight className="w-4 h-4 text-slate-700 mb-1.5" />
                <h3 className="font-semibold text-xs text-slate-800">
                  Live Status
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  View latest location and current transfer state.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}