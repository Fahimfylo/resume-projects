import {
  Eye,
  PackagePlus,
  Save,
  Database,
  Forward,
  ChevronDown,
  ArrowDownNarrowWide,
  MoreVertical,
  Trash2,
} from "lucide-react";

import RelevanceDown from "./RelevanceDown";
import LayoutDown from "./LayoutDown";
import { ImSpinner9 } from "react-icons/im";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";

import useStore from "../../store/store";
import { saveSearchShareState } from "../../api/mutation";
import { notifyContactDeleted, showToastIfPopupDisabled } from "../../utils/notificationHelper";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function LeadRightTopbar({ data, counts, totalLoading, isLoading }) {
  const {
    filters,
    excludedFilters,
    setFilters,
    checkedItems,
    toggleAllCheckedItems,
    visibleColumns,
    incrementDataRefreshKey,
  } = useStore();

  const [isLayoutVisible, setIsLayoutVisible] = useState(false);
  const [isLayoutActive, setIsLayoutActive] = useState(false);
  const [isRelevanceVisible, setIsRelevanceVisible] = useState(false);
  const [isRelevanceActive, setIsRelevanceActive] = useState(false);
  const [isSavedMenuVisible, setIsSavedMenuVisible] = useState(false);
  const viewType = filters.viewType;

  const isAllSelected =
    data?.results?.length > 0 &&
    data.results.every((item) =>
      checkedItems.some((ci) => ci._id === item._id),
    );

  const totalCount =
    counts?.total ?? data?.counts?.onPage ?? data?.results?.length ?? 0;

  const savedCountDisplay = counts?.saved ?? 0;
  const newCount = counts?.new ?? 0;

  const handleSelectPage = () => {
    // Filter only valid items with _id from current page
    const validResults = data?.results?.filter((item) =>
      item && item._id && typeof item._id === "string" && item._id.length > 0
    ) || [];

    if (isAllSelected) {
      // Remove current page items from checkedItems
      const currentPageIds = validResults.map((r) => r._id);
      const newCheckedItems = checkedItems.filter(
        (ci) => !currentPageIds.includes(ci._id),
      );
      toggleAllCheckedItems(newCheckedItems);
    } else {
      // Add missing current page items to checkedItems
      const newCheckedItems = [...checkedItems];
      validResults.forEach((item) => {
        if (!newCheckedItems.some((ci) => ci._id === item._id)) {
          newCheckedItems.push(item);
        }
      });
      toggleAllCheckedItems(newCheckedItems);
    }
  };

  const layoutRef = useRef(null);
  const relevanceRef = useRef(null);
  const layoutToggleRef = useRef(null);
  const relevanceToggleRef = useRef(null);
  const savedMenuRef = useRef(null);
  const savedMenuToggleRef = useRef(null);

  const handleViewChange = (value) => {
    setFilters("viewType", value);
    setFilters("currentPage", 1);
  };

  const handleLayoutClick = (event) => {
    event.stopPropagation();
    setIsLayoutVisible((prev) => !prev);
    setIsLayoutActive(!isLayoutActive);
  };

  const handleRelevanceClick = (event) => {
    event.stopPropagation();
    setIsRelevanceVisible((prev) => !prev);
    setIsRelevanceActive(!isRelevanceActive);
  };

  const handleSavedMenuClick = (event) => {
    event.stopPropagation();
    setIsSavedMenuVisible((prev) => !prev);
  };

  const handleDeleteAllSaved = async () => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to delete saved contacts.");
      return;
    }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete all saved contacts?
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              try {
                const response = await axios.delete(`${BASE_URL}/api/saved/all`, {
                  headers: { Authorization: `Bearer ${token}` } },
                );
                const deletedCount = response.data?.deleted || 0;
                showToastIfPopupDisabled(`${deletedCount} contacts deleted successfully.`);
                setIsSavedMenuVisible(false);
                toast.dismiss(toastId);
                notifyContactDeleted(deletedCount);
                const { clearCheckedItems, incrementDataRefreshKey: incKey } = useStore.getState();
                clearCheckedItems();
                incKey(); // force count + results re-fetch
              } catch (error) {
                // console.error("Failed to delete saved contacts:", error);
                const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to delete saved contacts";
                toast.error(errorMessage);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  const handleDeleteSelectedSaved = async () => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to delete saved contacts.");
      return;
    }

    const { checkedItems, clearCheckedItems, incrementDataRefreshKey } = useStore.getState();
    
    if (checkedItems.length === 0) {
      toast.error("Please select contacts to delete.");
      return;
    }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete {checkedItems.length} selected contacts?
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              try {
                const response = await axios.delete(`${BASE_URL}/api/saved`, {
                  headers: { Authorization: `Bearer ${token}` },
                  data: { contactIds: checkedItems.map(item => item._id) },
                });
                const deletedCount = response.data?.deleted || checkedItems.length;
                showToastIfPopupDisabled(`${deletedCount} contacts deleted successfully.`);
                setIsSavedMenuVisible(false);
                toast.dismiss(toastId);
                notifyContactDeleted(deletedCount);
                clearCheckedItems();
                incrementDataRefreshKey(); // force count + results re-fetch
              } catch (error) {
                // console.error("Failed to delete saved contacts:", error);
                const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to delete saved contacts";
                toast.error(errorMessage);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  const handleSortApply = ({ sortByFields, sortOrder }) => {
    // Store selectedRelevances and sort order for persistence
    toast.success(
      `Sorting by: ${sortByFields.join(", ")} (${sortOrder})`
    );
  };

  const handleClickOutside = (event) => {
    if (
      layoutRef.current &&
      !layoutRef.current.contains(event.target) &&
      !layoutToggleRef.current.contains(event.target)
    ) {
      setIsLayoutVisible(false);
      setIsLayoutActive(false);
    }

    if (
      relevanceRef.current &&
      !relevanceRef.current.contains(event.target) &&
      !relevanceToggleRef.current.contains(event.target)
    ) {
      setIsRelevanceVisible(false);
      setIsRelevanceActive(false);
    }

    if (
      savedMenuRef.current &&
      !savedMenuRef.current.contains(event.target) &&
      !savedMenuToggleRef.current.contains(event.target)
    ) {
      setIsSavedMenuVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div>
      <div className="items-center justify-between block px-2 bg-white border-t lg:flex lead-head border-x">
        <div className="flex items-center mt-3 lg:mt-1 lead-click-advance">
          <span className="cursor-pointer">
            <div className="flex items-center justify-between px-2 lead-head">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div
                  className={`total-leads flex justify-center hover:text-blue-500 items-center px-1 pb-[3px] ${
                    viewType === "new" &&
                    "text-blue-500 border-b border-blue-500"
                  }`}
                  onClick={() => handleViewChange("new")}
                >
                  <PackagePlus size={18} className="mr-2" />
                  <div className="flex items-center justify-center">
                    New (
                    {totalLoading ? (
                      <ImSpinner9 className="inline animate-spin" />
                    ) : (
                      newCount
                    )}
                    )
                  </div>
                </div>

                <div
                  className={`total-leads font-normal flex hover:text-blue-500 items-center px-1 pb-[3px] ${
                    viewType === "total" &&
                    "text-blue-500 border-b border-blue-500"
                  }`}
                  onClick={() => handleViewChange("total")}
                >
                  <Database size={18} className="mr-2" />
                  <div className="flex items-center justify-center">
                    Total (
                    {totalLoading ? (
                      <ImSpinner9 className="inline animate-spin" />
                    ) : (
                      counts?.total?.toLocaleString() ?? 0
                    )}
                    )
                  </div>
                </div>

                <div
                  className={`total-leads font-normal flex hover:text-blue-500 items-center px-1 pb-[3px] relative ${
                    viewType === "saved" &&
                    "text-blue-500 border-b border-blue-500"
                  }`}
                  onClick={() => handleViewChange("saved")}
                >
                  <Save size={18} className="mr-2" />
                  <div className="flex items-center justify-center">
                    Saved (
                    {totalLoading ? (
                      <ImSpinner9 className="inline animate-spin" />
                    ) : (
                      savedCountDisplay
                    )}
                    )
                  </div>
                  <button
                    ref={savedMenuToggleRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSavedMenuClick(e);
                    }}
                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                    style={{ display: viewType === "saved" && data?.results?.length > 0 ? "block" : "none" }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {isSavedMenuVisible && viewType === "saved" && data?.results?.length > 0 && (
                    <div
                      ref={savedMenuRef}
                      className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[150px]"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelectedSaved();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete selected
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAllSaved();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete all saved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </span>
        </div>

        <div className="flex flex-wrap py-2 text-gray-800">
          {/* Select Page Toggle Button — hidden when empty */}
          {data?.results?.length > 0 && (
          <div className="flex mr-2 select-page">
            <span
              onClick={handleSelectPage}
              className={`btn cursor-pointer py-1 pl-2 pr-2 flex items-center border rounded-sm font-medium text-[14px] transition-colors
              ${
                isAllSelected
                  ? "border-blue-500 text-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-500 hover:text-blue-500"
              }`}
            >
              <span className="">
                {isAllSelected ? "Deselect Page" : "Select Page"}
              </span>
            </span>
          </div>
          )}

          <div className="flex mr-2 share">
            <span
              onClick={async () => {
                const canShare =
                  totalCount > 0 || checkedItems.length > 0;
                if (canShare) {
                  try {
                    const stateToShare = { filters, excludedFilters, visibleColumns };
                    const result = await saveSearchShareState(
                      stateToShare.filters,
                      stateToShare.excludedFilters,
                      stateToShare.visibleColumns,
                    );
                    navigator.clipboard.writeText(result.url);
                    toast.success("Short link copied to clipboard!");
                  } catch (e) {
                    // console.error("Failed to generate share link", e);
                    toast.error("Failed to generate share link");
                  }
                }
              }}
              className={`btn cursor-pointer py-1 pl-2 pr-3 flex items-center border rounded-sm font-medium text-[14px] transition-colors ${totalCount > 0 || checkedItems.length > 0 ? "border-gray-300 hover:border-blue-500 hover:text-blue-500" : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              <Forward size={17} className="mr-1" />
              <span className="">
                Share (
                {checkedItems.length > 0
                  ? checkedItems.length
                  : totalCount}
                )
              </span>
            </span>
          </div>

          {/* Layout Toggle Button */}
          <div className="relative flex mr-2 text-gray-800 layout">
            <span
              onClick={handleLayoutClick}
              ref={layoutToggleRef}
              className={`btn cursor-pointer py-1 pl-2 pr-3 flex items-center border  hover:border-blue-500 hover:text-blue-500 rounded-sm font-medium text-[14px]
              ${
                isLayoutActive
                  ? "border-blue-500 text-blue-500"
                  : "border-gray-300"
              }`}
            >
              <Eye size={16} className="mr-1 mt-[2px]" />
              <span className="">Layout</span>
              <ChevronDown size={17} className="ml-3 mt-[2px]" />
            </span>
            {isLayoutVisible && (
              <div className="absolute z-30 top-full right-0 mt-2">
                <LayoutDown ref={layoutRef} />
              </div>
            )}
          </div>

          <div
            onClick={handleRelevanceClick}
            ref={relevanceToggleRef}
            className="relative flex mr-2 relevance"
          >
            <span
              className={`btn relative cursor-pointer py-1 pl-2 pr-3 flex items-center border hover:border-blue-500 hover:text-blue-500 rounded-sm font-medium text-[14px]  
              ${
                isRelevanceActive
                  ? "border-blue-500 text-blue-500"
                  : "border-gray-300"
              }`}
            >
              <ArrowDownNarrowWide size={16} className="mr-1 mt-[2px]" />
              <span className="my-auto">Relevance</span>
              <ChevronDown size={17} className="ml-2 mt-[2px]" />
            </span>
            {isRelevanceVisible && (
              <div className="absolute z-30 top-full right-0 mt-2">
                <RelevanceDown ref={relevanceRef} onApply={handleSortApply} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeadRightTopbar;
