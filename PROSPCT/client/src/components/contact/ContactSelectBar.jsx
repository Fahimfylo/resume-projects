import { ChevronDown, Download } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import useStore from "../../store/store.js";

function ContactSelectBar({ paginatedContacts, formattedContacts, totalCount }) {
  const {
    checkedItems,
    toggleAllCheckedItems,
    clearCheckedItems,
    setExportVisible,
  } = useStore();

  const [isSelectVisible, setIsSelectVisible] = useState(false);
  const toggleRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleSelectClick = () => {
    setIsSelectVisible((prev) => !prev);
  };

  const handleSelectPage = () => {
    const newChecked = [...checkedItems];
    paginatedContacts.forEach((contact) => {
      if (!newChecked.some((item) => item._id === contact._id)) {
        newChecked.push(contact);
      }
    });
    toggleAllCheckedItems(newChecked);
    setIsSelectVisible(false);
  };

  const handleSelectAllPeople = () => {
    toggleAllCheckedItems(formattedContacts);
    setIsSelectVisible(false);
  };

  const handleClearSelection = () => {
    clearCheckedItems();
    setIsSelectVisible(false);
  };

  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      toggleRef.current &&
      !toggleRef.current.contains(event.target)
    ) {
      setIsSelectVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center py-2 bg-white border-t border-x">
      <div
        onClick={handleSelectClick}
        ref={toggleRef}
        className="toggle-button relative flex cursor-pointer items-center h-[25px] justify-center bg-gray-100 ml-1 mr-4 rounded-sm"
      >
        <input
          type="checkbox"
          className="ml-[4px]"
          checked={
            paginatedContacts.length > 0 &&
            paginatedContacts.every((contact) =>
              checkedItems.some((item) => item._id === contact._id),
            )
          }
          onChange={() => {
            if (
              paginatedContacts.length > 0 &&
              paginatedContacts.every((contact) =>
                checkedItems.some((item) => item._id === contact._id),
              )
            ) {
              clearCheckedItems();
            } else {
              toggleAllCheckedItems(paginatedContacts);
            }
            setIsSelectVisible(false);
          }}
        />
        {checkedItems.length > 0 && (
          <div className="ml-2">
            <p className="text-sm flex items-center gap-1 text-gray-900">
              {checkedItems.length} Selected
            </p>
          </div>
        )}
        <ChevronDown
          size={18}
          className="ml-[2px] mr-[1px] text-gray-600 hover:text-blue-500"
        />

        {isSelectVisible && (
          <div ref={dropdownRef} className="absolute z-50 top-full left-0 mt-1 text-sm font-semibold text-gray-800 bg-white border shadow-md w-72">
            <div
              className="px-4 py-2 transition-colors delay-75 border-b rounded-t-sm cursor-pointer hover:bg-blue-500 hover:text-white"
              onClick={handleSelectPage}
            >
              Select this page ({paginatedContacts.length})
            </div>
            <div
              className="px-4 py-2 transition-colors delay-75 border-b cursor-pointer hover:bg-blue-500 hover:text-white"
              onClick={handleSelectAllPeople}
            >
              Select all people ({totalCount})
            </div>
            <div
              className="px-4 py-2 transition-colors delay-75 border-t-2 rounded-b-sm cursor-pointer hover:bg-blue-500 hover:text-white"
              onClick={handleClearSelection}
            >
              Clear selection
            </div>
          </div>
        )}
      </div>

      {paginatedContacts.length > 0 && (
        <button
          className="flex items-center text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500"
          onClick={() => {
            toggleAllCheckedItems(paginatedContacts);
            setExportVisible(true);
          }}
        >
          <Download size={17} className="mr-2" />
          <span>Export companies ({paginatedContacts.length})</span>
        </button>
      )}
      {paginatedContacts.length > 0 && (
        <button
          className="flex items-center ml-[20px] text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500"
          onClick={() => {
            toggleAllCheckedItems(formattedContacts);
            setExportVisible(true);
          }}
        >
          <Download size={17} className="mr-2" />
          <span>Export all companies ({formattedContacts.length})</span>
        </button>
      )}
    </div>
  );
}

export default ContactSelectBar;
