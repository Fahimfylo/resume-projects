import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import { formatContact } from "../../utils/contactFormatter";
import { MdEmail } from "react-icons/md";
import { MoreVertical, Trash2 } from "lucide-react";
import { ClipLoader } from "react-spinners";
import useStore from "../../store/store";
import { notifyContactDeleted, showToastIfPopupDisabled } from "../../utils/notificationHelper";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function LeadProfileContacts({ dataItem, queryClient }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [savedContacts, setSavedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deletingContactId, setDeletingContactId] = useState(null);

  const fetchSavedContacts = async () => {
    try {
      const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const res = await axios.get(`${BASE_URL}/api/saved/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawItems = res.data?.data || [];

      const normalized = rawItems.map((item) => {
        const contactId = item.contactId;
        const formatted = formatContact(item.contactData || {});
        return {
          id: contactId || Math.random().toString(36).slice(2),
          _id: contactId,
          contactId: contactId,
          name: formatted.name,
          title: formatted.title,
          company: formatted.company,
          location: formatted.location,
          email: formatted.email || "-",
          is_saved: true,
        };
      });

      setSavedContacts(normalized);
    } catch (err) {
      // console.error("Failed to fetch saved contacts", err);
      setError("Failed to load saved contacts.");
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSavedContacts().finally(() => setLoading(false));
  }, []);

  const handleDeleteContact = async (contactId) => {
    const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    if (!token) {
      toast.error("Please log in to delete contacts.");
      return;
    }

    setDeletingContactId(contactId);
    try {
      const response = await axios.delete(`${BASE_URL}/api/saved`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { contactIds: [contactId] },
      });
      
      const deletedCount = response.data?.deleted || 1;
      showToastIfPopupDisabled(`${deletedCount} contact deleted successfully.`);
      setMenuOpenId(null);
      
      // Refresh saved contacts list
      await fetchSavedContacts();
      
      // Invalidate query to refresh counts
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ["data"] });
      }
      notifyContactDeleted(deletedCount);
    } catch (error) {
      // console.error("[handleDeleteContact] Failed to delete saved contact:", error);
      // console.error("[handleDeleteContact] Error response:", error.response?.data);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Failed to delete contact";
      toast.error(errorMessage);
    } finally {
      setDeletingContactId(null);
    }
  };

  const displayedContacts = useMemo(() => {
    const query = searchTerm.trim();

    if (!query) return savedContacts;

    return savedContacts.filter((c) =>
      [c.name, c.title, c.company, c.location]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }, [savedContacts, searchTerm]);

  return (
    <div className="user-profile flex-1 overflow-y-auto pb-[80px]">
      <div className="mt-4 px-4">
        <div className="flex items-center mb-3 gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, title, company, or location"
            className="w-full px-2 py-2 text-gray-800 border border-gray-300 rounded-sm outline-none"
          />
          <button
            className="px-3 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            disabled={loading}
            onClick={() => setSearchTerm("")}
          >
            Clear
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading contacts...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : displayedContacts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No contacts found.</div>
        ) : (
          <div className="space-y-3">
            {displayedContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3 border border-gray-200 rounded hover:bg-gray-50 relative"
              >
                {/* 3-dot menu */}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === contact.id ? null : contact.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>
                  {menuOpenId === contact.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded shadow-lg z-10 w-32">
                      <button
                        onClick={() => {
                          handleDeleteContact(contact.contactId);
                        }}
                        disabled={deletingContactId === contact.contactId}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        {deletingContactId === contact.contactId ? (
                          <ClipLoader color="#dc2626" size={12} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        {deletingContactId === contact.contactId ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Name & Avatar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || "Not Available")}&background=random`}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center w-full h-full bg-blue-50 text-blue-600 rounded-full font-bold text-[10px]">
                      {(contact.name || "Not Available").charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-gray-900">
                    {contact.name}
                  </div>
                </div>

                {/* Job Title */}
                <div className="text-xs text-gray-700 mb-1">
                  {contact.title}
                </div>

                {/* Company */}
                <div className="text-xs text-gray-600 mb-1">
                  {contact.company}
                </div>

                {/* Location */}
                <div className="text-xs text-gray-600 mb-2">
                  {contact.location}
                </div>

                {/* Email */}
                <div className="flex items-center gap-2">
                  <MdEmail className="text-gray-400" size={14} />
                  <span className="text-xs text-gray-500">{contact.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

LeadProfileContacts.propTypes = {
  dataItem: PropTypes.shape({
    _id: PropTypes.string,
    person_name: PropTypes.string,
    person_title: PropTypes.string,
    organization_name: PropTypes.string,
    person_email: PropTypes.string,
    _source: PropTypes.shape({
      _id: PropTypes.string,
      person_name: PropTypes.string,
      person_title: PropTypes.string,
      organization_name: PropTypes.string,
      person_email: PropTypes.string,
      person_location_city: PropTypes.string,
      person_location_country: PropTypes.string,
    }),
  }),
};
