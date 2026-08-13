import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { RiSearchLine, RiAddLine, RiArrowLeftLine } from "react-icons/ri";
import { HiDotsVertical } from "react-icons/hi";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import AdminComponent from "../AdminComponent";
import EmptyState from "../EmptyState";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function ViewTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const fetchTransactionData = useCallback(async (page = 1, query = "", isSearch = false) => {
    if (isSearch) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    const token = Cookies.get("adminAccessToken");
    if (!token) {
      setError("Session expired. Please log in.");
      setLoading(false);
      setIsSearching(false);
      return;
    }

    try {
      // Consolidate endpoints based on whether we are searching
      let endpoint = `${BASE_URL}/api/transactions/`;
      const params = { page };

      if (query && query.trim()) {
        endpoint = `${BASE_URL}/api/transactions/find/search`;
        params.searchQuery = query.trim();
      }

      const response = await axios.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(response.data.transactions || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setError("");
    } catch (err) {
      // console.error("Error fetching transaction data:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "An error occurred while fetching transaction data."
      );
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        setCurrentPage(1);
        fetchTransactionData(1, searchTerm, true);
      } else if (currentPage === 1) {
        fetchTransactionData(1, "", false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, fetchTransactionData]);

  useEffect(() => {
    if (!searchTerm.trim() && currentPage > 1) {
      fetchTransactionData(currentPage, "", false);
    }
  }, [currentPage, searchTerm, fetchTransactionData]);

  const handleDeleteAll = () => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete all transactions?
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
                await axios.post(`${BASE_URL}/api/transactions/delete`, {}, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("All transactions deleted successfully!");
                fetchTransactionData(1, "");
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete this transaction?
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
                await axios.delete(`${BASE_URL}/api/transactions/delete/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Transaction deleted successfully!");
                setActiveId(null);
                fetchTransactionData(currentPage, searchTerm);
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
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading transactions...</p>
            </div>
          </div>
        )}

        {/* Header Area */}
        {!selectedTransaction && transactions.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Transactions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track all payment transactions and order history</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none relative group">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" size={18} />
              <input
                type="text"
                placeholder="Search transactions..."
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
            <Link to="/admin/transactions/add" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-none whitespace-nowrap">
              <RiAddLine size={18} /> Add Transaction
            </Link>
          </div>
        </div>
        )}

        {!selectedTransaction ? (
          transactions.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Gateway</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} onClick={() => setSelectedTransaction(transaction)} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.userId ? `${transaction.userId.firstName} ${transaction.userId.lastName}` : "Unknown User"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.status}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">${transaction.totalAmount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.paymentGateway.name}</td>
                      <td className="px-6 py-4 text-right relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveId(activeId === transaction._id ? null : transaction._id); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                          <HiDotsVertical className="text-gray-400 dark:text-gray-500" />
                        </button>
                        {activeId === transaction._id && (
                          <div ref={dropdownRef} className="absolute right-6 top-10 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-30 py-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-transaction/${transaction._id}`, { state: { transaction } }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/30">Update</button>
                            <button onClick={(e) => handleDelete(e, transaction._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
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
              icon={RiAddLine}
              title="No Transactions Found"
              subtitle="Transactions will appear here as users complete purchases or payments."
              actionLabel="Add Transaction"
              actionPath="/admin/transactions/add"
              iconColor="text-indigo-300"
              size="sm"
            />
          )
        ) : (
          /* Detailed Transaction View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedTransaction(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium">
                <RiArrowLeftLine /> Back to Transactions
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">User</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedTransaction.userId ? `${selectedTransaction.userId.firstName} ${selectedTransaction.userId.lastName}` : "Unknown User"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Type</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedTransaction.type}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Status</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedTransaction.status}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Total Amount</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">${selectedTransaction.totalAmount}</p>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-6">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-3">Items</label>
                <div className="space-y-4">
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      {item.plan ? (
                        <div className="space-y-2">
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plan:</span> <span className="text-sm text-gray-900 dark:text-gray-100">{item.plan.name}</span></p>
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Price:</span> <span className="text-sm text-gray-900 dark:text-gray-100">${item.plan.price}</span></p>
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cycle:</span> <span className="text-sm text-gray-900 dark:text-gray-100">{item.plan.billingCycle}</span></p>
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Qty:</span> <span className="text-sm text-gray-900 dark:text-gray-100">{item.quantity}</span></p>
                        </div>
                      ) : null}
                      {item.credit ? (
                        <div className="space-y-2">
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credit:</span> <span className="text-sm text-gray-900 dark:text-gray-100">{item.credit.name}</span></p>
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quantity:</span> <span className="text-sm text-gray-900 dark:text-gray-100">{item.credit.quantity}</span></p>
                          <p><span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Price:</span> <span className="text-sm text-gray-900 dark:text-gray-100">${item.credit.packagePrice}</span></p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-6">
                <p className="text-xs text-gray-500 dark:text-gray-400">Created: {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gateway: {selectedTransaction.paymentGateway.name}</p>
              </div>
            </div>

            <div className="p-8 border-t dark:border-gray-700 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-transaction/${selectedTransaction._id}`, { state: { transaction: selectedTransaction } }); }} className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition-shadow shadow-md">Update Transaction</button>
              <button onClick={(e) => { handleDelete(e, selectedTransaction._id); setSelectedTransaction(null); }} className="px-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">Delete</button>
            </div>
          </div>
        )}
      </div>
    </AdminComponent>
  );
}
