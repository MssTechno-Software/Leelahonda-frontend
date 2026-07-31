import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main
        className={`flex-1 p-8 min-h-screen overflow-y-auto transition-all duration-300 ${
          isCollapsed ? "ml-[80px]" : "ml-[250px]"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;