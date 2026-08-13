import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { RiSearchLine, RiArrowLeftLine, RiDeleteBin6Line } from "react-icons/ri";
import { HiPause, HiPlay } from "react-icons/hi";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const TABS = [
  { key: "manual", label: "Manual Assignments" },
  { key: "voucher", label: "Voucher Redemptions" },
];

function ManualTable({ assignments, loading, searchTerm, currentPage, totalPages, totalCount, setCurrentPage, handleSuspend, handleUnsuspend, handleDelete }) {
  const filtered = assignments.filter((a) =>
    !searchTerm.trim() ||
    a.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={RiSearchLine}
        title={searchTerm ? "No matching assignments" : "No Assignments Yet"}
        subtitle={searchTerm ? "Try a different search term." : "Approved redemptions will appear here."}
        iconColor="text-orange-300"
        size="sm"
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Code</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credits</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Approved</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((a) => (
              <tr key={a._id} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">
                      {a.userId?.firstName?.[0]}{a.userId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.userId?.firstName} {a.userId?.lastName}</p>
                      <p className="text-xs text-gray-500">{a.userId?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{a.code}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {a.credits?.emailCredits > 0 && <div>{a.credits.emailCredits.toLocaleString()} Contacts</div>}
                  {a.credits?.phoneCredits > 0 && <div>{a.credits.phoneCredits.toLocaleString()} Phone</div>}
                  {a.credits?.verificationCredits > 0 && <div>{a.credits.verificationCredits.toLocaleString()} Verifications</div>}
                  {a.credits?.exportCredits > 0 && <div>{a.credits.exportCredits.toLocaleString()} Export</div>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{a.approvedAt ? new Date(a.approvedAt).toLocaleDateString() : "-"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    a.status === "approved"
                      ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  }`}>
                    {a.status === "approved" ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {a.status === "approved" ? (
                      <button onClick={() => handleSuspend(a._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors">
                        <HiPause /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => handleUnsuspend(a._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                        <HiPlay /> Unsuspend
                      </button>
                    )}
                    <button onClick={() => handleDelete(a._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <RiDeleteBin6Line /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-t dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackPrevFilled size={12} /></button>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackNextFilled size={12} /></button>
        </div>
      </div>
    </div>
  );
}

function VoucherTable({ logs, loading, searchTerm, currentPage, totalPages, totalCount, setCurrentPage }) {
  const filtered = logs.filter((l) =>
    !searchTerm.trim() ||
    l.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={RiSearchLine}
        title={searchTerm ? "No matching redemptions" : "No Voucher Redemptions Yet"}
        subtitle={searchTerm ? "Try a different search term." : "Voucher redemptions will appear here once users redeem codes."}
        iconColor="text-green-300"
        size="sm"
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Voucher Code</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credits Granted</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Source</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Redeemed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((l) => (
              <tr key={l._id} className="hover:bg-green-50/30 dark:hover:bg-green-900/20 transition-colors">
                <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{l.voucherCode}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 uppercase">
                      {l.userId?.firstName?.[0]}{l.userId?.lastName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {l.userId ? `${l.userId.firstName} ${l.userId.lastName}` : l.email || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500">{l.userId?.email || ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {l.credits?.emailCredits > 0 && <div>{l.credits.emailCredits.toLocaleString()} Contacts</div>}
                  {l.credits?.phoneCredits > 0 && <div>{l.credits.phoneCredits.toLocaleString()} Phone</div>}
                  {l.credits?.verificationCredits > 0 && <div>{l.credits.verificationCredits.toLocaleString()} Verifications</div>}
                  {l.credits?.exportCredits > 0 && <div>{l.credits.exportCredits.toLocaleString()} Export</div>}
                  {!l.credits?.emailCredits && !l.credits?.phoneCredits && !l.credits?.verificationCredits && !l.credits?.exportCredits && <span className="text-xs italic">-</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {l.source === "register-and-redeem" ? "Register" : "Redeem"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleDateString()} {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-t dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackPrevFilled size={12} /></button>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackNextFilled size={12} /></button>
        </div>
      </div>
    </div>
  );
}

export default function Assigned() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("manual");

  const [assignments, setAssignments] = useState([]);
  const [voucherLogs, setVoucherLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      setError("Session expired. Please log in.");
      setLoading(false);
      return;
    }
    try {
      if (activeTab === "manual") {
        const response = await axios.get(`${BASE_URL}/api/special-deals/assigned`, {
          params: { page, limit: 20 },
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignments(response.data.assignments || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        const response = await axios.get(`${BASE_URL}/admin/special-deals/requests/redemption-logs`, {
          params: { page, limit: 20, status: "success" },
          headers: { Authorization: `Bearer ${token}` },
        });
        setVoucherLogs(response.data.logs || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      }
      setError("");
    } catch (err) {
      // console.error("Error fetching data:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const handleSuspend = async (id) => {
    const token = Cookies.get("adminAccessToken");
    try {
      await axios.post(`${BASE_URL}/api/special-deals/assigned/suspend/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Assignment suspended.");
      fetchData(currentPage);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Suspend failed.");
    }
  };

  const handleUnsuspend = async (id) => {
    const token = Cookies.get("adminAccessToken");
    try {
      await axios.post(`${BASE_URL}/api/special-deals/assigned/unsuspend/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Assignment unsuspended.");
      fetchData(currentPage);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unsuspend failed.");
    }
  };

  const handleDelete = (id) => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">Delete this assignment?</p>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={() => toast.dismiss()} className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all">Cancel</button>
          <button onClick={async () => {
            toast.dismiss();
            const token = Cookies.get("adminAccessToken");
            try {
              await axios.delete(`${BASE_URL}/api/special-deals/assigned/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              toast.success("Assignment deleted.");
              fetchData(currentPage);
            } catch (err) {
              toast.error(err?.response?.data?.message || "Delete failed.");
            }
          }} className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-all active:scale-95">Confirm</button>
        </div>
      </div>,
      { autoClose: false, icon: false }
    );
  };

  if (loading) {
    return (
      <AdminComponent>
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
          </div>
        </div>
      </AdminComponent>
    );
  }

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2">
              <RiArrowLeftLine /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Assigned</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} total records</p>
          </div>
          {totalCount > 0 && (
            <div className="relative group">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-sm"
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {activeTab === "manual" ? (
          <ManualTable
            assignments={assignments}
            loading={loading}
            searchTerm={searchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            setCurrentPage={setCurrentPage}
            handleSuspend={handleSuspend}
            handleUnsuspend={handleUnsuspend}
            handleDelete={handleDelete}
          />
        ) : (
          <VoucherTable
            logs={voucherLogs}
            loading={loading}
            searchTerm={searchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </AdminComponent>
  );
}
