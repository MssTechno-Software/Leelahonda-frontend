import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Package,
  ClipboardCheck,
  Truck,
  ScanSearch,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import logo from "../assets/side-bar-logo.png";
const navItems = [
  {
    name: "Inventory",
    path: "/inventory",
    icon: Package,
  },
  {
    name: "Audit Management",
    path: "/audit-management",
    icon: ClipboardCheck,
  },
  {
    name: "Delivered",
    path: "/delivered",
    icon: Truck,
  },
  {
    name: "Track with Frame Number",
    path: "/track",
    icon: ScanSearch,
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
  },
];

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
}) {
  const navigate = useNavigate();


  //for role 
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1B2B57] text-white flex flex-col justify-between shadow-2xl select-none z-50 transition-all duration-300 ease-in-out border-r border-white/10 ${isCollapsed ? "w-[80px]" : "w-[250px]"
        }`}
    >
      {/* Collapse Toggle Button  */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#1B2B57] text-white border border-white/20 shadow-md transition-transform hover:scale-110 cursor-pointer"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ================= HEADER ================= */}
        <div
          className={`flex items-center border-b border-white/10 transition-all duration-300 ${isCollapsed ? "justify-center px-2 py-5" : "gap-3.5 px-4 py-5"
            }`}
        >
          {/* Logo Container */}
          <div className="flex items-center justify-center w-14 h-14 flex-shrink-0 overflow-hidden">
  <img
  src={logo}
  alt="Leelamayi Group"
  className="w-full h-full object-contain scale-175"
/>
</div>

          {/* Title & Subtitle */}
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden transition-opacity duration-300">
              <h2 className="text-[17px] font-bold text-white leading-tight tracking-tight truncate">
                Leelamayi Group
              </h2>
              <p className="text-[12px] font-medium text-[#B7C6F3] truncate mt-0.5">
                Inventory System
              </p>
            </div>
          )}
        </div>

        {/* ================= NAVIGATION MENU ================= */}
        <nav className="flex-1 px-3 mt-6 space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => {
              if (
                item.name === "Users" &&
                role !== "admin" &&
                role !== "super_admin"
              ) {
                return false;
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-3.5 rounded-[16px] transition-all duration-300 ease-in-out whitespace-nowrap ${isCollapsed ? "justify-center p-3.5" : "px-4 py-3.5"
                    } ${isActive
                      ? "bg-white text-[#1B2B57] shadow-lg shadow-black/15 scale-[1.02]"
                      : "text-[#B7C6F3] hover:bg-white/[0.08] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive
                          ? "text-[#1B2B57]"
                          : "text-[#B7C6F3] group-hover:text-white"
                          }`}
                      />
                      {!isCollapsed && (
                        <span className="text-[15px] font-semibold truncate">
                          {item.name}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* ================= FOOTER / LOGOUT ================= */}
      <div className="border-t border-white/10 p-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`group flex items-center gap-3.5 rounded-[16px] text-[#B7C6F3] hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 ease-in-out whitespace-nowrap cursor-pointer ${isCollapsed ? "justify-center p-3.5" : "w-full px-4 py-3.5"
            }`}
        >
          <LogOut
            size={20}
            className="flex-shrink-0 transition-transform duration-300 group-hover:-translate-x-1"
          />
          {!isCollapsed && (
            <span className="text-[15px] font-semibold truncate">Logout</span>
          )}
        </button>

        {/* Version Badge Footer */}
        {!isCollapsed && (
          <div className="text-center pt-1">
            <p className="text-[11px] font-medium text-[#B7C6F3]/60 tracking-wider">
              © 2026 version 1.0.0
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}