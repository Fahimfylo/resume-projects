import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const defaultForm = {
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
};

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

export default function AddSpecialDeal() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(defaultForm);
  const [plans, setPlans] = useState([]);
  const [loadPlansError, setLoadPlansError] = useState("");

  const fetchPlans = useCallback(async () => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/plans/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      });
      setPlans(res.data.plans || []);
      setLoadPlansError("");
    } catch {
      setLoadPlansError("Failed to load plans");
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => {
      const raw = type === "checkbox" ? checked : value;
      const cleaned = name === "discount" ? raw.replace(/[^0-9.]/g, "") : raw;
      const updated = { ...prevData, [name]: cleaned };
      if (name === "discount") {
        if (updated.priceUSD > 0) {
          const calc = calcOriginalFromPrice(updated.priceUSD, cleaned);
          if (calc !== null) updated.originalPriceUSD = calc;
        } else if (updated.originalPriceUSD > 0) {
          const calc = calcPriceFromOriginal(updated.originalPriceUSD, cleaned);
          if (calc !== null) updated.priceUSD = calc;
        }
      }
      return updated;
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const num = Number(value) || 0;
    setFormData((prevData) => {
      const updated = { ...prevData, [name]: num };
      if (name === "priceUSD" && updated.discount) {
        const calc = calcOriginalFromPrice(num, updated.discount);
        if (calc !== null) updated.originalPriceUSD = calc;
      } else if (name === "originalPriceUSD" && updated.discount) {
        const calc = calcPriceFromOriginal(num, updated.discount);
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
      await axios.post(
        `${BASE_URL}/api/special-deals/add`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Special deal created successfully!");
      setTimeout(() => navigate("/admin/special-deals"), 1500);
    } catch (error) {
      // console.error("Error adding special deal:", error);
      const errorMsg = error?.response?.data?.message || "Error adding special deal.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

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
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> Create New Special Deal
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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

            <div className="mb-5 p-4 bg-sky-50/50 dark:bg-sky-900/10 rounded-lg border border-sky-100 dark:border-sky-800/40">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1.5">
                Load from Plan
              </label>
              <select
                value=""
                onChange={(e) => {
                  const plan = plans.find((p) => p._id === e.target.value);
                  if (!plan) return;
                  setFormData((prev) => ({
                    ...prev,
                    emailCredits: plan.features?.emailCredits?.max ?? 0,
                    phoneCredits: plan.features?.phoneCredits?.max ?? 0,
                    verificationCredits: plan.features?.verificationCredits?.max ?? 0,
                    exportCredits: plan.features?.exportCredits?.max ?? 0,
                  }));
                  e.target.value = "";
                }}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-sm"
              >
                <option value="">— Select a plan to populate credits —</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} {plan.type !== "official" ? `(${plan.type})` : ""} — {plan.features?.emailCredits?.max?.toLocaleString() ?? 0}C / {plan.features?.phoneCredits?.max?.toLocaleString() ?? 0}P / {plan.features?.verificationCredits?.max?.toLocaleString() ?? 0}V / {plan.features?.exportCredits?.max?.toLocaleString() ?? 0}E
                  </option>
                ))}
              </select>
              {loadPlansError && (
                <p className="text-xs text-red-500 mt-1">{loadPlansError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <InputWrapper label="Contact Credits">
                <input
                  type="number"
                  name="emailCredits"
                  value={formData.emailCredits}
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
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
                  onChange={handleNumberChange}
                  placeholder="1"
                  min="0"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Expires At (optional)">
                <input
                  type="date"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
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
                  <span>Creating...</span>
                </>
              ) : (
                "Create Deal"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
