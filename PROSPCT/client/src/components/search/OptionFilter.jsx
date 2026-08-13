import { toast } from "react-toastify";
import { sanitizeDomainForDisplay } from "../../utils/logoHelper";
import { ChevronDown, ChevronUp, CircleOff, X, Plus } from "lucide-react";

import { useState, useEffect, useRef } from "react";

import PropTypes from "prop-types";

import FoundedYearFilter from "./FoundedYearFilter";

import axios from "axios";

import Cookies from "js-cookie";

import API_CONFIG from "../../utils/apiConstant";

import { countryAbbreviations, jobTitleAbbreviations, industryAbbreviations } from "../../utils/data";



const BASE_URL = API_CONFIG.API_ENDPOINT;

// Cache for successful Clearbit logo domains
const logoCache = new Set();

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



const FREE_TIER_TOAST = "You are on a free tier, upgrade your plan to use these filters";

const OptionFilter = ({

  includedOptions,

  excludedOptions,

  visibleSection,

  hasSearch,

  searchInput,

  onSearchInputChange,

  onSearchInputKeyPress,

  onSearchTrigger,

  isDataLoading,

  onToggleVisibility,

  onClearAllOptions,

  onHandleCheckboxChange,

  onSelectExcludeOptions,

  optionsList,

  icon: Icon,

  label,

  optionType,

  hasYearFilter = false,

  isLocked = false,

}) => {

  const [citySuggestions, setCitySuggestions] = useState([]);

  const [companyDomainSuggestions, setCompanyDomainSuggestions] = useState([]);

  const [keywordSuggestions, setKeywordSuggestions] = useState([]);

  const [nameSuggestions, setNameSuggestions] = useState([]);

  const [industrySuggestions, setIndustrySuggestions] = useState([]);


  const [jobTitleSuggestions, setJobTitleSuggestions] = useState([]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Keyword search within Industry filter


  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const suggestionRef = useRef(null);
  const searchInputRef = useRef(searchInput);
  useEffect(() => { searchInputRef.current = searchInput; }, [searchInput]);



  const getCount = () => {

    if (optionType === "foundedYear") {

      return includedOptions[optionType]?.minYear ||

        includedOptions[optionType]?.maxYear

        ? 1

        : 0;

    }

    return includedOptions[optionType]?.length;

  };



  const filterItems = optionsList

    .filter((item) => {
      const q = searchInput.toLowerCase();
      // Show all items when search is empty
      if (!q) return true;
      // Substring match (min 3 chars to avoid overly broad results for short inputs)
      if (q.length >= 3 && item.toLowerCase().includes(q)) return true;
      const abbrMatch =
        Object.entries(countryAbbreviations).find(
          ([code, name]) => name === item && code.startsWith(q)
        ) ||
        Object.entries(jobTitleAbbreviations).find(
          ([code, names]) => {
            const list = Array.isArray(names) ? names : [names];
            return list.includes(item) && code.startsWith(q);
          }
        ) ||
        Object.entries(industryAbbreviations).find(
          ([code, name]) => name === item && code.startsWith(q)
        );
      return !!abbrMatch;
    })

    .filter(

      (item) =>

        !(includedOptions[optionType] || []).includes(item) &&

        !(excludedOptions[optionType] || []).includes(item)

    );



  const handleItemSelect = (item) => {
    if (isLocked) {
      toast.warn(FREE_TIER_TOAST);
      return;
    }
    onHandleCheckboxChange(optionType, item);
    onToggleVisibility(optionType);

  };



  const handleExcludeItemSelect = (item) => {
    if (isLocked) {
      toast.warn(FREE_TIER_TOAST);
      return;
    }
    onSelectExcludeOptions(optionType, item);

  };



  const handleRemoveExcludeItem = (item) => {
    if (isLocked) {
      toast.warn(FREE_TIER_TOAST);
      return;
    }
    onSelectExcludeOptions(optionType, item);

  };



  const [isActive, setIsActive] = useState(false);

  const divRef = useRef(null);



  const handleClick = () => {
    if (isLocked) {
      toast.warn(FREE_TIER_TOAST);
      return;
    }
    setIsActive(!isActive);

    onToggleVisibility(optionType);

  };



  const handleClickOutside = (event) => {

    if (divRef.current && !divRef.current.contains(event.target)) {

      setIsActive(false);

    }

  };



  useEffect(() => {

    document.addEventListener("mousedown", handleClickOutside);

    return () => {

      document.removeEventListener("mousedown", handleClickOutside);

    };

  }, []);





  // Job title abbreviation suggestions state
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);

  // Fetch city, company domain or keyword suggestions with debounce (NOT industry)

  useEffect(() => {

    if (optionType === "city" || optionType === "organizationName" || optionType === "keywords" || optionType === "personName" || optionType === "industry") {

      const timer = setTimeout(async () => {

        if (searchInput.length >= 2) {

          setLoadingSuggestions(true);

          try {

            const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

            let endpoint = "";

            if (optionType === "city") endpoint = "/api/search/city-suggestions";

            else if (optionType === "organizationName") endpoint = "/api/search/company-domain-suggestions";

            else if (optionType === "personName") endpoint = "/api/search/name-suggestions";

            else if (optionType === "keywords") endpoint = "/api/search/keywords-suggestions";

            else if (optionType === "industry") endpoint = "/api/search/industry-suggestions";

            const searchQuery = optionType === "organizationName" ? extractDomain(searchInput) : searchInput;
            const res = await axios.get(`${BASE_URL}${endpoint}?query=${searchQuery}`, {

              headers: { Authorization: `Bearer ${token}` },

            });



            if (optionType === "city") {

              setCitySuggestions(res.data.suggestions || []);

            } else if (optionType === "organizationName") {
              setCompanyDomainSuggestions(res.data.suggestions || []);
            } else if (optionType === "keywords") {

              const apiSuggestions = res.data.suggestions || [];
              const q = searchInput.toLowerCase();
              const abbrMatches = Object.entries({ ...countryAbbreviations, ...jobTitleAbbreviations, ...industryAbbreviations })
                .filter(([code]) => code.startsWith(q))
                .flatMap(([, names]) => Array.isArray(names) ? names : [names]);
              const merged = [...new Set([...apiSuggestions, ...abbrMatches])];
              setKeywordSuggestions(merged);

            } else if (optionType === "personName") {

              setNameSuggestions(res.data.suggestions || []);

            } else if (optionType === "industry") {

              setIndustrySuggestions(res.data.suggestions || []);

            }

            if (searchInputRef.current.length >= 2) {
              setShowSuggestions(true);
            }

          } catch (error) {

            // console.error(`Failed to fetch ${optionType} suggestions:`, error);

            if (optionType === "city") setCitySuggestions([]);

            else if (optionType === "organizationName") setCompanyDomainSuggestions([]);

            else if (optionType === "keywords") setKeywordSuggestions([]);

            else if (optionType === "personName") setNameSuggestions([]);

            else if (optionType === "industry") setIndustrySuggestions([]);

          } finally {

            setLoadingSuggestions(false);
            if (searchInputRef.current.length < 2) {
              setShowSuggestions(false);
            }

          }

        } else {

          if (optionType === "city") setCitySuggestions([]);

          else if (optionType === "organizationName") setCompanyDomainSuggestions([]);

          else if (optionType === "keywords") {

            setKeywordSuggestions([]);

          } else if (optionType === "personName") {

            setNameSuggestions([]);

          } else if (optionType === "industry") {

            setIndustrySuggestions([]);

          }

          setShowSuggestions(false);
        }

      }, 300);



      return () => clearTimeout(timer);

    }

  }, [searchInput, optionType, visibleSection]);

  // Job title abbreviation suggestions
  useEffect(() => {
    if (optionType === "jobTitle" && searchInput.length >= 1) {
      const timer = setTimeout(() => {
        const q = searchInput.toLowerCase();
        const matches = Object.entries(jobTitleAbbreviations)
          .filter(([code]) => code.startsWith(q))
          .flatMap(([, names]) => Array.isArray(names) ? names : [names]);
        const uniqueMatches = [...new Set(matches)];
        if (uniqueMatches.length > 0) {
          setJobTitleSuggestions(uniqueMatches);
          setShowJobTitleSuggestions(true);
        } else {
          setJobTitleSuggestions([]);
          setShowJobTitleSuggestions(false);
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setJobTitleSuggestions([]);
      setShowJobTitleSuggestions(false);
    }
  }, [searchInput, optionType]);



  const handleSuggestionClick = (value) => {
    if (isLocked) {
      toast.warn(FREE_TIER_TOAST);
      return;
    }

    const actualValue = typeof value === 'string' ? value : value.name;

    // Add the item to the selected options

    onHandleCheckboxChange(optionType, actualValue);

    setShowSuggestions(false);

    if (optionType === "jobTitle") {
      setShowJobTitleSuggestions(false);
      setJobTitleSuggestions([]);
    }

    if (optionType === "city") {

      setCitySuggestions([]);

    } else if (optionType === "organizationName") {

      setCompanyDomainSuggestions([]);

          } else if (optionType === "keywords") {

            setKeywordSuggestions([]);

          } else if (optionType === "personName") {

      setNameSuggestions([]);

    }

    // Clear the search input

    onSearchInputChange({ target: { value: '' } });

    // Close the filter dropdown
    onToggleVisibility(optionType);

  };

  const renderFoundedYearFilter = () => {

    if (

      optionType !== "foundedYear" ||

      (!includedOptions[optionType]?.minYear &&

        !includedOptions[optionType]?.maxYear)

    ) {

      return null;

    }



    const minYear = includedOptions[optionType].minYear;

    const maxYear = includedOptions[optionType].maxYear;

    let displayText = "";



    if (minYear && maxYear) {

      displayText = `${minYear} - ${maxYear}`;

    } else if (minYear) {

      displayText = `> ${minYear}`;

    } else if (maxYear) {

      displayText = `< ${maxYear}`;

    }



    return (

      <div className="pb-4 pl-4 text-xs font-normal bg-white included">

        <div className="flex flex-wrap">

          <div className="flex items-center p-1 mb-2 mr-2 font-medium text-white bg-blue-400 rounded-sm">

            <span>{displayText}</span>

            <X

              size={13}

              className="ml-1 cursor-pointer"

              onClick={() => {

                handleItemSelect({

                  minYear: null,

                  maxYear: null,

                });

                onToggleVisibility(optionType);

              }}

            />

          </div>

        </div>

      </div>

    );

  };



  return (

    <div className="group">

      <div className="border border-gray-100">

        <div

          ref={divRef}

          className={`filter-option flex justify-between items-center p-3 text-[14px] group-hover:text-blue-500 transition-colors delay-75 bg-white rounded cursor-pointer ${isActive ? "text-blue-500" : " text-gray-800"

            }`}

          onClick={handleClick}

        >

          <span className="flex items-center">

            <Icon

              size={17}

              className={`mr-4  group-hover:text-blue-500 transition-colors delay-75 ${isActive ? "text-blue-500" : " text-gray-500"

                }`}

            />

            {label}

          </span>

          <div className="flex">

            {getCount() > 0 && (

              <span className="h-5 mr-2 text-gray-500 border border-gray-300 rounded-sm counter-country">

                <span className="flex items-center ml-1">

                  <span className="text-[12px]">{getCount()}</span>

                  <X

                    size={14}

                    className="ml-1 cursor-pointer"

                    onClick={() => onClearAllOptions(optionType)}

                  />

                </span>

              </span>

            )}

            {visibleSection === optionType ? (

              <ChevronUp

                size={18}

                className="transition duration-200 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600"

              />

            ) : (

              <ChevronDown

                size={18}

                className="transition duration-200 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600"

              />

            )}

          </div>

        </div>



        {/* Render founded year filter */}

        {renderFoundedYearFilter()}



        {/* Render regular filters */}

        {includedOptions[optionType]?.length > 0 &&

          optionType !== "foundedYear" && (

            <div className="pb-4 pl-4 text-xs font-normal bg-white included">

              <div className="mb-2 text-gray-900">Included:</div>

              <div className="flex flex-wrap">

                {includedOptions[optionType].map((option) => (

                  <div

                    key={option}

                    className="flex items-center p-1 mb-2 mr-2 font-medium text-white bg-blue-400 rounded-sm"

                  >

                    <span>{option}</span>

                    <CircleOff

                      size={13}

                      className="ml-1 cursor-pointer"

                      onClick={() => handleExcludeItemSelect(option)}

                    />

                    <X

                      size={13}

                      className="ml-1 cursor-pointer"

                      onClick={() => {

                        handleItemSelect(option);

                        onToggleVisibility(optionType);

                      }}

                    />

                  </div>

                ))}

              </div>

            </div>

          )}



        {excludedOptions[optionType]?.length > 0 && (

          <div className="pb-4 pl-4 text-xs font-normal bg-white excluded">

            <div className="mb-2 text-gray-900">Excluded:</div>

            <div className="flex flex-wrap">

              {excludedOptions[optionType].map((option) => (

                <div

                  key={option}

                  className="flex items-center p-1 mb-2 mr-2 font-medium text-white bg-red-400 rounded-sm"

                >

                  <span>{option}</span>

                  <Plus

                    size={13}

                    className="ml-1 cursor-pointer"

                    onClick={() => handleExcludeItemSelect(option)}

                  />

                  <X

                    size={13}

                    className="ml-1 cursor-pointer"

                    onClick={() => {

                      handleRemoveExcludeItem(option);

                      onToggleVisibility(optionType);

                    }}

                  />

                </div>

              ))}

            </div>

          </div>

        )}



        {visibleSection === optionType && (

          <div

            id={`lead-${optionType}-results`}

            className="p-4 bg-white border shadow-md search-results left-7"

          >

            {hasSearch && (

              <div className="mb-2 search-bar relative">

                <div className="flex items-center gap-2">

                  <input

                    className="w-full p-1 text-sm font-normal text-gray-900 border border-gray-300 rounded shadow-sm search-bar-input focus:outline-1 focus:outline-blue-300"

                    type="text"

                    placeholder={`Add ${label}`}

                    value={searchInput}

                    onChange={(e) => onSearchInputChange(e)}

                    onKeyDown={(e) => {
                      if (isLocked) {
                        toast.warn(FREE_TIER_TOAST);
                        return;
                      }
                      onSearchInputKeyPress(e, optionType);
                    }}

                  />

                  {(optionType === "city" || optionType === "zip" || optionType === "keywords" || optionType === "personName" || optionType === "organizationName") && (

                    <button

                      onClick={() => {
                        if (isLocked) {
                          toast.warn(FREE_TIER_TOAST);
                          return;
                        }
                        onSearchTrigger();
                      }}

                      disabled={isDataLoading}

                      className="px-3 py-[5px] text-[13px] text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex flex-shrink-0 items-center transition-colors"

                    >

                      {isDataLoading && visibleSection === optionType ? (

                        <span className="w-3.5 h-3.5 mr-1.5 border-2 border-white rounded-full border-t-transparent animate-spin inline-block"></span>

                      ) : null}

                      Process

                    </button>

                  )}

                </div>

                {/* Job Title abbreviation suggestions */}
                {optionType === "jobTitle" && showJobTitleSuggestions && (
                  <div className="mt-1 mb-2 bg-white border border-gray-300 rounded shadow-sm max-h-32 overflow-y-auto">
                    {jobTitleSuggestions.length > 0 ? (
                      jobTitleSuggestions.map((item, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"
                          onClick={() => handleSuggestionClick(item)}
                        >
                          <div className="font-medium">{item}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">No suggestions found</div>
                    )}
                  </div>
                )}

                {/* City/Company Domain/Keywords/Name suggestions dropdown */}

                {(optionType === "city" || optionType === "organizationName" || optionType === "keywords" || optionType === "personName" || optionType === "industry") && (showSuggestions || loadingSuggestions) && (

                  <div

                    ref={suggestionRef}

                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto"

                  >

                    {loadingSuggestions ? (

                      <div className="p-2 text-sm text-gray-500">Loading...</div>

                    ) : (

                      (optionType === "city" ? citySuggestions : optionType === "organizationName" ? companyDomainSuggestions : optionType === "personName" ? nameSuggestions : optionType === "keywords" ? keywordSuggestions : industrySuggestions).length > 0 ? (

                        (optionType === "city" ? citySuggestions : optionType === "organizationName" ? companyDomainSuggestions : optionType === "personName" ? nameSuggestions : optionType === "keywords" ? keywordSuggestions : industrySuggestions).map((item, index) => {

                          const itemName = typeof item === 'string' ? item : item.name;

                          const itemDomain = typeof item === 'object' && item.domain ? item.domain : null;

                          const capitalizedItemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);



                          // For company suggestions, show logo

                          if (optionType === "organizationName") {

                            const finalDomain = sanitizeDomainForDisplay(itemDomain || itemName) || (itemName ? itemName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : null);

                            const initials = itemName ? itemName.substring(0, 2).toUpperCase() : "??";

                            const logoUrl = finalDomain ? `https://www.google.com/s2/favicons?domain=${finalDomain}&sz=128` : null;

                            return (

                              <div

                                key={index}

                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700 flex items-center gap-3"

                                onClick={() => handleSuggestionClick(item)}

                              >

                                {/* Company Logo */}
                                {finalDomain ? (
                                  <div className="relative w-6 h-6 flex-shrink-0">
                                    <img
                                      src={logoUrl}
                                      alt={`${itemName} logo`}
                                      className="w-full h-full object-contain rounded-full bg-white border border-gray-100"
                                      onLoad={() => logoCache.add(finalDomain)}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.nextElementSibling.style.display = "flex";
                                      }}
                                    />
                                    <div
                                      className="hidden w-full h-full bg-blue-500 rounded-full items-center justify-center text-white text-[10px] font-bold"
                                    >
                                      {initials}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                    {initials}
                                  </div>
                                )}

                                {/* Company Info */}

                                <div className="flex-1 min-w-0">

                                  <div className="font-medium truncate">{capitalizedItemName}</div>

                                  {itemDomain && (

                                    <div className="text-xs text-gray-500 truncate">{itemDomain}</div>

                                  )}

                                </div>

                              </div>

                            );

                          }



                          // For city/keywords/industry, show simple text

                          return (

                            <div

                              key={index}

                              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-700"

                              onClick={() => handleSuggestionClick(item)}

                            >

                              <div className="font-medium">{capitalizedItemName}</div>

                            </div>

                          );

                        })

                      ) : (

                        <div className="p-2 text-sm text-gray-500">No suggestions found</div>

                      )

                    )}

                  </div>

                )}

              </div>

            )}

            {hasYearFilter && (

              <FoundedYearFilter handleItemSelect={handleItemSelect} />

            )}



            {!hasYearFilter && (

              <ul className="ml-1 overflow-y-scroll font-normal max-h-44">

                {filterItems.map((option, index) => (

                  <li

                    className="flex items-center py-2 pr-1 text-xs border-b cursor-pointer checkbox-container-div hover:bg-blue-50"

                    key={index}

                  >

                    <label className="flex items-center w-full cursor-pointer">

                      <input

                        className={`${optionType}-checkbox mr-2 cursor-pointer`}

                        type="checkbox"

                        value={option}

                        checked={includedOptions[optionType]?.includes(option)}

                        onChange={(e) => handleItemSelect(e.target.value)}

                      />

                      <span className="font-semibold text-gray-700 checkmark">

                        {option}

                      </span>

                    </label>

                  </li>

                ))}

              </ul>

            )}

          </div>

        )}

      </div>

    </div>

  );

};



OptionFilter.propTypes = {

  includedOptions: PropTypes.object.isRequired,

  excludedOptions: PropTypes.object.isRequired,

  visibleSection: PropTypes.string,

  hasSearch: PropTypes.bool.isRequired,

  searchInput: PropTypes.string.isRequired,

  onSearchInputChange: PropTypes.func.isRequired,

  onSearchInputKeyPress: PropTypes.func.isRequired,

  onSearchTrigger: PropTypes.func.isRequired,

  isDataLoading: PropTypes.bool.isRequired,

  onToggleVisibility: PropTypes.func.isRequired,

  onClearAllOptions: PropTypes.func.isRequired,

  onHandleCheckboxChange: PropTypes.func.isRequired,

  onSelectExcludeOptions: PropTypes.func.isRequired,

  optionsList: PropTypes.array.isRequired,

  icon: PropTypes.elementType.isRequired,

  label: PropTypes.string.isRequired,

  optionType: PropTypes.string.isRequired,

  hasYearFilter: PropTypes.bool,

  isLocked: PropTypes.bool,

};



export default OptionFilter;

