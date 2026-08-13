import { ChevronDown, Lock } from "lucide-react";

const FREE_USER_LIMIT = 100;

export default function SelectOptions({
  dropdownRef,
  isAdvanceVisible,
  handleAdvanceClick,
  numberPeopleValue,
  handlePeopleChange,
  onSelectAllCheckBox,
  onApplySelection,
  onClearCheckedItems,
  hideAdvanceOptions,
  totalCount = 0,
  onPageCount = 0,
  onSelectAllPeople,
  isFreeUser,
  entityLabel = "people",
  numberOfPeopleValue,
  handleNumberOfPeopleChange,
}) {
  const displayCount = isFreeUser
    ? Math.min(totalCount, FREE_USER_LIMIT)
    : totalCount;

  return (
    <div
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 text-sm font-semibold text-gray-800 bg-white border shadow-md select-options w-72 text-md"
    >
      <div
        className="px-4 py-2 transition-colors delay-75 border-b rounded-t-sm cursor-pointer hover:bg-blue-500 hover:text-white"
        onClick={onSelectAllCheckBox}
      >
        Select this page ({onPageCount})
      </div>
      {!isFreeUser && (
        <div
          onClick={onSelectAllPeople}
          className="flex items-center justify-between px-4 py-2 transition-colors delay-75 border-b cursor-pointer hover:bg-blue-500 hover:text-white"
        >
          <span>
            <span>Select all {entityLabel}</span>
            <span>({displayCount.toLocaleString()})</span>
          </span>
        </div>
      )}
      {!hideAdvanceOptions && (
        <div className={isFreeUser ? "relative group" : ""}>
          {isFreeUser && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 text-xs font-medium text-yellow-900 bg-yellow-200 border border-yellow-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Upgrade your plan to use these Advance Options
            </div>
          )}
          <div
            onClick={handleAdvanceClick}
            className={`flex items-center justify-between px-4 pt-2 pb-3 ${isFreeUser ? "text-gray-500 cursor-not-allowed" : "text-blue-500 cursor-pointer"}`}
          >
            <span className="flex items-center gap-2">
              {isFreeUser && <Lock size={14} />}
              Advance options
            </span>
            <ChevronDown size={18} />
          </div>
          {isAdvanceVisible && (
            <div className="px-4 py-2">
              <div className="flex items-center justify-between my-1">
                <span className={isFreeUser ? "text-gray-500" : ""}>Select people</span>
                <input
                  type="number"
                  value={numberPeopleValue}
                  onChange={handlePeopleChange}
                  className={`px-2 py-1 border rounded-sm w-20 focus:outline-none ${isFreeUser ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:border-blue-500"}`}
                  min="0"
                  step="1"
                  disabled={isFreeUser}
                />
              </div>
              <div className="flex items-center justify-between my-1">
                <span className={isFreeUser ? "text-gray-500" : ""}>Select Number of people</span>
                <input
                  type="number"
                  value={numberOfPeopleValue}
                  onChange={handleNumberOfPeopleChange}
                  className={`px-2 py-1 border rounded-sm w-20 focus:outline-none ${isFreeUser ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:border-blue-500"}`}
                  min="0"
                  step="1"
                  disabled={isFreeUser}
                />
              </div>
              <button
                type="button"
                className={`w-full px-2 py-1 mt-2 mb-2 text-white rounded-sm ${isFreeUser ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"}`}
                onClick={onApplySelection}
                disabled={isFreeUser}
              >
                Apply selection
              </button>
            </div>
          )}
        </div>
      )}
      <div
        className="px-4 py-2 transition-colors delay-75 border-t-2 rounded-b-sm cursor-pointer hover:bg-blue-500 hover:text-white"
        onClick={onClearCheckedItems}
      >
        Clear selection
      </div>
    </div>
  );
}
