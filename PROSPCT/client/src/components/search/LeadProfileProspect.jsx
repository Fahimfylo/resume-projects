/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import useCreditDeduction from "../../hooks/useCreditDeduction";
import useLists from "../../hooks/useList";
import { getCompanyLogo } from "../../utils/logoHelper";
import { MdEmail, MdOutlineDescription } from "react-icons/md";
import { FaPhoneAlt, FaList, FaBriefcase, FaCalendar } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import CreateListModal from "../lists/CreateListModal";
import useStore from "../../store/store";
import { showToastIfPopupDisabled, notifyListCreated } from "../../utils/notificationHelper";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function LeadProfileProspect({ item, queryClient, viewType }) {
  const { deductCredit } = useCreditDeduction();
  // Get contact ID for credit tracking
  const contactId = item?._id || item?._source?._id || item?._source?.person_email;

  // State for loading a new item
  const [loadingItem, setLoadingItem] = useState(true);

  // State for Email
  const [showEmail, setShowEmail] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  // State for Phone
  const [showPhone, setShowPhone] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);

  // State for Organization Description
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingAndShowingEmail, setSavingAndShowingEmail] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [savedContactData, setSavedContactData] = useState(null);

  const { lists, isLoading: listsLoading, error: listsError, refetch } = useLists();

  useEffect(() => {
    setLoadingItem(true);
    setShowEmail(false); // Reset email visibility
    setShowPhone(false); // Reset phone visibility
    setSelectedList(null); // reset list selection on item change
    setSavedContactData(null); // Reset saved contact data

    // Check if contact is already saved and has email/phone data
    const checkSavedStatus = async () => {
      try {
        const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
        if (!token) return;

        if (!item) return;

        const contactId = item._id || item._source?._id || item._source?.person_email;
        if (!contactId) return;

        const res = await axios.get(`${BASE_URL}/api/saved/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const savedItems = res.data?.data || [];
        
        // Check if this contact is in the saved list
        const savedContact = savedItems.find(savedItem => {
          const savedContactId = savedItem.contactId?._id || savedItem.contactId || savedItem._id;
          return savedContactId === contactId;
        });

        if (savedContact) {
          setShowEmail(true);
          setShowPhone(true);
          const source = savedContact.contactId?._source || savedContact.contactId || savedContact;
          setSavedContactData(source);
        }
      } catch (error) {
        // console.error("Failed to check saved status:", error);
      }
    };

    checkSavedStatus();

    setTimeout(() => {
      setLoadingItem(false);
    }, 1000); // Adjust delay as necessary
  }, [item]);

  const handleListChange = (e) => {
    setSelectedList(e.target.value);
  };

  const handleAddToList = async () => {
    if (!selectedList) {
      toast.error("Please select a list first.");
      return;
    }

    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to save contacts.");
      return;
    }

    if (!item?._id && !item?._source?._id && !item?._source?.person_email) {
      toast.error("Cannot save this item: missing identifiers.");
      return;
    }

    const contactId = item._id || item._source?._id || item._source?.person_email;

    // Check if contact is already in the selected list
    const selectedListObj = lists.find(list => list.name === selectedList);
    if (selectedListObj && selectedListObj.items && selectedListObj.items.includes(contactId)) {
      toast.info("Contact is already in this list.");
      setDropdownOpen(false);
      setSelectedList(null);
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${BASE_URL}/api/saved/add`,
        { savedItems: [contactId], listNames: [selectedList] },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      showToastIfPopupDisabled("Contact added to list successfully.");
      setDropdownOpen(false);
      setSelectedList(null);
      refetch();
    } catch (err) {
      // console.error(err);
      toast.error(err.response?.data?.message || "Failed to add contact to list");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateList = async (listName, type = "contacts") => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to create lists.");
      return;
    }

    if (!item?._id && !item?._source?._id && !item?._source?.person_email) {
      toast.error("Cannot save this item: missing identifiers.");
      return;
    }

    const contactId = item._id || item._source?._id || item._source?.person_email;

    try {
      await axios.post(
        `${BASE_URL}/api/list/add`,
        { list: { name: listName, items: [contactId], type } },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToastIfPopupDisabled("List created and contact added!");
      notifyListCreated(listName);
      setDropdownOpen(false); // Auto close after creating list
      setIsCreateListModalOpen(false);
      refetch();
    } catch (err) {
      // console.error(err);
      toast.error(err.response?.data?.message || "Failed to create list");
    }
  };

  // Handler to reveal contact (email + phone)
  const handleRevealContact = async () => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to save contacts.");
      return;
    }

    if (!item?._id && !item?._source?._id && !item?._source?.person_email) {
      toast.error("Cannot save this item: missing identifiers.");
      return;
    }

    const contactId = item._id || item._source?._id || item._source?.person_email;

    setLoadingEmail(true);
    setLoadingPhone(true);
    try {
      await axios.post(
        `${BASE_URL}/api/saved/add`,
        { savedItems: [contactId], listNames: [] },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const hasEmail = !!(item?._source?.person_email || item?._source?.email || item?.person_email || item?.email);
      const hasPhone = !!(item?._source?.person_phone || item?._source?.phone || item?.person_phone || item?.phone || item?._source?.mobilePhone || item?._source?.mobile_phone || item?.mobilePhone || item?.mobile_phone);

      let emailRevealed = false;
      let phoneRevealed = false;

      if (hasEmail) {
        try {
          await deductCredit({ type: "email", quantity: 1 });
          emailRevealed = true;
        } catch (_) { /* useCreditDeduction hook shows toast */ }
      }

      if (hasPhone) {
        try {
          await deductCredit({ type: "phone", quantity: 1 });
          phoneRevealed = true;
        } catch (_) { /* useCreditDeduction hook shows toast */ }
      }

      if (!hasPhone) phoneRevealed = true;

      if (emailRevealed) setShowEmail(true);
      if (phoneRevealed) setShowPhone(true);

      useStore.getState().incrementDataRefreshKey();
      localStorage.removeItem("savedContactsCache");
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["data"] });
        queryClient.invalidateQueries({ queryKey: ["savedContacts"] });
      }

      // Direct count fetch with current filters after save
      try {
        const currentFilters = useStore.getState().filters;
        const currentExcluded = useStore.getState().excludedFilters;
        const countRes = await axios.post(
          `${BASE_URL}/api/search/count`,
          { filters: currentFilters || {}, excludedFilters: currentExcluded || {} },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (countRes.data) {
          useStore.getState().setTotalCounts({
            total: countRes.data.total,
            saved: countRes.data.saved,
            new: countRes.data.new,
          });
        }
      } catch (_) {
        // silent — count will update on next fetch cycle
      }
    } catch (error) {
      if (error?.response?.data?.error !== "INSUFFICIENT_FUNDS") {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to reveal contact";
        toast.error(errorMessage);
      }
    } finally {
      setLoadingEmail(false);
      setLoadingPhone(false);
    }
  };

  // Handler to Toggle Organization Description
  const toggleDescription = () => {
    setShowFullDescription((prevState) => !prevState);
  };

  // Handler to Save and Show (deducts all credits, saves to Saved, reveals email/phone)
  const handleShowAndSave = async () => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to save contacts.");
      return;
    }

    if (!item?._id && !item?._source?._id && !item?._source?.person_email) {
      toast.error("Cannot save this item: missing identifiers.");
      return;
    }

    const contactId = item._id || item._source?._id || item._source?.person_email;

    setSavingAndShowingEmail(true);
    try {
      const saveResponse = await axios.post(
        `${BASE_URL}/api/saved/add`,
        { savedItems: [contactId], listNames: [] },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (saveResponse.data?.inserted > 0) {
        useStore.getState().incrementDataRefreshKey();
      }

      // Direct count fetch with current filters after save
      try {
        const currentFilters = useStore.getState().filters;
        const currentExcluded = useStore.getState().excludedFilters;
        const countRes = await axios.post(
          `${BASE_URL}/api/search/count`,
          { filters: currentFilters || {}, excludedFilters: currentExcluded || {} },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (countRes.data) {
          useStore.getState().setTotalCounts({
            total: countRes.data.total,
            saved: countRes.data.saved,
            new: countRes.data.new,
          });
        }
      } catch (_) {
        // silent — count will update on next fetch cycle
      }

      const hasEmail = !!(item?._source?.person_email || item?._source?.email || item?.person_email || item?.email);
      const hasPhone = !!(item?._source?.person_phone || item?._source?.phone || item?.person_phone || item?.phone || item?._source?.mobilePhone || item?._source?.mobile_phone || item?.mobilePhone || item?.mobile_phone);

      let emailRevealed = false;
      let phoneRevealed = false;

      if (hasEmail) {
        try {
          await deductCredit({ type: "email", quantity: 1 });
          emailRevealed = true;
        } catch (_) { /* useCreditDeduction hook shows toast */ }
      }

      if (hasPhone) {
        try {
          await deductCredit({ type: "phone", quantity: 1 });
          phoneRevealed = true;
        } catch (_) { /* useCreditDeduction hook shows toast */ }
      }

      if (!hasPhone) phoneRevealed = true;

      localStorage.removeItem("savedContactsCache");
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["data"] });
        queryClient.invalidateQueries({ queryKey: ["savedContacts"] });
      }

      if (emailRevealed) setShowEmail(true);
      if (phoneRevealed) setShowPhone(true);
    } catch (err) {
      if (err?.response?.data?.error !== "INSUFFICIENT_FUNDS") {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to save and show";
        toast.error(errorMessage);
      }
    } finally {
      setSavingAndShowingEmail(false);
    }
  };

  // Function to Truncate Text
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const DESCRIPTION_MAX_LENGTH = 195;

  const initials = (item?._source?.organization_name || item?.company)
    ? (item._source?.organization_name || item.company).slice(0, 2).toUpperCase()
    : "NA";

  return (
    <div className="user-profile flex-1 overflow-y-auto px-6 pt-6 pb-[80px] bg-white">
      {/* Loader for fetching new item */}
      {loadingItem ? (
        <div className="flex justify-center items-center h-full">
          <ClipLoader color="#0570B9" size={50} />
        </div>
      ) : (
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item?._source?.person_name || item?.name || "Not Available")}&background=random`}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center w-full h-full bg-blue-100 text-blue-600 rounded-full font-bold text-base">
                {(item?._source?.person_name || item?.name || "Not Available").charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="user-name text-xl font-semibold text-gray-900">
              {item?._source?.person_name || item?.name || "Not Available"}
            </div>
          </div>

          {/* User Title */}
          <div className="user-title text-sm text-gray-700">
            {item?._source?.person_title || item?.title || "Not Available"}
          </div>

          {/* Location */}
          <div className="user-title text-sm text-gray-500">
            United States
          </div>

          {/* Show and Save Button */}
          <button
            onClick={handleShowAndSave}
            disabled={savingAndShowingEmail || (showEmail && showPhone) || viewType === "saved"}
            className="py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            {savingAndShowingEmail ? (
              <>
                <ClipLoader color="#ffffff" size={16} className="mr-2" />
                Processing...
              </>
            ) : viewType === "saved" ? (
              "Revealed"
            ) : showEmail && showPhone ? (
              "Revealed"
            ) : (
              "Show and Save"
            )}
          </button>

          {/* Contact Methods Container */}
          <div className="space-y-3 pt-2">
            {/* Email Section */}
            <div className="flex items-center gap-3">
              <div className="w-5 flex justify-center flex-shrink-0">
                <MdEmail className="text-gray-400" size={18} />
              </div>

              <div>
                {viewType === "saved" ? (
                  showEmail ? (
                    <span className="text-sm text-gray-500">
                      {savedContactData?.person_email || savedContactData?.email || item?._source?.person_email || item?._source?.email || item?.email || "Not Found"}
                    </span>
                  ) : (
                    <span
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer hover:underline"
                      onClick={handleRevealContact}
                    >
                      Show Email
                    </span>
                  )
                ) : !showEmail && !loadingEmail ? (
                  <span
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer hover:underline"
                    onClick={handleRevealContact}
                  >
                    Show Email
                  </span>
                ) : loadingEmail ? (
                  <ClipLoader color="#0570B9" size={18} />
                ) : (
                  <span className="text-sm text-gray-500">
                    {savedContactData?.person_email || savedContactData?.email || item?._source?.person_email || item?._source?.email || item?.email || "Not Found"}
                  </span>
                )}
              </div>
            </div>

            {/* Phone Section */}
            <div className="flex items-center gap-3">
              <div className="w-5 flex justify-center flex-shrink-0">
                <FaPhoneAlt className="text-gray-400" size={15} />
              </div>

              <div>
                {viewType === "saved" ? (
                  showPhone ? (
                    <span className="text-sm text-gray-500">
                      {savedContactData?.person_phone || savedContactData?.phone || item?._source?.person_phone || item?._source?.phone || item?.phone || "Not Found"}
                    </span>
                  ) : (
                    <span
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer hover:underline"
                      onClick={handleRevealContact}
                    >
                      Show Phone
                    </span>
                  )
                ) : !showPhone && !loadingPhone ? (
                  <span
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer hover:underline"
                    onClick={handleRevealContact}
                  >
                    Show Phone
                  </span>
                ) : loadingPhone ? (
                  <ClipLoader color="#0570B9" size={18} />
                ) : (
                  <span className="text-sm text-gray-500">
                    {savedContactData?.person_phone || savedContactData?.phone || item?._source?.person_phone || item?._source?.phone || item?.phone || "Not Found"}
                  </span>
                )}
              </div>
            </div>

            {/* Add to List Section */}
            <div className="flex items-start gap-3">
              <div className="w-5 flex justify-center flex-shrink-0 mt-0.5">
                <FaList className="text-gray-400" size={15} />
              </div>

              <div className="w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium hover:underline"
                >
                  {isDropdownOpen ? "Close list menu" : "Add to list"}
                </button>

                {isDropdownOpen && (
                  <div className="mt-2 space-y-2 p-3 border border-gray-200 bg-gray-50 rounded shadow-sm">
                    {listsLoading && (
                      <div className="text-sm text-gray-500">Loading lists...</div>
                    )}
                    {listsError && (
                      <div className="text-sm text-red-500">Failed to load lists.</div>
                    )}

                    {(() => {
                      const contactLists = lists.filter(list => list.type === "contacts" || !list.type);
                      return (
                        <>
                          {!listsLoading && !listsError && contactLists.length === 0 && (
                            <button
                              onClick={() => setIsCreateListModalOpen(true)}
                              className="w-full px-2 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                            >
                              Create list
                            </button>
                          )}

                          {!listsLoading && !listsError && contactLists.length > 0 && (
                            <div className="space-y-2">
                              <select
                                value={selectedList || ""}
                                onChange={handleListChange}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                              >
                                <option value="" disabled>
                                  Select a list
                                </option>
                                {contactLists.map((list) => (
                                  <option key={list._id} value={list.name}>
                                    {list.name}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={handleAddToList}
                                disabled={saving || !selectedList}
                                className="w-full px-2 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                              >
                                {saving ? "Saving..." : "Save to list"}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <hr className="border-gray-200" />

          {/* Companies Section */}
          <div className="space-y-3">
            <div className="font-semibold text-sm text-gray-900">Companies</div>
            <div className="flex items-center">
              <div className="relative w-10 h-10 flex-shrink-0">
                {(item?._source?.organization_website_url || item?._source?.organization_domain || item?.organizationWebsite || item?.organizationDomain) && (
                  <img
                    src={getCompanyLogo(item?._source?.organization_website_url || item?._source?.organization_domain || item?.organizationWebsite || item?.organizationDomain)}
                    alt={item?.company || item?._source?.organization_name || "Company logo"}
                    className="w-full h-full rounded-full object-contain border border-gray-100 bg-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                )}
                <div
                  className={`${getCompanyLogo(item?._source?.organization_website_url || item?._source?.organization_domain || item?.organizationWebsite || item?.organizationDomain) ? 'hidden' : 'flex'} rounded-full w-full h-full bg-blue-600 font-semibold text-white items-center justify-center text-center text-sm`}
                >
                  {initials}
                </div>
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900 hover:text-blue-500 cursor-pointer">
                  {item?._source?.organization_name || item?.company || "Not Available"}
                </div>
                <Link
                  to={item?._source?.organization_website_url || item?.organizationWebsite || "#"}
                  className="text-sm text-blue-500 hover:underline"
                >
                  {item?._source?.organization_website_url || item?.organizationWebsite || "Not Available"}
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Information Sections */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center">
              <div className="w-5 flex justify-center text-gray-400"><FaBriefcase /></div>
              <div className="ml-3 text-sm text-gray-900">
                {item?._source?.person_title || item?.title || "Not Available"}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-5 flex justify-center text-gray-400"><FaCalendar /></div>
              <div className="ml-3 text-sm text-gray-900">
                {item?._source?.organization_founded_year || "Not Available"}
              </div>
            </div>

            {/* Organization Description Section */}
            <div className="flex items-start">
              <div className="w-5 flex justify-center text-gray-400 mt-0.5"><MdOutlineDescription size={19} /></div>
              <div className="ml-3 text-sm text-gray-900 flex-1">
                {item?._source?.organization_short_description ? (
                  <>
                    <span>
                      {showFullDescription
                        ? item?._source?.organization_short_description
                        : truncateText(item?._source?.organization_short_description, DESCRIPTION_MAX_LENGTH)}
                    </span>
                    {item?._source?.organization_short_description?.length > DESCRIPTION_MAX_LENGTH && (
                      <span className="text-blue-500 cursor-pointer hover:underline ml-1" onClick={toggleDescription}>
                        {showFullDescription ? "Show less" : "Show more"}
                      </span>
                    )}
                  </>
                ) : (
                  "Not Available"
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onCreate={handleCreateList}
      />
    </div>
  );
}