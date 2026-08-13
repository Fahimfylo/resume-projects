/* eslint-disable react/prop-types */
import { ClipboardList } from "lucide-react"; // Example icon from lucide-react

const EmptyPage = ({
  title = "No data found",
  description = "Your workspace is empty. Start by adding new items to this section.",
  icon: Icon = ClipboardList,
  actions = [], // Array of { label, onClick, variant }
  noPadding = false,
}) => {
  return (
    <div className={`${noPadding ? "py-4" : "py-20"} flex justify-center`}>
      <div className="max-w-md w-full mx-auto px-8 py-12 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
        {/* Icon Container */}
        <div className="mx-auto w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-sky-600" strokeWidth={1.5} />
        </div>

        {/* Dynamic Text Content */}
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 mt-2 text-balance">
          {description}
        </p>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {actions.map((action, index) => {
              const isPrimary = action.variant === "primary" || !action.variant;
              const isSecondary = action.variant === "secondary";

              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all active:scale-95 ${
                    isPrimary
                      ? "bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-100"
                      : isSecondary
                        ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                        : ""
                  }`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyPage;
