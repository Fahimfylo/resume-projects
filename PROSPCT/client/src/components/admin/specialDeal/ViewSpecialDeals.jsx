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

function formatDiscountLabel(d) {
  if (!d) return "";
  const num = d.replace(/[^0-9.]/g, "");
  return num ? `-${num}%` : d;
}

export default function ViewSpecialDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const fetchDealData = useCallback(async (page = 1, query = "", isSearch = false) => {
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
      const endpoint = query.trim()
        ? `${BASE_URL}/api/special-deals/search`
        : `${BASE_URL}/api/special-deals/`;
      const response = await axios.get(endpoint, {
        params: query.trim() ? { searchQuery: query, page, limit: 20 } : { page, limit: 20 },
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeals(response.data.deals || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setError("");
    } catch (err) {
      if (err?.response?.status === 404) {
        setDeals([]);
        setTotalCount(0);
        setTotalPages(1);
        setError("");
      } else {
        // console.error("Error fetching special deals:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "An error occurred while fetching special deals."
        );
      }
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        setCurrentPage(1);
        fetchDealData(1, searchTerm, true);
      } else if (currentPage === 1) {
        fetchDealData(1, "", false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, fetchDealData]);

  useEffect(() => {
    if (!searchTerm.trim() && currentPage > 1) {
      fetchDealData(currentPage, "", false);
    }
  }, [currentPage, searchTerm, fetchDealData]);

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
          Delete this special deal?
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
                await axios.delete(`${BASE_URL}/api/special-deals/delete/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Special deal deleted successfully!");
                setActiveId(null);
                fetchDealData(currentPage, searchTerm);
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
        {loading && !isSearching && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading special deals...</p>
            </div>
          </div>
        )}

        {!selectedDeal && deals.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Special Deals</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage special offer packages with redeem codes</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none relative group">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" size={18} />
              <input
                type="text"
                placeholder="Search codes..."
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
            <Link to="/admin/special-deals/add" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-none whitespace-nowrap">
              <RiAddLine size={18} /> Add Deal
            </Link>
          </div>
        </div>
        )}

        {!selectedDeal ? (
          deals.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Code</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Package</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Credits</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Redeemed</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {deals.map((deal) => (
                    <tr key={deal._id} onClick={() => setSelectedDeal(deal)} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{deal.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {deal.codes} {deal.codes === 1 ? "Code" : "Codes"}
                        {deal.discount && <span className="ml-2 text-xs font-semibold text-green-500">({formatDiscountLabel(deal.discount)})</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">${deal.priceUSD?.toLocaleString()}</div>
                        {deal.originalPriceUSD > deal.priceUSD && (
                          <div className="text-xs text-gray-400 line-through">${deal.originalPriceUSD?.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>{deal.emailCredits?.toLocaleString()} Contacts</div>
                        <div>{deal.verificationCredits?.toLocaleString()} Verifications</div>
                        {deal.emailSeats > 0 && <div className="text-xs text-sky-500">{deal.emailSeats} Email {deal.emailSeats === 1 ? "Seat" : "Seats"}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{deal.timesRedeemed}{deal.maxRedeems > 0 ? ` / ${deal.maxRedeems}` : ""}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          deal.isActive
                            ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}>
                          {deal.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveId(activeId === deal._id ? null : deal._id); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                          <HiDotsVertical className="text-gray-400 dark:text-gray-500" />
                        </button>
                        {activeId === deal._id && (
                          <div ref={dropdownRef} className="absolute right-6 top-10 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-30 py-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-special-deal/${deal._id}`, { state: { deal } }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/30">Update</button>
                            <button onClick={(e) => handleDelete(e, deal._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
              title="No Special Deals Found"
              subtitle="Create special offer packages with redeem codes to grant extra credits to your users."
              actionLabel="Add Deal"
              actionPath="/admin/special-deals/add"
              iconColor="text-orange-300"
              size="sm"
            />
          )
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedDeal(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium">
                <RiArrowLeftLine /> Back to Directory
              </button>
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Redeem Code</label>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{selectedDeal.code}</p>
                </div>
                {selectedDeal.description && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Description</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedDeal.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Package</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedDeal.codes} {selectedDeal.codes === 1 ? "Code" : "Codes"}
                    {selectedDeal.discount && <span className="ml-2 text-xs font-semibold text-green-500">({formatDiscountLabel(selectedDeal.discount)})</span>}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedDeal.isActive
                      ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}>
                    {selectedDeal.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Pricing (USD)</label>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${selectedDeal.priceUSD?.toLocaleString()}</p>
                  {selectedDeal.originalPriceUSD > selectedDeal.priceUSD && (
                    <p className="text-sm text-gray-400 line-through">${selectedDeal.originalPriceUSD?.toLocaleString()}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Pricing (BDT)</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">৳{selectedDeal.priceBDT?.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Expires</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedDeal.expiresAt ? new Date(selectedDeal.expiresAt).toLocaleDateString() : "Never"}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Credits Granted</label>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 space-y-1">
                    {selectedDeal.emailCredits > 0 && <p>• {selectedDeal.emailCredits?.toLocaleString()} Contacts</p>}
                    {selectedDeal.phoneCredits > 0 && <p>• {selectedDeal.phoneCredits?.toLocaleString()} Phone</p>}
                    {selectedDeal.verificationCredits > 0 && <p>• {selectedDeal.verificationCredits?.toLocaleString()} Verifications</p>}
                    {selectedDeal.exportCredits > 0 && <p>• {selectedDeal.exportCredits?.toLocaleString()} Export</p>}
                    {selectedDeal.emailSeats > 0 && <p>• {selectedDeal.emailSeats} Email {selectedDeal.emailSeats === 1 ? "Seat" : "Seats"}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Redeemed</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedDeal.timesRedeemed} / {selectedDeal.maxRedeems > 0 ? selectedDeal.maxRedeems : "Unlimited"}</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t dark:border-gray-700 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-special-deal/${selectedDeal._id}`, { state: { deal: selectedDeal } }); }} className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition-shadow shadow-md">Update Deal</button>
              <button onClick={(e) => { handleDelete(e, selectedDeal._id); setSelectedDeal(null); }} className="px-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">Delete</button>
            </div>
          </div>
        )}
      </div>
    </AdminComponent>
  );
}
