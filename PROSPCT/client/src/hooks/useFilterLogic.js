import { useState, useEffect, useRef } from "react";
import useStore from "../store/store";
import { saveRecentSearch } from "../services/searchServices";

const useFilterLogic = (filterName) => {
  const {
    filters,
    setFilters,
    excludedFilters,
    setExcludeFilters,
    clearSpecificFilter,
    resetFilters,
    setTotalFiltersApplied,
    isDataLoading,
    setLastRecentUpdate,
  } = useStore();
  // If filterName contains multiple filters separated by dashes, use the first one
  const initialVisibleSection = filterName ? filterName.split('-')[0] : null;
  const [visibleSection, setVisibleSection] = useState(initialVisibleSection);
  const [searchInputs, setSearchInputs] = useState({});
  const filterRef = useRef(null);

  const handleItemSelect = (key, item) => setFilters(key, item);
  const handleExcludeItemSelect = (key, item) => setExcludeFilters(key, item);
  const clearFilter = (key) => clearSpecificFilter(key);
  const toggleVisibility = (section) =>
    setVisibleSection((prev) => (prev === section ? null : section));

  const handleSearchTrigger = (filterType) => {
    if (searchInputs[filterType]?.trim()) {
      setFilters(filterType, searchInputs[filterType].trim());
      setSearchInputs((prev) => ({ ...prev, [filterType]: "" }));
    }
  };

  const handleSearchInputChange = (event, filterType) => {
    setSearchInputs((prev) => ({ ...prev, [filterType]: event.target.value }));
  };

  const handleSearchInputKeyPress = (event, filterType) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchTrigger(filterType);
    }
  };

  const handleClickOutside = (event) => {
    if (filterRef.current && !filterRef.current.contains(event.target)) {
      setVisibleSection(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Count total filters applied, excluding specific keys like 'currentPage'
  const countSelectedFilters = (filtersObject) => {
    return Object.entries(filtersObject).reduce((total, [key, filter]) => {
      // Exclude system fields and layout/relevance settings
      if (key === "currentPage" || key === "limit" || key === "viewType" || 
          key === "sortOrder" || key === "selectedRelevances" || key === "appliedRelevances" || 
          key === "appliedSortOrder")
        return total; // Exclude system fields

      if (Array.isArray(filter)) {
        return total + filter.length;
      }
      return total + (filter ? 1 : 0);
    }, 0);
  };

  const totalFiltersApplied =
    countSelectedFilters(filters) + countSelectedFilters(excludedFilters);

  // Update the parent component's state
  useEffect(() => {
    setTotalFiltersApplied(totalFiltersApplied);

    // Removed automatic recent search saving - this should only happen on explicit search actions
  }, [totalFiltersApplied, setTotalFiltersApplied]);

  // Function to manually save recent search (call this when actual search is performed)
  const saveRecentSearchManually = async () => {
    if (totalFiltersApplied > 0) {
      try {
        await saveRecentSearch(filters, excludedFilters);
        // signal dashboard to refresh
        setLastRecentUpdate(Date.now());
      } catch (error) {
        // console.error("Failed to save recent search:", error);
      }
    }
  };

  return {
    filters,
    excludedFilters,
    visibleSection,
    searchInputs,
    handleItemSelect,
    handleExcludeItemSelect,
    clearFilter,
    toggleVisibility,
    handleSearchInputChange,
    handleSearchInputKeyPress,
    handleSearchTrigger,
    filterRef,
    totalFiltersApplied,
    resetFilters,
    isDataLoading,
    saveRecentSearchManually,
  };
};

export default useFilterLogic;
