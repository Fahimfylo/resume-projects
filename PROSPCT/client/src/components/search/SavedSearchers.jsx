// src/components/search/SavedSearches.jsx
import { Bookmark, EllipsisVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { deleteSavedSearch } from "../../services/searchServices";
import useStore from "../../store/store";
import { useNavigate } from "react-router-dom";
import { notifySearchDeleted, showToastIfPopupDisabled } from "../../utils/notificationHelper";

const VALID_FILTER_KEYS = [
  "countries",
  "city",
  "zip",
  "jobTitle",
  "list",
  "industry",
  "seniority",
  "personName",
  "employeeRange",
  "revenueRange",
  "emailStatus",
  "emailType",
  "foundedYear",
  "organizationName",
  "gender",
  "stage",
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

const SavedSearches = ({ searches = [], onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const setLastSavedUpdate = useStore((state) => state.setLastSavedUpdate);
  const navigate = useNavigate();

  const applySearch = (search) => {
    const filtersObj = search?.searchParams?.filters || search?.filters || {};
    const excludedObj = search?.searchParams?.excludedFilters || {};
    useStore.getState().setInitialFilters(filtersObj, excludedObj);
    navigate("/search");
  };

  const handleBookmarkClick = async (e, id) => {
    e.stopPropagation();
    const ok = await deleteSavedSearch(id);

    if (ok) {
      showToastIfPopupDisabled("Removed from saved searches");
      notifySearchDeleted("Saved", 1);
      setLastSavedUpdate(Date.now());

      if (onDelete) {
        setTimeout(() => onDelete(id), 50);
      }
    } else {
      toast.error("Failed to remove saved search");
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await deleteSavedSearch(id);

    if (ok) {
      setOpenMenuId(null);
      showToastIfPopupDisabled("Deleted saved search");
      notifySearchDeleted("Saved", 1);
      setLastSavedUpdate(Date.now());

      if (onDelete) {
        setTimeout(() => onDelete(id), 50);
      }
    } else {
      toast.error("Failed to delete saved search");
    }
  };

  const getFilterDisplayText = (search) => {
    const filters = search?.searchParams?.filters || search?.filters || {};

    const isEmptyValue = (value) => {
      if (value == null || value === "") return true;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === "object") return Object.keys(value).length === 0;
      return false;
    };

    const filledFilters = Object.entries(filters)
      .filter(([key, value]) => {
        return VALID_FILTER_KEYS.includes(key) && !isEmptyValue(value);
      })
      .slice(0, 3);

    if (filledFilters.length === 0) {
      return search?.searchName || search?.title || "Unnamed Search";
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
      return dateString
        ? new Date(dateString).toLocaleDateString()
        : new Date().toLocaleDateString();
    } catch {
      return new Date().toLocaleDateString();
    }
  };

  return (
    <ul className="space-y-2 flex-1">
      {searches.length === 0 ? (
        <div className="flex items-center justify-center h-[150px] text-gray-400">
          No saved searches found
        </div>
      ) : (
        searches.map((search, index) => {
          const itemId = search._id || index;
          const displayText = getFilterDisplayText(search);

          return (
            <li
              key={itemId}
              onClick={() => applySearch(search)}
              className="relative flex items-center group justify-between border-b border-gray-200 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {/* Left Content */}
              <div className="flex-1 pr-4">
                <div className="font-medium text-gray-700 text-sm group-hover:text-blue-500 truncate">
                  {displayText}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {getFormattedDate(search.createdAt)}
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center text-gray-400 gap-2">
                <Bookmark
                  size={18}
                  className="cursor-pointer fill-blue-500 text-blue-500 hover:text-blue-600 transition-colors"
                  onClick={(e) => handleBookmarkClick(e, itemId)}
                />

                <div className="relative">
                  <EllipsisVertical
                    size={18}
                    className="hover:text-blue-600 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === itemId ? null : itemId);
                    }}
                  />

                  {openMenuId === itemId && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50">
                      <button
                        onClick={(e) => handleDelete(e, itemId)}
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

export default SavedSearches;
