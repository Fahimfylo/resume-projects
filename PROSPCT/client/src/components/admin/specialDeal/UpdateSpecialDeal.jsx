import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiInformationLine,
  RiMoneyDollarCircleLine,
  RiCoinLine,
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

function parseDiscount(str) {
  const pct = parseFloat(str?.replace(/[^0-9.]/g, ""));
  return isNaN(pct) ? null : pct;
}

function calcOriginalFromPrice(price, discountStr) {
  const pct = parseDiscount(discountStr);
  if (pct !== null && pct > 0 && pct < 100 && price > 0) {
    return Math.round(price / (1 - pct / 100));
  }
  return null;
}

function calcPriceFromOriginal(original, discountStr) {
  const pct = parseDiscount(discountStr);
  if (pct !== null && pct > 0 && pct < 100 && original > 0) {
    return Math.round(original * (1 - pct / 100));
  }
  return null;
}

const defaultForm = {
  _id: "",
  code: "",
  description: "",
  codes: 1,
  discount: "",
  priceUSD: 0,
  originalPriceUSD: 0,
  priceBDT: 0,
  emailCredits: 0,
  phoneCredits: 0,
  verificationCredits: 0,
  exportCredits: 0,
  emailSeats: 0,
  isActive: true,
  maxRedeems: 1,
  expiresAt: "",
  timesRedeemed: 0,
};

export default function UpdateSpecialDeal() {
  const location = useLocation();
  const navigate = useNavigate();
  const deal = location.state?.deal || {};
  const { dealId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(defaultForm);

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
        if (dealId) {
          const response = await axios.get(`${BASE_URL}/api/special-deals/${dealId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = response.data.deal;
          setFormData({
            _id: d._id || "",
            code: d.code || "",
            description: d.description || "",
            codes: d.codes || 1,
            discount: (d.discount || "").replace(/[^0-9.]/g, ""),
            priceUSD: d.priceUSD || 0,
            originalPriceUSD: d.originalPriceUSD || 0,
            priceBDT: d.priceBDT || 0,
            emailCredits: d.emailCredits || 0,
            phoneCredits: d.phoneCredits || 0,
            verificationCredits: d.verificationCredits || 0,
            exportCredits: d.exportCredits || 0,
            emailSeats: d.emailSeats || 0,
            isActive: d.isActive !== undefined ? d.isActive : true,
            maxRedeems: d.maxRedeems || 1,
            expiresAt: d.expiresAt || "",
            timesRedeemed: d.timesRedeemed || 0,
          });
        }
      } catch (err) {
        // console.error("Error fetching deal data:", err);
        setError("Failed to load deal data.");
        toast.error("Failed to load deal data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dealId]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const raw = type === "number" ? Number(value) : value;
      const cleaned = name === "discount" ? raw.replace(/[^0-9.]/g, "") : raw;
      const updated = { ...prev, [name]: cleaned };
      if (name === "discount") {
        if (updated.priceUSD > 0) {
          const calc = calcOriginalFromPrice(updated.priceUSD, cleaned);
          if (calc !== null) updated.originalPriceUSD = calc;
        } else if (updated.originalPriceUSD > 0) {
          const calc = calcPriceFromOriginal(updated.originalPriceUSD, cleaned);
          if (calc !== null) updated.priceUSD = calc;
        }
      } else if (name === "priceUSD" && updated.discount) {
        const calc = calcOriginalFromPrice(cleaned, updated.discount);
        if (calc !== null) updated.originalPriceUSD = calc;
      } else if (name === "originalPriceUSD" && updated.discount) {
        const calc = calcPriceFromOriginal(cleaned, updated.discount);
        if (calc !== null) updated.priceUSD = calc;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    if (!formData.code) {
      toast.error("Redeem code is required.");
      setSubmitting(false);
      return;
    }

    try {
      if (dealId) {
        await axios.put(
          `${BASE_URL}/api/special-deals/update/${formData._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Special deal updated successfully!");
      }
      setTimeout(() => navigate("/admin/special-deals"), 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Error saving special deal.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
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
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading data...</p>
          </div>
        </div>
      </AdminComponent>
    );
  }

  return (
    <AdminComponent>
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2"
            >
              <RiArrowLeftLine /> Back to Special Deals
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> Update Special Deal
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiInformationLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Redeem Code & Package</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InputWrapper label="Redeem Code">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., DEAL5000"
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all uppercase tracking-wider"
                />
              </InputWrapper>

              <InputWrapper label="Description (optional)">
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., VIP Launch Promotion"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Package Size (Codes)">
                <input
                  type="number"
                  name="codes"
                  value={formData.codes}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiMoneyDollarCircleLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Pricing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <InputWrapper label="Discount (%)">
                <input
                  type="text"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  placeholder="e.g., 97"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Price (USD)">
                <input
                  type="number"
                  name="priceUSD"
                  value={formData.priceUSD}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Original Price (USD)">
                <input
                  type="number"
                  name="originalPriceUSD"
                  value={formData.originalPriceUSD}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Price (BDT)">
                <input
                  type="number"
                  name="priceBDT"
                  value={formData.priceBDT}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiCoinLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Credits Granted on Redeem</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <InputWrapper label="Contact Credits">
                <input
                  type="number"
                  name="emailCredits"
                  value={formData.emailCredits}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Phone Credits">
                <input
                  type="number"
                  name="phoneCredits"
                  value={formData.phoneCredits}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Verification Credits">
                <input
                  type="number"
                  name="verificationCredits"
                  value={formData.verificationCredits}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Export Credits">
                <input
                  type="number"
                  name="exportCredits"
                  value={formData.exportCredits}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Email Seats">
                <input
                  type="number"
                  name="emailSeats"
                  value={formData.emailSeats}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Max Redeems (0 = unlimited)">
                <input
                  type="number"
                  name="maxRedeems"
                  value={formData.maxRedeems}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Expires At (optional)">
                <input
                  type="date"
                  name="expiresAt"
                  value={formData.expiresAt ? formData.expiresAt.split("T")[0] || "" : ""}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Times Redeemed (Read-only)">
                <input
                  type="number"
                  name="timesRedeemed"
                  value={formData.timesRedeemed}
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
                  {formData.isActive ? "Active" : "Inactive"}
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
                  <span>Updating...</span>
                </>
              ) : (
                "Update Deal"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
