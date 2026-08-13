import { RotateCcw } from "lucide-react";
import React from "react";
import useStore from "../../store/store";

const fields = [
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

const LayoutDown = React.forwardRef((props, ref) => {
  const { visibleColumns, toggleColumn, resetColumns } = useStore();

  return (
    <div
      ref={ref}
      className="layout-down border bg-white w-[210px] shadow-md text-gray-800 text-[14px]"
    >
      {/* Reset Button */}
      <div
        onClick={resetColumns}
        className="border-b py-3 px-4 flex items-center text-blue-500 cursor-pointer hover:bg-gray-50"
      >
        <RotateCcw size={16} className="mr-1" />
        <span className="font-semibold">Reset by default</span>
      </div>

      {/* Checkbox List */}
      <div className="pt-1 pb-2 px-4 h-52 overflow-y-auto">
        {fields.map((field) => (
          <div key={field} className="flex items-center py-2">
            <input
              type="checkbox"
              checked={visibleColumns.includes(field)}
              onChange={() => toggleColumn(field)}
              className="cursor-pointer"
            />
            <span className="ml-2 font-semibold">{field}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

LayoutDown.displayName = "LayoutDown";

export default LayoutDown;