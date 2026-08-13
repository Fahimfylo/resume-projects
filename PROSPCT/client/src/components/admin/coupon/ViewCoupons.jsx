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

export default function ViewCoupons() {
  const [coupons, setcoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();
  const [selectedcoupon, setSelectedcoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const fetchcouponData = useCallback(async (page = 1, query = "", isSearch = false) => {
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
      const response = await axios.get(`${BASE_URL}/api/coupons/`, {
        params: { page, searchQuery: query },
        headers: { Authorization: `Bearer ${token}` },
      });

      setcoupons(response.data.coupons || []);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setError("");
    } catch (err) {
      // console.error("Error fetching coupon data:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "An error occurred while fetching coupon data."
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
        fetchcouponData(1, searchTerm, true);
      } else if (currentPage === 1) {
        fetchcouponData(1, "", false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentPage, fetchcouponData]);

  useEffect(() => {
    if (!searchTerm.trim() && currentPage > 1) {
      fetchcouponData(currentPage, "", false);
    }
  }, [currentPage, searchTerm, fetchcouponData]);

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
          Delete this coupon?
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
                await axios.delete(`${BASE_URL}/api/coupons/delete/${id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Coupon deleted successfully!");
                setActiveId(null);
                fetchcouponData(currentPage, searchTerm);
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
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading coupons...</p>
            </div>
          </div>
        )}

        {/* Header Area */}
        {!selectedcoupon && coupons.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Coupon Directory</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage all active and inactive coupon codes</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none relative group">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500" size={18} />
              <input
                type="text"
                placeholder="Search coupons..."
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
            <Link to="/admin/coupons/add" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-none whitespace-nowrap">
              <RiAddLine size={18} /> Add Coupon
            </Link>
          </div>
        </div>
        )}

        {!selectedcoupon ? (
          coupons.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Code</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Discount %</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Valid Until</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usage Limit</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Times Used</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} onClick={() => setSelectedcoupon(coupon)} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{coupon.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{coupon.discountPercentage}%</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(coupon.validUntil).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{coupon.usageLimit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{coupon.timesUsed}</td>
                      <td className="px-6 py-4 text-right relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveId(activeId === coupon._id ? null : coupon._id); }} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors">
                          <HiDotsVertical className="text-gray-400 dark:text-gray-500" />
                        </button>
                        {activeId === coupon._id && (
                          <div ref={dropdownRef} className="absolute right-6 top-10 w-32 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg z-30 py-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-coupon/${coupon._id}`, { state: { coupon } }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-sky-900/30">Update</button>
                            <button onClick={(e) => handleDelete(e, coupon._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
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
              title="No Coupons Found"
              subtitle="Start by creating your first coupon to offer discounts to your users."
              actionLabel="Add Coupon"
              actionPath="/admin/coupons/add"
              iconColor="text-orange-300"
              size="sm"
            />
          )
        ) : (
          /* Detailed Coupon View */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button onClick={() => setSelectedcoupon(null)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm font-medium">
                <RiArrowLeftLine /> Back to Directory
                           </button>
            </div>

            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Code</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedcoupon.code}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Discount</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedcoupon.discountPercentage}%</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Valid Until</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(selectedcoupon.validUntil).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Times Used</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedcoupon.timesUsed} / {selectedcoupon.usageLimit}</p>
                </div>
              </div>
            </div>

            <div className="p-8 border-t dark:border-gray-700 flex gap-4">
              <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/update-coupon/${selectedcoupon._id}`, { state: { coupon: selectedcoupon } }); }} className="flex-1 bg-sky-600 text-white py-2.5 rounded-lg font-semibold hover:bg-sky-700 transition-shadow shadow-md">Update Coupon</button>
              <button onClick={(e) => { handleDelete(e, selectedcoupon._id); setSelectedcoupon(null); }} className="px-6 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium">Delete</button>
            </div>
          </div>
        )}
      </div>
    </AdminComponent>
  );
}
