import { ChevronDown, RotateCcw } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import useStore from "../../store/store";

const relevanceOptions = [
  "Name",
  "Company",
  "Email",
  "Phone",
  "Location",
  "Zip/Postal",
  "Employees",
  "Industry",
  "Keywords",
];

const RelevanceDown = React.forwardRef((props, ref) => {
  const {
    selectedRelevances,
    toggleRelevance,
    resetRelevances,
    applyRelevanceSelections,
    appliedSortOrder,
    setFilters,
  } = useStore();

  const [isADToggled, setIsADToggled] = useState(false);
  const [selectedAD, setSelectedAD] = useState(
    appliedSortOrder || "descending",
  );

  const divADRef = useRef(null);
  const toggleADRef = useRef(null);

  // Update selectedAD when appliedSortOrder changes
  useEffect(() => {
    setSelectedAD(appliedSortOrder || "descending");
  }, [appliedSortOrder]);

  const handleADToggle = (event) => {
    event.stopPropagation();
    setIsADToggled(!isADToggled);
  };

  const handleADSelect = (option) => {
    setSelectedAD(option.toLowerCase());
    setIsADToggled(false);
  };

  const handleApply = () => {
    // Update the sort order in store
    setFilters("sortOrder", selectedAD);

    // Apply the current selections for sorting
    applyRelevanceSelections();

    // Call the onApply callback with selected relevance options and direction
    if (props.onApply) {
      props.onApply({
        sortByFields: selectedRelevances,
        sortOrder: selectedAD,
      });
    }
  };

  const handleReset = () => {
    resetRelevances();
    setSelectedAD("descending");
  };

  useEffect(() => {
    const handleADOutsideClick = (event) => {
      if (
        divADRef.current &&
        !divADRef.current.contains(event.target) &&
        !toggleADRef.current.contains(event.target)
      ) {
        setIsADToggled(false);
      }
    };

    document.addEventListener("mousedown", handleADOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleADOutsideClick);
    };
  }, [divADRef]);

  return (
    <div
      ref={ref}
      className="layout-down border bg-white w-[240px] shadow-md p-4 text-[14px] text-gray-800"
    >
      <div className="mb-3">Sort by...</div>

      {/* Reset Button */}
      <div
        onClick={handleReset}
        className="border-b mb-3 py-2 px-2 flex items-center text-blue-500 cursor-pointer hover:bg-gray-50 rounded"
      ></div>

      {/* Relevance Checkboxes Section */}
      <div className="mb-3">
        <div className="font-semibold text-[13px] mb-2">Select Fields:</div>
        <div className="border rounded p-2 h-40 overflow-y-auto">
          {relevanceOptions.map((option) => (
            <div key={option} className="flex items-center py-1">
              <input
                type="checkbox"
                checked={selectedRelevances.includes(option)}
                onChange={() => toggleRelevance(option)}
                className="cursor-pointer"
              />
              <span className="ml-2 font-semibold text-[13px]">{option}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ascending/Descending Section */}
      <div className="mb-3">
        <div className="font-semibold text-[13px] mb-2">Sort Order:</div>
        <div
          className="ad border relative border-gray-300 cursor-pointer hover:border-blue-500 flex justify-between items-center font-semibold px-2 py-[6px] rounded-sm"
          onClick={handleADToggle}
          ref={toggleADRef}
        >
          <span className="ad-selected text-[13px]">
            {selectedAD === "ascending" ? "Ascending" : "Descending"}
          </span>
          <ChevronDown size={14} />
        </div>

        {isADToggled && (
          <div
            ref={divADRef}
            className="ad-options absolute shadow-sm z-20 border rounded-sm bg-white w-[120px] text-center mt-1"
          >
            {["ascending", "descending"].map((option) => (
              <div
                key={option}
                onClick={() => handleADSelect(option)}
                className={`ad-option py-1 font-semibold cursor-pointer text-[13px] ${
                  selectedAD === option ? "bg-blue-500 text-white" : ""
                }`}
              >
                {option === "ascending" ? "Ascending" : "Descending"}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleApply}
        className="bg-blue-500 hover:bg-blue-600 text-white w-full text-center font-semibold px-2 py-[6px] rounded-sm text-[13px]"
      >
        Apply
      </button>
    </div>
  );
});

RelevanceDown.displayName = "RelevanceDown";

export default RelevanceDown;
