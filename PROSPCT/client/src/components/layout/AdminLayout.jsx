import { useState, useRef, useEffect } from "react";
import ThemeSettings from "../admin/ThemeSettings";
import AdminHeader from "../admin/AdminHeader";
import Sidebar from "../admin/Sidebar";

const AdminLayout = ({ children }) => {
  const [showThemeSettings, setShowThemeSettings] = useState(false); // State for ThemeSettings visibility

  const [isExpanded, setIsExpanded] = useState(true);
  const mainDivRef = useRef(null);
  const sidebarDivRef = useRef(null);

  const toggleClasses = () => {
    setIsExpanded((prev) => !prev);
  };

  const expandSidebar = () => {
    setIsExpanded(true);
  };

  const toggleThemeSettings = () => {
    setShowThemeSettings(!showThemeSettings);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if sidebar is expanded, screen is mobile-sized, and click is outside sidebar
      if (
        isExpanded &&
        window.innerWidth < 1024 &&
        sidebarDivRef.current &&
        !sidebarDivRef.current.contains(event.target) &&
        !event.target.closest('#sidebar-toggle') // Don't close if clicking the toggle button itself
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div>
      <AdminHeader
        toggleThemeSettings={toggleThemeSettings}
        toggleClasses={toggleClasses}
      />
      <Sidebar isExpanded={isExpanded} sidebarDivRef={sidebarDivRef} expandSidebar={expandSidebar} />
      <section
        ref={mainDivRef}
        id="main-div"
        className={`h-full bg-slate-50 dark:bg-slate-900 transition-all duration-300 relative overflow-y-auto ${
          isExpanded ? "lg:ml-52" : "lg:ml-[74px]"
        }`}
      >
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </section>
      {showThemeSettings && (
        <ThemeSettings toggleThemeSettings={toggleThemeSettings} />
      )}
    </div>
  );
};

export default AdminLayout;
