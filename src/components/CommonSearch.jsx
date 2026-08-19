import React from "react";
import { Search, X, Loader2 } from "lucide-react";

const CommonSearch = ({
    value = "",
    onChange,
    onSearch,
    onClear,
    isLoading = false,
    placeholder = "Search...",
    disabled = false,
}) => {
    const handleKeyDown = (e) => {
        // Search ONLY when Enter is pressed
        if (e.key === "Enter") {
            e.preventDefault();

            if (value.trim() && !isLoading && !disabled) {
                onSearch?.();
            }

            return;
        }

        // Clear ONLY when Escape is pressed
        if (e.key === "Escape") {
            e.preventDefault();

            if (value.trim() && !isLoading && !disabled) {
                onClear?.();
            }

            return;
        }
    };

    return (
        <div className="relative w-full">
            {/* Search Icon */}
            <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLoading ? "text-slate-300" : "text-slate-400"
                    }`}
            />

            {/* Input */}
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-32 py-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-2xs transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
            />

            {/* Loading */}
            {isLoading && (
                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
            )}

            {/* Search Button */}
            {!isLoading && value.trim() && (
                <button
                    type="button"
                    onClick={() => {
                        if (value.trim() && !disabled) {
                            onSearch?.();
                        }
                    }}
                    disabled={!value.trim() || disabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-[72px] h-8 flex items-center justify-center gap-1.5 rounded-md bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Search"
                >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                </button>
            )}

            {/* Clear */}
            {!isLoading && value.trim() && (
                <button
                    type="button"
                    onClick={onClear}
                    disabled={disabled}
                    className="absolute right-[82px] top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Clear search"
                    title="Clear search"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default CommonSearch;