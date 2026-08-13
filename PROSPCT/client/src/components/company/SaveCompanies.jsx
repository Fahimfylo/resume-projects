import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ListPlus,
  UserPlus,
  Plus,
  Phone,
  Download,
  ChevronDown,
  X,
  Search,
  GripVertical,
} from "lucide-react";
import useStore from "../../store/store";
import { useMutation } from "@tanstack/react-query";
import { saveList, saveCompaniesToDatabase } from "../../api/mutation";
import { toast } from "react-toastify";
import DropdownList from "../search/DropdownList";
import CreateListModal from "../lists/CreateListModal";
import useLists from "../../hooks/useList";
import { exportToCSV } from "../../utils/export";
import { notifySave, notifyExport, notifyListCreated, showToastIfPopupDisabled } from "../../utils/notificationHelper";

export default function SaveCompanies() {
  const navigate = useNavigate();
  const {
    isSaveCompaniesVisible,
    setSaveCompaniesVisible,
    user,
    checkedItems,
    clearCheckedItems,
    incrementSavedCount,
    toggleAllCheckedItems,
    selectAllMode,
    selectAllFilters,
  } = useStore();

  // Clean up invalid items from checkedItems when modal opens
  useEffect(() => {
    if (isSaveCompaniesVisible && checkedItems.length > 0) {
      const validItems = checkedItems.filter((item) => {
        const hasId = item && item._id && typeof item._id === "string" && item._id.length > 0;
        const src = item?._source || item || {};
        const hasData = Object.keys(src).some(k => 
          typeof src[k] === "string" && src[k].length > 0
        );
        return hasId && hasData;
      });
      if (validItems.length !== checkedItems.length) {
        toggleAllCheckedItems(validItems);
      }
    }
  }, [isSaveCompaniesVisible]);

  const ownerName = user
    ? `${user.firstName || ""} ${user.lastName || ""} (You)`.trim()
    : "Unknown user";

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

  const [exportColumns, setExportColumns] = useState(exportFields);

  const { lists: allLists, isLoading: listsLoading, refetch: refetchLists } = useLists();
  const lists = allLists.filter(list => list.type === "companies");

  const [activeTab, setActiveTab] = useState("list"); // 'list', 'assign', 'phone', 'export'
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedList, setSelectedList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportPropertyType, setExportPropertyType] = useState("only_columns");
  const [columnSearch, setColumnSearch] = useState("");
  const [customFilename, setCustomFilename] = useState("");
  const [checkedTabs, setCheckedTabs] = useState({ list: true, assign: false, phone: false, export: false });

  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [pendingCreateListName, setPendingCreateListName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const handleClose = () => {
    setSaveCompaniesVisible(false);
    setShowColumnSelector(false);
  };

  const handleListSelect = (listName) => {
    const trimmed = listName?.trim();
    if (!trimmed) return;
    setSelectedList((prev) =>
      prev.includes(trimmed)
        ? prev.filter((i) => i !== trimmed)
        : [...prev, trimmed],
    );
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleOpenCreateListModal = (name = "") => {
    setPendingCreateListName(name);
    setIsCreateListModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCreateList = (listName, type = "companies") => {
    const trimmed = listName?.trim();
    if (!trimmed) return;

    setSelectedList((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    );
    setIsCreateListModalOpen(false);
    setPendingCreateListName("");
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const saveItemsMutation = useMutation({
    mutationFn: saveCompaniesToDatabase,
    onSuccess: (data) => {
      // console.log("[SAVE COMPANIES] Mutation success:", data);
    },
    onError: (error) => {
      // console.error("[SAVE COMPANIES] Mutation failed:", error);
      // console.error("[SAVE COMPANIES] Error response:", error?.response);
      // console.error("[SAVE COMPANIES] Error status:", error?.response?.status);
      // console.error("[SAVE COMPANIES] Error data:", error?.response?.data);
      toast.error(error?.response?.data?.message || "Failed to save companies.");
    },
  });

  const handleConfirm = async () => {
    // Prevent multiple simultaneous save operations
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Check if at least one tab is checked
      const hasCheckedTab = Object.values(checkedTabs).some(checked => checked);
      if (!hasCheckedTab) {
        toast.error("Please select at least one option (Add to list, Assign owner, or Export)");
        return;
      }

      const missingLists = selectedList.filter(
        (name) => !lists.some((item) => item.name === name),
      );

      for (const listName of missingLists) {
        await saveList(listName, [], null, "companies");
        showToastIfPopupDisabled(`List "${listName}" created.`);
        notifyListCreated(listName);
      }

      if (missingLists.length > 0) {
        await refetchLists();
      }

      // 1. Create missing lists
      showToastIfPopupDisabled("Save companies confirmed.");

      // 2. Save selected companies to SavedContacts DB (if checkedItems exist)

      if (checkedItems && checkedItems.length > 0) {
        // Log first few items to debug

        // Filter only valid items with actual company data - skip empty/invalid entries
        const validItems = checkedItems.filter((item) => {
          const hasId = item && item._id && typeof item._id === "string" && item._id.length > 0;
          const src = item?._source || item || {};
          const hasData = item.company || src.organization_name || src.companyName || src.company_name;

          if (!hasId || !hasData) {
            // console.warn("[SaveCompanies] Filtering out invalid item:", {
            //   hasId,
            //   hasData,
            //   _id: item._id,
            //   sourceKeys: Object.keys(src),
            // });
          }

          return hasId && hasData;
        });

          if (validItems.length > 0 || selectAllMode) {
          if (checkedTabs.list) {

            if (selectAllMode) {
              // console.log("[SAVE COMPANIES] selectAllMode active");
              // console.log("[SAVE COMPANIES] selectAllFilters:", JSON.parse(JSON.stringify(selectAllFilters)));
              // console.log("[SAVE COMPANIES] validItems length:", validItems.length);
            } else {
              // console.log("[SAVE COMPANIES] saving checked items:", validItems.length);
            }

            const selectAllFiltersForServer = selectAllMode
              ? (() => {
                  const s = { ...(selectAllFilters?.companyActiveFilters || {}) };
                  if (selectAllFilters?.companySearchQuery) {
                    s.company = selectAllFilters.companySearchQuery;
                  }
                  return s;
                })()
              : undefined;

            if (selectAllMode) {
              // console.log("[SAVE COMPANIES] selectAllFiltersForServer:", JSON.parse(JSON.stringify(selectAllFiltersForServer)));
              // console.log("[SAVE COMPANIES] filters keys:", Object.keys(selectAllFiltersForServer || {}));
              // console.log("[SAVE COMPANIES] payload to server:", JSON.parse(JSON.stringify({ filters: selectAllFiltersForServer, listNames: selectedList })));
            }

            const result = await saveItemsMutation.mutateAsync(
              selectAllMode
                ? { filters: selectAllFiltersForServer, listNames: selectedList }
                : { savedItems: validItems, listNames: selectedList }
            );
            const savedCount = selectAllMode ? (result?.inserted || 0) + (result?.modified || 0) : validItems.length;
            incrementSavedCount(savedCount);
            queryClient.invalidateQueries({ queryKey: ["companies"] });
            queryClient.refetchQueries({ queryKey: ["companies"] });
            queryClient.invalidateQueries({ queryKey: ["savedCompanies"] });
            queryClient.invalidateQueries({ queryKey: ["data"] });
            queryClient.invalidateQueries({ queryKey: ["companies-count"] });
            localStorage.removeItem("savedCompaniesCache");
            localStorage.removeItem("companiesCache");
            useStore.getState().incrementDataRefreshKey();

            notifySave(savedCount, selectedList);
          }

          // Only download export file if "export" tab is checked
          if (checkedTabs.export && !selectAllMode) {

            const mappedExportData = validItems.map((item) => {
              const src = item._source || item || {};
              const mapped = {
                "Company Name": src.organization_name || src.company || src.company_name || "",
                Employees: src.organization_num_current_employees || src.employees || "",
                Industry: Array.isArray(src.organization_industries)
                  ? src.organization_industries.join(", ")
                  : src.organization_industries || src.industry || "",
                Website: src.organization_website_url || src.website || src.domain || "",
                "Company Linkedin Url": src.organization_linkedin_url || src.company_linkedin || src.companyLinkedin || "",
                "Facebook Url": src.organization_facebook_url || "",
                "Twitter Url": src.organization_twitter_url || "",
                "Company Street": src.organization_hq_location_address || "",
                "Company City": src.organization_hq_location_city || "",
                "Company State": src.organization_hq_location_state || "",
                "Company Country": src.organization_hq_location_country || "",
                "Company Address": (() => {
                  const c = src.organization_hq_location_city || "";
                  const s = src.organization_hq_location_state || "";
                  const co = src.organization_hq_location_country || "";
                  let z = src.organization_hq_location_postal_code || src.company_zip || src.company_postal_code || "";
                  if (!z) {
                    const a = src.organization_hq_location_address || "";
                    if (a) { const p = a.split(",").map(x => x.trim()).filter(Boolean); if (p.length > 0) z = p[p.length - 1]; }
                  }
                  return [c, s, co, z].filter(Boolean).join(", ");
                })(),
                Keywords: src.organization_relevant_keywords_str || src.keywords || "",
                "Company Phone": src.organization_phone || src.company_phone || "",
                "Annual Revenue": src.organization_annual_revenue || src.annual_revenue || "",
              };
              return mapped;
            });


            const fileName = customFilename.trim()
              ? `${customFilename.trim()}.${exportFormat.toLowerCase()}`
              : `saved_companies_${Date.now()}.${exportFormat.toLowerCase()}`;
            const fieldsToExport =
              exportPropertyType === "all" ? [] : exportColumns;

            exportToCSV(mappedExportData, fileName, fieldsToExport);
            
            notifyExport(validItems.length, exportFormat);
          }
        }
      }

      // 3. Clean up state
      handleClose();
      setSelectedList([]);
      clearCheckedItems();
    } catch (err) {
      // console.error("Confirm save failed:", err);
      if (err.response?.data?.error !== "INSUFFICIENT_FUNDS") {
        toast.error(err.response?.data?.message || err.message || "Unable to complete save");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // UI Components for the Right Panel
  const renderRightPanel = () => {
    switch (activeTab) {
      case "list":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Saving new companies{" "}
              <span className="font-bold">costs 1 export credit</span> per
              company when Export is checked. No export credits are charged for items
              exported from the Saved tab.
            </p>
            <div className="py-2 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-semibold">My lists</div>
              <button
                type="button"
                className="flex items-center text-blue-500 text-xs font-medium hover:text-blue-600"
                onClick={() => handleOpenCreateListModal("")}
              >
                <Plus size={14} className="mr-1" /> Add
              </button>
            </div>
            <div className="relative">
              <div className="flex flex-wrap items-center min-h-[40px] w-full px-3 py-1 border rounded-md bg-white">
                {selectedList.map((list) => (
                  <span
                    key={list}
                    className="bg-gray-100 text-xs font-semibold px-2 py-1 rounded mr-2 flex items-center"
                  >
                    {list}{" "}
                    <X
                      size={12}
                      className="ml-1 cursor-pointer"
                      onClick={() => handleListSelect(list)}
                    />
                  </span>
                ))}
                <input
                  ref={inputRef}
                  className="flex-1 outline-none text-sm min-w-[150px]"
                  placeholder="Enter or create lists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                />
                <ChevronDown
                  size={18}
                  className="text-gray-400 cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />
              </div>
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                  <DropdownList
                    items={lists}
                    selectedList={selectedList}
                    onSelect={handleListSelect}
                    onCreate={handleOpenCreateListModal}
                    searchQuery={searchQuery}
                    isLoading={listsLoading}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case "assign":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Saving new companies{" "}
              <span className="font-bold">costs 1 export credit</span> per
              company when Export is checked. No export credits are charged for items
              exported from the Saved tab.
            </p>
            <div className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white text-sm">
              <span>{ownerName}</span>
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </div>
        );
      case "phone":
        return (
          <div className="space-y-6 text-center py-4">
            <p className="text-sm text-gray-600 text-left">
              Premium users are 219% more likely to connect with prospects via
              the phone when they call the direct line.
            </p>
            <button
              onClick={() => navigate("/plans-and-billings")}
              className="w-full py-2.5 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
            >
              Buy more credits
            </button>
          </div>
        );
      case "export":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Saving new companies{" "}
              <span className="font-bold">costs 1 export credit</span> per
              company when Export is checked. No export credits are charged for items
              exported from the Saved tab.
            </p>
            <div>
              <label className="text-sm font-bold block mb-1">
                File name
              </label>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Leave empty for default name"
                className="w-full px-3 py-2 border rounded-md bg-white text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">
                File format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white text-sm"
              >
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-2">Properties</label>
              <div className="space-y-2">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="prop"
                    checked={exportPropertyType === "only_columns"}
                    onChange={() => setExportPropertyType("only_columns")}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  Include only properties in columns
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="prop"
                    checked={exportPropertyType === "all"}
                    onChange={() => setExportPropertyType("all")}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  Include all properties
                </label>
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="prop"
                      checked={exportPropertyType === "custom"}
                      onChange={() => setExportPropertyType("custom")}
                      className="mr-2 w-4 h-4 text-blue-600"
                    />
                    Custom configuration
                  </label>
                  <button
                    onClick={() => setShowColumnSelector(true)}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isSaveCompaniesVisible) return null;

  return (
    <>
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onCreate={handleCreateList}
        initialName={pendingCreateListName}
        initialType="companies"
        hideType
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-[750px] rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="bg-[#2b6cb0] px-6 py-4 flex justify-between items-center">
            <h2 className="text-white font-semibold text-lg">Save companies</h2>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Column Selector Overlay */}
          {showColumnSelector && (
            <div className="absolute inset-0 z-20 bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
              <div className="bg-[#2b6cb0] px-6 py-4 flex justify-between items-center">
                <h2 className="text-white font-semibold text-lg">
                  Exported columns
                </h2>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X size={24} />
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
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {exportFields
                    .filter((field) =>
                      field.toLowerCase().includes(columnSearch.toLowerCase()),
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
                                  ? prev.filter((item) => item !== field)
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
                    onClick={() => {
                      setExportColumns(exportFields);
                      setColumnSearch("");
                    }}
                    className="text-gray-500 text-sm font-medium hover:text-gray-700"
                  >
                    Reset to default
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowColumnSelector(false)}
                      className="px-5 py-2 bg-[#2b6cb0] text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Body */}
          <div className="flex flex-1 min-h-[400px]">
            {/* Left Navigation */}
            <div className="w-1/3 border-r p-4 space-y-2">
              <NavItem
                icon={<ListPlus size={18} />}
                label="Add to list"
                active={activeTab === "list"}
                onClick={() => setActiveTab("list")}
                checked={checkedTabs.list}
                onCheckboxChange={(checked) => setCheckedTabs(prev => ({ ...prev, list: checked }))}
              />
              <NavItem
                icon={<UserPlus size={18} />}
                label="Assign owner"
                active={activeTab === "assign"}
                onClick={() => setActiveTab("assign")}
                checked={checkedTabs.assign}
                onCheckboxChange={(checked) => setCheckedTabs(prev => ({ ...prev, assign: checked }))}
              />
              <NavItem
                icon={<Phone size={18} />}
                label="Phone numbers"
                active={activeTab === "phone"}
                onClick={() => setActiveTab("phone")}
                checked={checkedTabs.phone}
                onCheckboxChange={(checked) => setCheckedTabs(prev => ({ ...prev, phone: checked }))}
              />
              <NavItem
                icon={<Download size={18} />}
                label="Export"
                active={activeTab === "export"}
                onClick={() => setActiveTab("export")}
                checked={checkedTabs.export}
                onCheckboxChange={(checked) => setCheckedTabs(prev => ({ ...prev, export: checked }))}
              />
            </div>

            {/* Right Content */}
            <div className="flex-1 p-6 bg-white">{renderRightPanel()}</div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex justify-start gap-3 bg-white">
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-8 py-2.5 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 shadow-md transition-all disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                "Confirm"
              )}
            </button>
            <button
              onClick={handleClose}
              className="px-8 py-2.5 border border-gray-300 text-gray-600 rounded-md font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function NavItem({ icon, label, active, onClick, checked, onCheckboxChange }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all border-2 
        ${active ? "border-blue-400 bg-blue-50/50" : "border-transparent hover:bg-gray-50"}`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-blue-600" : "text-gray-500"}>
          {icon}
        </span>
        <span
          className={`text-sm font-medium ${active ? "text-blue-700" : "text-gray-700"}`}
        >
          {label}
        </span>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          e.stopPropagation();
          onCheckboxChange(e.target.checked);
        }}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
    </div>
  );
}

NavItem.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  checked: PropTypes.bool,
  onCheckboxChange: PropTypes.func,
};
