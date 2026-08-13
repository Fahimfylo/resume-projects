import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";

import { toast } from "react-toastify";
import { FaLink, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Save, Download, MoreVertical, Trash2, ChevronDown, ChevronsUpDown } from "lucide-react";
import SocialLink from "../common/SocialLink";
import { ImSpinner9 } from "react-icons/im";

import SelectOptions from "../search/SelectOptions";
import Pagination from "../search/Pagination";
import EditCompanyColumns from "./EditCompanyColumns";
import ExportContacts from "../contact/ExportContacts";
import EmptyPage from "../common/EmptyPage";
import CompanyTableSkeleton from "./CompanyTableSkeleton";
import SaveCompanies from "./SaveCompanies";
import ExportCompanies from "./ExportCompanies";

import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { sanitizeDomainForDisplay } from "../../utils/logoHelper";
import { formatContact, formatCompany } from "../../utils/contactFormatter";
import { notifyContactDeleted, showToastIfPopupDisabled } from "../../utils/notificationHelper";

// Legal suffixes to strip for better matching
const LEGAL_SUFFIXES = [
  /\s*,?\s*inc\.?$/i,
  /\s*,?\s*llc\.?$/i,
  /\s*,?\s*ltd\.?$/i,
  /\s*,?\s*limited$/i,
  /\s*,?\s*corp\.?$/i,
  /\s*,?\s*corporation$/i,
  /\s*,?\s*co\.?$/i,
  /\s*,?\s*company$/i,
  /\s*,?\s*plc\.?$/i,
];

// Normalize company name for deduplication (matches backend)
function normalizeCompanyName(name) {
  if (!name || typeof name !== "string") return null;
  
  let normalized = name.trim();
  if (normalized === "" || normalized.toLowerCase() === "[missing]") return null;
  
  normalized = normalized.toLowerCase();
  
  // Remove legal suffixes
  LEGAL_SUFFIXES.forEach(regex => {
    normalized = normalized.replace(regex, "");
  });
  
  // Remove punctuation and standardize
  normalized = normalized
    .replace(/[.,;:'"()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/&/g, "and")
    .trim();
  
  return normalized.length > 0 ? normalized : null;
}

function CompanyContainer() {
  const { hasFeature } = useFeatureAccess();

  const {
    companyFilter,
    companySearchQuery,
    companyListId,
    companyActiveFilters,
    filters,
    setFilters,
    checkedItems,
    toggleCheckedItems,
    toggleAllCheckedItems,
    clearCheckedItems,
    decrementSavedCount,
    setHasCompanyData,
    visibleCompanyColumns,
    companyCounts,
    setCompanyCounts,
    setIsDataLoading,
    isDataLoading,
    setSaveCompaniesVisible,
    setExportCompaniesVisible,
    setCompanyFilter,
    selectAllMode,
    setSelectAllMode,
    selectAllFilters,
    cursorHistory,
    setNextPageInfo,
    resetCursorState,
    dataRefreshKey,
  } = useStore();

  const user = useStore((state) => state.user);
  const isFreeUser = !user || user?.plan?.name === "Free" || user?.plan?.type === "free";

  const page = cursorHistory.length + 1;
  const perPage = filters?.limit || 25;

  const BASE_URL = API_CONFIG.API_ENDPOINT;

  const [isSavedMenuVisible, setIsSavedMenuVisible] = useState(false);
  const savedMenuRef = useRef(null);
  const savedMenuToggleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isSavedMenuVisible &&
        savedMenuRef.current &&
        !savedMenuRef.current.contains(e.target) &&
        savedMenuToggleRef.current &&
        !savedMenuToggleRef.current.contains(e.target)
      ) {
        setIsSavedMenuVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSavedMenuVisible]);

  const [isSelectVisible, setIsSelectVisible] = useState(false);
  const [isAdvanceVisible, setIsAdvanceVisible] = useState(true);
  const selectToggleRef = useRef(null);
  const selectDropdownRef = useRef(null);
  const [numberPeopleValue, setNumberPeopleValue] = useState(0);

  const handleSelectClick = () => {
    setIsSelectVisible((prev) => !prev);
  };

  const handleAdvanceClick = () => {
    setIsAdvanceVisible(!isAdvanceVisible);
  };

  const handlePeopleChange = (e) => {
    setNumberPeopleValue(e.target.value);
  };

  const handleApplySelection = () => {
    const peopleCount = Number(numberPeopleValue);
    if (!peopleCount || peopleCount <= 0) {
      toast.info("Enter a number of people to select");
      return;
    }
    const validResults = paginatedCompanies.filter(
      (item) => item && item._id && typeof item._id === "string" && item._id.length > 0
    );
    const itemsToSelect = validResults.slice(0, peopleCount);
    if (itemsToSelect.length === 0) {
      toast.info("No items available to select");
      return;
    }
    toggleAllCheckedItems(itemsToSelect);
    setIsSelectVisible(false);
  };

  const handleSelectAllCheckBox = () => {
    const allItems = paginatedCompanies.filter(
      (item) => item && item._id && typeof item._id === "string" && item._id.length > 0
    );
    toggleAllCheckedItems(allItems);
    setIsSelectVisible(false);
  };

  const handleSelectAllPeople = () => {
    if (isFreeUser) {
      toast.warn("Free users can not select more than 25 at a time");
      setIsSelectVisible(false);
      return;
    }

    const allItems = optimizedCompanies.filter(
      (item) => item && item._id && typeof item._id === "string" && item._id.length > 0
    );
    toggleAllCheckedItems(allItems);
    setSelectAllMode(true, {
      companyFilter,
      companySearchQuery,
      companyListId,
      companyActiveFilters,
    });
    setIsSelectVisible(false);
  };

  const handleClearAllCheckBox = () => {
    clearCheckedItems();
    setSelectAllMode(false);
    setIsSelectVisible(false);
  };

  useEffect(() => {
    const handleClickOutsideSelect = (e) => {
      if (
        selectDropdownRef.current &&
        !selectDropdownRef.current.contains(e.target) &&
        selectToggleRef.current &&
        !selectToggleRef.current.contains(e.target)
      ) {
        setIsSelectVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSelect);
    return () => document.removeEventListener("mousedown", handleClickOutsideSelect);
  }, []);
  /* ===============================
     DATA FETCHING (paginated)
  =============================== */
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [countData, setCountData] = useState(null);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stable filter key for active filters
  const activeFiltersKey = useMemo(
    () => JSON.stringify(companyActiveFilters),
    [companyActiveFilters],
  );

  // Map internal field names to API field names
  const toApiField = useCallback((field) => {
    switch (field?.toLowerCase()) {
      case "company":
      case "name":       return "organizationName";
      case "domain":     return "organizationDomain";
      case "citystate":  return "cityState";
      case "country":    return "country";
      case "zip":        return "zip";
      case "location":   return "location";
      case "industry":   return "industry";
      case "employees":  return "employeeRange";
      case "keywords":   return "keywords";
      default:           return field;
    }
  }, []);

  // Fetch companies — fires on filter/page change
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);

      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const effectiveFilter = companyFilter === "total" ? "all"
        : companyFilter === "saved" ? "my"
          : companyFilter;

      try {
        if (effectiveFilter === "list" && companyListId) {
          const res = await axios.get(`${BASE_URL}/api/saved-companies/list`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          setResults(res.data?.results || res.data?.data || (Array.isArray(res.data) ? res.data : []));
          return;
        }

        if (effectiveFilter === "all" || effectiveFilter === "new") {
          const postData = { filters: { limit: perPage, cursor: filters.cursor || null } };
          if (companyActiveFilters && Object.keys(companyActiveFilters).length > 0) {
            Object.entries(companyActiveFilters).forEach(([field, value]) => {
              postData.filters[toApiField(field)] = Array.isArray(value) ? value : [value];
            });
          }

          const res = await axios.post(`${BASE_URL}/api/search/companies`, postData, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cancelled) return;
          setResults(res.data?.results || []);
          setSearchTotal(res.data?.total);
          setNextPageInfo(res.data?.nextCursor ?? null, res.data?.hasMore ?? false);
          return;
        }

        // Default: saved/my filter
        const res = await axios.get(`${BASE_URL}/api/saved-companies/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        setResults(res.data?.results || res.data?.data || (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        if (!cancelled) setFetchError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter, companySearchQuery, companyListId, activeFiltersKey, page, perPage, refreshKey]);

  // Fetch counts — fires on active filter changes or refresh
  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      setIsCountLoading(true);
      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const countFilters = {};
      if (companyActiveFilters && Object.keys(companyActiveFilters).length > 0) {
        Object.entries(companyActiveFilters).forEach(([field, value]) => {
          countFilters[toApiField(field)] = Array.isArray(value) ? value : value;
        });
      }

      try {
        const res = await axios.post(
          `${BASE_URL}/api/search/companies-count`,
          { filters: { ...countFilters } },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!cancelled) setCountData(res.data);
      } catch {
        // silently fail — pagination falls back to local count
      } finally {
        if (!cancelled) setIsCountLoading(false);
      }
    };

    fetchCount();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFiltersKey, refreshKey, dataRefreshKey]);

  // Reset cursor pagination when filters change
  useEffect(() => {
    resetCursorState();
  }, [activeFiltersKey]);

  const savedItems = results;


  // Combine formatting and filtering into one useMemo for better performance
  const filteredCompanies = useMemo(() => {
    const afterFormat = savedItems
      .map((saved) => {
        // Use companyData from SavedCompanies, fallback to the full document
        const raw = saved?.companyData || saved?.contactData || saved; // NOT saved._source — that loses _id and _source fields

        // Use formatCompany for company data, formatContact for contact data
        const formatted = raw ? (saved?.companyData ? formatCompany(raw) : formatContact(raw)) : null;
        if (!formatted) return null;

        // For "my" filter, only show companies (records with organization_name)
        if (companyFilter === "my") {
          const source = raw._source || raw;
          if (!source.organization_name) return null;
        }

        const listIdsRaw =
          saved?.listIds ||
          (saved?.listId ? [saved.listId] : []) ||
          (Array.isArray(saved?.list)
            ? saved.list
            : saved?.list
              ? [saved.list]
              : []);

        const listIds = Array.isArray(listIdsRaw)
          ? listIdsRaw.map((id) => String(id))
          : [];

        return {
          ...formatted,
          is_saved: companyFilter === "all" || companyFilter === "total" ? Boolean(saved?.is_saved) : true,
          listIds,
        };
      })
      .filter(Boolean);

    const afterFilter = afterFormat.filter((company) => {
      // If list filter is active, handle it separately
      if (companyFilter === "list" && companyListId) {
        if (company.listIds && Array.isArray(company.listIds)) {
          if (!company.listIds.includes(String(companyListId))) return false;
        }
      }

      // Apply sidebar filters (company, location, industry, etc.) when in list mode
      if (companyActiveFilters && Object.keys(companyActiveFilters).length > 0) {
        for (const [field, value] of Object.entries(companyActiveFilters)) {
          if (!value) continue;

          // Handle employees filter specially (supports multiple ranges)
          if (field?.toLowerCase() === "employees") {
            const employeeCount = parseInt(company.employees, 10) || 0;
            const rangeList = Array.isArray(value) ? value : [value];
            let matches = false;

            for (const rangeStr of rangeList) {
              const trimmed = (rangeStr || '').toString().trim();
              if (!trimmed) continue;

              if (trimmed.includes('and more')) {
                const min = parseInt(trimmed.replace(/\D/g, ''), 10);
                matches = employeeCount >= min;
              } else if (trimmed.includes('-')) {
                const [minStr, maxStr] = trimmed.split('-').map(s => s.trim());
                const min = parseInt(minStr, 10) || 0;
                const max = parseInt(maxStr, 10) || Number.MAX_SAFE_INTEGER;
                matches = employeeCount >= min && employeeCount <= max;
              } else {
                matches = String(company.employees).toLowerCase().includes(trimmed.toLowerCase());
              }
              if (matches) break; // OR logic: any matching range is sufficient
            }

            if (!matches) return false;
            continue;
          }

          const fieldValue = (() => {
            switch (field?.toLowerCase()) {
              case "company":
              case "name":
                return company.company || company.organization_name;
              case "domain":
                return company.organizationWebsite;
              case "citystate":
                return [
                  company._locationCity,
                  company._locationState,
                  company._locationCityWithStateOrCountry,
                  company._locationStateWithCountry,
                ].filter(Boolean).join(' ');
              case "country":
                return company._locationCountry || company.country;
              case "zip":
                return company._locationPostalCode || company.postalCode;
              case "location":
                return [
                  company.location,
                  company._locationCity,
                  company._locationState,
                  company._locationCountry,
                  company._locationPostalCode,
                  company._locationCityWithStateOrCountry,
                  company._locationStateWithCountry,
                ].filter(Boolean).join(' ');
              case "industry":
                return company.industry;
              case "keywords":
                return company.keywords;
              default:
                return company[field];
            }
          })();

          // Case-insensitive partial match (supports multi-select values)
          const valueList = Array.isArray(value) ? value : [value];
          if (fieldValue && typeof fieldValue === 'string') {
            if (!valueList.some(v => fieldValue.toLowerCase().includes(v.toLowerCase()))) {
              return false;
            }
          } else if (fieldValue && Array.isArray(fieldValue)) {
            if (!valueList.some(v => fieldValue.some(fv => String(fv).toLowerCase().includes(v.toLowerCase())))) {
              return false;
            }
          } else {
            return false;
          }
        }
      }

      // Apply tab filter (Total/Saved/New)
      switch (companyFilter) {
        case "all":
        case "total":
          break;
        case "my":
        case "saved":
          if (!company.is_saved) return false;
          break;
        case "new":
          if (company.is_saved) return false;
          break;
        default:
          break;
      }

      return true;
    });

    return afterFilter;
  }, [savedItems, companyFilter, companySearchQuery, companyListId, companyActiveFilters]);

  const optimizedCompanies = filteredCompanies;
  // Use total from the accurate count endpoint for pagination
  const totalItems = (countData?.total != null && countData?.total > 0)
    ? countData.total
    : (searchTotal != null && searchTotal > 0)
      ? searchTotal
      : optimizedCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Compute counts — backend now returns contextual { total, saved, new }.
  // new = total - saved (contextual: only saved companies matching current filters).
  const computedCounts = useMemo(() => {
    const serverTotal = countData?.total;
    const total = (serverTotal != null && serverTotal > 0)
      ? Math.max(serverTotal, totalItems)
      : totalItems;
    const serverSaved = countData?.saved;
    const saved = serverSaved != null
      ? Math.min(serverSaved, total)
      : 0;
    return {
      total,
      saved,
      new: countData?.new != null ? countData.new : Math.max(0, total - saved),
    };
  }, [totalItems, countData, searchTotal]);

  const prevCountsRef = useRef({ total: 0, saved: 0, new: 0 });

  // Sync computed counts to store
  useEffect(() => {
    if (
      computedCounts.total !== prevCountsRef.current.total ||
      computedCounts.saved !== prevCountsRef.current.saved ||
      computedCounts.new !== prevCountsRef.current.new
    ) {
      prevCountsRef.current = computedCounts;
      setCompanyCounts(computedCounts);
    }
  }, [computedCounts, setCompanyCounts]);

  const paginatedCompanies = optimizedCompanies;

  const isCompanyEmpty = !isLoading && !fetchError && paginatedCompanies.length === 0;

  const allChecked =
    paginatedCompanies.length > 0 &&
    paginatedCompanies.every((company) =>
      checkedItems.some((item) => item._id === company._id),
    );

  // Column definitions for companies table
  const columnDefinitions = {
    "Name": { key: "company", label: "Name", width: "380px" },
    "Links": { key: "links", label: "Links", width: "220px" },
    "Industry": { key: "industry", label: "Industry", width: "300px" },
    "Keywords": { key: "keywords", label: "Keywords", width: "380px" },
    "Employees": { key: "employees", label: "Employees", width: "220px" },
    "Zip": { key: "zip", label: "Zip", width: "140px" },
    "Headquarters": { key: "location", label: "Headquarters", width: "320px" },
  };

  // Get visible column definitions
  const visibleColumnDefs = visibleCompanyColumns
    .map(col => columnDefinitions[col])
    .filter(Boolean);

  const handleToggleRow = (company) => {
    toggleCheckedItems(company);
  };

  // Sync loading state to global store
  useEffect(() => {
    setIsDataLoading(isLoading);
  }, [isLoading, setIsDataLoading]);

  useEffect(() => {
    setFilters("currentPage", 1);
  }, [companyFilter, companySearchQuery, companyListId, companyActiveFilters, setFilters]);

  // Update store with data availability
  useEffect(() => {
    if (!isLoading) {
      setHasCompanyData(savedItems.length > 0);
    }
  }, [isLoading, savedItems, setHasCompanyData]);

  
  const handleDeleteSelectedSaved = async () => {
    if (checkedItems.length === 0) {
      toast.warn("No items selected to delete.");
      return;
    }
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) { toast.error("Please log in."); return; }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete {checkedItems.length} company/companies?
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
              toast.dismiss(toastId);
              try {
                const ids = checkedItems.map(item => item._id);
                const res = await axios.delete(`${BASE_URL}/api/saved-companies`, {
                  headers: { Authorization: `Bearer ${token}` },
                  data: { companyIds: ids },
                });
                const deleted = res.data?.deleted || 0;
                showToastIfPopupDisabled(`${deleted} companies deleted.`);
                setIsSavedMenuVisible(false);
                notifyContactDeleted(deleted);
                clearCheckedItems();

                if (companyFilter === "saved" || companyFilter === "my") {
                  setResults([]);
                }

                setCompanyCounts(prev => ({
                  ...prev,
                  saved: Math.max(0, (prev?.saved || 0) - deleted),
                  new: (prev?.total || 0) - Math.max(0, (prev?.saved || 0) - deleted),
                }));
              } catch (err) {
                toast.error(err.response?.data?.message || "Failed to delete.");
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

  const handleDeleteAllSaved = async () => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) { toast.error("Please log in."); return; }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete ALL saved companies? This action cannot be undone.
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
              toast.dismiss(toastId);
              try {
                const res = await axios.delete(`${BASE_URL}/api/saved-companies/all`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const deleted = res.data?.deleted || 0;
                showToastIfPopupDisabled(`${deleted} companies deleted.`);
                setIsSavedMenuVisible(false);
                notifyContactDeleted(deleted);
                clearCheckedItems();

                if (companyFilter === "saved" || companyFilter === "my") {
                  setResults([]);
                }

                setCompanyCounts({
                  total: companyCounts?.total || 0,
                  saved: 0,
                  new: companyCounts?.total || 0,
                });

                useStore.getState().incrementDataRefreshKey();
              } catch (err) {
                toast.error(err.response?.data?.message || "Failed to delete all.");
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

  const handleSelectPage = () => {
    if (selectAllMode) {
      setSelectAllMode(false);
      clearCheckedItems();
      return;
    }
    const validResults = paginatedCompanies.filter(
      (item) => item && item._id && typeof item._id === "string" && item._id.length > 0
    );
    if (allChecked) {
      const currentIds = validResults.map((r) => r._id);
      const remaining = checkedItems.filter((ci) => !currentIds.includes(ci._id));
      toggleAllCheckedItems(remaining);
    } else {
      const merged = [...checkedItems];
      validResults.forEach((item) => {
        if (!merged.some((ci) => ci._id === item._id)) {
          merged.push(item);
        }
      });
      toggleAllCheckedItems(merged);
    }
  };

  return (
    <div className="flex-1 min-w-0 px-3 md:px-4 mt-3 flex flex-col h-full">
      <div className="flex-1 flex flex-col border border-gray-300 bg-white shadow-sm min-h-0 overflow-hidden rounded-lg">
        <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2 border-b border-gray-200">
        {/* New / Total / Saved filter tabs — inline flex row, no border */}
        <div className="flex items-center gap-1">
          {[
            { label: "New", value: "new" },
            { label: "Total", value: "total" },
            { label: "Saved", value: "saved" },
          ].map(({ label, value }) => {
            const isActive = companyFilter === value;
            return (
              <span
                key={value}
                className={`text-sm font-medium cursor-pointer px-2 py-1 transition-colors inline-flex items-center gap-1 ${
                  isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-500"
                }`}
                onClick={() => setCompanyFilter(value)}
              >
                {label} ({isDataLoading ? <ImSpinner9 className="inline animate-spin" /> : companyCounts?.[value] !== undefined ? companyCounts[value].toLocaleString() : "0"})
                {(companyFilter === "saved" || companyFilter === "my") && value === "saved" && (
                  <div className="relative inline-flex">
                    <button
                      ref={savedMenuToggleRef}
                      onClick={(e) => { e.stopPropagation(); setIsSavedMenuVisible(prev => !prev); }}
                      className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical size={12} />
                    </button>
                    {isSavedMenuVisible && (
                      <div
                        ref={savedMenuRef}
                        className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[150px]"
                      >
                        <button
                          onClick={handleDeleteSelectedSaved}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={12} />
                          Delete Selected
                        </button>
                        <button
                          onClick={handleDeleteAllSaved}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={12} />
                          Delete All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </span>
            );
          })}
        </div>

        {/* Select Page Toggle Button — hidden when empty */}
        {!isCompanyEmpty && (
        <button
          onClick={handleSelectPage}
          className={`cursor-pointer py-1.5 px-3 flex items-center border font-medium text-sm transition-colors
            ${allChecked
              ? "border-blue-500 text-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-500 hover:text-blue-500 bg-white"
            }`}
        >
          {allChecked ? "Deselect Page" : "Select Page"}
        </button>
        )}
      </div>

      {/* Row 2: Selection dropdown + Save + Export buttons */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2">
        {/* Selection dropdown trigger */}
        <div
          onClick={handleSelectClick}
          ref={selectToggleRef}
          className="relative flex cursor-pointer items-center gap-1 px-2 py-1 bg-gray-100 rounded-sm"
        >
          <input
            type="checkbox"
            className="lead-checkbox-all"
            checked={allChecked}
            readOnly
          />
          {(checkedItems.length > 0 || selectAllMode) && (
            <span className="text-sm font-medium text-blue-600">{selectAllMode ? (companyCounts?.total || 0).toLocaleString() : checkedItems.length}</span>
          )}
          <ChevronDown size={16} className="text-gray-600" />

          {isSelectVisible && !isCompanyEmpty && (
            <div className="absolute z-50 top-full left-0 mt-1">
              <SelectOptions
                dropdownRef={selectDropdownRef}
                isAdvanceVisible={isAdvanceVisible}
                handleAdvanceClick={handleAdvanceClick}
                numberPeopleValue={numberPeopleValue}
                handlePeopleChange={handlePeopleChange}
                onSelectAllCheckBox={handleSelectAllCheckBox}
                onApplySelection={handleApplySelection}
                onClearCheckedItems={handleClearAllCheckBox}
                hideAdvanceOptions
                totalCount={companyCounts?.total || 0}
                onPageCount={results.length}
                onSelectAllPeople={handleSelectAllPeople}
                isFreeUser={isFreeUser}
                entityLabel="companies"
              />
            </div>
          )}
        </div>

        {/* Save Companies Button — shown on New and Total tabs */}
        {(companyFilter === "new" || companyFilter === "total") && !isCompanyEmpty && (
        <button
          className="flex items-center text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500 "
          onClick={() => {
            if (!selectAllMode && checkedItems.length === 0) {
              toast.warn("Please select at least one item to save.");
              return;
            }

            const exportBalance = user?.credits?.exportCredits?.current || 0;
            const count = selectAllMode ? (companyCounts?.total || 0) : checkedItems.length;
            if (count > exportBalance) {
              toast.error("Insufficient credits.");
              return;
            }

            setSaveCompaniesVisible(true);
          }}
        >
          <span>
            <Save size={17} className="mr-2" />
          </span>
          <span>
            Save Companies{selectAllMode ? ` (${(companyCounts?.total || 0).toLocaleString()})` : checkedItems.length > 0 ? ` (${checkedItems.length})` : ""}
          </span>
        </button>
        )}

        {/* Export Companies Button — shown on New, Total, and Saved tabs */}
        {(companyFilter === "new" || companyFilter === "total" || companyFilter === "saved") && !isCompanyEmpty && (
        <button
          className="flex items-center text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500 "
          onClick={() => {
            if (!selectAllMode && checkedItems.length === 0) {
              toast.warn("Please select at least one item to export.");
              return;
            }

            const exportBalance = user?.credits?.exportCredits?.current || 0;
            const count = selectAllMode ? (companyCounts?.total || 0) : checkedItems.length;
            if (count > exportBalance) {
              toast.error("Insufficient credits.");
              return;
            }

            setExportCompaniesVisible(true);
          }}
        >
          <span>
            <Download size={17} className="mr-2" />
          </span>
          <span>
            Export Companies{selectAllMode ? ` (${(companyCounts?.total || 0).toLocaleString()})` : checkedItems.length > 0 ? ` (${checkedItems.length})` : ""}
          </span>
        </button>
        )}

        {/* Export All Button — only on Saved tab */}
        {companyFilter === "saved" && !isCompanyEmpty && (
        <button
          className="flex items-center text-sm text-gray-500 transition-colors delay-75 cursor-pointer hover:text-blue-500 "
          onClick={async () => {
            try {
              const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
              const res = await axios.get(`${BASE_URL}/api/saved-companies/list`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              let savedItems = [];
              if (Array.isArray(res.data)) savedItems = res.data;
              else if (Array.isArray(res.data?.data)) savedItems = res.data.data;
              if (savedItems.length > 0) {
                const exportBalance = user?.credits?.exportCredits?.current || 0;
                if (savedItems.length > exportBalance) {
                  toast.error("Insufficient credits.");
                  return;
                }
                toggleAllCheckedItems(savedItems.map((item) =>
                  item.companyData || { _id: item.companyId, _source: {} }
                ));
                setExportCompaniesVisible(true);
              } else {
                toast.warn("No saved companies to export.");
              }
            } catch {
              toast.error("Failed to load saved companies.");
            }
          }}
        >
          <span>
            <Download size={17} className="mr-2" />
          </span>
          <span>
            Export All ({companyCounts?.saved?.toLocaleString() ?? 0})
          </span>
        </button>
        )}


      </div>

      {/* Table wrapper */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 border-t border-gray-200 no-y-scrollbar relative">
        {isLoading ? (
          <CompanyTableSkeleton />
        ) : isCompanyEmpty ? (
          <div className="flex items-center justify-center h-full">
            <EmptyPage
              title={companyFilter === "saved" ? "No saved companies yet" : "No companies to display"}
              description={companyFilter === "saved" ? "Save companies from search results to see them here, or try adjusting your filters." : "No companies match your filter criteria. Please adjust filters or try a different search."}
            />
          </div>
        ) : (
        <table className="min-w-full text-left text-gray-800 table-fixed" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
          <thead
            className="text-xs bg-white border-b sticky top-0 z-30"
          >
            <tr className="bg-gray-50">
              <th className="w-12 py-3 px-3 text-center border-b border-gray-200">
                {/* Checkbox removed - use Select Page button above */}
              </th>

              {visibleColumnDefs.map((col, index) => (
                <th
                  key={col.key}
                  className={`py-3 px-5 text-start font-semibold text-gray-600 ${col.width} ${index === 0 ? 'sticky left-0 bg-gray-50 z-40 border-b border-gray-200' : 'border-b border-gray-200'}`}
                >
                  <div className="flex items-center">
                    <span>{col.label}</span>
                    <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {fetchError && (
              <tr>
                <td colSpan={visibleColumnDefs.length + 1} className="text-center py-12 text-red-600 font-medium">
                  Error loading companies
                </td>
              </tr>
            )}

            {paginatedCompanies.map((company) => {
              const isChecked = checkedItems.some(
                (item) => item._id === company._id,
              );

              const companyInitials = company.company?.substring(0, 2).toUpperCase() ?? "??";

              const renderLogo = () => {
                const rawDomain = company.organizationDomain || company.company;
                const cleanDomain = sanitizeDomainForDisplay(rawDomain);
                const domain =
                  cleanDomain
                    ? cleanDomain
                    : company.company
                      ? company.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
                      : null;

                const src = domain
                  ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                  : null;

                return src ? (
                  <>
                    <img
                      src={src}
                      alt={`${company.company} logo`}
                      className="w-full h-full object-contain rounded-full bg-white border border-gray-100"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-full bg-blue-500 rounded-full items-center justify-center text-white text-[10px] font-bold">
                      {companyInitials}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {companyInitials}
                  </div>
                );
              };

              return (
                <tr key={company._id} className="text-sm hover:bg-gray-50 group transition-colors">
                  <td className="text-center py-4 px-5 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRow(company)}
                    />
                  </td>

                  {visibleColumnDefs.map((col, index) => (
                    <td
                      key={col.key}
                      className={`py-4 px-5 border-b border-gray-200 ${index === 0 ? 'sticky left-0 bg-white group-hover:bg-gray-50 z-20 border-b border-gray-200' : ''}`}
                    >
                      {col.key === "company" ? (
                        <div className="flex items-center">
                          <div className="relative w-6 h-6 flex-shrink-0">
                            {renderLogo()}
                          </div>
                          <div className="ml-2 overflow-hidden">
                            <div className="truncate w-36 font-semibold">
                              {company.company || "Not Available"}
                            </div>
                            <div className="text-xs text-gray-500 truncate w-36">
                              {sanitizeDomainForDisplay(company.organizationDomain) || ""}
                            </div>
                          </div>
                        </div>
                      ) : col.key === "links" ? (
                        <div className="flex items-center gap-2">
                          <SocialLink
                            url={company.organizationWebsite || company.organizationDomain}
                            icon={FaLink}
                            size={17}
                          />
                          <SocialLink
                            url={company.organizationLinkedin}
                            icon={FaLinkedinIn}
                            size={19}
                          />
                          <SocialLink
                            url={company.organizationFacebook}
                            icon={FaFacebookF}
                            size={17}
                          />
                          <SocialLink
                            url={company.organizationTwitter}
                            icon={FaXTwitter}
                            size={17}
                          />
                        </div>
                      ) : col.key === "keywords" ? (
                        <span className="truncate">
                          {company[col.key] ? (() => {
                            const words = company[col.key].split(',').map(w => w.trim());
                            const truncatedWords = words.slice(0, 2).map(w => w.length > 15 ? w.substring(0, 15) + '...' : w);
                            return truncatedWords.join(', ') + (words.length > 2 ? '...' : '');
                          })() : "Not Available"}
                        </span>
                      ) : col.key === "zip" ? (
                        <span className="truncate">{company._locationPostalCode || company.postalCode || "Not Available"}</span>
                      ) : col.isDate ? (
                        company[col.key]
                          ? new Date(company[col.key]).toLocaleString()
                          : "Not Available"
                      ) : (
                        <span className="truncate">{company[col.key] || "Not Available"}</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>
      </div>

      <Pagination
        data={{
          onPage: results.length,
          saved: computedCounts.saved,
          new: computedCounts.new,
        }}
        counts={computedCounts}
        totalLoading={isCountLoading}
        viewType={
          companyFilter === "new"
            ? "new"
            : companyFilter === "saved" || companyFilter === "my"
              ? "saved"
              : "total"
        }
      />

      <EditCompanyColumns />
      <ExportContacts />
      <SaveCompanies />
      <ExportCompanies />
    </div>
  );
}

export default CompanyContainer;
