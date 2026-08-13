import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import PropTypes from "prop-types";
import "flag-icons/css/flag-icons.min.css";

export const countries = [
  { name: "Bangladesh", code: "bd", dial: "+880" },
  { name: "India", code: "in", dial: "+91" },
  { name: "United States", code: "us", dial: "+1" },
  { name: "United Kingdom", code: "gb", dial: "+44" },
  { name: "Canada", code: "ca", dial: "+1" },
  { name: "Australia", code: "au", dial: "+61" },
  { name: "Germany", code: "de", dial: "+49" },
  { name: "France", code: "fr", dial: "+33" },
  { name: "Italy", code: "it", dial: "+39" },
  { name: "Spain", code: "es", dial: "+34" },
  { name: "Netherlands", code: "nl", dial: "+31" },
  { name: "Belgium", code: "be", dial: "+32" },
  { name: "Sweden", code: "se", dial: "+46" },
  { name: "Norway", code: "no", dial: "+47" },
  { name: "Denmark", code: "dk", dial: "+45" },
  { name: "Finland", code: "fi", dial: "+358" },
  { name: "Switzerland", code: "ch", dial: "+41" },
  { name: "Austria", code: "at", dial: "+43" },
  { name: "Portugal", code: "pt", dial: "+351" },
  { name: "Greece", code: "gr", dial: "+30" },
  { name: "Poland", code: "pl", dial: "+48" },
  { name: "Turkey", code: "tr", dial: "+90" },
  { name: "Saudi Arabia", code: "sa", dial: "+966" },
  { name: "United Arab Emirates", code: "ae", dial: "+971" },
  { name: "Qatar", code: "qa", dial: "+974" },
  { name: "Kuwait", code: "kw", dial: "+965" },
  { name: "Pakistan", code: "pk", dial: "+92" },
  { name: "Sri Lanka", code: "lk", dial: "+94" },
  { name: "Nepal", code: "np", dial: "+977" },
  { name: "China", code: "cn", dial: "+86" },
  { name: "Japan", code: "jp", dial: "+81" },
  { name: "South Korea", code: "kr", dial: "+82" },
  { name: "Indonesia", code: "id", dial: "+62" },
  { name: "Malaysia", code: "my", dial: "+60" },
  { name: "Singapore", code: "sg", dial: "+65" },
  { name: "Philippines", code: "ph", dial: "+63" },
  { name: "Thailand", code: "th", dial: "+66" },
  { name: "Vietnam", code: "vn", dial: "+84" },
  { name: "Brazil", code: "br", dial: "+55" },
  { name: "Mexico", code: "mx", dial: "+52" },
  { name: "Argentina", code: "ar", dial: "+54" },
  { name: "Russia", code: "ru", dial: "+7" },
  { name: "South Africa", code: "za", dial: "+27" },
  { name: "Nigeria", code: "ng", dial: "+234" },
  { name: "Egypt", code: "eg", dial: "+20" },
  { name: "New Zealand", code: "nz", dial: "+64" },
  { name: "Ireland", code: "ie", dial: "+353" },
  { name: "Czech Republic", code: "cz", dial: "+420" },
  { name: "Romania", code: "ro", dial: "+40" },
  { name: "Hungary", code: "hu", dial: "+36" },
  { name: "Israel", code: "il", dial: "+972" },
  { name: "Colombia", code: "co", dial: "+57" },
  { name: "Chile", code: "cl", dial: "+56" },
  { name: "Ukraine", code: "ua", dial: "+380" },
];

const CountrySelector = ({ value = "bd", onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === value) || countries[0],
    [value]
  );

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropdownRef} className="relative flex-shrink-0">
      {/* Trigger Button - Matches Register page input style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-10 px-2.5 border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
      >
        <span className={`fi fi-${selectedCountry.code}`} style={{ fontSize: "14px" }} />
        <span className="text-xs text-gray-700 whitespace-nowrap">
          {selectedCountry.dial}
        </span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 z-[9999] mt-1 w-56 bg-white rounded-sm shadow-lg border border-gray-300 overflow-hidden">
          {/* Search */}
          <div className="p-1.5 border-b border-gray-200">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-7 pl-6 pr-5 text-xs bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-28 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-500 text-center">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-blue-50 transition-colors text-left ${
                    country.code === value ? "bg-blue-50/50" : ""
                  }`}
                >
                  <span className={`fi fi-${country.code} flex-shrink-0`} style={{ fontSize: "14px" }} />
                  <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 w-8">
                    {country.dial}
                  </span>
                  <span className="text-xs text-gray-700 truncate">
                    {country.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

CountrySelector.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default CountrySelector;
