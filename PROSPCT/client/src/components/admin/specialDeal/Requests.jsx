import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { RiSearchLine, RiArrowLeftLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const TABS = [
  { key: "pending", label: "Pending Requests" },
  { key: "failed", label: "Failed Attempts" },
];

function PendingTable({ requests, searchTerm, currentPage, totalPages, totalCount, setCurrentPage, handleApprove, handleReject }) {
  const filtered = requests.filter((r) =>
    !searchTerm.trim() ||
    r.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={RiSearchLine}
        title={searchTerm ? "No matching requests" : "No Pending Requests"}
        subtitle={searchTerm ? "Try a different search term." : "All redemption requests have been processed."}
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
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Requested</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((r) => (
              <tr key={r._id} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">
                      {r.userId?.firstName?.[0]}{r.userId?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.userId?.firstName} {r.userId?.lastName}</p>
                      <p className="text-xs text-gray-500">{r.userId?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{r.code}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {r.credits?.emailCredits > 0 && <div>{r.credits.emailCredits.toLocaleString()} Contacts</div>}
                  {r.credits?.phoneCredits > 0 && <div>{r.credits.phoneCredits.toLocaleString()} Phone</div>}
                  {r.credits?.verificationCredits > 0 && <div>{r.credits.verificationCredits.toLocaleString()} Verifications</div>}
                  {r.credits?.exportCredits > 0 && <div>{r.credits.exportCredits.toLocaleString()} Export</div>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleApprove(r._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                      <RiCheckLine /> Approve
                    </button>
                    <button onClick={() => handleReject(r._id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <RiCloseLine /> Reject
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

function FailedTable({ logs, searchTerm, currentPage, totalPages, totalCount, setCurrentPage }) {
  const filtered = logs.filter((l) =>
    !searchTerm.trim() ||
    l.voucherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={RiSearchLine}
        title={searchTerm ? "No matching failures" : "No Failed Attempts"}
        subtitle={searchTerm ? "Try a different search term." : "Failed voucher redemption attempts will appear here."}
        iconColor="text-red-300"
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
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Email / IP</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Error</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Source</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Attempted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((l) => (
              <tr key={l._id} className="hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-colors">
                <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{l.voucherCode}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    {l.email && <p className="text-sm">{l.email}</p>}
                    {l.userId && <p className="text-xs text-gray-500">{l.userId?.firstName} {l.userId?.lastName}</p>}
                    <p className="text-xs text-gray-400 font-mono">{l.ip || "-"}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    {l.errorMessage || "Unknown error"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
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

export default function Requests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");

  const [requests, setRequests] = useState([]);
  const [failedLogs, setFailedLogs] = useState([]);
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
      if (activeTab === "pending") {
        const response = await axios.get(`${BASE_URL}/api/special-deals/requests/pending`, {
          params: { page, limit: 20 },
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(response.data.requests || []);
        setTotalCount(response.data.totalCount || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        const response = await axios.get(`${BASE_URL}/admin/special-deals/requests/redemption-logs`, {
          params: { page, limit: 20, status: "failed" },
          headers: { Authorization: `Bearer ${token}` },
        });
        setFailedLogs(response.data.logs || []);
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

  const handleApprove = async (id) => {
    const token = Cookies.get("adminAccessToken");
    try {
      await axios.post(`${BASE_URL}/api/special-deals/requests/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Request approved, credits granted.");
      fetchData(currentPage);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Approve failed.");
    }
  };

  const handleReject = async (id) => {
    const token = Cookies.get("adminAccessToken");
    try {
      await axios.post(`${BASE_URL}/api/special-deals/requests/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Request rejected.");
      fetchData(currentPage);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reject failed.");
    }
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Redemption Requests</h1>
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

        {activeTab === "pending" ? (
          <PendingTable
            requests={requests}
            searchTerm={searchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            setCurrentPage={setCurrentPage}
            handleApprove={handleApprove}
            handleReject={handleReject}
          />
        ) : (
          <FailedTable
            logs={failedLogs}
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
