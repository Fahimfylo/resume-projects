import { IoCheckmark } from "react-icons/io5";

export default function PackageFeatures({ price }) {
  const getFeatures = (value) => {
    if (value <= 98) {
      return {
        features: [
          "Select 25 Records at a Time",
          "50 Email verification credit",
          "5 Phone number credit",
          "5 Export credit",
          "Basic filters",
          "Export files CSV & XLSX",
          "Custom domain tracking",
        ],
      };
    } else if (value <= 245) {
      return {
        features: [
          "Select 25 Records at a Time",
          "200 Email verification credit",
          "25 Phone number credit",
          "100 Export credit",
          "Basic filters",
          "Export files CSV & XLSX",
          "Priority live support",
          "Custom domain tracking",
        ],
      };
    } else if (value <= 392) {
      return {
        features: [
          "Select 100 Records at a Time",
          "200 Email verification credit",
          "100 Phone number credit",
          "250 Export credit",
          "Advanced filters",
          "API Access",
          "Export files CSV & XLSX",
          "Team data sharing",
          "Priority live support",
          "Custom domain tracking",
        ],
      };
    } else {
      return {
        features: [
          "Select 10,000 Records at a Time",
          "2,000 Email verification credit",
          "500 Phone number credit",
          "1,000 Export credit",
          "Advanced filters",
          "API Access",
          "Export files CSV & XLSX",
          "Team data sharing",
          "Priority live support",
          "Custom domain tracking",
        ],
      };
    }
  };

  const { features } = getFeatures(price);

  return (
    <div className="mx-8 my-8">
      <h2 className="mb-6 text-2xl font-semibold text-gray-900">
        See All Features
      </h2>
      <div className="border-t border-l border-r border-gray-300">
        <div className="p-4 text-lg font-semibold text-gray-900 bg-gray-100">
          All plans include
        </div>
        <div className="grid grid-cols-1 gap-px border-b border-gray-300 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center p-3 border-b border-gray-300"
            >
              <IoCheckmark className="w-6 h-5 mr-3 font-thin text-blue-600" />
              <span className="text-sm text-gray-900">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
