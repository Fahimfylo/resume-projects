import OptionFilter from "./OptionFilter";
import { toast } from "react-toastify";
import useFetchLists from "../../hooks/useFetchList";
import useFilterLogic from "../../hooks/useFilterLogic";
import { saveSearch } from "../../services/searchServices";
import filterList from "./filterList";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { showToastIfPopupDisabled, notifySearchSaved } from "../../utils/notificationHelper";

const LOCKED_FILTER_FEATURES = {
  keywords: "keywordsFilter",
  seniority: "seniorityFilter",
  personName: "personNameFilter",
  employeeRange: "employeeRangeFilter",
  revenueRange: "revenueFilter",
  emailStatus: "emailStatusFilter",
  emailType: "emailTypeFilter",
  foundedYear: "foundedYearFilter",
  organizationName: "organizationNameFilter",
  zip: "zipFilter",
  industry: "industryFilter",
};

const LeadSearchFilter = ({ filterName }) => {
  const { lists } = useFetchLists();
  const { hasFeature } = useFeatureAccess();
  const lockedFilters = new Set(
    Object.entries(LOCKED_FILTER_FEATURES)
      .filter(([, feature]) => !hasFeature(feature))
      .map(([optionType]) => optionType)
  );

  const {
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
    resetFilters,
    totalFiltersApplied,
    isDataLoading,
  } = useFilterLogic(filterName);

  const handleSaveSearch = async () => {
    try {
      const success = await saveSearch(filters, excludedFilters);
      if (success) {
        showToastIfPopupDisabled("Search saved successfully");
        notifySearchSaved("Custom Search");
      }
    } catch (error) {
      // console.error("saveSearch error", error);
      const msg = error.response?.data?.error || error.message || "Failed to save search";
      toast.error(msg);
    }
  };

  return (
    <section
      id="lead-section"
      className="mt-3 ml-3 lead-section sm:w-auto"
      ref={filterRef}
    >
      <div id="lead-section-div" className="lead-section-div">
        <div className="left-lead-section  w-full sm:w-[250px] md:h-[80vh] overflow-y-scroll no-scrollbar">
          <div className="filter-title flex justify-between items-baseline p-4 bg-white border-b border-gray-100 text-gray-700 font-medium text-[14px]">
            <span className="text-xl">Filter</span>

            <div>
              <span
                className="text-xs font-medium cursor-pointer clear-filters hover:text-blue-500 hover:underline"
                onClick={resetFilters}
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
            {filterList(lists).map(
              ({
                label,
                optionsList,
                optionType,
                icon,
                hasSearch,
                hasYearFilter,
                hasSubFilter,
                subFilterType,
                subFilterLabel,
                subFilterPlaceholder,
              }) => (
                <OptionFilter
                  key={optionType}
                  includedOptions={filters}
                  excludedOptions={excludedFilters}
                  visibleSection={visibleSection}
                  hasSearch={hasSearch}
                  searchInput={searchInputs[optionType] || ""}
                  onSearchInputChange={(e) =>
                    handleSearchInputChange(e, optionType)
                  }
                  onSearchInputKeyPress={(e) =>
                    handleSearchInputKeyPress(e, optionType)
                  }
                  onSearchTrigger={() => handleSearchTrigger(optionType)}
                  isDataLoading={isDataLoading}
                  onToggleVisibility={toggleVisibility}
                  onClearAllOptions={clearFilter}
                  onHandleCheckboxChange={handleItemSelect}
                  onSelectExcludeOptions={handleExcludeItemSelect}
                  optionsList={optionsList}
                  icon={icon}
                  label={label}
                  optionType={optionType}
                  hasYearFilter={hasYearFilter}
                  isLocked={lockedFilters.has(optionType)}
                  hasSubFilter={hasSubFilter}
                  subFilterType={subFilterType}
                  subFilterLabel={subFilterLabel}
                  subFilterPlaceholder={subFilterPlaceholder}
                  subFilterValue={searchInputs[`${optionType}_${subFilterType}`] || ""}
                  onSubFilterChange={(value) =>
                    handleSearchInputChange({ target: { value } }, `${optionType}_${subFilterType}`)
                  }
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadSearchFilter;
