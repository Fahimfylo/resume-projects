import { Bookmark, EllipsisVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { saveSearch, deleteRecentSearch } from "../../services/searchServices";
import useStore from "../../store/store";
import { notifyRecentToSaved, showToastIfPopupDisabled } from "../../utils/notificationHelper";

const VALID_FILTER_KEYS = [
  "countries", "city", "zip", "jobTitle", "list", "industry", "seniority",
  "personName", "employeeRange", "revenueRange", "emailStatus", "emailType",
  "foundedYear", "organizationName", "gender", "stage"
];

const FILTER_LABELS = {
  countries: "Country",
  city: "City",
  zip: "ZIP / Postal Code",
  jobTitle: "Job Title",
  list: "List",
  industry: "Industry",
  seniority: "Seniority",
  personName: "Name",
  employeeRange: "Employees",
  revenueRange: "Annual Revenue",
  emailStatus: "Email Status",
  emailType: "Email Type",
  foundedYear: "Founded Year",
  organizationName: "Company Name",
  gender: "Gender",
  stage: "Stage",
};

const RecentSearches = ({ searches = [], onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const setLastSavedUpdate = useStore((state) => state.setLastSavedUpdate);

  const navigate = useNavigate();

  const applySearch = (search) => {
    const filtersObj = search?.searchParams?.filters || search?.filters || {};
    const excludedObj = search?.searchParams?.excludedFilters || {};

    // Apply the saved filter set into the global store
    useStore.getState().setInitialFilters(filtersObj, excludedObj);

    // Navigate to the search page
    navigate("/search");
  };

  const handleToggleSave = async (e, search) => {
    e.stopPropagation();
    try {
      const success = await saveSearch(
        search.searchParams.filters || search.filters || {},
        search.searchParams.excludedFilters || {}
      );
      if (success) {
        setLastSavedUpdate(Date.now());
        showToastIfPopupDisabled("Added to saved searches");
        notifyRecentToSaved("Custom Search");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Operation failed";
      toast.error(msg);
    }
  };

  const handleSave = async (e, search) => {
    e.stopPropagation();
    try {
      const success = await saveSearch(
        search.searchParams.filters || search.filters || {},
        search.searchParams.excludedFilters || {}
      );
      if (success) {
        setLastSavedUpdate(Date.now());
        showToastIfPopupDisabled("Saved search");
        notifyRecentToSaved("Custom Search");
      }
    } catch (error) {
      // console.error("save failed", error);
      const msg = error.response?.data?.error || error.message || "Unable to save search";
      toast.error(msg);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await deleteRecentSearch(id);
    if (ok) {
      setOpenMenuId(null);
      showToastIfPopupDisabled("Deleted");
      if (onDelete) onDelete(id);
    } else {
      toast.error("Delete failed");
    }
  };

  const getFilterDisplayText = (search) => {
    const filters = search?.searchParams?.filters || {};
    // Helper for determining emptiness
    const isEmptyValue = (value) => {
      if (value == null || value === "") return true;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === "object") return Object.keys(value).length === 0;
      return false;
    };

    // Filter out only valid filter keys and exclude empty values
    const filledFilters = Object.entries(filters)
      .filter(([key, value]) => {
        return (
          VALID_FILTER_KEYS.includes(key) && !isEmptyValue(value)
        );
      })
      .slice(0, 3); // Show only first 3 filled filters

    if (filledFilters.length === 0) {
      return search?.title || "Recent Search";
    }

    return filledFilters
      .map(([key, value]) => {
        const label = FILTER_LABELS[key] || key;
        if (Array.isArray(value)) {
          return `${label}: ${value.join(", ")}`;
        }
        return `${label}: ${value}`;
      })
      .join(", ");
  };

  const getFormattedDate = (dateString) => {
    try {
      return dateString ? new Date(dateString).toLocaleString() : new Date().toLocaleString();
    } catch (err) {
      return new Date().toLocaleString();
    }
  };

  return (
    <ul className="space-y-2 flex-1">
      {searches.length === 0 ? (
        <div className="flex items-center justify-center h-[150px] text-gray-400">
          No recent searches found
        </div>
      ) : (
        searches.map((search) => {
          const displayText = getFilterDisplayText(search);

          return (
            <li
              key={search._id}
              onClick={() => applySearch(search)}
              className="relative flex items-center group justify-between border-b border-gray-200 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 pr-4">
                <div className="font-medium text-gray-700 text-sm group-hover:text-blue-500 truncate">
                  {displayText}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getFormattedDate(search.createdAt)}
                </div>
              </div>
              <div className="flex items-center text-gray-400 gap-2">
                <Bookmark
                  size={18}
                  className="cursor-pointer transition-colors hover:text-blue-600"
                  onClick={(e) => handleToggleSave(e, search)}
                />

                <div className="relative">
                  <EllipsisVertical
                    size={18}
                    className="hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(
                        openMenuId === search._id ? null : search._id,
                      );
                    }}
                  />
                  {openMenuId === search._id && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50">
                      <button
                        onClick={(e) => handleDelete(e, search._id)}
                        className="flex items-center w-full font-semibold px-4 py-2 text-sm text-red-600 hover:bg-red-50 gap-2"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })
      )}
    </ul>
  );
};

export default RecentSearches;
