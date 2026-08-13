import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { RiSearchLine, RiArrowLeftLine } from "react-icons/ri";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function VoucherRequests() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchVouchers = useCallback(async (page = 1) => {
    setLoading(true);
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      setError("Session expired. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${BASE_URL}/admin/special-deals/requests`, {
        params: { page, limit: 20 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setVouchers(response.data.vouchers || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setError("");
    } catch (err) {
      // console.error("Error fetching voucher requests:", err);
      setError("Failed to load voucher requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers(currentPage);
  }, [currentPage, fetchVouchers]);

  const filteredVouchers = vouchers.filter((v) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      v.voucherCode?.toLowerCase().includes(q) ||
      v.invoiceNumber?.toLowerCase().includes(q) ||
      v.payload?.buyer?.email?.toLowerCase().includes(q) ||
      v.payload?.buyer?.name?.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <AdminComponent>
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading voucher requests...</p>
          </div>
        </div>
      </AdminComponent>
    );
  }

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2">
              <RiArrowLeftLine /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Voucher Generation Requests</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Incoming voucher requests — {totalCount} total</p>
          </div>

          {totalCount > 0 && (
            <div className="relative group">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" size={18} />
              <input
                type="text"
                placeholder="Search code, invoice, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-sm"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {filteredVouchers.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Voucher Code</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Invoice</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Buyer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Created</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {filteredVouchers.map((v) => {
                    const buyerEmail = v.payload?.buyer?.email;
                    const buyerName = v.payload?.buyer?.name;
                    const planName = v.payload?.plan?.name || v.payload?.plan?.description;
                    const source = v.payload?.source;

                    return (
                      <tr key={v._id} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                          {v.voucherCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {v.invoiceNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {buyerName && <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{buyerName}</p>}
                            {buyerEmail && <p className="text-xs text-gray-500">{buyerEmail}</p>}
                            {!buyerName && !buyerEmail && <span className="text-xs text-gray-400 italic">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {planName || <span className="text-xs italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(v._id)}
                            className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-medium"
                          >
                            {expandedId === v._id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {expandedId && (
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Full Payload</p>
                  <pre className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto text-xs leading-relaxed max-h-96 overflow-y-auto">
                    {JSON.stringify(
                      vouchers.find((v) => v._id === expandedId)?.payload || {},
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}

            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between border-t dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackPrevFilled size={12} /></button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-30"><TbPlayerTrackNextFilled size={12} /></button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={RiSearchLine}
            title={searchTerm ? "No matching voucher requests" : "No Voucher Requests Yet"}
            subtitle={searchTerm ? "Try a different search term." : "Voucher generation requests will appear here once received."}
            iconColor="text-orange-300"
            size="sm"
          />
        )}
      </div>
    </AdminComponent>
  );
}
