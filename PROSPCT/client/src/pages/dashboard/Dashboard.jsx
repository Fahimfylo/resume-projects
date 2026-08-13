import { Plus, ClipboardList, ChevronRight, Trash2, Gift } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import useStore from "../../store/store";
import { Link, useNavigate } from "react-router-dom";
import Usage from "../../components/common/header/Usage";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import { toast } from "react-toastify";
import { deleteList } from "../../api/mutation";
import RecentSearches from "../../components/search/RecentSearches";
import SavedSearches from "../../components/search/SavedSearchers";
import Integrations from "../../components/common/Integrations";
const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };
  const {
    user,
    refreshUser,
    setFilters,
    resetFilters,
    lastSavedUpdate,
    lastListUpdate,
    setLastListUpdate,
  } = useStore();
  const navigate = useNavigate();
  const [recentSearchesAll, setRecentSearchesAll] = useState([]);
  const [savedSearchesAll, setSavedSearchesAll] = useState([]);
  const [lists, setLists] = useState([]);
  const [activeTab, setActiveTab] = useState("recent");

  // Team state
  const [teams, setTeams] = useState([]);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [pendingVouchers, setPendingVouchers] = useState([]);

  const emailCredits = user?.credits?.emailCredits || { current: 0, max: 0 };
  const phoneCredits = user?.credits?.phoneCredits || { current: 0, max: 0 };
  const exportCredits = user?.credits?.exportCredits || { current: 0, max: 0 };
  const verificationCredits = user?.credits?.verificationCredits || { current: 0, max: 0 };

  const fetchRecentAndSavedSearches = async () => {
    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const recentRes = await axios.get(
        `${API_CONFIG.API_ENDPOINT}/api/recent-searches`,
        { headers },
      );
      const savedRes = await axios.get(
        `${API_CONFIG.API_ENDPOINT}/api/saved-searches`,
        { headers },
      );

      setRecentSearchesAll(recentRes.data);
      setSavedSearchesAll(savedRes.data);
    } catch (err) {
      // console.error("Failed to fetch searches:", err);
      throw err; // Re-throw to handle in consolidated error handler
    }
  };

  const fetchLists = async () => {
    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_CONFIG.API_ENDPOINT}/api/list`, {
        headers,
      });
      setLists(res.data || []);
    } catch (err) {
      // console.error("Failed to fetch lists:", err);
      throw err; // Re-throw to handle in consolidated error handler
    }
  };

  const fetchPendingVouchers = async () => {
    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_CONFIG.API_ENDPOINT}/api/vouchers/my-pending`, { headers });
      setPendingVouchers(res.data?.vouchers || []);
    } catch {
      // Silently fail — this is non-critical UI enhancement
    }
  };

  const confirmDelete = async (message) => {
    return new Promise((resolve) => {
      const toastId = toast(
        ({ closeToast }) => (
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div className="text-sm text-gray-700">{message}</div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ),
        {
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          pauseOnHover: true,
          className: "max-w-md",
        },
      );

      // Fallback in case the toast never renders or is dismissed externally
      setTimeout(() => {
        toast.dismiss(toastId);
        resolve(false);
      }, 10000);
    });
  };

  const handleDeleteList = (listId) => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete this list?
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
              try {
                await deleteList(listId);
                toast.success("List deleted");
                // Refresh contacts list since contacts may have been deleted
                queryClient.removeQueries({ queryKey: ["savedContacts"] });
                queryClient.refetchQueries({ queryKey: ["savedContacts"] });
                localStorage.removeItem("savedContactsCache");
                setLastListUpdate(Date.now());
                await fetchLists();
              } catch (err) {
                // console.error("Failed to delete list:", err);

                const message =
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  err.message ||
                  "Unable to delete list";

                toast.error(message);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  const handleOpenList = (listName) => {
    // Clear any other filters and apply the selected list as a filter
    if (resetFilters) resetFilters();
    setFilters("list", listName);

    // Redirect to the lists page (matches the "View all lists" link behavior)
    navigate("/lists");
  };

  const fetchTeams = async () => {
    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const teamsRes = await axios.get(`${API_CONFIG.API_ENDPOINT}/api/team`, {
        headers,
      });

      setTeams(teamsRes.data || []);
    } catch (err) {
      // console.error("Failed to fetch teams:", err);
      throw err; // Re-throw to handle in consolidated error handler
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await Promise.all([
          refreshUser(),
          fetchRecentAndSavedSearches(),
          fetchTeams(),
          fetchLists(),
          fetchPendingVouchers(),
        ]);
      } catch (err) {
        // console.error("Failed to load dashboard data:", err);
        // Show a single consolidated toast instead of multiple toasts
        toast.error("Failed to load dashboard data. Please refresh the page.");
      }
    };

    loadDashboardData();
  }, [lastSavedUpdate, lastListUpdate]); // Re-fetch when saved searches or lists change

  // Fetch fresh user data on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Poll for credit updates every 15s as a reliable fallback
  useEffect(() => {
    const interval = setInterval(refreshUser, 15000);
    return () => clearInterval(interval);
  }, []);

  // Refresh when the window regains focus
  useEffect(() => {
    const onFocus = () => refreshUser();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleInviteMember = () => {
    navigate("/settings/teams");
  };

  const handleDeleteMember = async (teamId, email) => {
    if (!teamId || !email) return;

    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }

    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(
        `${API_CONFIG.API_ENDPOINT}/api/team/member/${teamId}/${encodeURIComponent(email)}`,
        { headers }
      );

      toast.success("Team member removed successfully");
      fetchTeams();
    } catch (err) {
      // console.error("Failed to remove team member:", err);
      toast.error(err.response?.data?.error || "Failed to remove team member");
    }
  };

  const displayedRecent = recentSearchesAll.slice(0, 3);
  const displayedSaved = savedSearchesAll.slice(0, 3);

  const currentTeam = teams[0] || null;
  const teamMembers = currentTeam?.members || [];
  const displayedMembers = teamMembers.slice(0, 3);

  const showViewAll =
    activeTab === "recent"
      ? recentSearchesAll.length >= 3
      : savedSearchesAll.length >= 3;

  const showViewAllMembers = teamMembers.length > 3;

  const getMemberInitials = (member) => {
    const first = member?.firstName?.[0] || "";
    const last = member?.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  return (
    <MainLayout>
      <section id="dashboard-section" className="bg-gray-100">
        <div className="block px-2 py-8 mx-auto">
          <div className="flex flex-col gap-4">
            <div className="block gap-4 md:flex md:flex-wrap md:justify-center lg:flex lg:justify-center lg:flex-wrap xl:flex xl:justify-center">
              {/* User Info Card */}
              <div className="w-full md:w-[48%] lg:w-[49%] xl:w-[305px] bg-white border border-gray-300 rounded-md p-6 flex flex-col md:mb-0 lg:mb-0 xl:mb-4 mb-4">
                <div className="flex items-center pb-5 mb-5 border-b border-gray-300">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture.startsWith("http") ? user.profilePicture : API_CONFIG.API_ENDPOINT + user.profilePicture}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <img
                      src="/logo/Profile-Icon-2.jpg"
                      alt=""
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-semibold text-gray-400">
                      Welcome
                    </div>
                    <div className="text-lg font-semibold text-gray-700">
                      {user ? user?.firstName + " " + user?.lastName : ""}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between mb-3 text-xs text-gray-400">
                    <span>Current plan</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {user?.redeemedDeal || user?.plan?.name}
                    </span>
                  </div>
                  <div className="flex justify-between mb-3 text-xs text-gray-400">
                    <span>Email credits</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {Math.max(0, emailCredits.max - emailCredits.current)}
                      <span className="text-xs font-semibold text-gray-400">
                        {" "}
                        / {emailCredits.max}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between mb-3 text-xs text-gray-400">
                    <span>Phone credits</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {Math.max(0, phoneCredits.max - phoneCredits.current)}
                      <span className="text-xs font-semibold text-gray-400">
                        {" "}
                        / {phoneCredits.max}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between mb-3 text-xs text-gray-400">
                    <span>Export credits</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {Math.max(0, exportCredits.max - exportCredits.current)}
                      <span className="text-xs font-semibold text-gray-400">
                        {" "}
                        / {exportCredits.max}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between mb-3 text-xs text-gray-400">
                    <span>Verification credits</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {Math.max(0, verificationCredits.max - verificationCredits.current)}
                      <span className="text-xs font-semibold text-gray-400">
                        {" "}
                        / {verificationCredits.max}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between mb-2 text-xs text-gray-400">
                    <span>Next renewal</span>
                    <span className="text-xs font-semibold text-gray-700">
                      Not applicable
                    </span>
                  </div>
                  <Link
                    to="/plans-and-billings"
                    className="flex items-center justify-center w-full h-8 text-sm text-center text-white transition duration-300 ease-in-out bg-blue-500 border border-transparent rounded-sm hover:bg-blue-400"
                  >
                    See plans
                  </Link>
                  {pendingVouchers.length > 0 && (
                    <Link
                      to={`/redeem?token=${pendingVouchers[0].redeemToken}`}
                      className="flex items-center justify-center gap-1 w-full mt-2 h-8 text-sm text-center text-white transition duration-300 ease-in-out bg-green-500 border border-transparent rounded-sm hover:bg-green-400"
                    >
                      <Gift size={14} />
                      Redeem Code{pendingVouchers.length > 1 ? `s (${pendingVouchers.length})` : ""}
                    </Link>
                  )}
                </div>
              </div>

              {/* Lists Card */}
              <div className="w-full md:w-[48%] lg:w-[49%] xl:w-[305px] xl:order-2 bg-white border border-gray-300 rounded-md p-6 flex flex-col md:mb-0 lg:mb-0 xl:mb-4 mb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium text-gray-700">Lists</h2>

                  <Link
                    to="/lists"
                    className={`text-sm hover:underline ${lists.length === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600"
                      }`}
                    onClick={(e) => {
                      if (lists.length === 0) {
                        e.preventDefault();
                      }
                    }}
                  >
                    View all lists ({lists.length})
                  </Link>
                </div>

                {/* Lists */}
                <ul className="space-y-2">
                  {lists.length === 0 ? (
                    <li className="flex items-center justify-between px-1 py-2 border-b border-gray-200 text-sm text-gray-400">
                      No lists created yet
                    </li>
                  ) : (
                    lists.slice(0, 5).map((list) => (
                      <li
                        key={list._id}
                        onClick={() => handleOpenList(list.name)}
                        className="flex items-center justify-between px-1 py-2 border-b border-gray-200 cursor-pointer group hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <ClipboardList
                            size={18}
                            className="mr-2 text-gray-400"
                          />
                          <span className="text-sm group-hover:text-blue-400">
                            {list.name}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list._id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Recent + Saved Searches Card */}
              <div className="w-full md:w-[98%] lg:w-[99%] xl:w-[610px] bg-white border border-gray-300 rounded-md p-6 flex flex-col mb-4 min-h-[250px]">
                <div className="flex justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <span
                      className={`pb-2 text-lg font-medium cursor-pointer ${activeTab === "recent"
                          ? "text-gray-600 border-b-2 border-b-blue-400"
                          : "text-gray-400 hover:text-gray-600"
                        }`}
                      onClick={() => setActiveTab("recent")}
                    >
                      Recent search
                    </span>
                    <span
                      className={`pb-2 text-lg font-medium cursor-pointer ${activeTab === "saved"
                          ? "text-gray-600 border-b-2 border-b-blue-400"
                          : "text-gray-400 hover:text-gray-600"
                        }`}
                      onClick={() => setActiveTab("saved")}
                    >
                      Saved search
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    {showViewAll ? (
                      <Link
                        to={
                          activeTab === "recent"
                            ? "/recent-searches"
                            : "/saved-searches"
                        }
                        className="mr-2 hover:underline flex items-center"
                      >
                        View all <ChevronRight size={18} className="ml-1" />
                      </Link>
                    ) : (
                      <span className="mr-2 cursor-not-allowed opacity-50 flex items-center">
                        View all <ChevronRight size={18} className="ml-1" />
                      </span>
                    )}
                  </div>
                </div>
                {activeTab === "recent" ? (
                  displayedRecent.length > 0 ? (
                    <RecentSearches
                      searches={displayedRecent}
                      onDelete={async (id) => {
                        setRecentSearchesAll((prev) =>
                          prev.filter((s) => s._id !== id),
                        );
                        await fetchRecentAndSavedSearches(); // Refresh data after deletion
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[150px] text-gray-400">
                      No recent searches yet
                    </div>
                  )
                ) : displayedSaved.length > 0 ? (
                  <SavedSearches
                    searches={displayedSaved}
                    onDelete={async (id) => {
                      setSavedSearchesAll((prev) =>
                        prev.filter((s) => s._id !== id),
                      );
                      await fetchRecentAndSavedSearches(); // Refresh data after deletion
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-gray-400">
                    No saved searches yet
                  </div>
                )}
              </div>
            </div>

            {/* Usage + Suggested / Team / Integrations Section */}
            <div className="block gap-4 md:flex md:flex-wrap md:justify-center lg:flex lg:justify-center lg:flex-wrap xl:flex xl:justify-center">
              <div className="md:ml-2 lg:ml-0 xl:w-[925px] xl:order-4 bg-white border border-gray-300 rounded-md p-6 lg:mb-0 md:mb-4 mb-4 md:w-[98%] lg:w-[99%]">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between">
                    <div className="pb-2 mr-4 text-lg font-medium text-gray-600">
                      Usage
                    </div>
                    <div className="flex flex-col xl:flex-row items-start gap-4">
                      <input
                        type="date"
                        value={selectedDate.toISOString().split("T")[0]}
                        onChange={handleDateChange}
                        max={new Date().toISOString().split("T")[0]}
                        className="px-2 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-sm cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                  <div className="w-full mt-8">
                    <Usage
                      selectedDate={selectedDate}
                      planName={user?.plan?.name}
                      emailCredits={emailCredits}
                      phoneCredits={phoneCredits}
                      exportCredits={exportCredits}
                      verificationCredits={verificationCredits}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full md:flex md:flex-wrap md:justify-center lg:flex lg:justify-center lg:flex-wrap xl:flex-col xl:w-[305px] xl:flex-wrap gap-4">
                {/* Suggested */}
                <div className="w-full md:flex md:w-[48%] lg:flex lg:w-[49%] xl:w-[305px] bg-white border border-gray-300 rounded-md p-6 flex flex-col mb-4 md:mb-0 lg:mb-0">
                  <div className="mb-4 text-lg font-medium text-gray-700">
                    Suggested for you
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between px-1 py-2 cursor-pointer group hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <img
                          src="/images/google-sheet.png"
                          alt="image"
                          className="w-8 h-8"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-400">
                            Add google sheets add on
                          </div>
                          <div className="text-xs text-gray-600">
                            work faster with g-sheets
                          </div>
                        </div>
                      </div>
                      <Plus
                        size={18}
                        className="text-gray-500 group-hover:text-blue-400"
                      />
                    </li>
                  </ul>
                </div>

                {/* Team */}
                <div className="w-full md:flex md:w-[48%] lg:w-[49%] xl:w-[305px] bg-white border border-gray-300 rounded-md p-6 flex flex-col mb-4 md:mb-0 lg:mb-0">
                  <div className="mb-4 text-lg font-medium text-gray-700">
                    Team
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    {displayedMembers.length > 0 ? (
                      displayedMembers.map((member) => (
                        <div
                          key={member._id || member.email}
                          className="flex items-center justify-between px-2 py-2 border rounded-sm hover:bg-gray-50 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold text-white rounded-full bg-blue-500">
                              {getMemberInitials(member)}
                            </div>
                            <div className="text-sm">
                              <div className="font-medium text-gray-700">
                                {member.firstName || member.email}
                                {member.lastName ? ` ${member.lastName}` : ""}
                              </div>
                              <div className="text-xs text-gray-500">
                                {member.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500">
                              {member.status || "pending"}
                            </span>
                            <button
                              onClick={() => handleDeleteMember(currentTeam._id, member.email)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove member"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">
                        No team members yet. Invite someone to join.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleInviteMember}
                      className="w-32 py-1 text-sm text-center text-gray-700 border border-gray-300 rounded-sm cursor-pointer hover:text-blue-400 hover:border-blue-500"
                    >
                      {user?.teamRole && user.teamRole !== "owner" ? "See Members" : "Invite members"}
                    </button>
                    {showViewAllMembers && (
                      <button
                        onClick={() => setIsTeamModalOpen(true)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View all ({teamMembers.length})
                      </button>
                    )}
                  </div>
                </div>
                {/* Integrations */}
                <div>
                  <Integrations />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Members Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Team members
              </h2>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {teamMembers.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No team members yet. Invite someone to join.
                </div>
              ) : (
                <ul className="space-y-3">
                  {teamMembers.map((member) => (
                    <li
                      key={member._id || member.email}
                      className="flex items-center justify-between p-3 border rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold text-white rounded-full bg-blue-500">
                          {getMemberInitials(member)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {member.firstName || member.email}
                            {member.lastName ? ` ${member.lastName}` : ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-gray-500">
                          {member.status || "pending"}
                        </div>
                        <button
                          onClick={() => handleDeleteMember(currentTeam._id, member.email)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Dashboard;
