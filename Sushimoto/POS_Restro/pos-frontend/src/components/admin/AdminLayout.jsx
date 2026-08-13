import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-creamson">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={`flex-1 p-6 overflow-x-hidden transition-all duration-300 min-h-screen ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
