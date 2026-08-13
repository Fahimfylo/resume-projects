import { useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import useStore from "../../store/store";
import { FaBarsStaggered } from "react-icons/fa6";

function ListsHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    setContactEditColumnsVisible,
    setExportVisible,
  } = useStore();

  const toggleVisibility = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow">
      <div
        id="second-section-header"
        className="hidden text-xl font-semibold lg:flex"
      >
        All Lists
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
          <div
            className="text-[13px] sm:hidden mx-4 py-4  px-4 rounded-[4px] shadow-sm cursor-pointer hover:bg-sky-100 hover:border-sky-500 transition-colors duration-500"
            
          >
            All Lists
          </div>
          <div
            className="text-[13px] sm:hidden mx-4 py-4  px-4 rounded-[4px] shadow-sm cursor-pointer hover:bg-sky-100 hover:border-sky-500 transition-colors duration-500"
            
          >
            Folder
          </div>
          
        </div>
      </div>
    </nav>
  );
}

export default ListsHeader;
