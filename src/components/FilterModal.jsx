import React, { useEffect } from "react";

const FilterModal= ({ isOpen, onClose, inventory = [], filters, setFilters }) => {
  // Extract unique option values dynamically from current inventory prop
  const getUnique = (key) => [
    ...new Set(inventory.map((item) => item[key]).filter(Boolean)),
  ];

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFilters({
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
  };

  const handleApply = (e) => {
    e.preventDefault();
    onClose();
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full">
        {/* Drawer Panel */}
        <div
          className={`w-screen max-w-[400px] h-full bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-semibold text-white leading-snug">
                Filter Inventory
              </h2>
              <p className="text-xs text-slate-300 leading-tight">
                Filter inventory records
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white transition-colors text-lg leading-none p-1 focus:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleApply} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* Warehouse */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Warehouse
                </label>
                <select
                  value={filters.warehouse || ""}
                  onChange={(e) => updateFilter("warehouse", e.target.value)}
                  className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="">All Warehouses</option>
                 {getUnique("location").map((item) => (        
                <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Product
                </label>
                <select
                  value={filters.product || ""}
                  onChange={(e) => updateFilter("product", e.target.value)}
                  className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="">All Products</option>
                  {getUnique("product").map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model & Variant */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Model
                  </label>
                  <select
                    value={filters.model || ""}
                    onChange={(e) => updateFilter("model", e.target.value)}
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  >
                    <option value="">All Models</option>
                    {getUnique("model").map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Variant
                  </label>
                  <select
                    value={filters.variant || ""}
                    onChange={(e) => updateFilter("variant", e.target.value)}
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  >
                    <option value="">All Variants</option>
                    {getUnique("variant").map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Color
                  </label>
                  <select
                    value={filters.color || ""}
                    onChange={(e) => updateFilter("color", e.target.value)}
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  >
                    <option value="">All Colors</option>
                  {getUnique("colorName").map((item) => (        
                  <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Location
                  </label>
                  <select
                    value={filters.location || ""}
                    onChange={(e) => updateFilter("location", e.target.value)}
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  >
                    <option value="">All Locations</option>
                    {getUnique("location").map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manufacturing Date */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Manufacturing Date
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={filters.mfgFrom || ""}
                    onChange={(e) => updateFilter("mfgFrom", e.target.value)}
                    placeholder="From"
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  />
                  <input
                    type="date"
                    value={filters.mfgTo || ""}
                    onChange={(e) => updateFilter("mfgTo", e.target.value)}
                    placeholder="To"
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  />
                </div>
              </div>

              {/* Transfer Date */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Transfer Date
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={filters.transferFrom || ""}
                    onChange={(e) => updateFilter("transferFrom", e.target.value)}
                    placeholder="From"
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  />
                  <input
                    type="date"
                    value={filters.transferTo || ""}
                    onChange={(e) => updateFilter("transferTo", e.target.value)}
                    placeholder="To"
                    className="h-[44px] w-full px-3 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-slate-800 transition-colors"
                  />
                </div>
              </div>

            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
              >
                Reset
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-[44px] px-4 bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-[44px] px-4 bg-[#0F172A] text-white font-medium text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default FilterModal;