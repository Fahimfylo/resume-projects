import { useEffect, useState } from "react";
import axios from "axios";
import { ImSpinner9 } from "react-icons/im";
import { ChevronDown, ChevronUp, Building2, ListTree, MapPin, Users, Factory, Tag, SortAsc, X } from "lucide-react";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";
import CreateListModal from "../lists/CreateListModal";
import { employeeRange, industryList, countryAbbreviations, industryAbbreviations } from "../../utils/data";
import { getCompanyLogo } from "../../utils/logoHelper";
import { saveSearch } from "../../services/searchServices";
import { toast } from "react-toastify";
import { showToastIfPopupDisabled, notifySearchSaved } from "../../utils/notificationHelper";

const FILTER_OPTIONS = [
  { label: "Lists", value: "lists", icon: <ListTree size={17} /> },
  { label: "Company", value: "company", icon: <Building2 size={17} /> },
  { label: "City / State", value: "cityState", icon: <MapPin size={17} /> },
  { label: "Country", value: "country", icon: <MapPin size={17} /> },
  { label: "Zip / Postal Code", value: "zip", icon: <MapPin size={17} /> },
  { label: "Employees", value: "employees", icon: <Users size={17} /> },
  { label: "Industry", value: "industry", icon: <Factory size={17} /> },
  { label: "Keywords", value: "keywords", icon: <Tag size={17} /> },
];

const FREE_TIER_TOAST = "You are on a free tier, upgrade your plan to use these filters";

const LOCKED_COMPANY_FILTERS = new Set(["country", "zip", "employees", "industry", "keywords"]);

const LIST_SORT_OPTIONS = [
  { label: "Most Common", value: "mostCommon" },
  { label: "Name (a-z)", value: "nameAsc" },
  { label: "Name (z-a)", value: "nameDesc" },
  { label: "Most Recent", value: "mostRecent" },
  { label: "Oldest", value: "oldest" },
];

const extractDomain = (input) => {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed.includes(".") && !trimmed.startsWith("http")) return trimmed;
  try {
    let urlStr = trimmed;
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      urlStr = "https://" + urlStr;
    }
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([^/?]+)/i);
    return match ? match[1].replace(/^www\./, "") : trimmed;
  }
};

function CompanySidebar() {
  const user = useStore((state) => state.user);
  const isFreeUser = !user || user?.plan?.name === "Free" || user?.plan?.type === "free";

  const {
    companyFilter,
    companySearchQuery,
    companyListId,
    companyActiveFilters,
    companyCounts,
    setCompanyFilter,
    setCompanySearchQuery,
    setCompanyListId,
    addCompanyActiveFilter,
    removeCompanyActiveFilter,
    clearCompanyActiveFilters,
    isDataLoading,
  } = useStore();

  const [filterValue, setFilterValue] = useState("");
  const [lists, setLists] = useState([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [listSortBy, setListSortBy] = useState("mostCommon");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isListsDropdownOpen, setIsListsDropdownOpen] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);

  // Company filter suggestions
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [loadingCompanySuggestions, setLoadingCompanySuggestions] = useState(false);

  // City/State filter suggestions
  const [cityStateSuggestions, setCityStateSuggestions] = useState([]);
  const [showCityStateSuggestions, setShowCityStateSuggestions] = useState(false);
  const [loadingCityStateSuggestions, setLoadingCityStateSuggestions] = useState(false);

  // Country filter suggestions
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [loadingCountrySuggestions, setLoadingCountrySuggestions] = useState(false);

  // Zip/Postal Code filter suggestions
  const [zipSuggestions, setZipSuggestions] = useState([]);
  const [showZipSuggestions, setShowZipSuggestions] = useState(false);
  const [loadingZipSuggestions, setLoadingZipSuggestions] = useState(false);

  // Keywords filter suggestions
  const [keywordsSuggestions, setKeywordsSuggestions] = useState([]);
  const [showKeywordsSuggestions, setShowKeywordsSuggestions] = useState(false);
  const [loadingKeywordsSuggestions, setLoadingKeywordsSuggestions] = useState(false);



  const BASE_URL = API_CONFIG.API_ENDPOINT;

  useEffect(() => {
    if (activeFilter !== "lists") return;
    const fetchLists = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/list`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
          },
        });
        if (res.status === 200) {
          const companyLists = res.data.filter(list => list.type === "companies");
          setLists(companyLists);
        }
      } catch (err) {
        // console.error("Failed to load lists", err);
      }
    };
    fetchLists();
  }, [activeFilter, BASE_URL]);

  const selectFilter = (value) => {
    setCompanyFilter(value);
    setCompanySearchQuery("");
    // Don't clear list or active filters when switching tabs
    setFilterValue("");
  };

  const applySearchFilter = (field, value) => {
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
      removeCompanyActiveFilter(field);
      return;
    }

    let formattedValue = trimmedValue;
    if (field === "company") {
      const isUrlOrDomain = trimmedValue.match(/^https?:\/\//i) || trimmedValue.includes(".");
      if (isUrlOrDomain) {
        formattedValue = extractDomain(trimmedValue).toLowerCase();
      } else {
        formattedValue = trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
      }
    }

    addCompanyActiveFilter(field, formattedValue);
  };

  const handleHeaderClick = (val) => {
    if (isFreeUser && LOCKED_COMPANY_FILTERS.has(val)) {
      toast.warn(FREE_TIER_TOAST);
      return;
    }
    setActiveFilter(activeFilter === val ? null : val);
    setFilterValue("");
    setCompanySuggestions([]);
    setShowCityStateSuggestions(false);
    setCityStateSuggestions([]);
    setShowCountrySuggestions(false);
    setCountrySuggestions([]);
    setShowZipSuggestions(false);
    setZipSuggestions([]);
    setShowKeywordsSuggestions(false);
    setKeywordsSuggestions([]);
  };

  const handleSaveSearch = async () => {
    try {
      // Convert companyActiveFilters to the format expected by the search API
      const formattedFilters = {};
      Object.entries(companyActiveFilters).forEach(([field, value]) => {
        const apiField = (() => {
          switch (field?.toLowerCase()) {
            case "company":
            case "name":
              return "organizationName";
            case "domain":
              return "organizationDomain";
            case "citystate":
              return "cityState";
            case "country":
              return "country";
            case "zip":
              return "zip";
            case "location":
              return "location";
            case "industry":
              return "industry";
            case "employees":
              return "employeeRange";
            case "keywords":
              return "keywords";
            default:
              return field;
          }
        })();
        formattedFilters[apiField] = Array.isArray(value) ? value : [value];
      });

      // Also include companyListId if it is selected and filter is list
      if (companyFilter === "list" && companyListId) {
        formattedFilters.list = [companyListId];
      }

      const success = await saveSearch(formattedFilters, {});
      if (success) {
        showToastIfPopupDisabled("Search saved successfully");
        notifySearchSaved("Company Search");
      }
    } catch (error) {
      // console.error("saveSearch error", error);
      const msg = error.response?.data?.error || error.message || "Failed to save search";
      toast.error(msg);
    }
  };

  // Fetch company name/domain suggestions with debounce
  useEffect(() => {
    if (activeFilter !== "company") return;

    const timer = setTimeout(async () => {
      const trimmed = filterValue.trim();
      if (trimmed.length >= 2) {
        // Extract domain if user pasted a full URL
        const searchQuery = extractDomain(trimmed);
        setLoadingCompanySuggestions(true);
        try {
          const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
          const res = await axios.get(
            `${BASE_URL}/api/search/company-domain-suggestions?query=${encodeURIComponent(searchQuery)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = res.data.suggestions || [];
          // Sort A-Z by name
          data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setCompanySuggestions(data);
          setShowCompanySuggestions(true);
        } catch (err) {
          // console.error("Failed to fetch company suggestions", err);
          setCompanySuggestions([]);
        } finally {
          setLoadingCompanySuggestions(false);
        }
      } else {
        setCompanySuggestions([]);
        setShowCompanySuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filterValue, activeFilter, BASE_URL]);

  // Fetch City/State suggestions (city + state fields only) with debounce
  useEffect(() => {
    if (activeFilter !== "cityState") return;

    const timer = setTimeout(async () => {
      if (filterValue.trim().length >= 1) {
        setLoadingCityStateSuggestions(true);
        try {
          const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
          const res = await axios.get(
            `${BASE_URL}/api/search/city-suggestions?query=${encodeURIComponent(filterValue.trim())}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const apiSuggestions = res.data.suggestions || [];
          // Filter to only city/state-like results (exclude country names and zip codes)
          const filtered = apiSuggestions.filter(s => {
            const lower = s.toLowerCase();
            // Check if it looks like a country (from countryAbbreviations)
            const isCountry = Object.values(countryAbbreviations).some(c => c.toLowerCase() === lower);
            // Check if it looks like a zip code (starts with digits)
            const isZip = /^\d/.test(s);
            return !isCountry && !isZip;
          });
          setCityStateSuggestions(filtered);
          setShowCityStateSuggestions(true);
        } catch (err) {
          // console.error("Failed to fetch city/state suggestions", err);
          setCityStateSuggestions([]);
        } finally {
          setLoadingCityStateSuggestions(false);
        }
      } else {
        setCityStateSuggestions([]);
        setShowCityStateSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [filterValue, activeFilter, BASE_URL]);

  // Fetch Country suggestions (country field + countryAbbreviations) with debounce
  useEffect(() => {
    if (activeFilter !== "country") return;

    const timer = setTimeout(async () => {
      if (filterValue.trim().length >= 1) {
        setLoadingCountrySuggestions(true);
        try {
          const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
          const res = await axios.get(
            `${BASE_URL}/api/search/city-suggestions?query=${encodeURIComponent(filterValue.trim())}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const apiSuggestions = res.data.suggestions || [];
          const q = filterValue.trim().toLowerCase();
          // Merge with country abbreviations for short form support (e.g., "US" -> "United States")
          const abbrMatches = Object.entries(countryAbbreviations)
            .filter(([code]) => code.startsWith(q) || Object.values(countryAbbreviations)[0]?.toLowerCase().startsWith(q))
            .map(([, name]) => name);
          // Filter to only country names
          const countryNames = new Set(Object.values(countryAbbreviations).map(c => c.toLowerCase()));
          const filteredApi = apiSuggestions.filter(s => countryNames.has(s.toLowerCase()));
          const merged = [...new Set([...filteredApi, ...abbrMatches])];
          setCountrySuggestions(merged);
          setShowCountrySuggestions(true);
        } catch (err) {
          // console.error("Failed to fetch country suggestions", err);
          setCountrySuggestions([]);
        } finally {
          setLoadingCountrySuggestions(false);
        }
      } else {
        setCountrySuggestions([]);
        setShowCountrySuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [filterValue, activeFilter, BASE_URL]);

  // Fetch Zip/Postal Code suggestions with debounce
  useEffect(() => {
    if (activeFilter !== "zip") return;

    const timer = setTimeout(async () => {
      if (filterValue.trim().length >= 1) {
        setLoadingZipSuggestions(true);
        try {
          const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
          const res = await axios.get(
            `${BASE_URL}/api/search/city-suggestions?query=${encodeURIComponent(filterValue.trim())}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const apiSuggestions = res.data.suggestions || [];
          // Filter to only zip/postal code-like results (starts with digits or looks like a postal code)
          const filtered = apiSuggestions.filter(s => {
            return /^\d/.test(s) || /^[A-Za-z]\d/.test(s);
          });
          setZipSuggestions(filtered);
          setShowZipSuggestions(true);
        } catch (err) {
          // console.error("Failed to fetch zip suggestions", err);
          setZipSuggestions([]);
        } finally {
          setLoadingZipSuggestions(false);
        }
      } else {
        setZipSuggestions([]);
        setShowZipSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [filterValue, activeFilter, BASE_URL]);

  // Fetch keywords suggestions with debounce
  useEffect(() => {
    if (activeFilter !== "keywords") return;

    const timer = setTimeout(async () => {
      if (filterValue.trim().length >= 2) {
        setLoadingKeywordsSuggestions(true);
        try {
          const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
          const res = await axios.get(
            `${BASE_URL}/api/search/keywords-suggestions?query=${encodeURIComponent(filterValue.trim())}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = res.data.suggestions || [];
          setKeywordsSuggestions(data);
          setShowKeywordsSuggestions(true);
        } catch (err) {
          // console.error("Failed to fetch keywords suggestions", err);
          setKeywordsSuggestions([]);
        } finally {
          setLoadingKeywordsSuggestions(false);
        }
      } else {
        setKeywordsSuggestions([]);
        setShowKeywordsSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filterValue, activeFilter, BASE_URL]);



  const handleCreateList = async (listName, type = "contacts") => {
    try {
      const token = localStorage.getItem("userAccessToken");
      const res = await axios.post(
        `${BASE_URL}/api/list/add`,
        { name: listName, type },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 201 || res.status === 200) {
        // Refresh the lists
        const listsRes = await axios.get(`${BASE_URL}/api/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (listsRes.status === 200) setLists(listsRes.data);
      }
    } catch (err) {
      // console.error("Failed to create list", err);
    }
  };

  // Sort lists based on the selected sort option
  const sortedLists = [...lists].sort((a, b) => {
    switch (listSortBy) {
      case "nameAsc":
        return a.name?.localeCompare(b.name || "");
      case "nameDesc":
        return b.name?.localeCompare(a.name || "");
      case "mostRecent":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "oldest":
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case "mostCommon":
      default:
        // For most common, we could sort by the number of items in the list
        // For now, just use name as fallback
        return a.name?.localeCompare(b.name || "");
    }
  });

  const totalFiltersApplied = Object.keys(companyActiveFilters).length + (companyListId ? 1 : 0);



  return (
    <section id="company-section" className="mt-3 ml-3 company-section sm:w-auto">
      <div id="company-section-div" className="company-section-div">
        <div className="left-company-section w-[94vw] sm:w-[250px] md:h-[80vh] overflow-y-scroll">
          {/* Header */}
          <div className="filter-title flex justify-between items-baseline p-4 bg-white border-b border-gray-100 text-gray-700 font-medium text-[14px]">
            <span className="text-xl">Filter</span>

            <div>
              <span
                className="text-xs font-medium cursor-pointer clear-filters hover:text-blue-500 hover:underline"
                onClick={() => {
                  clearCompanyActiveFilters();
                  setCompanyListId(null);
                  setCompanyFilter("all");
                }}
              >
                <span>Clear all</span>
                {totalFiltersApplied > 0 && (
                  <span className="ml-1 filter-count">
                    ({totalFiltersApplied})
                  </span>
                )}
              </span>
              <span
                className="ml-3 text-xs font-medium cursor-pointer clear-filters hover:text-blue-500 hover:underline"
                onClick={handleSaveSearch}
              >
                Save all
              </span>
            </div>
          </div>



          <div className="mb-5 font-medium filter-options">
            {FILTER_OPTIONS.map((filter) => {
              const isActive = activeFilter === filter.value;
              const activeVal = companyActiveFilters[filter.value];
              const hasActiveValue = (filter.value === "lists" && companyListId) || (Array.isArray(activeVal) ? activeVal.length > 0 : activeVal);

              return (
                <div key={filter.value} className="group">
                  <div className="border border-gray-100">
                    <div
                      className={`filter-option flex justify-between items-center p-3 text-[14px] group-hover:text-blue-500 transition-colors delay-75 bg-white rounded cursor-pointer ${isActive ? "text-blue-500" : " text-gray-800"}`}
                      onClick={() => handleHeaderClick(filter.value)}
                    >
                      <span className="flex items-center">
                        <span className={`mr-4 group-hover:text-blue-500 transition-colors delay-75 ${isActive ? "text-blue-500" : " text-gray-500"}`}>
                          {filter.icon}
                        </span>
                        {filter.label}
                      </span>
                      <div className="flex items-center">
                        {hasActiveValue && (
                          <span className="h-5 mr-2 text-gray-500 border border-gray-300 rounded-sm counter-country">
                            <span className="flex items-center ml-1">
                              <span className="text-[12px]">{Array.isArray(activeVal) ? activeVal.length : 1}</span>
                              <X
                                size={14}
                                className="ml-1 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (filter.value === "lists") {
                                    setCompanyListId(null);
                                  } else {
                                    removeCompanyActiveFilter(filter.value);
                                  }
                                }}
                              />
                            </span>
                          </span>
                        )}
                        {isActive ? (
                          <ChevronUp size={18} className="transition duration-200 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600" />
                        ) : (
                          <ChevronDown size={18} className="transition duration-200 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600" />
                        )}
                      </div>
                    </div>

                    {/* Active filter chips (Included) */}
                    {hasActiveValue && (
                      <div className="pb-4 pl-4 text-xs font-normal bg-white included">
                        <div className="mb-2">Included:</div>
                        <div className="flex flex-wrap">
                          {filter.value === "lists" ? (
                            <div className="flex items-center p-1 mb-2 mr-2 font-medium text-white bg-blue-400 rounded-sm">
                              <span>{lists.find(l => l._id === companyListId)?.name || "Selected"}</span>
                              <X size={13} className="ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setCompanyListId(null); }} />
                            </div>
                          ) : Array.isArray(companyActiveFilters[filter.value]) ? (
                            companyActiveFilters[filter.value].map((val) => (
                              <div key={val} className="flex items-center p-1 mb-2 mr-2 font-medium text-white bg-blue-400 rounded-sm">
                                <span>{val}</span>
                                <X size={13} className="ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); addCompanyActiveFilter(filter.value, val); }} />
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center p-1 mb-2 mr-2 font-medium text-white bg-blue-400 rounded-sm">
                              <span>{companyActiveFilters[filter.value]}</span>
                              <X size={13} className="ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); removeCompanyActiveFilter(filter.value); }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isActive && (
                      <div className="p-4 bg-white border shadow-md search-results">
                        {filter.value === "lists" ? (
                          <div className="space-y-3">
                            {/* Sort Row */}
                            <div className="relative flex items-center justify-between">
                              <div
                                className="flex items-center gap-1 text-blue-600 text-xs font-semibold cursor-pointer hover:text-blue-700"
                                onClick={() => setIsCreateListModalOpen(true)}
                              >
                                <SortAsc size={14} />
                                <span>Create list</span>
                              </div>

                              <div
                                className="flex items-center gap-1 text-blue-600 text-xs font-bold cursor-pointer"
                              >
                                <ChevronDown size={12} />
                              </div>
                            </div>

                            <div className="relative">
                              <input
                                placeholder="Select lists..."
                                className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none cursor-pointer"
                                readOnly
                                onClick={() => setIsListsDropdownOpen(!isListsDropdownOpen)}
                              />

                              {isListsDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsListsDropdownOpen(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                                    {sortedLists.length === 0 ? (
                                      <p className="text-xs text-gray-500 italic px-3 py-2">No lists found.</p>
                                    ) : (
                                      sortedLists.map((list) => (
                                        <div
                                          key={list._id}
                                          onClick={() => {
                                            setCompanyFilter("list");
                                            setCompanyListId(list._id);
                                            setCompanySearchQuery("");
                                            setIsListsDropdownOpen(false);
                                            setActiveFilter(null);
                                          }}
                                          className={`text-sm px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${companyListId === list._id
                                              ? "text-blue-600 bg-blue-50 font-medium"
                                              : "text-gray-700"
                                            }`}
                                        >
                                          {list.name}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : filter.value === "company" ? (
                          <div className="space-y-3 relative">
                            <div className="relative">
                              <input
                                autoFocus
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    applySearchFilter(filter.value, filterValue);
                                    setShowCompanySuggestions(false);
                                    setActiveFilter(null);
                                  }
                                }}
                                placeholder="Search company name..."
                                className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                              />

                              {showCompanySuggestions && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowCompanySuggestions(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                                    {loadingCompanySuggestions ? (
                                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2"><ImSpinner9 className="animate-spin" size={14} /> Loading...</div>
                                    ) : companySuggestions.length > 0 ? (
                                      companySuggestions.map((item, index) => {
                                        const name = typeof item === "string" ? item : item.name;
                                        const domain = typeof item === "object" ? item.domain : "";
                                        const logoUrl = domain ? getCompanyLogo(domain) : null;
                                        const initials = name ? name.substring(0, 2).toUpperCase() : "??";
                                        return (
                                          <div
                                            key={index}
                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 flex items-center gap-3"
                                            onClick={() => {
                                              const isDomainSearch = filterValue.includes('.') || /^https?:\/\//i.test(filterValue);
                                              const val = isDomainSearch && domain ? domain : name;
                                              setFilterValue(val);
                                              applySearchFilter("company", val);
                                              setShowCompanySuggestions(false);
                                              setActiveFilter(null);
                                            }}
                                          >
                                            {/* Company Logo */}
                                            <div className="relative w-8 h-8 flex-shrink-0">
                                              {logoUrl && (
                                                <img
                                                  src={logoUrl}
                                                  alt={`${name} logo`}
                                                  className="w-full h-full object-contain rounded bg-white border border-gray-100"
                                                  onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                  }}
                                                />
                                              )}
                                              {!logoUrl && (
                                                <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                                                  {initials}
                                                </div>
                                              )}
                                            </div>
                                            {/* Company Info */}
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium truncate">{name || "Not Available"}</div>
                                              {domain && (
                                                <div className="text-xs text-gray-500 truncate">{domain}</div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : filter.value === "cityState" ? (
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-gray-700">Select region</div>
                            <div className="text-xs text-gray-500 mb-2">City / State</div>
                            <div className="relative">
                              <input
                                autoFocus
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (filterValue.trim()) {
                                      addCompanyActiveFilter("cityState", filterValue.trim());
                                      setFilterValue("");
                                      setShowCityStateSuggestions(false);
                                      setCityStateSuggestions([]);
                                      setActiveFilter(null);
                                    }
                                  }
                                }}
                                placeholder="Search city or state..."
                                className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                              />

                              {showCityStateSuggestions && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowCityStateSuggestions(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                                    {loadingCityStateSuggestions ? (
                                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2"><ImSpinner9 className="animate-spin" size={14} /> Loading...</div>
                                    ) : cityStateSuggestions.length > 0 ? (
                                      cityStateSuggestions.map((item, index) => {
                                        const itemName = typeof item === 'string' ? item : item.name;
                                        const capitalizedItemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
                                        return (
                                          <div
                                            key={index}
                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"
                                            onClick={() => {
                                              addCompanyActiveFilter("cityState", capitalizedItemName);
                                              setFilterValue("");
                                              setShowCityStateSuggestions(false);
                                              setCityStateSuggestions([]);
                                              setActiveFilter(null);
                                            }}
                                          >
                                            <div className="font-medium">{capitalizedItemName}</div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : filter.value === "country" ? (
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-gray-700">Select country</div>
                            <div className="text-xs text-gray-500 mb-2">Full name or short form (e.g., US, UK)</div>
                            <div className="relative">
                              <input
                                autoFocus
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (isFreeUser && LOCKED_COMPANY_FILTERS.has("country")) {
                                      toast.warn(FREE_TIER_TOAST);
                                      return;
                                    }
                                    if (filterValue.trim()) {
                                      // Check if it's a short form abbreviation
                                      const q = filterValue.trim().toLowerCase();
                                      let finalValue = filterValue.trim();
                                      if (countryAbbreviations[q]) {
                                        finalValue = countryAbbreviations[q];
                                      } else {
                                        finalValue = finalValue.charAt(0).toUpperCase() + finalValue.slice(1);
                                      }
                                      addCompanyActiveFilter("country", finalValue);
                                      setFilterValue("");
                                      setShowCountrySuggestions(false);
                                      setCountrySuggestions([]);
                                      setActiveFilter(null);
                                    }
                                  }
                                }}
                                placeholder="Search country..."
                                className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                              />

                              {showCountrySuggestions && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowCountrySuggestions(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                                    {loadingCountrySuggestions ? (
                                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2"><ImSpinner9 className="animate-spin" size={14} /> Loading...</div>
                                    ) : countrySuggestions.length > 0 ? (
                                      countrySuggestions.map((item, index) => {
                                        const itemName = typeof item === 'string' ? item : item;
                                        // Find matching abbreviation if any
                                        const abbr = Object.entries(countryAbbreviations)
                                          .find(([, name]) => name.toLowerCase() === itemName.toLowerCase())?.[0]?.toUpperCase();
                                        return (
                                          <div
                                            key={index}
                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"
                                            onClick={() => {
                                              if (isFreeUser && LOCKED_COMPANY_FILTERS.has("country")) {
                                                toast.warn(FREE_TIER_TOAST);
                                                return;
                                              }
                                              addCompanyActiveFilter("country", itemName);
                                              setFilterValue("");
                                              setShowCountrySuggestions(false);
                                              setCountrySuggestions([]);
                                              setActiveFilter(null);
                                            }}
                                          >
                                            <div className="font-medium">
                                              {itemName}
                                              {abbr && <span className="ml-2 text-xs text-gray-400">({abbr})</span>}
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : filter.value === "zip" ? (
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-gray-700">Select zip / postal code</div>
                            <div className="text-xs text-gray-500 mb-2">e.g., 10001, SW1A 1AA</div>
                            <div className="relative">
                              <input
                                autoFocus
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (isFreeUser && LOCKED_COMPANY_FILTERS.has("zip")) {
                                      toast.warn(FREE_TIER_TOAST);
                                      return;
                                    }
                                    if (filterValue.trim()) {
                                      addCompanyActiveFilter("zip", filterValue.trim());
                                      setFilterValue("");
                                      setShowZipSuggestions(false);
                                      setZipSuggestions([]);
                                      setActiveFilter(null);
                                    }
                                  }
                                }}
                                placeholder="Search zip code..."
                                className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                              />

                              {showZipSuggestions && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowZipSuggestions(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                                    {loadingZipSuggestions ? (
                                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2"><ImSpinner9 className="animate-spin" size={14} /> Loading...</div>
                                    ) : zipSuggestions.length > 0 ? (
                                      zipSuggestions.map((item, index) => (
                                        <div
                                          key={index}
                                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"
                                          onClick={() => {
                                            if (isFreeUser && LOCKED_COMPANY_FILTERS.has("zip")) {
                                              toast.warn(FREE_TIER_TOAST);
                                              return;
                                            }
                                            addCompanyActiveFilter("zip", item);
                                            setFilterValue("");
                                            setShowZipSuggestions(false);
                                            setZipSuggestions([]);
                                            setActiveFilter(null);
                                          }}
                                        >
                                          <div className="font-medium">{item}</div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : filter.value === "employees" || filter.value === "industry" ? (
                          <div className="space-y-3">
                            {filter.value === "industry" && (
                              <div className="mb-2">
                                <input
                                  type="text"
                                  placeholder="Search industry..."
                                  value={filterValue}
                                  onChange={(e) => setFilterValue(e.target.value)}
                                  className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                                />

                              </div>
                            )}
                            <ul className="ml-1 overflow-y-scroll font-normal max-h-44">
                              {(filter.value === "employees" ? employeeRange : industryList)
                                .filter((option) => {
                                  if (filter.value !== "industry") return true;
                                  const q = filterValue.toLowerCase();
                                  if (!q) return true;
                                  if (q.length >= 3 && option.toLowerCase().includes(q)) return true;
                                  const abbrEntry = Object.entries(industryAbbreviations).find(
                                    ([code, name]) => name === option && code.startsWith(q)
                                  );
                                  return !!abbrEntry;
                                })
                                .map((option, index) => {
                                  const isSelected = (companyActiveFilters[filter.value] || []).includes(option);
                                  return (
                                    <li
                                      className="flex items-center py-2 pr-1 text-xs border-b cursor-pointer checkbox-container-div hover:bg-blue-50"
                                      key={index}
                                    >
                                      <label className="flex items-center w-full cursor-pointer">
                                        <input
                                          className="mr-2 cursor-pointer"
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            if (isFreeUser && LOCKED_COMPANY_FILTERS.has(filter.value)) {
                                              toast.warn(FREE_TIER_TOAST);
                                              return;
                                            }
                                            addCompanyActiveFilter(filter.value, option);
                                            setActiveFilter(null);
                                          }}
                                        />
                                        <span className={`font-semibold checkmark ${isSelected ? "text-blue-600" : "text-gray-700"}`}>
                                          {option}
                                        </span>
                                      </label>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        ) : filter.value === "keywords" ? (
                          <div className="space-y-3 relative">
                            <div className="relative">
                              <input
                                autoFocus
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (isFreeUser && LOCKED_COMPANY_FILTERS.has("keywords")) {
                                      toast.warn(FREE_TIER_TOAST);
                                      return;
                                    }
                                    applySearchFilter(filter.value, filterValue);
                                    setShowKeywordsSuggestions(false);
                                    setActiveFilter(null);
                                  }
                                }}
                                placeholder="Search keywords..."
                                className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                              />

                              {showKeywordsSuggestions && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowKeywordsSuggestions(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                                    {loadingKeywordsSuggestions ? (
                                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2"><ImSpinner9 className="animate-spin" size={14} /> Loading...</div>
                                    ) : keywordsSuggestions.length > 0 ? (
                                      keywordsSuggestions.map((item, index) => (
                                        <div
                                          key={index}
                                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"
                                          onClick={() => {
                                            if (isFreeUser && LOCKED_COMPANY_FILTERS.has("keywords")) {
                                              toast.warn(FREE_TIER_TOAST);
                                              return;
                                            }
                                            setFilterValue(item);
                                            applySearchFilter("keywords", item);
                                            setShowKeywordsSuggestions(false);
                                            setActiveFilter(null);
                                          }}
                                        >
                                          <div className="font-medium">{item}</div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-gray-500">No suggestions found</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <input
                              autoFocus
                              value={filterValue}
                              onChange={(e) => setFilterValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  applySearchFilter(filter.value, filterValue);
                                  setActiveFilter(null);
                                }
                              }}
                              placeholder={`Enter ${filter.label.toLowerCase()}...`}
                              className="w-full p-1 text-sm font-normal border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onCreate={handleCreateList}
        initialType="companies"
      />
    </section>
  );
}

export default CompanySidebar;