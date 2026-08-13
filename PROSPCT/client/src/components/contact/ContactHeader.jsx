import { useState } from "react";
import { Search, X, Trash2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import useStore from "../../store/store";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { FaBarsStaggered } from "react-icons/fa6";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import API_CONFIG from "../../utils/apiConstant";
import { notifyContactDeleted, showToastIfPopupDisabled } from "../../utils/notificationHelper";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function ContactHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isCleaningup, setIsCleaningup] = useState(false);
  const queryClient = useQueryClient();
  const { hasFeature } = useFeatureAccess();
  const {
    setContactEditColumnsVisible,
    setExportVisible,
    hasContactData,
    checkedItems,
    clearCheckedItems,
    totalSavedContacts,
    filteredContactCount,
  } = useStore();

  const toggleVisibility = () => {
    setIsOpen(!isOpen);
  };

  const handleDeleteContacts = async () => {
    if (checkedItems.length === 0) {
      toast.warning("No contacts selected");
      return;
    }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete {checkedItems.length} contact(s)?
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss(toastId);
              setIsDeleting(true);
              try {
                const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
                const contactIds = checkedItems.map((item) => item.savedContactId || item._id);

                const response = await axios({
                  method: "DELETE",
                  url: `${BASE_URL}/api/saved/`,
                  headers: { Authorization: `Bearer ${token}` },
                  data: { contactIds },
                });

                showToastIfPopupDisabled(`${contactIds.length} contact(s) deleted`);
                clearCheckedItems();
                // Clear cache first, then refetch
                localStorage.removeItem("savedContactsCache");
                queryClient.removeQueries({ queryKey: ["savedContacts"] });
                await queryClient.refetchQueries({ queryKey: ["savedContacts"] });
                
                notifyContactDeleted(contactIds.length);
              } catch (error) {
                // console.error("[Delete] Error:", error);
                // console.error("[Delete] Error response:", error.response?.data);
                toast.error(error.response?.data?.error || "Failed to delete contacts");
              } finally {
                setIsDeleting(false);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  const handleDeleteAllContacts = async () => {
    if (!filteredContactCount || filteredContactCount === 0) {
      toast.warning("No contacts to delete");
      return;
    }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete ALL {filteredContactCount} contacts? This action cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss(toastId);
              setIsDeletingAll(true);
              try {
                const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

                const response = await axios({
                  method: "DELETE",
                  url: `${BASE_URL}/api/saved/all`,
                  headers: { Authorization: `Bearer ${token}` },
                });

                showToastIfPopupDisabled(`All ${response.data.deletedFromSavedContacts} contact(s) deleted`);
                clearCheckedItems();
                // Clear cache first, then refetch
                localStorage.removeItem("savedContactsCache");
                queryClient.removeQueries({ queryKey: ["savedContacts"] });
                await queryClient.refetchQueries({ queryKey: ["savedContacts"] });
                
                notifyContactDeleted(response.data.deletedFromSavedContacts);
              } catch (error) {
                // console.error("[DeleteAll] Error:", error);
                // console.error("[DeleteAll] Error response:", error.response?.data);
                toast.error(error.response?.data?.error || "Failed to delete all contacts");
              } finally {
                setIsDeletingAll(false);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningup(true);
    try {
      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

      const response = await axios({
        method: "POST",
        url: `${BASE_URL}/api/saved/cleanup`,
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Cleaned up ${response.data.deleted} duplicate contacts, kept ${response.data.merged} unique`);

      // Refresh the contacts list
      queryClient.invalidateQueries({ queryKey: ["savedContacts"] });
      await queryClient.refetchQueries({ queryKey: ["savedContacts"] });
    } catch (error) {
      // console.error("[Cleanup] Error:", error);
      // console.error("[Cleanup] Error response:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to cleanup duplicates");
    } finally {
      setIsCleaningup(false);
    }
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow">
      <div
        id="second-section-header"
        className="hidden text-xl font-semibold lg:flex"
      >
        All Contacts
      </div>
      <div className="flex mx-3">
        <div className=" sm:ml-0">
          <FaBarsStaggered
            size='20'
            onClick={toggleVisibility}
            className="sm:hidden cursor-pointer mt-2 text-lg text-gray-700"
          />
        </div>
        <div
          className={`absolute sm:flex w-full sm:w-auto top-0 left-0 p h-full sm:relative bg-white sm:transition-all duration-300 z-30 sm:z-40 sm:translate-y-0 ${isOpen ? "translate-y-0" : "-translate-y-full"
            }`}
        >
          <div className="px-4 py-4 mb-4 text-xl text-white sm:hidden bg-sky-600">
            <div className="flex justify-between">
              <div className="">Filter</div>
              <X className="cursor-pointer" onClick={toggleVisibility} />
            </div>
          </div>
          {filteredContactCount > 0 && (
            <>
              <div
                className="text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-gray-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-sky-500 transition-colors duration-500"
                onClick={() => setContactEditColumnsVisible(true)}
              >
                Edit Columns
              </div>
              <Link
                to="/import"
                className="text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-gray-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-sky-500 transition-colors duration-500"
              >
                Import
              </Link>
              <div
                className={`text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-gray-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-sky-100 sm:hover:bg-white sm:hover:text-sky-500 hover:border-sky-500 transition-colors duration-500 ${!hasFeature("csvEnrichment") ? "opacity-40" : ""}`}
                onClick={() => {
                  if (!hasFeature("csvEnrichment")) {
                    toast.warn("Your plan does not include CSV export. Please upgrade your plan.");
                    return;
                  }
                  setExportVisible(true);
                }}
              >
                Export
              </div>
              {checkedItems.length > 0 && (
                <div
                  className={`text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-red-400 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-red-50 sm:hover:bg-white sm:hover:text-red-500 hover:border-red-500 transition-colors duration-500 flex items-center gap-1 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={handleDeleteContacts}
                >
                  <Trash2 size={14} />
                  <span>Delete ({checkedItems.length})</span>
                </div>
              )}
              {filteredContactCount > 0 && (
                <div
                  className={`text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-red-500 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-red-50 sm:hover:bg-white sm:hover:text-red-600 hover:border-red-600 transition-colors duration-500 flex items-center gap-1 ${isDeletingAll ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={handleDeleteAllContacts}
                >
                  <Trash2 size={14} />
                  <span>Delete All ({filteredContactCount})</span>
                </div>
              )}
              {filteredContactCount > 0 && hasFeature("duplicateControl") && (
                <div
                  className={`text-[13px] mx-4 sm:mx-0 sm:mr-3 sm:border border-purple-400 py-5 sm:py-[4px] px-4 rounded-sm cursor-pointer hover:bg-purple-50 sm:hover:bg-white sm:hover:text-purple-500 hover:border-purple-500 transition-colors duration-500 flex items-center gap-1 ${isCleaningup ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={handleCleanupDuplicates}
                >
                  <Sparkles size={14} />
                  <span>Cleanup Duplicates</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default ContactHeader;
