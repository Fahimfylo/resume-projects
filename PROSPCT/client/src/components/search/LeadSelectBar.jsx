import SelectOptions from "./SelectOptions";
import { useState, useRef, useEffect } from "react";
import useStore from "../../store/store.js";

import { ImSpinner9 } from "react-icons/im";
import { FolderUp, ChevronDown, Save, Download } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";

const FREE_USER_PAGES = 4;
const FREE_USER_LIMIT = 100;

function LeadSelectBar({ data, counts, totalLoading }) {
  const BASE_URL = API_CONFIG.API_ENDPOINT;
  const user = useStore((state) => state.user);
  const isFreeUser = !user || user?.plan?.name === "Free" || user?.plan?.type === "free";
  const {
    checkedItems,
    toggleAllCheckedItems,
    clearCheckedItems,
    setSaveLeadsVisible,
    setExportLeadsVisible,
    filters,
    setFilters,
    selectedEmployeeCount,
    setSelectedEmployeeCount,
    selectAllMode,
    setSelectAllMode,
  } = useStore();

  const viewType = filters.viewType;

  const [isSelectVisible, setIsSelectVisible] = useState(false);
  const [isAdvanceVisible, setIsAdvanceVisible] = useState(true);

  const toggleRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleSelectClick = (event) => {
    // event.stopPropagation();
    setIsSelectVisible((prev) => !prev);
  };

  const handleAdvanceClick = () => {
    setIsAdvanceVisible(!isAdvanceVisible);
  };

  const [numberPeopleValue, setPeopleNumberValue] = useState(0);
  const [numberOfPeopleValue, setNumberOfPeopleValue] = useState(0);

  const handlePeopleChange = (e) => {
    setPeopleNumberValue(e.target.value);
  };

  const handleNumberOfPeopleChange = (e) => {
    setNumberOfPeopleValue(e.target.value);
  };

  const handleApplySelection = () => {
    const flatCount = Number(numberOfPeopleValue);
    const peopleCount = Number(numberPeopleValue);

    if (!data?.results?.length) return;

    const validResults = data.results.filter((item) =>
      item && item._id && typeof item._id === "string" && item._id.length > 0
    );

    // Flat selection (Select Number of people)
    if (flatCount > 0) {
      const itemsToSelect = validResults.slice(0, flatCount);
      if (itemsToSelect.length === 0) {
        toast.info("No items available to select");
        return;
      }
      toggleAllCheckedItems(itemsToSelect);
      setSelectedEmployeeCount(itemsToSelect.length);
      toast.success(`Selected ${itemsToSelect.length} people`);
      setIsSelectVisible(false);
      return;
    }

    // Per-company selection (Select people)
    if (peopleCount > 0) {
      const groupedByCompany = validResults.reduce((acc, item) => {
        const companyName = item._source?.organization_name || "Unknown Company";
        if (!acc[companyName]) { acc[companyName] = []; }
        acc[companyName].push(item);
        return acc;
      }, {});

      const itemsToSelect = [];
      Object.values(groupedByCompany).forEach((companyItems) => {
        const itemsToTake = companyItems.slice(0, peopleCount);
        itemsToSelect.push(...itemsToTake);
      });

      if (itemsToSelect.length === 0) {
        toast.info("No items available to select");
        return;
      }

      toggleAllCheckedItems(itemsToSelect);
      setSelectedEmployeeCount(peopleCount);
      toast.success(`Selected ${peopleCount} per company`);
      setIsSelectVisible(false);
      return;
    }

    toast.info("Enter a number of people to select");
  };

  const handleSelectAllCheckBox = () => {
    // Only select items with valid _id
    const allItems = data?.results?.filter((item) =>
      item && item._id && typeof item._id === "string" && item._id.length > 0
    ) || [];
    toggleAllCheckedItems(allItems);
    setIsSelectVisible(false);
  };

  const handleSelectAllPeople = () => {
    const validItems = (items) =>
      items.filter((item) =>
        item && item._id && typeof item._id === "string" && item._id.length > 0
      );

    if (!isFreeUser) {
      const allItems = validItems(data?.results || []);
      toggleAllCheckedItems(allItems);
      setSelectAllMode(true, {
        viewType,
        searchQuery: filters.searchQuery,
        listId: filters.listId,
        activeFilters: filters.activeFilters,
      });
      setIsSelectVisible(false);
      return;
    }

    toast.warn("Free users can not select more than 25 at a time");
    setIsSelectVisible(false);
  };

  const handleClearAllCheckBox = () => {
    clearCheckedItems();
    setSelectedEmployeeCount(null);
    setPeopleNumberValue(0);
    setNumberOfPeopleValue(0);
    setIsSelectVisible(false);
  };

  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
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

  useEffect(() => {
    clearCheckedItems();
    setIsSelectVisible(false); // Optionally hide the dropdown
  }, [viewType, clearCheckedItems]);

  // handle export of selected items
  const handleExport = () => {
    if (checkedItems.length === 0) {
      alert("Please select at least one item to export");
      return;
    }

    // Prepare data for export
    const selectedItemsData = data.results.filter((item) =>
      checkedItems.includes(item._id)
    );

    // Define CSV header
    const header =
      "ID,Name,Title,Email,Phone Number,Company,Company Website URL,Company Linkedin URL,Company Facebook URL,Company Twitter URL,Company Address";

    // Function to escape CSV fields
    const escapeCsvField = (field) => {
      if (field === null || field === undefined) return "";
      // Escape double quotes by replacing them with two double quotes
      // Enclose field in double quotes if it contains commas, double quotes, or new lines
      const escapedField = field.toString().replace(/"/g, '""');
      return /[",\n]/.test(escapedField) ? `"${escapedField}"` : escapedField;
    };

    // Convert data to CSV format
    const csvContent =
      "data:text/csv;charset=utf-8," +
      header +
      "\n" + // Add header to CSV content
      selectedItemsData
        .map((item) => {
          const src = item._source || {};
          const companyAddress = [src.organization_hq_location_city, src.organization_hq_location_state, src.organization_hq_location_country].filter(Boolean).join(", ");
          return [
            escapeCsvField(item._id),
            escapeCsvField(src.person_name),
            escapeCsvField(src.person_title),
            escapeCsvField(src.person_email),
            escapeCsvField(src.person_phone),
            escapeCsvField(src.organization_name),
            escapeCsvField(src.organization_website_url),
            escapeCsvField(src.organization_linkedin_url),
            escapeCsvField(src.organization_facebook_url),
            escapeCsvField(src.organization_twitter_url),
            escapeCsvField(companyAddress),
          ].join(",");
        })
        .join("\n");

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="flex flex-wrap items-center py-2 bg-white border-t lead-head border-x">
      <div
        onClick={(e) => handleSelectClick(e)}
        ref={toggleRef}
        className="toggle-button relative flex cursor-pointer items-center h-[25px] justify-center bg-gray-100 ml-1 mr-4 rounded-sm"
      >
        <input
          type="checkbox"
          className="lead-checkbox-all ml-[4px]"
          checked={
            selectAllMode ||
            (checkedItems.length === data?.results?.length &&
              checkedItems.length > 0)
          }
          onChange={() => {
            if (selectAllMode) {
              setSelectAllMode(false);
              clearCheckedItems();
              setIsSelectVisible(false);
            } else if (
              checkedItems.length === data?.results?.length &&
              checkedItems.length > 0
            ) {
              clearCheckedItems();
              setIsSelectVisible(false);
            } else {
              handleSelectAllCheckBox();
            }
          }}
        />
        {(checkedItems.length > 0 || selectAllMode) && (
          <div className="ml-2">
            <p className="text-sm flex items-center gap-1 text-gray-900">
              {selectAllMode
                ? (totalLoading && (data?.counts?.[viewType] ?? null) == null ? <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span> : totalLoading ? <ImSpinner9 className="animate-spin" /> : `${(data?.counts?.[viewType] || 0).toLocaleString()} Selected`)
                : `${checkedItems.length} Selected`}
            </p>
          </div>
        )}
        <ChevronDown
          size={18}
          className="ml-[2px] mr-[1px] text-gray-600 hover:text-blue-500"
        />

        {/* Dropdown anchored to button */}
        {isSelectVisible && data?.results?.length > 0 && (
          <div className="absolute z-30 top-full left-0 mt-1">
            <SelectOptions
              dropdownRef={dropdownRef}
              isAdvanceVisible={isAdvanceVisible}
              handleAdvanceClick={handleAdvanceClick}
               numberPeopleValue={numberPeopleValue}
              handlePeopleChange={handlePeopleChange}
              onSelectAllCheckBox={handleSelectAllCheckBox}
              onApplySelection={handleApplySelection}
              onClearCheckedItems={handleClearAllCheckBox}
               totalCount={data?.counts?.[viewType] || 0}
              onPageCount={data?.results?.length || 0}
              onSelectAllPeople={handleSelectAllPeople}
              isFreeUser={isFreeUser}
              numberOfPeopleValue={numberOfPeopleValue}
              handleNumberOfPeopleChange={handleNumberOfPeopleChange}
            />
          </div>
        )}
      </div>

      {data?.results?.length > 0 && filters.viewType !== "saved" && (
        <button
          className="flex items-center ml-5 text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500"
          onClick={() => {
            if (!selectAllMode && checkedItems.length === 0) {
              toast.warn("Please select at least one item to save.");
              return;
            }

            const creds = user?.credits || {};
            const emailBalance = creds.emailCredits?.current || 0;
            const phoneBalance = creds.phoneCredits?.current || 0;
            const exportBalance = creds.exportCredits?.current || 0;

            if (selectAllMode) {
              const total = data?.counts?.[viewType] || 0;
              if (total > exportBalance) {
                toast.error("Insufficient credits.");
                return;
              }
            } else {
              const quantity = checkedItems.length;
              if (quantity > exportBalance) {
                toast.error("Insufficient credits.");
                return;
              }

              const validItems = (data?.results || []).filter(item =>
                item && item._id && typeof item._id === "string" && item._id.length > 0
              );
              const leadsWithEmail = validItems.filter(item => {
                const src = item._source || item || {};
                return !!(src.person_email || src.email);
              }).length;
              const leadsWithPhone = validItems.filter(item => {
                const src = item._source || item || {};
                return !!(src.person_phone || src.phone);
              }).length;

              if (leadsWithEmail > emailBalance) {
                toast.error("Insufficient credits.");
                return;
              }
              if (leadsWithPhone > phoneBalance) {
                toast.error("Insufficient credits.");
                return;
              }
            }

            setSaveLeadsVisible(true);
          }}
        >
          <span>
            <Save size={17} className="mr-2" />
          </span>
          <span className="flex items-center gap-1">
            Save leads{selectAllMode ? (totalLoading && (data?.counts?.[viewType] ?? null) == null ? <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span> : totalLoading ? <ImSpinner9 className="animate-spin" /> : ` (${(data?.counts?.[viewType] || 0).toLocaleString()})`) : checkedItems.length > 0 ? ` (${checkedItems.length})` : ""}
          </span>
        </button>
      )}
      {data?.results?.length > 0 && (
        <button
          className="flex items-center ml-5 text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500"
          onClick={() => {
            if (!selectAllMode && checkedItems.length === 0) {
              toast.warn("Please select at least one item to export.");
              return;
            }

            const creds = user?.credits || {};
            const exportBalance = creds.exportCredits?.current || 0;
            const emailBalance = creds.emailCredits?.current || 0;
            const phoneBalance = creds.phoneCredits?.current || 0;

            if (selectAllMode) {
              const total = data?.counts?.[viewType] || 0;
              if (total > exportBalance) {
                toast.error("Insufficient export credits.");
                return;
              }
            } else {
              const quantity = checkedItems.length;
              if (quantity > exportBalance) {
                toast.error("Insufficient export credits.");
                return;
              }
              const validItems = (data?.results || []).filter(item =>
                item && item._id && typeof item._id === "string" && item._id.length > 0
              );
              const leadsWithEmail = validItems.filter(item => {
                const src = item._source || item || {};
                return !!(src.person_email || src.email);
              }).length;
              const leadsWithPhone = validItems.filter(item => {
                const src = item._source || item || {};
                return !!(src.person_phone || src.phone);
              }).length;

              if (leadsWithEmail > emailBalance) {
                toast.error("Insufficient email credits.");
                return;
              }
              if (leadsWithPhone > phoneBalance) {
                toast.error("Insufficient phone credits.");
                return;
              }
            }

            setExportLeadsVisible(true);
          }}
        >
          <span>
            <FolderUp size={17} className="mr-2" />
          </span>
          <span className="flex items-center gap-1">
            Export leads{selectAllMode ? (totalLoading && (data?.counts?.[viewType] ?? null) == null ? <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span> : totalLoading ? <ImSpinner9 className="animate-spin" /> : ` (${(data?.counts?.[viewType] || 0).toLocaleString()})`) : checkedItems.length > 0 ? ` (${checkedItems.length})` : ""}
          </span>
        </button>
      )}
      {data?.results?.length > 0 && filters.viewType === "saved" && (
        <button
          className="flex items-center ml-5 text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500"
          onClick={async () => {
            try {
              const token = localStorage.getItem("userAccessToken");
              const res = await axios.get(`${BASE_URL}/api/saved/list`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              let savedItems = [];
              if (Array.isArray(res.data)) savedItems = res.data;
              else if (Array.isArray(res.data?.data)) savedItems = res.data.data;
              if (savedItems.length > 0) {
                const exportBalance = user?.credits?.exportCredits?.current || 0;
                if (savedItems.length > exportBalance) {
                  toast.error("Insufficient export credits.");
                  return;
                }
                toggleAllCheckedItems(savedItems.map((item) => ({ _id: item.contactId })));
                setExportLeadsVisible(true);
              } else {
                toast.warn("No saved contacts to export.");
              }
            } catch {
              toast.error("Failed to load saved contacts.");
            }
          }}
        >
          <span>
            <Download size={17} className="mr-2" />
          </span>
          <span className="flex items-center gap-1">
            Export All{totalLoading && (counts?.saved ?? null) == null ? <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span> : totalLoading ? <ImSpinner9 className="animate-spin" /> : ` (${(counts?.saved ?? 0).toLocaleString()})`}
          </span>
        </button>
      )}
    </div>
  );
}

export default LeadSelectBar;
