import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { RiArrowLeftLine, RiSearchLine, RiAddLine, RiShieldCheckLine, RiCalendarLine, RiTimeLine } from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function Subscription() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchSubscriptionData = useCallback(async (page = 1, query = "", isSearch = false) => {
    if (isSearch) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      setError("Session expired. Please log in.");
      setIsSearching(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/subscriptions`, {
        params: { page, searchQuery: query },
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubscriptions(response.data.subscriptions || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setError("");
    } catch (err) {
      // console.error("Error fetching subscriptions:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while fetching subscriptions."
      );
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        setCurrentPage(1);
        fetchSubscriptionData(1, searchTerm, true);
      } else if (currentPage === 1) {
        fetchSubscriptionData(1, "", false);
      }
    }, 800); // 800ms debounce as requested "make it slow"

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, fetchSubscriptionData]);

  useEffect(() => {
    if (!searchTerm.trim() && currentPage > 1) {
      fetchSubscriptionData(currentPage, "", false);
    }
  }, [currentPage, searchTerm, fetchSubscriptionData]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveId(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${status !== 'active' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );

  const handleDelete = (e, id) => {
    e.stopPropagation();
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete this subscription?
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss();
              const token = Cookies.get("adminAccessToken");
              try {
                await axios.delete(`${BASE_URL}/api/subscriptions/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Subscription deleted successfully!");
                setActiveId(null);
                fetchSubscriptionData(currentPage, searchTerm);
              } catch (err) {
                toast.error(err?.response?.data?.message || "Delete failed.");
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false }
    );
  };

  const handleDeleteAll = () => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete all subscriptions?
        </p>
        <p className="text-xs text-gray-400 mt-1">This action cannot be undone.</p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss();
              const token = Cookies.get("adminAccessToken");
              try {
                await axios.post(`${BASE_URL}/api/subscriptions/deleteAll`, {}, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("All subscriptions deleted successfully!");
                fetchSubscriptionData(1, "");
              } catch (err) {
                toast.error(err?.response?.data?.message || "Delete failed.");
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false }
    );
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prevPage) => prevPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prevPage) => prevPage + 1);
  };

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* Loading Overlay */}
        {loading && !isSearching && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading subscriptions...</p>
            </div>
          </div>
        )}

        {/* Header Area */}
        {!selectedSubscription && subscriptions.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Subscription Directory</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overview of all active and inactive user subscriptions</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none relative group">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" size={18} />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-sm"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button onClick={handleDeleteAll} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap">
              Delete All
            </button>
            <Link to="/admin/subscriptions/add" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap">
              <RiAddLine size={18} /> Add Subscription
            </Link>
          </div>
        </div>
        )}

        {!selectedSubscription ? (
          subscriptions.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Start Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">End Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cycle</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription._id} onClick={() => setSelectedSubscription(subscription)} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{subscription.user?.firstName || ''} {subscription.user?.lastName || ''}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{subscription.user?.email || 'Not Available'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {subscription.plan?.name || 'Not Available'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'Not Available'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Not Available'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {subscription.billingCycle || 'Not Available'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={subscription.status} />
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveId(activeId === subscription._id ? null : subscription._id); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                          <HiDotsVertical className="text-gray-400 dark:text-gray-500" />
                        </button>
                        {activeId === subscription._id && (
                          <div ref={dropdownRef} className="absolute right-6 top-10 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-30 py-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-subscription/${subscription._id}`, { state: { subscription } }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/30">Update</button>
                            <button onClick={(e) => handleDelete(e, subscription._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-t dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackPrevFilled size={12} /></button>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackNextFilled size={12} /></button>
              </div>
            </div>
          </div>
          ) : (
            <EmptyState
              icon={RiCalendarLine}
              title="No Subscriptions Found"
              subtitle="Start by adding your first subscription to manage plan assignments."
              actionLabel="Add Subscription"
              actionPath="/admin/subscriptions/add"
              iconColor="text-purple-300"
              size="sm"
            />
          )
        ) : (
          /* Detailed Subscription View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedSubscription(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium">
                <RiArrowLeftLine /> Back to Directory
              </button>
              <StatusBadge status={selectedSubscription.status} />
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="text-center md:text-left border-b md:border-b-0 md:border-r dark:border-gray-700 pb-8 md:pb-0 md:pr-8">
                <div className="w-24 h-24 mx-auto md:mx-0 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                  <RiShieldCheckLine size={40} className="text-sky-500 dark:text-sky-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{selectedSubscription.user?.firstName} {selectedSubscription.user?.lastName}</h2>
                <div className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{selectedSubscription.plan?.name} Plan</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">{selectedSubscription.user?.email || 'No email'}</p>
              </div>

              {/* Data Grid */}
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-1"><RiCalendarLine size={12} /> Start Date</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSubscription.startDate ? new Date(selectedSubscription.startDate).toLocaleDateString() : 'Not Available'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-1"><RiTimeLine size={12} /> End Date</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedSubscription.endDate ? new Date(selectedSubscription.endDate).toLocaleDateString() : 'Not Available'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Billing Cycle</label>
                    <p className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">{selectedSubscription.billingCycle}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 tracking-widest">Subscription Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Plan Name</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedSubscription.plan?.name || 'Not Available'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <StatusBadge status={selectedSubscription.status} />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Created At</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedSubscription.createdAt ? new Date(selectedSubscription.createdAt).toLocaleDateString() : 'Not Available'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-subscription/${selectedSubscription._id}`, { state: { subscription: selectedSubscription } }); }} className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition-shadow shadow-md">Update Subscription</button>
                  <button onClick={(e) => { handleDelete(e, selectedSubscription._id); setSelectedSubscription(null); }} className="px-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminComponent>
  );
}
