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
import { saveList, saveItemToDatabase, deductCredits } from "../../api/mutation";
import { toast } from "react-toastify";
import DropdownList from "./DropdownList";
import CreateListModal from "../lists/CreateListModal";
import useLists from "../../hooks/useList";
import { exportToCSV } from "../../utils/export";
import { notifySave, notifyExport, notifyListCreated, showToastIfPopupDisabled } from "../../utils/notificationHelper";

export default function SaveLeads() {
  const navigate = useNavigate();
  const {
    isSaveLeadsVisible,
    setSaveLeadsVisible,
    user,
    checkedItems,
    clearCheckedItems,
    toggleAllCheckedItems,
    selectAllMode,
    selectAllFilters,
    filters: storeFilters,
  } = useStore();

  // Clean up invalid items from checkedItems when modal opens
  useEffect(() => {
    if (isSaveLeadsVisible && checkedItems.length > 0) {
      const validItems = checkedItems.filter((item) => {
        const hasId = item && item._id && typeof item._id === "string" && item._id.length > 0;
        const src = item?._source || item || {};
        const hasData = src.person_name || src.organization_name || src.person_email || src.firstName || src.lastName || src.companyName || src.email;
        return hasId && hasData;
      });
      if (validItems.length !== checkedItems.length) {
        toggleAllCheckedItems(validItems);
      }
    }
  }, [isSaveLeadsVisible]);

  const ownerName = user
    ? `${user.firstName || ""} ${user.lastName || ""} (You)`.trim()
    : "Unknown user";

  const exportFields = [
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

  const [exportColumns, setExportColumns] = useState(exportFields);

  const { lists: allLists, isLoading: listsLoading, refetch: refetchLists } = useLists();
  const lists = allLists.filter(list => list.type === "contacts" || !list.type);

  const [activeTab, setActiveTab] = useState("list"); // 'list', 'assign', 'phone', 'export'
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedList, setSelectedList] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportPropertyType, setExportPropertyType] = useState("only_columns");
  const [columnSearch, setColumnSearch] = useState("");
  const [customFilename, setCustomFilename] = useState("");
  const [checkedTabs, setCheckedTabs] = useState({ list: false, assign: false, phone: false, export: false });

  const [isSaving, setIsSaving] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [pendingCreateListName, setPendingCreateListName] = useState("");

  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const handleClose = () => {
    setSaveLeadsVisible(false);
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

  const handleCreateList = (listName, type = "contacts") => {
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
    mutationFn: saveItemToDatabase,
    onSuccess: (data, variables) => {
      // console.log(`[SAVE LEADS] ✅ DB save success: ${variables.savedItems.length} items, upserted=${data?.inserted}, modified=${data?.modified}`);
    },
    onError: (error) => {
      // console.error("[SAVE LEADS] ❌ DB save failed:", {
        // status: error?.response?.status,
        // data: error?.response?.data,
        // message: error?.message,
      // });
      toast.error(error?.response?.data?.message || "Failed to save leads.");
    },
  });

  const handleConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // console.groupCollapsed(`[SAVE LEADS] ▶️ handleConfirm() — ${new Date().toISOString()}`);
    // console.log("[SAVE LEADS] Input state:", {
    //   totalChecked: checkedItems?.length,
    //   selectAllMode,
    //   selectedList,
    //   checkedTabs,
    //   exportFormat,
    //   customFilename,
    // });

    try {
      if (checkedTabs.list && selectedList.length === 0) {
        // console.warn("[SAVE LEADS] ⚠️ Add to list checked but no list selected");
        toast.error("Please select at least one list to add contacts to");
        return;
      }

      if (checkedTabs.list && selectedList.length > 0) {
        const missingLists = selectedList.filter(
          (name) => !lists.some((item) => item.name === name),
        );
        // console.log("[SAVE LEADS] 📋 List check:", { selectedList, missingLists, existingCount: lists.length });
        for (const listName of missingLists) {
          // console.log(`[SAVE LEADS] 📝 Creating list: "${listName}"`);
          await saveList(listName);
          showToastIfPopupDisabled(`List "${listName}" created.`);
          notifyListCreated(listName);
        }
      }

      if (selectAllMode) {
        const saveResult = await saveItemsMutation.mutateAsync({
          filters: storeFilters,
          listNames: selectedList,
        });
        const totalSaved = (saveResult?.inserted || 0) + (saveResult?.modified || 0);

        useStore.getState().incrementDataRefreshKey();
        queryClient.invalidateQueries({ queryKey: ["savedContacts"] });
        localStorage.removeItem("savedContactsCache");
        refetchLists();

        notifySave(totalSaved, selectedList);
        showToastIfPopupDisabled("Save leads confirmed.");
      } else if (checkedItems && checkedItems.length > 0) {
        const validItems = checkedItems.filter((item) => {
          const hasId = item && item._id && typeof item._id === "string" && item._id.length > 0;
          const src = item?._source || item || {};
          const hasData = src.person_name || src.organization_name || src.person_email || src.firstName || src.lastName || src.companyName || src.email;
          return hasId && hasData;
        });

        // console.log("[SAVE LEADS] Item validation:", { total: checkedItems.length, valid: validItems.length, invalid: checkedItems.length - validItems.length });

        if (validItems.length > 0) {
          // Sort ascending by _id so saved data is in chronological order
          validItems.sort((a, b) => String(a._id).localeCompare(String(b._id)));

          const leadsWithEmail = validItems.filter(item => {
            const src = item._source || item || {};
            return !!(src.person_email || src.email);
          }).length;
          const leadsWithPhone = validItems.filter(item => {
            const src = item._source || item || {};
            return !!(src.person_phone || src.phone);
          }).length;

          // Fetch fresh credits from server before any deduction
          await useStore.getState().refreshUser();
          const currentUser = useStore.getState().user;
          const creds = currentUser?.credits || {};
          const emailBalance = creds.emailCredits?.current || 0;
          const phoneBalance = creds.phoneCredits?.current || 0;

          if (leadsWithEmail > emailBalance) {
            toast.error("Insufficient email credits.");
            closeModal();
            return;
          }
          if (leadsWithPhone > phoneBalance) {
            toast.error("Insufficient phone credits.");
            closeModal();
            return;
          }

          const saveResult = await saveItemsMutation.mutateAsync({
            savedItems: validItems.map((item) => item._id),
            listNames: selectedList,
          });
          // console.log("[SAVE LEADS] 💾 DB save result:", saveResult);

          useStore.getState().incrementDataRefreshKey();
          queryClient.invalidateQueries({ queryKey: ["savedContacts"] });
          localStorage.removeItem("savedContactsCache");
          refetchLists();

          notifySave(validItems.length, selectedList);
          showToastIfPopupDisabled("Save leads confirmed.");

          if (leadsWithEmail > 0) {
            await deductCredits({ type: "email", quantity: leadsWithEmail });
          }
          if (leadsWithPhone > 0) {
            await deductCredits({ type: "phone", quantity: leadsWithPhone });
          }
          await useStore.getState().refreshUser();
          useStore.getState().incrementCreditHistoryRefreshKey();

          if (checkedTabs.export) {
            const mappedExportData = validItems.map((item) => {
              const src = item._source || item || {};
              return {
                Name: src.person_name || "",
                Company: src.organization_name || "",
                Email: src.person_email || "",
                Phone: src.person_phone || "",
                Location: [src.person_location_city, src.person_location_state, src.person_location_country].filter(Boolean).join(", ") || "",
                Employees: src.organization_num_current_employees || "",
                Industry: Array.isArray(src.organization_industries) ? src.organization_industries.join(", ") : src.organization_industries || src.industry || "",
                Keywords: src.organization_relevant_keywords_str || "",
                "Facebook Url": src.organization_facebook_url || "",
                "Twitter Url": src.organization_twitter_url || "",
                "Company Address": [src.organization_hq_location_city, src.organization_hq_location_state, src.organization_hq_location_country].filter(Boolean).join(", ") || "",
                "Company City": src.organization_hq_location_city || "",
                "Company State": src.organization_hq_location_state || "",
                "Company Country": src.organization_hq_location_country || "",
                "Company Phone": src.organization_phone || src.company_phone || "",
                Website: src.organization_website_url || src.website || src.domain || "",
                "Company Linkedin Url": src.organization_linkedin_url || src.company_linkedin || src.companyLinkedin || "",
                "Person Linkedin Url": src.person_linkedin_url || src.linkedin_url || src.linkedinUrl || "",
              };
            });

            const fileName = customFilename.trim()
              ? `${customFilename.trim()}.${exportFormat.toLowerCase()}`
              : `saved_leads_${Date.now()}.${exportFormat.toLowerCase()}`;
            const fieldsToExport = exportPropertyType === "all" ? [] : exportColumns;

            // console.log("[SAVE LEADS] 📄 Exporting CSV:", { rows: mappedExportData.length, fileName, fields: fieldsToExport.length || "all" });
            exportToCSV(mappedExportData, fileName, fieldsToExport);
            notifyExport(validItems.length, exportFormat);
          }
        } else {
          // console.warn("[SAVE LEADS] ⚠️ No valid items after filtering — skipping save");
        }
      } else {
        // console.warn("[SAVE LEADS] ⚠️ No checked items — nothing to save");
      }

      handleClose();
      setSelectedList([]);
      clearCheckedItems();
      // console.log("[SAVE LEADS] ✅ handleConfirm completed successfully");
    } catch (err) {
      const errResponse = err?.response?.data || {};
      // console.error("[SAVE LEADS] ❌ handleConfirm failed:", {
        // error: errResponse.error || err.message,
        // message: errResponse.message,
        // details: errResponse.details,
        // status: err?.response?.status,
        // stack: err?.stack?.split("\n").slice(0, 3).join("\n"),
      // });
      if (errResponse.error === "INSUFFICIENT_FUNDS" && errResponse.details) {
        toast.error(`Insufficient ${errResponse.details.type} credits.`);
      } else if (errResponse.error !== "INSUFFICIENT_FUNDS") {
        toast.error(errResponse.message || err.message || "Unable to complete save");
      }
      // console.warn("[SAVE LEADS] ⚠️ WARNING: Credits may have been deducted before this failure — no rollback in place");
    } finally {
      // console.groupEnd();
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
              Saving new contacts{" "}
              <span className="font-bold">costs 1 email credit</span> per
              contact with email. No credits are charged for adding previously
              saved contacts.
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
              Saving new contacts{" "}
              <span className="font-bold">costs 1 email credit</span> per
              contact with email. No credits are charged for adding previously
              saved contacts.
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
              Saving new contacts{" "}
              <span className="font-bold">costs 1 email credit</span> per
              contact with email. No credits are charged for adding previously
              saved contacts.
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

  if (!isSaveLeadsVisible) return null;

  return (
    <>
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onCreate={handleCreateList}
        initialName={pendingCreateListName}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-[750px] rounded-lg shadow-2xl overflow-hidden flex flex-col relative">
          {/* Header */}
          <div className="bg-[#2b6cb0] px-6 py-4 flex justify-between items-center">
            <h2 className="text-white font-semibold text-lg">Save leads</h2>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Column Selector Overlay (Screenshot 6) */}
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
