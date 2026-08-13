import { useState } from "react";
const FoundedYearFilter = ({ handleItemSelect, visibleSection }) => {
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [includeUnknown, setIncludeUnknown] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 124 }, (_, i) => currentYear - i);

  const handleMinYearChange = (e) => {
    const newMinYear = e.target.value;
    setMinYear(newMinYear);
    handleItemSelect({ minYear: newMinYear, maxYear });
  };

  const handleMaxYearChange = (e) => {
    const newMaxYear = e.target.value;
    setMaxYear(newMaxYear);
    handleItemSelect({ minYear, maxYear: newMaxYear });
  };

  return (
    <div className="bg-white rounded-lg ">
      <div className="flex items-center mb-3 space-x-2">
        <select
          className="flex-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded-md"
          value={minYear}
          onChange={handleMinYearChange}
        >
          <option value="">Min year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <span className="text-gray-400">—</span>
        <select
          className="flex-1 px-2 py-1 ml-2 text-xs text-gray-600 border border-gray-300 rounded-md"
          value={maxYear}
          onChange={handleMaxYearChange}
        >
          <option value="">Max year</option>
          {years.map((year) => (
            <option
              key={year}
              value={year}
              disabled={parseInt(year) < parseInt(minYear)}
            >
              {year}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center space-x-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={includeUnknown}
          onChange={() => setIncludeUnknown(!includeUnknown)}
          className="w-4 h-4 text-blue-600 rounded form-checkbox"
        />
        <span>Include with unknown year</span>
      </label>
    </div>
  );
};

export default FoundedYearFilter;
