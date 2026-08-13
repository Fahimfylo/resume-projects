import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { RiExpandUpDownFill, RiSearchLine, RiAddLine, RiArrowLeftLine, RiUserLine } from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant.js";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function ViewUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshingUser, setRefreshingUser] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // --- API Functions ---
  const fetchUserById = async (userId) => {
    setRefreshingUser(true);
    const token = Cookies.get("adminAccessToken");
    if (!token) return;

    try {
      const response = await axios.get(`${BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUser(response.data.user || response.data);
    } catch (err) {
      // console.error("Error fetching user details:", err);
    } finally {
      setRefreshingUser(false);
    }
  };

  const fetchUserData = useCallback(async (page = 1, search = "", isSearch = false) => {
    if (isSearch) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      setError("Session expired. Please log in.");
      if (isSearch) setIsSearching(false);
      else setLoading(false);
      return;
    }

    try {
      let endpoint = `${BASE_URL}/api/users/`;
      const params = { page, limit };

      if (search && search.trim()) {
        endpoint = `${BASE_URL}/api/users/search`;
        params.searchQuery = search.trim();
      }

      const response = await axios.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setUsers(data.users || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching users.");
      // console.error("Fetch error:", err);
    } finally {
      if (isSearch) setIsSearching(false);
      else setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        // Reset to page 1 when searching
        setCurrentPage(1);
        fetchUserData(1, searchTerm, true); // isSearch = true
      } else if (currentPage === 1) {
        // If on page 1 and search cleared, fetch immediately
        fetchUserData(1, "", false); // isSearch = false
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, fetchUserData]);

  // Handle pagination changes separately
  useEffect(() => {
    if (!searchTerm.trim() && currentPage > 1) {
      fetchUserData(currentPage, "", false); // isSearch = false
    }
  }, [currentPage, searchTerm, fetchUserData]);

  // --- Handlers ---
  const handleDelete = (e, id) => {
    e.stopPropagation();
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete this user?
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
                await axios.delete(`${BASE_URL}/api/users/delete/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("User deleted successfully!");
                setActiveId(null);
                // Refetch with current page/search params
                if (searchTerm.trim()) {
                  fetchUserData(1, searchTerm, true);
                } else {
                  fetchUserData(currentPage, "", false);
                }
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

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setActiveId(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // --- UI Helpers ---
  const StatusBadge = ({ isBlocked }) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${isBlocked ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
      {isBlocked ? 'Blocked' : 'Active'}
    </span>
  );

  const CreditBar = ({ current, max, label }) => (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-sky-500 h-full transition-all"
          style={{ width: `${Math.min((current / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );

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
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading users...</p>
            </div>
          </div>
        )}

        {/* Header Area */}
        {!selectedUser && users.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">User Directory</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overview of all registered platform users and their subscription status</p>
          </div>

          <div className="flex items-center gap-3">
              <div className="relative group">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" />
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none w-64"
                  placeholder="Search name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <Link to="/admin/users/add" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm">
                <RiAddLine size={18} /> Add User
              </Link>
            </div>
        </div>
        )}

        {!selectedUser ? (
          users.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Billing</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user._id} onClick={() => { setSelectedUser(user); fetchUserById(user._id); }} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded">
                            {user.plan?.name || user.redeemedDeal || "Free Tier"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {user.subscription?.billingCycle || "Not Available"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge isBlocked={user.isBlocked} />
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button onClick={(e) => { e.stopPropagation(); setActiveId(activeId === user._id ? null : user._id); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                            <HiDotsVertical className="text-gray-400 dark:text-gray-500" />
                          </button>
                          {activeId === user._id && (
                            <div ref={dropdownRef} className="absolute right-6 top-10 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-30 py-1">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-user/${user._id}`, { state: { user } }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/30">Update</button>
                              <button onClick={(e) => handleDelete(e, user._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-t dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-30"><TbPlayerTrackPrevFilled size={12} /></button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-30"><TbPlayerTrackNextFilled size={12} /></button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={RiUserLine}
              title="No Users Found"
              subtitle="Start by adding your first user to begin managing the platform."
              actionLabel="Add User"
              actionPath="/admin/users/add"
              iconColor="text-sky-300"
              size="sm"
            />
          )
        ) : (
          /* Detailed User View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium">
                <RiArrowLeftLine /> Back to Directory
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchUserById(selectedUser._id)}
                  disabled={refreshingUser}
                  className="flex items-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors disabled:opacity-50"
                >
                  {refreshingUser ? (
                    <div className="w-3 h-3 border-2 border-sky-200 dark:border-sky-700 border-t-sky-600 rounded-full animate-spin"></div>
                  ) : (
                    "Refresh"
                  )}
                </button>
                <StatusBadge isBlocked={selectedUser.isBlocked} />
              </div>
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="text-center md:text-left border-b md:border-b-0 md:border-r dark:border-gray-700 pb-8 md:pb-0 md:pr-8">
              <div className="w-24 h-24 mx-auto md:mx-0 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                  {selectedUser.profilePicture ? (
                    <img 
                      src={`${selectedUser.profilePicture.startsWith("http") ? selectedUser.profilePicture : API_CONFIG.API_ENDPOINT + selectedUser.profilePicture}?t=${Date.now()}`}
                      alt="User" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <RiUserLine size={40} className="text-sky-500 dark:text-sky-400" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{selectedUser.firstName} {selectedUser.lastName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selectedUser.email}</p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest">Company</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedUser.company || "Independent"}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Country Code</label><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedUser.countryCode || "Not Available"}</p></div>
                  <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Account ID</label><p className="text-[10px] font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded inline-block text-gray-900 dark:text-gray-100">{selectedUser._id}</p></div>
                  <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Joined</label><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(selectedUser.createdAt).toLocaleDateString()}</p></div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 tracking-widest">Credit Utilization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CreditBar label="Email Credits" current={selectedUser.credits?.emailCredits?.current} max={selectedUser.credits?.emailCredits?.max} />
                    <CreditBar label="Verification Credits" current={selectedUser.credits?.verificationCredits?.current} max={selectedUser.credits?.verificationCredits?.max} />
                    <CreditBar label="Phone Credits" current={selectedUser.credits?.phoneCredits?.current} max={selectedUser.credits?.phoneCredits?.max} />
                    <CreditBar label="Export Credits" current={selectedUser.credits?.exportCredits?.current} max={selectedUser.credits?.exportCredits?.max} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-user/${selectedUser._id}`, { state: { user: selectedUser } }); }} className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition-shadow shadow-md">Update User Profile</button>
                  <button onClick={(e) => { handleDelete(e, selectedUser._id); setSelectedUser(null); }} className="px-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminComponent>
  );
}