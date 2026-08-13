import { X } from "lucide-react";
import { FaBarsStaggered } from "react-icons/fa6";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function SearchHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleVisibility = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div
        id="second-section-header"
        className="hidden ml-4 text-2xl font-semibold text-gray-900 lg:flex"
      >
        Search
      </div>
      <div className="flex mx-3 ">
        <div className=" sm:ml-0">
          <FaBarsStaggered
            size="20"
            onClick={toggleVisibility}
            className="mt-2 text-lg text-gray-700 cursor-pointer sm:hidden"
          />
        </div>

        <div
          className={`absolute sm:flex w-full sm:w-auto top-0 left-0 p h-full sm:relative bg-white sm:transition-all duration-300 z-40 sm:translate-y-0 ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="px-4 py-4 mb-4 text-xl text-white sm:hidden bg-sky-600">
            <div className="flex justify-between">
              <div className="">Filter</div>
              <X onClick={toggleVisibility} className="cursor-pointer" />
            </div>
          </div>
          <div
            onClick={() => {
              navigate("/search");
              toggleVisibility();
            }}
            className={`text-[13px] text-gray-700 mx-4 sm:mx-0 sm:mr-0 sm:border py-3 sm:py-[5px] px-4 w-full sm:w-24 rounded-l-[2px] cursor-pointer transition-colors duration-500 ${
              location.pathname === "/search"
                ? "border-blue-500 bg-sky-100 text-sky-600"
                : "border-gray-400 hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-blue-500"
            }`}
          >
            Leads
          </div>
          <div
            onClick={() => {
              navigate("/companies");
              toggleVisibility();
            }}
            className={`text-[13px] text-gray-700 mx-4 sm:mx-0 sm:mr-3 sm:border-y sm:border-r py-3 sm:py-[5px] px-4 w-full sm:w-24 rounded-r-[2px] cursor-pointer transition-colors duration-500 ${
              location.pathname === "/companies"
                ? "border-blue-500 bg-sky-100 text-sky-600"
                : "border-gray-400 hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-blue-500"
            }`}
          >
            Companies
          </div>
          <div
            onClick={() => {
              navigate("/saved-search");
              toggleVisibility();
            }}
            className={`text-[13px] text-gray-700 mx-4 sm:mx-0 sm:mr-3 sm:border py-3 sm:py-[5px] px-4 rounded-[2px] cursor-pointer transition-colors duration-500 ${
              location.pathname === "/saved-search"
                ? "border-blue-500 bg-sky-100 text-sky-600"
                : "border-gray-400 hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-blue-500"
            }`}
          >
            Saved search
          </div>
          <div
            onClick={() => {
              navigate("/recent-searches");
              toggleVisibility();
            }}
            className={`text-[13px] text-gray-700 mx-4 sm:mx-0 sm:mr-3 sm:border py-3 sm:py-[5px] px-4 rounded-[2px] cursor-pointer transition-colors duration-500 ${
              location.pathname === "/recent-searches"
                ? "border-blue-500 bg-sky-100 text-sky-600"
                : "border-gray-400 hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-blue-500"
            }`}
          >
            Recent activity
          </div>
        </div>
      </div>
    </nav>
  );
}

export default SearchHeader;
