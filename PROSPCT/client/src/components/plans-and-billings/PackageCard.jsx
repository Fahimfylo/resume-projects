export default function PackageCard({
  title,
  emails,
  verifications,
  price,
  annualPrice,
  annually,
  popular,
  isSelected,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`min-w-[277px] plan-billing-package p-5 mb-5 border rounded-sm transition-all duration-300 cursor-pointer ${
        isSelected ? "bg-blue-50 border-blue-400" : "border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold text-blue-600">{title}</p>
        {popular && (
          <div className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md">
            Most Popular
          </div>
        )}
      </div>
      <div className="my-4">
        <div className="flex items-center mb-2">
          <p className="text-sm text-gray-500">
            <strong>{emails}</strong> valid emails
          </p>
        </div>
        <div className="flex items-center mb-2">
          <p className="text-sm text-gray-500">
            <strong>{verifications}</strong> verifications
          </p>
        </div>
      </div>
      <div className="w-full my-2 border-b border-gray-300"></div>
      <div className="flex items-center mt-4">
        <div className="text-lg text-gray-500">
          <div>
            <span className="font-semibold text-gray-700">${price}</span>{" "}
            <span className="text-sm">monthly</span>
          </div>
          {annually && (
            <div>
              <span className="text-sm text-gray-500">${annualPrice}</span>{" "}
              <span className="text-sm">annually</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <button
          className={`w-full text-sm font-medium border rounded-sm h-8 flex items-center justify-center hover:border-blue-400  transition-all ${
            isSelected
              ? "bg-blue-600 text-white"
              : "border-gray-300 text-gray-600 hover:text-blue-600"
          }`}
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}
