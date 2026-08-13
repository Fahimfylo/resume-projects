import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { RiPriceTag3Line, RiArrowLeftLine, RiAddLine, RiUserAddLine } from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function ViewCustomPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const fetchCustomPlans = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      setError("Session expired. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const [plansRes, usersRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/custom-plans/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/api/users?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const plans = plansRes.data.plans || [];
      setPlans(plans);
      setTotalCount(plansRes.data.totalCount || plans.length);
      setUsers(usersRes.data?.users || usersRes.data?.data || []);
      setError("");
    } catch (err) {
      // console.error("Error fetching custom plan data:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "An error occurred while fetching custom plan data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomPlans();
  }, [fetchCustomPlans]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete this custom plan?
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
                await axios.delete(`${BASE_URL}/api/custom-plans/delete/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Custom plan deleted successfully!");
                setActiveId(null);
                const response = await axios.get(`${BASE_URL}/api/custom-plans/`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const plans = response.data.plans || [];
                setPlans(plans);
                setTotalCount(response.data.totalCount || plans.length);
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setUserSearchQuery("");
        setSearchResults([]);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAvailableUsers = async () => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/users?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data?.users || res.data?.data || []);
    } catch (err) {
      // console.error("Error fetching users:", err);
    }
  };

  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    setSearchingUsers(true);
    await new Promise((r) => setTimeout(r, 300));
    const token = Cookies.get("adminAccessToken");
    try {
      const res = await axios.get(`${BASE_URL}/api/users/search`, {
        params: { searchQuery: query.trim(), limit: 5 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = res.data?.users || res.data?.data || [];
      const filtered = allUsers.filter(
        (u) => !(selectedPlan?.assigned || []).includes(u.email)
      );
      setSearchResults(filtered);
    } catch (err) {
      // console.error("Error searching users:", err);
    }
    setSearchingUsers(false);
  };

  const updateLocalAssignState = (user) => {
    const updatedAssigned = [...(selectedPlan?.assigned || []), user.email];
    setSelectedPlan((prev) => ({ ...prev, assigned: updatedAssigned }));
    setPlans(prev => prev.map(p => p._id === selectedPlan._id ? { ...p, assigned: updatedAssigned } : p));
    setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
    setUsers((prev) => prev.filter((u) => u._id !== user._id));
    setUserSearchQuery("");
  };

  const doAssignUser = async (user) => {
    const token = Cookies.get("adminAccessToken");
    try {
      const response = await axios.post(`${BASE_URL}/api/custom-plans/assign-custom-plan`, {
        userId: user._id,
        planId: selectedPlan._id,
        email: user.email,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
        setUserSearchQuery("");
        toast.success("User assigned to custom plan successfully");
        const token2 = Cookies.get("adminAccessToken");
        const plansRes = await axios.get(`${BASE_URL}/api/custom-plans/`, {
          headers: { Authorization: `Bearer ${token2}` },
        });
        const refreshedPlans = plansRes.data.plans || [];
        setPlans(refreshedPlans);
        setTotalCount(plansRes.data.totalCount || refreshedPlans.length);
        const refreshed = refreshedPlans.find(p => p._id === selectedPlan._id);
        if (refreshed) setSelectedPlan(refreshed);
      } else {
        toast.error(response.data.message || "Failed to assign user");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error assigning user to custom plan");
    }
  };

  const confirmAssignUser = (user) => {
    let existingPlanName = null;
    if (user?.plan) {
      existingPlanName = typeof user.plan === 'object' && user.plan !== null ? user.plan.name : null;
    }
    if (!existingPlanName) {
      const assignedPlan = plans.find(p => (p.assigned || []).includes(user.email));
      if (assignedPlan) existingPlanName = assignedPlan.name;
    }

    if (existingPlanName) {
      const toastId = toast.info(
        <div className="p-1">
          <p className="text-md font-semibold text-white tracking-tight">
            This user is already assigned into {existingPlanName} plan. Do you want to switch it
          </p>
          <div className="flex gap-2 justify-end mt-5">
            <button
              onClick={() => toast.dismiss(toastId)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(toastId);
                doAssignUser(user);
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>,
        { autoClose: false, icon: false }
      );
      return;
    }

    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Assign this user to the plan?
        </p>
        <p className="text-sm text-gray-300 mt-1">
          {user.firstName} {user.lastName} ({user.email})
        </p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(toastId);
              doAssignUser(user);
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

  const confirmRemoveUser = (email) => {
    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Remove assigned user?
        </p>
        <p className="text-sm text-gray-300 mt-1">{email}</p>
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
              const token = Cookies.get("adminAccessToken");
              const userToRemove = users.find(u => u.email === email);

              if (!userToRemove) {
                toast.error("User not found");
                return;
              }

              try {
                const response = await axios.delete(`${BASE_URL}/api/custom-plans/remove-custom-plan-assignment`, {
                  data: {
                    userId: userToRemove._id,
                    email: email,
                  },
                  headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.success) {
                  const updatedAssigned = (selectedPlan?.assigned || []).filter((e) => e !== email);
                  setSelectedPlan((prev) => ({ ...prev, assigned: updatedAssigned }));
                  setPlans(prev => prev.map(p => p._id === selectedPlan._id ? { ...p, assigned: updatedAssigned } : p));
                  toast.success("User removed from custom plan successfully");
                } else {
                  toast.error(response.data.message || "Failed to remove user");
                }
              } catch (error) {
                toast.error(error?.response?.data?.message || "Error removing user from custom plan");
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

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${status !== 'active' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading custom plans...</p>
            </div>
          </div>
        )}

        {/* Header Area - only show when plans exist */}
        {!selectedPlan && plans.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Custom Plan Directory</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overview of all custom subscription plans</p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/admin/plans/add?type=custom" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm">
                <RiAddLine size={18} /> Add Plan
              </Link>
            </div>
          </div>
        )}

        {!selectedPlan ? (
          plans.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Monthly</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Yearly</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Assigned to</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {plans.map((plan) => (
                      <tr key={plan._id} onClick={() => setSelectedPlan(plan)} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{plan.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{plan.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          ${plan.pricing?.monthly?.price || 0}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          ${plan.pricing?.yearly?.price || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {plan.duration}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {plan.assigned && plan.assigned.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="truncate max-w-[160px]"
                                title={plan.assigned.join(", ")}
                              >
                                {plan.assigned[0]}
                              </span>
                              {plan.assigned.length > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                                  +{plan.assigned.length - 1} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={plan.status} />
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button onClick={(e) => { e.stopPropagation(); setActiveId(activeId === plan._id ? null : plan._id); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                            <HiDotsVertical className="text-gray-400 dark:text-gray-500" />
                          </button>
                          {activeId === plan._id && (
                            <div ref={dropdownRef} className="absolute right-6 top-10 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-30 py-1">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-custom-plan/${plan._id}`, { state: { plan } }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/30">Update</button>
                              <button onClick={(e) => handleDelete(e, plan._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading ? (
            <EmptyState
              icon={RiPriceTag3Line}
              title="No custom plans found"
              subtitle="Custom plans created by users or admins will appear here."
              actionLabel="Add Custom Plan"
              actionPath="/admin/plans/add?type=custom"
              size="lg"
              iconColor="text-sky-600"
            />
          ) : null
        ) : (
          /* Detailed Plan View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium">
                <RiArrowLeftLine /> Back to Directory
              </button>
              <StatusBadge status={selectedPlan.status} />
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="text-center md:text-left border-b md:border-b-0 md:border-r dark:border-gray-700 pb-8 md:pb-0 md:pr-8">
                <div className="w-24 h-24 mx-auto md:mx-0 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-inner">
                  <RiPriceTag3Line size={40} className="text-sky-500 dark:text-sky-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{selectedPlan.name}</h2>
                <div className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{selectedPlan.type} Plan</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">{selectedPlan.description}</p>
              </div>

              {/* Data Grid */}
              <div className="md:col-span-2 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Monthly Base</label><p className="text-lg font-bold text-gray-900 dark:text-gray-100">${selectedPlan.pricing?.monthly?.price || 0}</p></div>
                  <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Yearly Base</label><p className="text-lg font-bold text-gray-900 dark:text-gray-100">${selectedPlan.pricing?.yearly?.price || 0}</p></div>
                  <div><label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Duration</label><p className="text-sm font-medium capitalize mt-1 text-gray-900 dark:text-gray-100">{selectedPlan.duration}</p></div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 tracking-widest">Resource Allocation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center text-sm"><span className="text-gray-500 dark:text-gray-400">Email Credits</span><span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPlan.features?.emailCredits?.max || 0}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-gray-500 dark:text-gray-400">Phone Credits</span><span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPlan.features?.phoneCredits?.max || 0}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-gray-500 dark:text-gray-400">Verification</span><span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPlan.features?.verificationCredits?.max || 0}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-gray-500 dark:text-gray-400">Export</span><span className="font-semibold text-gray-900 dark:text-gray-100">{selectedPlan.features?.exportCredits?.max || 0}</span></div>
                  </div>
                </div>

                {/* Assigned Users */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
                    <RiUserAddLine className="text-gray-400 dark:text-gray-500" />
                    <h2 className="font-semibold text-gray-700 dark:text-gray-300">Assigned Users</h2>
                  </div>

                  {/* Search */}
                  <div ref={searchContainerRef}>
                    <div className="relative mb-5">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onFocus={() => {
                          setIsSearchFocused(true);
                          if (!userSearchQuery.trim()) fetchAvailableUsers();
                        }}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 focus:border-transparent"
                      />
                      <div className="absolute right-3 top-2.5">
                        {searchingUsers ? (
                          <div className="w-4 h-4 border rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Search Results */}
                    {userSearchQuery.trim() && searchResults.length > 0 && (
                      <div className="mb-5 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                          Search Results
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                          {searchResults.map((user) => (
                            <div key={user._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => confirmAssignUser(user)}
                                className="ml-3 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-md transition-colors shrink-0"
                              >
                                Assign
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {userSearchQuery.trim() && searchResults.length === 0 && !searchingUsers && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">No matching users found.</p>
                    )}

                    {/* Available Users (when search is focused but empty) */}
                    {isSearchFocused && !userSearchQuery.trim() && (
                      <div className="mb-5">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                          Available Users
                        </h3>
                        {users.filter((u) => !(selectedPlan?.assigned || []).includes(u.email)).length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No users available.</p>
                        ) : (
                          <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-50 dark:divide-gray-700">
                            {users
                              .filter((u) => !(selectedPlan?.assigned || []).includes(u.email))
                              .map((user) => (
                                <div key={user._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => confirmAssignUser(user)}
                                    className="ml-3 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-md transition-colors shrink-0"
                                  >
                                    Assign
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assigned List */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                      Currently Assigned
                    </h3>
                    {(selectedPlan?.assigned || []).length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">No users assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(selectedPlan?.assigned || []).map((email) => {
                          const user = users.find((u) => u.email === email);
                          return (
                            <div
                              key={email}
                              className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-sm"
                              title={user ? `${user.firstName} ${user.lastName}` : email}
                            >
                              <span className="text-sky-700 dark:text-sky-300 font-medium text-xs truncate max-w-[180px]">
                                {email}
                              </span>
                              <button
                                type="button"
                                onClick={() => confirmRemoveUser(email)}
                                className="p-0.5 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-600 dark:text-sky-400 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-custom-plan/${selectedPlan._id}`, { state: { plan: selectedPlan } }); }} className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition-shadow shadow-md">Update Plan Details</button>
                  <button onClick={(e) => { handleDelete(e, selectedPlan._id); setSelectedPlan(null); }} className="px-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminComponent>
  );
}
