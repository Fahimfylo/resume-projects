import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useStore from "../../store/store";
import { deductCredits } from "../../api/mutation";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import { X, ChevronDown, GripVertical, Search } from "lucide-react";
import { exportToCSV } from "../../utils/export";

const BASE_URL = API_CONFIG.API_ENDPOINT;
const EXPORT_TIMEOUT_MS = 5 * 60 * 1000;

const exportFields = [
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
];

const columnToSourceKey = {
  "Company Name": "organization_name",
  "Employees": "organization_num_current_employees",
  "Industry": "organization_industries",
  "Website": "organization_website_url",
  "Company Linkedin Url": "organization_linkedin_url",
  "Facebook Url": "organization_facebook_url",
  "Twitter Url": "organization_twitter_url",
  "Company Street": "organization_hq_location_address",
  "Company City": "organization_hq_location_city",
  "Company State": "organization_hq_location_state",
  "Company Country": "organization_hq_location_country",
  "Company Address": "companyAddress",
  "Keywords": "keywords",
  "Company Phone": "organization_phone",
  "Annual Revenue": "organization_revenue",
};

const ExportCompanies = () => {
  const [isAnimatedVisible, setIsAnimatedVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("CSV");
  const [propertyOption, setPropertyOption] = useState("columns");
  const [exportColumns, setExportColumns] = useState(exportFields);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const [customFilename, setCustomFilename] = useState("");

  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const queryClient = useQueryClient();
  const { isExportCompaniesVisible, setExportCompaniesVisible, checkedItems, companyFilter } =
    useStore();

  useEffect(() => {
    if (isExportCompaniesVisible) {
      const timer = setTimeout(() => setIsAnimatedVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatedVisible(false);
    }
  }, [isExportCompaniesVisible]);

  const exportHandler = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const quantity = checkedItems.length;
      if (!quantity || quantity <= 0) {
        // console.error("[ExportCompanies] Invalid quantity:", quantity);
        toast.error("No items selected for export");
        setIsExporting(false);
        return;
      }

      // ── Map flat formatted fields to ES field names for items without _source ──
      const frontendToEsField = {
        company: "organization_name",
        employees: "organization_num_current_employees",
        industry: "organization_industries",
        organizationWebsite: "organization_website_url",
        organizationLinkedin: "organization_linkedin_url",
        organizationFacebook: "organization_facebook_url",
        organizationTwitter: "organization_twitter_url",
        _locationCity: "organization_hq_location_city",
        _locationState: "organization_hq_location_state",
        _locationCountry: "organization_hq_location_country",
        _locationPostalCode: "organization_hq_location_postal_code",
        keywords: "keywords",
        phone: "organization_phone",
      };

      const exportItems = checkedItems.map(item => {
        if (item._source && typeof item._source === "object" && Object.keys(item._source).length > 1) {
          return item;
        }
        const source = {};
        let hasData = false;
        Object.entries(frontendToEsField).forEach(([key, esKey]) => {
          if (item[key] != null && item[key] !== "" && item[key] !== "Not Available") {
            source[esKey] = item[key];
            hasData = true;
          }
        });
        return hasData ? { _id: item._id, _source: source } : item;
      });

      const hasSourceData = exportItems.some(
        (item) => item._source && typeof item._source === "object" && Object.keys(item._source).length > 1
      );

      const timeoutId = setTimeout(() => {
        controller.abort();
        toast.error("Export timed out.");
      }, EXPORT_TIMEOUT_MS);

      if (hasSourceData) {
        clearTimeout(timeoutId);
        const columnsToUse = propertyOption === "all"
          ? exportFields
          : propertyOption === "custom"
            ? exportColumns
            : exportFields;
        const sourceKeys = columnsToUse.map((col) => columnToSourceKey[col]).filter(Boolean);
        const fieldLabels = {};
        columnsToUse.forEach((col) => {
          if (columnToSourceKey[col]) fieldLabels[columnToSourceKey[col]] = col;
        });

        const filename = customFilename && customFilename.trim()
          ? `${customFilename.trim()}.${exportFormat.toLowerCase()}`
          : `Prospct Companies Export_${Date.now()}.${exportFormat.toLowerCase()}`;

        await exportToCSV(exportItems, filename, sourceKeys, true, fieldLabels);
        await deductCredits({
          type: "export",
          quantity: quantity,
        });
        await useStore.getState().refreshUser();
        useStore.getState().incrementCreditHistoryRefreshKey();
        setExportCompaniesVisible(false);
        queryClient.invalidateQueries({ queryKey: ["companies"] });
        queryClient.refetchQueries({ queryKey: ["companies"] });
        localStorage.removeItem("companiesCache");
        setIsExporting(false);
        return;
      }

      // ── Server-side export (fallback for items without _source) ──────
      const token = localStorage.getItem("userAccessToken");

      const ids = exportItems.map((item) =>
        typeof item === "object" ? item._id : item,
      );

      // Step 2: Proceed with export
      const response = await fetch(`${BASE_URL}/api/search/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: ids,
          exportOption: propertyOption,
          selectedColumns:
            propertyOption === "all" || propertyOption === "columns"
              ? exportFields
              : exportColumns,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        // console.error("[ExportCompanies] Export failed:", response.status, errorText);
        throw new Error(`Export failed: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      const filename = customFilename && customFilename.trim()
        ? `${customFilename.trim()}.${exportFormat.toLowerCase()}`
        : `Prospct Companies Export_${Date.now()}.${exportFormat.toLowerCase()}`;
      anchor.download = filename;
      anchor.click();

      await deductCredits({
        type: "export",
        quantity: quantity,
      });
      await useStore.getState().refreshUser();
      useStore.getState().incrementCreditHistoryRefreshKey();

      setExportCompaniesVisible(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.refetchQueries({ queryKey: ["companies"] });
      localStorage.removeItem("companiesCache");
    } catch (error) {
      const errData = error?.response?.data || {};
      if (errData.error === "INSUFFICIENT_FUNDS" && errData.details) {
        toast.error(`Insufficient ${errData.details.type} credits.`);
      } else {
        toast.error(error.message || "Export failed");
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!isExportCompaniesVisible) return null;

  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={containerRef}
        className={`bg-white w-full max-w-[550px] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 transform ${isAnimatedVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* Main Export Header */}
        <div className="bg-[#2563eb] px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-medium tracking-wide">Export Companies</h2>
          <button
            onClick={() => setExportCompaniesVisible(false)}
            className="hover:bg-white/10 p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[#374151] text-[14px]">
            Saving new companies{" "}
            <span className="font-bold">costs 1 export credit</span> per company. No export credits are charged for items exported from the Saved tab.
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
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
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

          {/* Properties Selector */}
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

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={exportHandler}
              disabled={isExporting}
              className="px-6 py-2.5 bg-[#2563eb] text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Exporting...</span>
                </>
              ) : (
                "Confirm"
              )}
            </button>
            <button
              onClick={() => setExportCompaniesVisible(false)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* --- REFINED COLUMN SELECTOR MODAL --- */}
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
                      {/* Professional Toggle Switch */}
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

export default ExportCompanies;
