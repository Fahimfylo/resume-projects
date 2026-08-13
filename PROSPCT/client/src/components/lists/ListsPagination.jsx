import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

function ListsPagination({ totalPages = 1, currentPage: currentPageProp, onPageChange }) {
  const [localPage, setLocalPage] = useState(currentPageProp ?? 1);
  const currentPage = currentPageProp ?? localPage;

  useEffect(() => {
    if (currentPageProp !== undefined) {
      setLocalPage(currentPageProp);
    }
  }, [currentPageProp]);

  const setPage = (page) => {
    const normalized = Math.max(1, Math.min(totalPages || 1, page));
    if (onPageChange) {
      onPageChange(normalized);
    }
    setLocalPage(normalized);
  };

  const handleInputChange = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setPage(parsed);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-gray-700">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => setPage(currentPage - 1)}
        className="flex items-center justify-center rounded-sm border bg-white px-2 py-1 text-gray-700 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:border-sky-500 hover:text-sky-500"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-2 rounded-sm border bg-white px-3 py-1">
        <span className="text-sm text-gray-600">Page</span>
        <input
          type="text"
          value={currentPage}
          onChange={(e) => handleInputChange(e.target.value)}
          className="w-12 rounded border border-gray-200 px-2 py-1 text-center text-sm focus:border-sky-500 focus:outline-none"
        />
        <span className="text-sm text-gray-600">of</span>
        <span className="text-sm font-semibold text-gray-800">{totalPages}</span>
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => setPage(currentPage + 1)}
        className="flex items-center justify-center rounded-sm border bg-white px-2 py-1 text-gray-700 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:border-sky-500 hover:text-sky-500"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default ListsPagination;
