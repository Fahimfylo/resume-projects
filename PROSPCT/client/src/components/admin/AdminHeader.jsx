import {
  FaBarsStaggered,
  FaMagnifyingGlass,
  FaReact,
  FaBell,
  FaGear,
} from "react-icons/fa6";

// Ensure this is a client component

const AdminHeader = ({ toggleThemeSettings, toggleClasses }) => {
  return (
    <nav className="flex sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md w-full border-b border-slate-200 dark:border-slate-800 justify-between items-center py-2 px-4 md:px-6 z-40 transition-colors duration-300 shadow-sm">
      <div className="flex">
        <span
          id="sidebar-toggle"
          onClick={toggleClasses}
          className="cursor-pointer p-2 text-xl my-auto mr-4"
        >
          <FaBarsStaggered className="fa-solid fa-bars-staggered text-sky-600 dark:text-white" />
        </span>

        <span className="cursor-pointer my-auto p-1.5 flex items-center group">
          <img src="/logo/Favicon.png" alt="logo" className="w-7 h-7 md:w-8 md:h-8 hover:scale-110 transition-transform" />
          <span className="ml-2.5 text-xl md:text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight">
            Prospct
          </span>
        </span>
      </div>

      <div className="flex text-center items-center">
        <span
          id="ui-setting"
          onClick={toggleThemeSettings}
          className="cursor-pointer p-2 text-xl  my-auto"
        >
          <FaGear className="fa-solid fa-gear text-gray-700 dark:text-white" />
        </span>
      </div>
    </nav>
  );
};

export default AdminHeader;
