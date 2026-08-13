import LeadSearchFilter from "./LeadSearchFilter";
import LeadRightSec from "./LeadRightSec";
import SaveLeads from "./SaveLeads";
import { useState } from "react";
import Exports from "./Exports";
import LeadProfile from "./LeadProfile";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LeadsSearch({ filterName }) {
  const [hoveredText, setHoveredText] = useState("");
  const [hoveredPosition, setHoveredPosition] = useState({});
  const [dataItem, setDataItem] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleMouseEnter = (e) => {
    const textElement = e.currentTarget;
    const text = textElement.textContent || "";

    if (textElement.scrollWidth > textElement.clientWidth) {
      const { left, top, height } = textElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate the default tooltip position (below the text)
      let tooltipLeft = left;

      let tooltipTop = top + window.scrollY + height + 5;

      // Adjust the position if the tooltip would go off the right edge of the screen
      const tooltipWidth = textElement.scrollWidth;
      if (tooltipLeft + tooltipWidth > viewportWidth) {
        tooltipLeft = viewportWidth - tooltipWidth - 10;
      }

      // Adjust the position if the tooltip would go off the bottom edge of the screen
      const tooltipHeight = height;
      if (tooltipTop + tooltipHeight > viewportHeight) {
        tooltipTop = top + window.scrollY - tooltipHeight - 5;
      }

      // Ensure the tooltip does not go off the left edge of the screen
      if (tooltipLeft < 0) {
        tooltipLeft = 10; // Use a smaller padding
      }

      setHoveredPosition({ left: tooltipLeft, top: tooltipTop });
      setHoveredText(text);
    }
  };

  const handleMouseLeave = () => {
    setHoveredText("");
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Mobile: filter drawer + toggle */}
      <div className="sm:hidden">
        {mobileFilterOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileFilterOpen(false)}
          />
        )}
        <div
          className={`fixed top-12 left-0 h-[calc(100vh-48px)] w-1/2 z-40 transform transition-transform duration-300 ease-in-out bg-white ${
            mobileFilterOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <LeadSearchFilter filterName={filterName} />
        </div>
        <button
          className="fixed top-1/2 left-0 z-50 -translate-y-1/2 bg-white border border-gray-300 rounded-r-md p-1.5 shadow-md hover:bg-gray-50 transition-colors"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          aria-label={mobileFilterOpen ? "Close filters" : "Open filters"}
        >
          {mobileFilterOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div
        className="block overflow-hidden sm:flex bg-gray-50 h-full"
      >
        <div className="hidden sm:block">
          <LeadSearchFilter filterName={filterName} />
        </div>
        <LeadRightSec
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          setDataItem={setDataItem}
        />
      </div>
      <LeadProfile dataItem={dataItem} />
      <SaveLeads />
      {/* <ExportLeads/> */}
      <Exports />

      {/* Hovered Text Display */}
      {hoveredText && (
        <div
          className="text-sm text-white bg-gray-900"
          style={{
            position: "absolute",
            left: hoveredPosition.left,
            top: hoveredPosition.top,
            padding: "5px 10px",
            border: "1px solid gray",
            borderRadius: "4px",
            zIndex: 1000,
            boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
            whiteSpace: "wrap",
          }}
        >
          {hoveredText}
        </div>
      )}
    </div>
  );
}
