import { IoCheckmark, IoClose, IoChevronDown } from "react-icons/io5";

const resourceLimitOptions = [
  { label: "CSV Enrichment", key: "csvEnrichment" },
  { label: "Technology Filter", key: "technologyFilter" },
  { label: "Job Posting Filter", key: "jobPostingFilter" },
  { label: "Revenue Filter", key: "revenueFilter" },
  { label: "Funding Filter", key: "fundingFilter" },
  { label: "Basic Integrations", key: "basicIntegrations" },
  { label: "Job Change Filter", key: "jobChangeFilter" },
  { label: "Duplicate Control", key: "duplicateControl" },
  { label: "HubSpot Integration", key: "hubspotIntegration" },
  { label: "Salesforce Integration", key: "salesforceIntegration" },
  { label: "Job Change Tracking", key: "jobChangeTracking" },
];

export default function PackageSection({
  packageData,
  annually,
  isSelected,
  isCurrentPlan,
  onClick,
  showAdvanced,
  onToggleAdvanced,
}) {
  if (!packageData) return null;

  const { name, pricing, features } = packageData;

  const displayPrice = annually
    ? pricing?.yearly?.finalPrice || 0
    : pricing?.monthly?.finalPrice || 0;

  const billingCycle = annually ? "/year" : "/month";

  // Build a clean, formatted feature list based on your DB structure
  const coreFeatures = [];
  const advancedFeatures = [];

  if (features) {
    // 1. Add formatted Core Credits
    if (features.exportCredits?.max > 0) {
      coreFeatures.push(
        `${features.exportCredits.max.toLocaleString()} Export Credits`,
      );
    }
    if (features.emailCredits?.max > 0) {
      coreFeatures.push(
        `${features.emailCredits.max.toLocaleString()} Valid Emails`,
      );
    }
    if (features.verificationCredits?.max > 0) {
      coreFeatures.push(
        `${features.verificationCredits.max.toLocaleString()} Verifications`,
      );
    }
    if (features.phoneCredits?.max > 0) {
      coreFeatures.push(
        `${features.phoneCredits.max.toLocaleString()} Phone Credits`,
      );
    }

    // 2. Add Boolean features with clean labels
    if (features.apiAccess) coreFeatures.push("Full API Access");
    if (features.prioritySupport) coreFeatures.push("Priority Support");

    // 3. Add Resource Limit Toggles (show all with ✓ or ✗)
    const limits = features.limits || {};
    resourceLimitOptions.forEach(({ label, key }) => {
      advancedFeatures.push({ label, enabled: !!limits[key] });
    });
    advancedFeatures.sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1));
  }

  const rawMinPrice = Math.min(
    pricing?.monthly?.price ?? Infinity,
    pricing?.yearly?.price ?? Infinity,
  );
  const rawMaxPrice = Math.max(
    pricing?.monthly?.price ?? 0,
    pricing?.yearly?.price ?? 0,
  );

  const minPrice = Number.isFinite(rawMinPrice) ? rawMinPrice : 0;
  const maxPrice = Number.isFinite(rawMaxPrice) ? rawMaxPrice : 0;

  return (
    <div
      onClick={onClick}
      className={`flex flex-col w-[95%] h-full mx-auto p-8 cursor-pointer transition-all duration-200 border rounded-xl shadow-sm hover:shadow-md ${
        isSelected
          ? "border-blue-400 ring-1 ring-blue-600 bg-blue-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* 1. HEADER & PRICE: Stays at the top */}
      <div className="flex flex-col text-left">
        <h2 className="text-blue-600 font-semibold text-xl mb-2 uppercase tracking-tight">
          {name}
        </h2>

        <p className="text-sm font-medium text-gray-500">
          User:{" "}
          {packageData?.maxUsers ? packageData.maxUsers.toLocaleString() : "-"}
        </p>
        <p className="text-sm font-medium text-gray-500">
          Price range: ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
        </p>
        <p className="text-sm font-medium mb-3 text-gray-500">
          {annually ? "Yearly" : "Monthly"} Base: ${(annually
            ? pricing?.yearly?.price || 0
            : pricing?.monthly?.price || 0
          ).toFixed(2)}
        </p>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-bold text-gray-900">
            ${displayPrice}
          </span>
          <span className="text-gray-500 font-medium text-sm">
            {billingCycle}
          </span>
          {(() => {
            const discount = annually
              ? pricing?.yearly?.discount || 0
              : pricing?.monthly?.discount || 0;
            return discount > 0 ? (
              <span className="text-sm font-semibold text-green-600 ml-1">
                ({discount}% off)
              </span>
            ) : null;
          })()}
        </div>
      </div>

      {/* 2. FEATURE LIST */}
      <div className="flex-grow space-y-4 text-left mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          What's included:
        </p>
        <ul className="space-y-3">
          {coreFeatures.map((feature, index) => (
            <li
              key={index}
              className="flex items-start text-gray-700 font-medium"
            >
              <IoCheckmark className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-tight">{feature}</span>
            </li>
          ))}
          {advancedFeatures.length > 0 && (
            <li className="flex items-start text-gray-700 font-medium">
              {advancedFeatures[0].enabled ? (
                <IoCheckmark className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
              ) : (
                <IoClose className="w-4 h-4 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm leading-tight">{advancedFeatures[0].label}</span>
            </li>
          )}
        </ul>

        {!showAdvanced && advancedFeatures.length > 1 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleAdvanced(); }}
              className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
            >
              <IoChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {showAdvanced && advancedFeatures.length > 1 && (
          <>
            <ul className="space-y-3">
              {advancedFeatures.slice(1).map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start text-gray-700 font-medium"
                >
                  {feature.enabled ? (
                    <IoCheckmark className="w-4 h-4 mr-3 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <IoClose className="w-4 h-4 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm leading-tight">{feature.label}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleAdvanced(); }}
                className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
              >
                <IoChevronDown className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* 3. BUTTON: Now anchored to the bottom because of the flex-grow above */}
      <div className="mt-auto">
        <button
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors text-sm ${
            isSelected
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {isCurrentPlan ? "Current Plan" : isSelected ? "Subscribe" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}
