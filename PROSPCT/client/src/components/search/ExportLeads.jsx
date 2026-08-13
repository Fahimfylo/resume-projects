import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListPlus,
  UserPlus,
  Download,
  Phone,
  X,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";
import useStore from "../../store/store";
import { saveList } from "../../api/mutation";
import { notifyListCreated, showToastIfPopupDisabled } from "../../utils/notificationHelper";

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

export default function ExportLeads() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const {
    isExportLeadsVisible,
    setExportLeadsVisible,
    filters,
    user,
    checkedItems,
  } = useStore();

  const checkedItemsCount = checkedItems?.length || 0;

  const phoneCreditCostPerPhoneNumber = 1;

  const phoneNumbersCount = (checkedItems || []).reduce((acc, item) => {
    const source = item._source || item || {};
    const phone = source.person_phone || source.phone || source.phoneNumber;
    return acc + (phone ? 1 : 0);
  }, 0);

  const phoneCredits = user?.credits?.phoneCredits?.current || 0;
  const phoneCreditsMax = user?.credits?.phoneCredits?.max || 0;
  const requiredPhoneCredits = phoneNumbersCount * phoneCreditCostPerPhoneNumber;

  // UI State
  const [activeTab, setActiveTab] = useState("export");
  const [selections, setSelections] = useState({
    list: false,
    assign: true, // Default per screenshot
    phone: false,
    export: false,
  });

  // Form State
  const [exportOption, setExportOption] = useState("custom");
  const [createList, setCreateList] = useState("");

  // Animation & Visibility Logic
  const [isAnimatedVisible, setIsAnimatedVisible] = useState(false);

  useEffect(() => {
    if (isExportLeadsVisible) {
      const timer = setTimeout(() => setIsAnimatedVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatedVisible(false);
    }
  }, [isExportLeadsVisible]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExportLeadsVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setExportLeadsVisible]);

  const toggleSelection = (key) => {
    setSelections((prev) => ({ ...prev, [key]: !prev[key] }));
    setActiveTab(key);
  };

  const handleSaveContacts = async () => {
    if (selections.list && !createList.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      if (selections.list) {
        await saveList(createList.trim());
        showToastIfPopupDisabled(`List "${createList}" created`);
        notifyListCreated(createList.trim());
      }

      // Credits already deducted when saving from Total tab - no re-deduction needed

      setExportLeadsVisible(false);
    } catch (error) {
      toast.error(error.message || "Failed to process request");
    }
  };

  if (!isExportLeadsVisible || filters.viewType !== "saved") return null;

  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
      <div
        ref={containerRef}
        className={`relative w-full max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${
          isAnimatedVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header - Solid Blue */}
        <div className="bg-[#2563eb] px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-semibold">Save leads</h2>
          <button
            onClick={() => setExportLeadsVisible(false)}
            className="hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-[400px]">
          {/* Left Sidebar */}
          <div className="w-[40%] border-r bg-gray-50/30 p-4 space-y-2">
            <SidebarItem
              icon={<ListPlus size={18} />}
              label="Add to list"
              isActive={activeTab === "list"}
              isSelected={selections.list}
              onClick={() => setActiveTab("list")}
              onToggle={() => toggleSelection("list")}
            />
            <SidebarItem
              icon={<UserPlus size={18} />}
              label="Assign owner"
              isActive={activeTab === "assign"}
              isSelected={selections.assign}
              onClick={() => setActiveTab("assign")}
              onToggle={() => toggleSelection("assign")}
            />
            <SidebarItem
              icon={<Phone size={18} />}
              label="Phone numbers"
              isActive={activeTab === "phone"}
              isSelected={selections.phone}
              onClick={() => setActiveTab("phone")}
              onToggle={() => toggleSelection("phone")}
            />
            <SidebarItem
              icon={<Download size={18} />}
              label="Export"
              isActive={activeTab === "export"}
              isSelected={selections.export}
              onClick={() => setActiveTab("export")}
              onToggle={() => toggleSelection("export")}
            />
          </div>

          {/* Right Content Area */}
          <div className="w-[60%] p-8 overflow-y-auto">
            {activeTab === "export" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Saving new contacts{" "}
                  <span className="font-bold text-gray-800">
                    costs 1 email credit
                  </span>{" "}
                  per contact with email. No credits are charged for adding
                  previously saved contacts.
                </p>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">
                    File format
                  </label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white appearance-none focus:ring-2 focus:ring-blue-500 outline-none">
                      <option>CSV</option>
                      <option>Excel</option>
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                      size={16}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800">
                    Properties
                  </label>
                  <RadioOption
                    label="Include only properties in columns"
                    checked={exportOption === "columns"}
                    onChange={() => setExportOption("columns")}
                  />
                  <RadioOption
                    label="Include all properties"
                    checked={exportOption === "all"}
                    onChange={() => setExportOption("all")}
                  />
                  <div className="flex justify-between items-center">
                    <RadioOption
                      label="Custom configuration"
                      checked={exportOption === "custom"}
                      onChange={() => setExportOption("custom")}
                    />
                    <button className="text-blue-600 text-xs font-semibold hover:underline">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "phone" && (
              <div className="flex flex-col items-start h-full space-y-4 animate-in fade-in duration-300">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Phone lookup uses <span className="font-bold">1 phone credit</span> per contact with a phone number.
                </p>
                <div className="w-full rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                  <div>Phone credits available: <span className="font-semibold">{phoneCredits}</span> / {phoneCreditsMax}</div>
                  <div>Selected contacts with phone: <span className="font-semibold">{phoneNumbersCount}</span></div>
                  <div>Estimated required phone credits: <span className="font-semibold">{requiredPhoneCredits}</span></div>
                </div>

                {requiredPhoneCredits > phoneCredits ? (
                  <p className="text-sm text-red-600">
                    Not enough phone credits. Please buy more credits before using this feature.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    You have enough phone credits to process this selection.
                  </p>
                )}

                <button
                  onClick={() => setExportLeadsVisible(false)}
                  className="w-full bg-white border border-gray-300 text-gray-700 rounded py-2.5 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Continue without phone lookup
                </button>
                <button
                  onClick={() => navigate("/plans-and-billings")}
                  className="w-full bg-blue-500 text-white px-6 py-2 rounded font-semibold text-sm hover:bg-blue-600 transition-colors shadow-md"
                >
                  Buy more credits
                </button>
              </div>
            )}

            {activeTab === "list" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h3 className="text-sm font-bold text-gray-800">Select List</h3>
                <input
                  type="text"
                  placeholder="Enter list name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={createList}
                  onChange={(e) => setCreateList(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3 bg-white">
          <button
            onClick={handleSaveContacts}
            className="flex-1 bg-[#2563eb] text-white font-semibold py-2.5 rounded hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            Confirm
          </button>
          <button
            onClick={() => setExportLeadsVisible(false)}
            className="flex-1 border border-gray-300 text-gray-600 font-semibold py-2.5 rounded hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

// Helper Components
function SidebarItem({ icon, label, isActive, isSelected, onClick, onToggle }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${
        isActive
          ? "border-blue-500 bg-blue-50/50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={isActive ? "text-blue-600" : "text-gray-400"}>
          {icon}
        </span>
        <span
          className={`text-[13px] font-semibold ${isActive ? "text-blue-700" : "text-gray-700"}`}
        >
          {label}
        </span>
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
    </div>
  );
}

function RadioOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </label>
  );
}
