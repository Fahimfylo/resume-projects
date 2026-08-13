import { useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import useStore from "../../store/store";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { FaBarsStaggered } from "react-icons/fa6";
import { toast } from "react-toastify";

function CompanyHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasFeature } = useFeatureAccess();
  const {
    setCompanyEditColumnsVisible,
    setExportVisible,
    hasCompanyData,
  } = useStore();

  const toggleVisibility = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div
        id="second-section-header"
        className="hidden text-xl font-semibold lg:flex"
      >
        All Companies
      </div>
      <div className="flex mx-3">
        

        <div className=" sm:ml-0">
              <FaBarsStaggered
                size='20'
                onClick={toggleVisibility}
                className="sm:hidden cursor-pointer mt-2 text-lg text-gray-700"
              />
            </div>

        <div
          className={`absolute sm:flex w-full sm:w-auto top-0 left-0 p h-full sm:relative bg-white sm:transition-all duration-300 z-30 sm:z-40 sm:translate-y-0 ${
          isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        >
          <div className="px-4 py-4 mb-4 text-xl text-white sm:hidden bg-sky-600">
            <div className="flex justify-between">
              <div className="">Filter</div>
              <X className="cursor-pointer" onClick={toggleVisibility} />
            </div>
          </div>
          {hasCompanyData && (
            <>
              <div
                className="text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-gray-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-sky-500 transition-colors duration-500"
                onClick={() => setCompanyEditColumnsVisible(true)}
              >
                Edit Columns
              </div>
              <Link
                to="/import"
                className="text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-gray-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-sky-500 transition-colors duration-500"
              >
                Import
              </Link>
              <div
                className={`text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-gray-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-sky-500 transition-colors duration-500 ${!hasFeature("csvEnrichment") ? "opacity-40" : ""}`}
                onClick={() => {
                  if (!hasFeature("csvEnrichment")) {
                    toast.warn("Your plan does not include CSV export. Please upgrade your plan.");
                    return;
                  }
                  setExportVisible(true);
                }}
              >
                Export
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default CompanyHeader;
