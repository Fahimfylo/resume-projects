import { useEffect, useState, useRef } from "react";
import { X, GripVertical } from "lucide-react";
import useStore from "../../store/store";
import { Link } from "react-router-dom";

export default function EditCompanyColumns() {
  const [isAnimatedVisible, setIsAnimatedVisible] = useState(false);
  const containerRef = useRef(null);
  const {
    isCompanyEditColumnsVisible,
    setCompanyEditColumnsVisible,
    visibleCompanyColumns,
    toggleCompanyColumn,
    resetCompanyColumns,
  } = useStore();

  const fields = [
    "Name",
    "Domain",
    "Industry",
    "Employees",
    "Headquarters",
  ];

  useEffect(() => {
    if (isCompanyEditColumnsVisible) {
      const timer = setTimeout(() => {
        setIsAnimatedVisible(true);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setIsAnimatedVisible(false);
    }
  }, [isCompanyEditColumnsVisible]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setCompanyEditColumnsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setCompanyEditColumnsVisible]);

  return (
    <section
      id="company-edit-column-section"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${
        isCompanyEditColumnsVisible
          ? "opacity-100"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Background Mask */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Content Container with Scaling Effect */}
      <div
        ref={containerRef}
        className={`relative w-full max-w-3xl bg-white rounded-lg shadow-lg transform transition-transform duration-300 ease-out ${
          isAnimatedVisible ? "scale-100" : "scale-0"
        }`}
      >
        <div className="flex justify-between items-center p-4 px-7 bg-blue-600 text-white rounded-t-lg">
          <span className="font-semibold text-lg">
            Choose which columns you see
          </span>
          <X
            className="cursor-pointer text-lg"
            onClick={() => setCompanyEditColumnsVisible(false)}
          />
        </div>
        <div className="flex p-6 space-x-6">
          <div className="w-1/2 border-r border-gray-300 pr-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search properties"
                className="w-full h-10 px-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="h-64 overflow-y-auto border rounded bg-white">
              <div className="p-4">
                <div className="font-semibold text-gray-700">
                  Company Properties
                </div>
                <div>
                  {fields.map((field) => (
                    <label
                      key={field}
                      className="flex items-center font-semibold text-gray-600 mt-1 mb-2"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCompanyColumns.includes(field)}
                        onChange={() => toggleCompanyColumn(field)}
                        className="w-4 h-4"
                      />
                      <span className="ml-2">{field}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs">
              Don&apos;t see the property you&apos;re looking for?{" "}
              <Link
                to="#"
                className="hover:underline text-blue-500 font-semibold"
              >
                Create Link property
              </Link>
            </p>
          </div>
          <div className="w-1/2">
            <div className="font-semibold text-gray-700">
              Selected columns ({visibleCompanyColumns.length})
            </div>
            <div className="mt-4 space-y-2">
              {visibleCompanyColumns.map((column) => (
                <div
                  key={column}
                  className="pl-2 py-2 bg-gray-50 border border-gray-200 rounded-sm flex items-center"
                >
                  <GripVertical className="text-lg mr-1" />
                  {column}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center px-4 pb-4 pt-2">
          <button
            type="button"
            className="ml-2 px-8 py-2 mr-3 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setCompanyEditColumnsVisible(false)}
          >
            Save
          </button>
          <button
            type="button"
            className="px-8 py-2 mr-3 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => setCompanyEditColumnsVisible(false)}
          >
            Cancel
          </button>
          <span
            className="text-sky-600 cursor-pointer font-semibold mr-3"
            onClick={() => resetCompanyColumns()}
          >
            Reset columns
          </span>
        </div>
      </div>
    </section>
  );
}
