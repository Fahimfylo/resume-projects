import { GoTriangleLeft, GoTriangleRight } from "react-icons/go";
import { ImSpinner9 } from "react-icons/im";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import useStore from "../../store/store";
import { toast } from "react-toastify";

export default function Pagination({ data, counts, totalLoading, viewType: viewTypeProp, usePageMode }) {
  const { filters, setFilters, cursorHistory, nextCursor, hasMore, navigateNextPage, navigatePrevPage, goToPage, resetCursorState } = useStore();
  const viewType = viewTypeProp || filters.viewType || "total";
  const itemPerPage = filters.limit || 25;

  // Cursor-based: current page is derived from history
  // Page-based: current page comes from filters.currentPage
  const currentPage = usePageMode ? (filters.currentPage || 1) : (cursorHistory.length + 1);


  const isTotalKnown = usePageMode
    ? (data?.total != null)
    : (counts?.[viewType] != null && !totalLoading);

  const totalData = usePageMode
    ? (data?.total ?? 0)
    : (counts?.[viewType] ?? data?.onPage);

  // Safety guard: NaN/undefined → 1
  const totalForPaging = totalData ?? 1;
  const totalPages = Number.isFinite(Math.ceil(totalForPaging / itemPerPage))
    ? Math.ceil(totalForPaging / itemPerPage)
    : 1;

  // Progressive pagination: when total is unknown, show pages we've visited
  const progressivePages = isTotalKnown
    ? totalPages
    : hasMore
      ? cursorHistory.length + 2
      : cursorHistory.length + 1;

  const { user } = useStore();
  const isFreePlan = user?.plan?.name?.toLowerCase() === "free";
  const maxPageForAlert = isFreePlan ? 4 : progressivePages;

  // ──────────────────────────────────────────────────────────────────────────

  const showAlert = () => {
    toast.warning(
      "You are on a limited version of Prospct which allows viewing up to 4 pages of Prospects."
    );
  };

  const handleNextPage = () => {

    if (usePageMode) {
      setFilters("currentPage", currentPage + 1);
      return;
    }
    if (nextCursor == null) return;
    if (currentPage >= maxPageForAlert) {
      showAlert();
      return;
    }
    navigateNextPage();
  };

  const handlePrevPage = () => {

    if (usePageMode) {
      if (currentPage <= 1) return;
      setFilters("currentPage", currentPage - 1);
      return;
    }
    if (cursorHistory.length === 0) return;
    navigatePrevPage();
  };

  const goToTargetPage = (page) => {

    if (page < 1) return;
    if (page > 1 && page > maxPageForAlert) {
      showAlert();
      return;
    }

    if (usePageMode) {

      setFilters("currentPage", page);
      return;
    }

    const curPage = cursorHistory.length + 1;
    if (page === curPage) return;

    if (page > curPage + 1) {
      // Can't jump forward multiple pages
      toast.warning("Use Next to navigate to further pages");
      return;
    }

    if (page === curPage + 1) {
      // Navigate forward one page (uses nextCursor)
      handleNextPage();
      return;
    }

    // page < curPage — navigate backwards via cursorHistory
    goToPage(page);
  };

  const handleItemsPerPageChange = (e) => {

    if (isFreePlan) return;
    setFilters("limit", Number(e.target.value));
    if (usePageMode) {
      setFilters("currentPage", 1);
    } else {
      resetCursorState();
    }
  };

  // ─── Windowed page numbers ─────────────────────────────────────────────────
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    const lastPage = progressivePages;

    const start = Math.max(1, currentPage - delta);
    const end = Math.min(lastPage, currentPage + delta);

    for (let i = start; i <= end; i++) range.push(i);

    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) rangeWithDots.push("...");
    }

    rangeWithDots.push(...range);

    if (end < lastPage) {
      if (end < lastPage - 1) rangeWithDots.push("...");
      rangeWithDots.push(lastPage);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-2 py-3 sm:flex-row sm:justify-between sm:px-3">
      {/* Items per page */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Show</span>
        <select
          value={itemPerPage}
          onChange={handleItemsPerPageChange}
          disabled={isFreePlan}
          className={`px-2 py-1 text-sm border border-gray-300 rounded-sm focus:outline-none transition-colors ${
            isFreePlan ? 'text-gray-500 bg-gray-50 cursor-not-allowed' : 'focus:border-blue-500 hover:border-blue-400'
          }`}
        >
          <option value={25}>25</option>
          {!isFreePlan && <option value={50}>50</option>}
          {!isFreePlan && <option value={100}>100</option>}
        </select>
        <span>per page</span>
        {totalLoading && totalData == null ? (
          <span className="ml-2 text-xs text-gray-400">- results</span>
        ) : totalLoading ? (
          <span className="ml-2 text-xs text-gray-400">
            <ImSpinner9 className="animate-spin inline" /> loading...
          </span>
        ) : totalData !== undefined ? (
          <span className="ml-2 text-xs text-gray-400">
            {totalData.toLocaleString()} results
          </span>
        ) : null}
      </div>

      {/* Page navigation — show whenever data exists, even before count arrives */}
      {data?.onPage > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {/* First */}
          <button
            onClick={() => goToTargetPage(1)}
            disabled={currentPage === 1}
            title="First page"
            className="p-1 rounded-sm border border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Prev */}
          <button
            onClick={handlePrevPage}
            disabled={usePageMode ? currentPage <= 1 : cursorHistory.length === 0}
            title="Previous page"
            className="p-1 rounded-sm border border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <GoTriangleLeft className="text-base" />
          </button>

          {/* Windowed page numbers */}
          {pageNumbers.map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="px-1 text-gray-400 text-sm select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToTargetPage(page)}
                className={`min-w-[32px] h-[30px] px-2 text-sm rounded-sm border transition-colors ${
                  page === currentPage
                    ? "bg-blue-500 text-white border-blue-500 font-semibold"
                    : usePageMode
                      ? "border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      : page > cursorHistory.length + 2
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-500"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={handleNextPage}
            disabled={usePageMode ? currentPage >= progressivePages : nextCursor == null}
            title="Next page"
            className="p-1 rounded-sm border border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <GoTriangleRight className="text-base" />
          </button>

          {/* Last — only show when total count is known */}
          {isTotalKnown && (
            <button
              onClick={() => goToTargetPage(progressivePages)}
              disabled={currentPage >= progressivePages}
              title="Last page"
              className="p-1 rounded-sm border border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
