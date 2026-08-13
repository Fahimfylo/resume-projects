import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiInformationLine,
  RiPriceTag3Line,
} from "react-icons/ri";
import AdminComponent from "../AdminComponent";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const InputWrapper = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

export default function AddOrUpdateCoupon() {
  const location = useLocation();
  const navigate = useNavigate();
  const coupon = location.state?.coupon || {};
  const { couponId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    _id: "",
    code: "",
    discountPercentage: 0,
    isActive: true,
    validUntil: "",
    usageLimit: 0,
    timesUsed: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("adminAccessToken");
      if (!token) {
        setError("Session expired. Please log in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        if (couponId) {
          const response = await axios.get(`${BASE_URL}/api/coupons/${couponId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const couponData = response.data.coupon;
          setFormData({
            _id: couponData._id || "",
            code: couponData.code || "",
            discountPercentage: couponData.discountPercentage || 0,
            isActive: couponData.isActive !== undefined ? couponData.isActive : true,
            validUntil: couponData.validUntil || "",
            usageLimit: couponData.usageLimit || 0,
            timesUsed: couponData.timesUsed || 0,
          });
        }
      } catch (err) {
        // console.error("Error fetching coupon data:", err);
        setError("Failed to load coupon data.");
        toast.error("Failed to load coupon data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [couponId]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    if (!formData.code || !formData.discountPercentage) {
      toast.error("Coupon code and discount percentage are required.");
      setSubmitting(false);
      return;
    }

    try {
      if (couponId) {
        await axios.put(
          `${BASE_URL}/api/coupons/update/${formData._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Coupon updated successfully!");
      } else {
        await axios.post(
          `${BASE_URL}/api/coupons`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Coupon added successfully!");
      }
      setTimeout(() => navigate("/admin/coupons"), 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Error saving coupon.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };


  if (loading) {
    return (
      <AdminComponent>
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading data...</p>
          </div>
        </div>
      </AdminComponent>
    );
  }

  return (
    <AdminComponent>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2"
            >
              <RiArrowLeftLine /> Back to Coupons
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> {couponId ? "Update Coupon" : "Create New Coupon"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coupon Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiInformationLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Coupon Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Coupon Code">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SAVE20"
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all uppercase tracking-wider"
                />
              </InputWrapper>

              <InputWrapper label="Valid Until">
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil.split("T")[0] || ""}
                  onChange={handleInputChange}
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Discount Percentage (%)">
                <input
                  type="number"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max="100"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Usage Limit">
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  placeholder="0 for unlimited"
                  min="0"
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Times Used (Read-only)">
                <input
                  type="number"
                  name="timesUsed"
                  value={formData.timesUsed}
                  disabled
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </InputWrapper>

              <InputWrapper label="Status">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, isActive: !p.isActive }))
                  }
                  className={`py-2 px-4 rounded-lg font-medium border transition-all w-full text-left ${
                    formData.isActive
                      ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
                      : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  }`}
                >
                  {formData.isActive ? "🟢 Active" : "🔴 Inactive"}
                </button>
              </InputWrapper>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-2.5 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 transition-shadow shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-sky-200 rounded-full animate-spin"></div>
                  <span>{couponId ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                couponId ? "Update Coupon" : "Create Coupon"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
