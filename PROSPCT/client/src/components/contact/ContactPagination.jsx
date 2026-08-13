import { ChevronLeft, ChevronRight } from "lucide-react";

function ContactPagination({ currentPage, totalPages, onPageChange }) {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const handlePrev = () => {
    if (canPrev) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (canNext) onPageChange(currentPage + 1);
  };

  return (
    <div className="mt-4 flex space-x-2 justify-center items-center text-gray-700">
      <button
        type="button"
        disabled={!canPrev}
        onClick={handlePrev}
        className={`cursor-pointer p-1 px-2 py-1 bg-white text-center border rounded-sm transition-colors duration-300 ${
          canPrev
            ? "hover:text-sky-500 hover:border-sky-500"
            : "opacity-50 cursor-not-allowed"
        }`}
      >
        <ChevronLeft size={16} className="text-sm" />
      </button>

      <div className="flex items-center bg-white border rounded-sm px-3 py-1">
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <button
        type="button"
        disabled={!canNext}
        onClick={handleNext}
        className={`cursor-pointer p-1 px-2 py-1 bg-white text-center border rounded-sm transition-colors duration-300 ${
          canNext
            ? "hover:text-sky-500 hover:border-sky-500"
            : "opacity-50 cursor-not-allowed"
        }`}
      >
        <ChevronRight size={16} className="text-sm" />
      </button>
    </div>
  );
}

export default ContactPagination;
