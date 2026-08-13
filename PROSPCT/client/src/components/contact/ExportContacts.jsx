import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, ChevronDown, GripVertical, Search } from "lucide-react";
import { ImSpinner9 } from "react-icons/im";
import { toast } from "react-toastify";
import useStore from "../../store/store";
import { exportToCSV } from "../../utils/export";
import { notifyExport } from "../../utils/notificationHelper";
import useCreditDeduction from "../../hooks/useCreditDeduction";

const ExportContacts = () => {
  const location = useLocation();
  const isCompanyPage = location.pathname.startsWith("/companies");

  const { isExportVisible, setExportVisible, checkedItems, visibleColumns, companyCounts, setCompanyCounts } =
    useStore();

  const containerRef = useRef(null);

  const { deductCredit } = useCreditDeduction();

  // Strict column order matching backend EXPORT_ORDER
  const exportFields = isCompanyPage
    ? [
        "Company Name",
        "Employees",
        "Industry",
        "Website",
        "Company Linkedin Url",
        "Facebook Url",
        "Twitter Url",
        "Company Street",
        "Company City",
        "Company State",
        "Company Country",
        "Company Address",
        "Keywords",
        "Company Phone",
        "Annual Revenue",
      ]
    : [
        "First Name",
        "Last Name",
        "Title",
        "Company Name",
        "Email",
        "Email Status",
        "Mobile Phone",
        "City",
        "State",
        "Country",
        "Person Linkedin Url",
        "Website",
        "Company Linkedin Url",
        "Facebook Url",
        "Twitter Url",
        "Company Address",
        "Company City",
        "Company State",
        "Company Country",
        "Company Phone",
        "Employees",
        "Industry",
        "Keywords",
        "Annual Revenue",
      ];

  const [isAnimating, setIsAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fileFormat, setFileFormat] = useState("CSV");
  const [propertyOption, setPropertyOption] = useState("columns");
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [exportColumns, setExportColumns] = useState(exportFields);
  const [columnSearch, setColumnSearch] = useState("");
  const [customFilename, setCustomFilename] = useState("");

  useEffect(() => {
    if (!isExportVisible) {
      setIsAnimating(false);
      return;
    }
    if (!checkedItems || checkedItems.length === 0) {
      toast.info(`Select at least one ${isCompanyPage ? "company" : "contact"} before exporting.`);
      setExportVisible(false);
      return;
    }
    const timer = setTimeout(() => setIsAnimating(true), 10);
    return () => clearTimeout(timer);
  }, [isExportVisible, checkedItems, isCompanyPage, setExportVisible]);

  const handleExport = async () => {
    if (isExporting) return;
    if (!checkedItems || checkedItems.length === 0) {
      toast.info("Select at least one contact before exporting.");
      return;
    }

    setIsExporting(true);

    try {
      const sample = checkedItems[0] || {};
      const source = sample._source || sample;

      const resolveKey = (col) => {
        if (isCompanyPage && col === "Company Address") return "companyAddress";
        const mapping = {
          "First Name": ["firstName", "first_name"],
          "Last Name": ["lastName", "last_name"],
          "Title": ["title", "job_title", "person_title"],
          "Company Name": ["company", "company_name", "organization_name"],
          "Email": ["email", "person_email"],
          "Email Status": ["emailStatus", "email_status", "person_email_status"],
          "Mobile Phone": ["mobilePhone", "mobile_phone", "phone", "person_phone", "sanitized_phone"],
          "City": ["city", "person_location_city"],
          "State": ["state", "person_location_state"],
          "Country": ["country", "person_location_country"],
          "Person Linkedin Url": ["linkedinUrl", "linkedin_url", "person_linkedin_url", "person_linkedin"],
          "Website": ["website", "organization_website_url", "domain"],
          "Company Linkedin Url": ["companyLinkedin", "company_linkedin", "organization_linkedin_url"],
          "Facebook Url": ["organization_facebook_url", "facebook", "person_facebook"],
          "Twitter Url": ["organization_twitter_url", "twitter", "person_twitter"],
          "Company Address": ["organization_hq_location_city", "companyAddress", "company_address", "organization_address", "location", "headquarters"],
          "Company City": ["organization_hq_location_city", "companyCity", "company_city", "organization_city"],
          "Company State": ["organization_hq_location_state", "companyState", "company_state", "organization_state"],
          "Company Country": ["organization_hq_location_country", "companyCountry", "company_country", "organization_country"],
          "Company Phone": ["companyPhone", "company_phone", "organization_phone"],
          "Employees": ["employees", "employee_count", "organization_num_current_employees"],
          "Industry": ["industry", "industries", "organization_industries"],
          "Keywords": ["keywords", "keywords_str", "organization_relevant_keywords_str"],
          "Annual Revenue": ["revenue", "annual_revenue", "organization_revenue"],
          "Company Street": ["organization_hq_location_address", "company_address"],
          "Company Postal Code": ["organization_hq_location_postal_code", "company_zip", "company_postal_code"],
        };

        const candidates = mapping[col] || [col.toLowerCase().replace(/\s+/g, "")];
        return candidates.find((k) => source[k] !== undefined);
      };

      const defaultColumns = isCompanyPage
        ? exportFields
        : visibleColumns || [];

      const columnsToUse =
        propertyOption === "all"
          ? isCompanyPage ? exportFields : []
          : propertyOption === "custom"
            ? exportColumns
            : defaultColumns;

      const fieldsToUse = columnsToUse
        .map((col) => resolveKey(col))
        .filter(Boolean);

      const fieldLabels = {};
      columnsToUse.forEach((col) => {
        const key = resolveKey(col);
        if (key) fieldLabels[key] = col;
      });

      const filename = customFilename.trim()
        ? `${customFilename.trim()}.${fileFormat.toLowerCase()}`
        : `contacts_export_${new Date()
            .toISOString()
            .slice(0, 10)}.${fileFormat.toLowerCase()}`;

      const quantity = checkedItems.length;
      await deductCredit({ type: "export", quantity: quantity });

      exportToCSV(checkedItems, filename, fieldsToUse, isCompanyPage, fieldLabels);
      notifyExport(checkedItems.length, fileFormat);

      if (isCompanyPage && companyCounts) {
        const exportedCount = checkedItems.length;
        setCompanyCounts({
          total: companyCounts.total,
          saved: companyCounts.saved + exportedCount,
          new: Math.max(0, companyCounts.new - exportedCount),
        });
      }

      setExportVisible(false);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isExportVisible) return null;

  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={containerRef}
        className={`bg-white w-full max-w-[550px] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 transform ${isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* Header */}
        <div className="bg-[#2563eb] px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-medium tracking-wide">
            {isCompanyPage ? "Export Companies" : "Export Contacts"}
          </h2>
          <button
            onClick={() => setExportVisible(false)}
            className="hover:bg-white/10 p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[#374151] text-[14px]">
            Exporting{" "}
            <span className="font-bold">{isCompanyPage ? "companies" : "contacts"}</span>{" "}
            costs 1 export credit per item.
          </p>

          {/* File Name */}
          <div className="space-y-2">
            <label className="block text-[#111827] font-semibold text-[15px]">
              File name
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Leave empty for default name"
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* File Format */}
          <div className="space-y-2">
            <label className="block text-[#111827] font-semibold text-[15px]">
              File format
            </label>
            <div className="relative">
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          {/* Properties */}
          <div className="space-y-3">
            <label className="block text-[#111827] font-semibold text-[15px]">
              Properties
            </label>
            <div className="space-y-4">
              {["columns", "all"].map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    checked={propertyOption === opt}
                    onChange={() => setPropertyOption(opt)}
                    className="w-4 h-4 text-blue-600 border-gray-300"
                  />
                  <span className="text-gray-700 text-sm capitalize">
                    {opt === "columns"
                      ? "Include only properties in columns"
                      : "Include all properties"}
                  </span>
                </label>
              ))}
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={propertyOption === "custom"}
                    onChange={() => setPropertyOption("custom")}
                    className="w-4 h-4 text-blue-600 border-gray-300"
                  />
                  <span className="text-gray-700 text-sm">
                    Custom configuration
                  </span>
                </label>
                <button
                  type="button"
                  className="text-blue-600 text-sm hover:underline font-medium"
                  onClick={() => {
                    setPropertyOption("custom");
                    setShowColumnSelector(true);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2.5 bg-[#2563eb] text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300 inline-flex items-center gap-2"
            >
              {isExporting ? (
                <><ImSpinner9 className="animate-spin" size={16} /> Exporting...</>
              ) : (
                "Export"
              )}
            </button>
            <button
              onClick={() => setExportVisible(false)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Column Selector Modal */}
        {showColumnSelector && (
          <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
            <div className="bg-[#2563eb] px-6 py-4 flex justify-between items-center text-white">
              <h2 className="text-lg font-medium">Exported columns</h2>
              <button
                onClick={() => setShowColumnSelector(false)}
                className="hover:bg-white/10 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 flex flex-col h-full overflow-hidden">
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  onChange={(e) => setColumnSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {exportFields
                  .filter((f) =>
                    f.toLowerCase().includes(columnSearch.toLowerCase()),
                  )
                  .map((field) => (
                    <div
                      key={field}
                      className="flex items-center justify-between py-3 px-2 border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical
                          size={16}
                          className="text-gray-300 group-hover:text-gray-400 cursor-grab"
                        />
                        <span className="text-sm text-gray-700">{field}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={exportColumns.includes(field)}
                          onChange={() =>
                            setExportColumns((prev) =>
                              prev.includes(field)
                                ? prev.filter((f) => f !== field)
                                : [...prev, field],
                            )
                          }
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between items-center pt-4 mt-2 border-t">
                <button
                  type="button"
                  onClick={() => setExportColumns(exportFields)}
                  className="text-gray-500 text-sm font-medium hover:text-gray-700"
                >
                  Reset to default
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowColumnSelector(false)}
                    className="px-5 py-2 bg-[#2563eb] text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExportContacts;
