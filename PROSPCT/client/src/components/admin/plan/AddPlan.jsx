import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiPriceTag3Line,
  RiArrowLeftLine,
  RiInformationLine,
  RiMoneyDollarCircleLine,
  RiStackLine,
  RiSettings4Line,
  RiUserAddLine,
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

const resourceLimitOptions = [
  { label: "CSV Enrichment", key: "csvEnrichment" },
  { label: "Technology Filter", key: "technologyFilter" },
  { label: "Job Posting Filter", key: "jobPostingFilter" },
  { label: "Revenue Filter", key: "revenueFilter" },
  { label: "Funding Filter", key: "fundingFilter" },
  { label: "Basic Integrations", key: "basicIntegrations" },
  { label: "Job Change Filter", key: "jobChangeFilter" },
  { label: "Duplicate Control", key: "duplicateControl" },
  { label: "HubSpot Integration", key: "hubspotIntegration" },
  { label: "Salesforce Integration", key: "salesforceIntegration" },
  { label: "Job Change Tracking", key: "jobChangeTracking" },
];

export default function AddPlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planType = searchParams.get("type") || "official";
  const isCustom = planType === "custom";
  const assignedEmail = searchParams.get("assignedEmail");
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isCreatingCustom, setIsCreatingCustom] = useState(isCustom);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    pricing: {
      monthly: { price: 0, discount: 0 },
      yearly: { price: 0, discount: 0 },
    },
    features: {
      emailCredits: { max: 0 },
      phoneCredits: { max: 0 },
      verificationCredits: { max: 0 },
      exportCredits: { max: 0 },
      apiAccess: false,
      prioritySupport: false,
      limits: {
        csvEnrichment: false,
        technologyFilter: false,
        jobPostingFilter: false,
        revenueFilter: false,
        fundingFilter: false,
        basicIntegrations: false,
        jobChangeFilter: false,
        duplicateControl: false,
        hubspotIntegration: false,
        salesforceIntegration: false,
        jobChangeTracking: false,
      },
    },
    recommended: false,
    duration: "yearly",
    status: "active",
    type: planType,
    assigned: [],
    maxUsers: 1,
  });

  useEffect(() => {
    if (!isCustom || !assignedEmail) return;
    const fetchUsersAndMatch = async () => {
      const token = Cookies.get("adminAccessToken");
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allUsers = res.data?.users || res.data?.data || [];
        const matched = allUsers.find((u) => u.email === assignedEmail);
        if (matched) {
          setFormData((prev) => ({ ...prev, assigned: [assignedEmail] }));
        }
      } catch (err) {
        // console.error("Error fetching users for assignment match:", err);
      }
    };
    fetchUsersAndMatch();
  }, [isCustom, assignedEmail]);

  const fetchAvailableUsers = async () => {
    const token = Cookies.get("adminAccessToken");
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/users?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data?.users || res.data?.data || []);
    } catch (err) {
      // console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setUserSearchQuery("");
        setSearchResults([]);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    // Backend calculates final discounted price from base + discount
    const validatedData = {
      ...formData,
      maxUsers: formData.maxUsers || 1,
      pricing: {
        monthly: {
          price: +formData.pricing.monthly.price || 0,
          discount: +formData.pricing.monthly.discount || 0,
        },
        yearly: {
          price: +formData.pricing.yearly.price || 0,
          discount: +formData.pricing.yearly.discount || 0,
        },
      },
      type: isCreatingCustom ? "custom" : planType,
    };

    const endpoint = isCreatingCustom
      ? `${BASE_URL}/api/custom-plans/addPlan`
      : `${BASE_URL}/api/plans/addPlan`;

    try {
      await axios.post(endpoint, validatedData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      toast.success(
        isCreatingCustom
          ? "Custom plan created successfully!"
          : "Plan created successfully!",
      );
      setTimeout(
        () =>
          navigate(isCreatingCustom ? "/admin/custom-plans" : "/admin/plans"),
        1500,
      );
    } catch (error) {
      // console.error("Error adding plan:", error);
      if (error.code === "ECONNABORTED") {
        toast.error(
          "Request timeout. Please check your connection and try again.",
        );
      } else if (error.response) {
        toast.error(error.response.data.message || "Error adding plan.");
      } else if (error.request) {
        toast.error(
          "No response from server. Please check if the server is running.",
        );
      } else {
        toast.error(error.message || "Error adding plan.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prevData) => {
        let newData = { ...prevData };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        let val =
          type === "checkbox" ? checked : type === "number" ? +value : value;

        if (keys.includes("discount")) val = Math.min(Math.max(val, 0), 100);

        current[keys[keys.length - 1]] = val;

        // Auto-calculate yearly price when monthly price changes
        if (name === "pricing.monthly.price" && type === "number") {
          const monthlyPrice = +value || 0;
          newData.pricing.yearly.price = monthlyPrice * 12;
        }

        return newData;
      });
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          type === "checkbox" ? checked : type === "number" ? +value : value,
      }));
    }
  };

  const handleLimitToggle = (key) => {
    setFormData((prevData) => ({
      ...prevData,
      features: {
        ...prevData.features,
        limits: {
          ...prevData.features.limits,
          [key]: !prevData.features.limits[key],
        },
      },
    }));
  };

  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }
    setSearchingUsers(true);
    await new Promise((r) => setTimeout(r, 300));
    const token = Cookies.get("adminAccessToken");
    try {
      const res = await axios.get(`${BASE_URL}/api/users/search`, {
        params: { searchQuery: query.trim(), limit: 5 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = res.data?.users || res.data?.data || [];
      const filtered = allUsers.filter(
        (u) => !(formData.assigned || []).includes(u.email),
      );
      setSearchResults(filtered);
    } catch (err) {
      // console.error("Error searching users:", err);
    }
    setSearchingUsers(false);
  };

  const doAssignUser = (user) => {
    setFormData((prev) => ({
      ...prev,
      assigned: [...(prev.assigned || []), user.email],
    }));
    setSearchResults((prev) => prev.filter((u) => u._id !== user._id));
    setUsers((prev) => prev.filter((u) => u._id !== user._id));
    setUserSearchQuery("");
  };

  const assignUser = (user) => {
    if ((formData.assigned || []).length >= (formData.maxUsers || 1)) {
      toast.warning(
        "All seats are filled. Increase max users or remove an assigned user.",
      );
      return;
    }

    const existingPlan = user?.plan?.name;
    if (
      existingPlan &&
      !/^free\s*plan$/i.test(existingPlan) &&
      existingPlan.toLowerCase() !== "free"
    ) {
      const toastId = toast.info(
        <div className="p-1">
          <p className="text-md font-semibold text-white tracking-tight">
            {user.firstName} {user.lastName} is already assigned in (
            {existingPlan}). Do you want to assign this user to (
            {formData.name || "this plan"})?
          </p>
          <div className="flex gap-2 justify-end mt-5">
            <button
              onClick={() => toast.dismiss(toastId)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(toastId);
                doAssignUser(user);
              }}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>,
        { autoClose: false, icon: false },
      );
      return;
    }

    doAssignUser(user);
  };

  const removeAssignedUser = (email) => {
    const toastId = toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Remove assigned user?
        </p>
        <p className="text-sm text-gray-300 mt-1">{email}</p>
        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss(toastId)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(toastId);
              setFormData((prev) => ({
                ...prev,
                assigned: (prev.assigned || []).filter((e) => e !== email),
              }));
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

  const calculateDiscountedPrice = (basePrice, discount) => {
    const price = parseFloat(basePrice) || 0;
    const discountPercent = parseFloat(discount) || 0;
    return Math.round((price - (price * discountPercent) / 100) * 100) / 100;
  };

  return (
    <AdminComponent>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() =>
                navigate(
                  isCreatingCustom ? "/admin/custom-plans" : "/admin/plans",
                )
              }
              className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2"
            >
              <RiArrowLeftLine /> Back to{" "}
              {isCreatingCustom ? "Custom Plans" : "Plans"}
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiPriceTag3Line className="text-sky-500 dark:text-sky-400" />{" "}
              {isCreatingCustom ? "Create Custom Plan" : "Create New Plan"}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiInformationLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Basic Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <InputWrapper label="Plan Name">
                  {isCreatingCustom ? (
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter custom plan name"
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                    />
                  ) : (
                    <select
                      name="name"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        handleChange(e);
                        if (e.target.value === "Custom") {
                          setIsCreatingCustom(true);
                        }
                      }}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select a plan</option>
                      <option value="Free">Free</option>
                      <option value="Basic">Basic</option>
                      <option value="Professional">Professional</option>
                      <option value="Premium">Premium</option>
                      <option value="Custom">Custom</option>
                    </select>
                  )}
                </InputWrapper>
              </div>
            </div>
          </div>

          {/* Pricing Strategy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiMoneyDollarCircleLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Pricing Strategy
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Monthly Base ($)">
                  <input
                    type="number"
                    name="pricing.monthly.price"
                    value={formData.pricing.monthly.price}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </InputWrapper>
                <InputWrapper label="Monthly Discount (%)">
                  <input
                    type="number"
                    name="pricing.monthly.discount"
                    value={formData.pricing.monthly.discount}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </InputWrapper>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Yearly Base ($)">
                  <input
                    type="number"
                    name="pricing.yearly.price"
                    value={formData.pricing.yearly.price}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </InputWrapper>
                <InputWrapper label="Yearly Discount (%)">
                  <input
                    type="number"
                    name="pricing.yearly.discount"
                    value={formData.pricing.yearly.discount}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </InputWrapper>
              </div>
            </div>

            {/* Discounted Prices Display */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                      Monthly Final Price on (
                      {formData.pricing.monthly.discount}%)
                    </span>
                    <span className="text-lg font-bold text-sky-800 dark:text-sky-200 mt-1">
                      $
                      {calculateDiscountedPrice(
                        formData.pricing.monthly.price,
                        formData.pricing.monthly.discount,
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Yearly Final Price on ({formData.pricing.yearly.discount}
                      %)
                    </span>
                    <span className="text-lg font-bold text-green-800 dark:text-green-200 mt-1">
                      $
                      {calculateDiscountedPrice(
                        formData.pricing.yearly.price,
                        formData.pricing.yearly.discount,
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Limits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiStackLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Resource Limits
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <InputWrapper label="Email Credits">
                <input
                  type="number"
                  name="features.emailCredits.max"
                  value={formData.features.emailCredits.max}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Phone Credits">
                <input
                  type="number"
                  name="features.phoneCredits.max"
                  value={formData.features.phoneCredits.max}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Verification Limits">
                <input
                  type="number"
                  name="features.verificationCredits.max"
                  value={formData.features.verificationCredits.max}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Export Limits">
                <input
                  type="number"
                  name="features.exportCredits.max"
                  value={formData.features.exportCredits.max}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
            <div className="mt-4">
              <InputWrapper label="Max Users (seats)">
                <input
                  type="number"
                  min={1}
                  name="maxUsers"
                  value={formData.maxUsers}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>

            {/* Feature Toggles Section */}
            <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Feature Toggles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {resourceLimitOptions.map(({ label, key }) => {
                  const isEnabled = formData.features.limits[key];
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleLimitToggle(key)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-left transition-all duration-150 outline-none focus:ring-2 focus:ring-blue-500/10 ${
                        isEnabled
                          ? "border-blue-500 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-blue-500/10"
                          : "border-gray-200 bg-white dark:bg-gray-800 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                      <span
                        className={`ml-2 text-sm font-semibold flex items-center justify-center w-5 h-5 rounded-full ${
                          isEnabled
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            : "text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50"
                        }`}
                      >
                        {isEnabled ? "✓" : "✗"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Configuration & Toggles */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100 dark:border-gray-700">
              <RiSettings4Line className="text-gray-400 dark:text-gray-500 text-lg" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Configuration & Scope
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <InputWrapper label="Plan Duration Scheme">
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none cursor-pointer text-sm transition-all"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </InputWrapper>

              <InputWrapper label="Plan Publication Status">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      status: p.status === "active" ? "inactive" : "active",
                    }))
                  }
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium border transition-all duration-150 outline-none focus:ring-2 focus:ring-blue-500/10 ${
                    formData.status === "inactive"
                      ? "border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      : "border-blue-500 bg-white text-blue-600 dark:bg-gray-900 dark:text-blue-400 shadow-sm"
                  }`}
                >
                  {formData.status === "active" ? "Active" : "Inactive"}
                </button>
              </InputWrapper>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 p-5 flex flex-wrap gap-x-8 gap-y-4 rounded-lg border border-gray-100 dark:border-gray-800">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="features.apiAccess"
                  checked={formData.features.apiAccess}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Enable API Access
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="features.prioritySupport"
                  checked={formData.features.prioritySupport}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Priority Support
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="recommended"
                  checked={formData.recommended}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500/20 focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Mark as Recommended Tag
                </span>
              </label>
            </div>
          </div>

          {/* Assign Users */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiUserAddLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Assign Users
              </h2>
              <span className="ml-auto text-xs font-medium text-gray-500 dark:text-gray-400">
                {(formData.assigned || []).length} / {formData.maxUsers || 1}{" "}
                seats used
              </span>
            </div>

            {/* No seats warning */}
            {(formData.assigned || []).length >= (formData.maxUsers || 1) && (
              <div className="mb-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  All seats are filled. Increase "Max Users (seats)" or remove
                  an assigned user to assign more.
                </p>
              </div>
            )}

            {/* Search */}
            <div ref={searchContainerRef}>
              <div className="relative mb-5">
                <input
                  type="text"
                  value={userSearchQuery}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    if (!userSearchQuery.trim()) fetchAvailableUsers();
                  }}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5">
                  {searchingUsers ? (
                    <div className="w-4 h-4 border rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Search Results (when searching) */}
              {userSearchQuery.trim() && searchResults.length > 0 && (
                <div className="mb-5 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Search Results
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {searchResults.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => assignUser(user)}
                          disabled={
                            (formData.assigned || []).length >=
                            (formData.maxUsers || 1)
                          }
                          className="ml-3 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-md transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userSearchQuery.trim() &&
                searchResults.length === 0 &&
                !searchingUsers && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                    No matching users found.
                  </p>
                )}
            </div>

            {/* Available Users (when search is focused but empty) */}
            {isSearchFocused && !userSearchQuery.trim() && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  Available Users
                </h3>
                {users.filter(
                  (u) => !(formData.assigned || []).includes(u.email),
                ).length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    No users available.
                  </p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-50 dark:divide-gray-700">
                    {users
                      .filter(
                        (u) => !(formData.assigned || []).includes(u.email),
                      )
                      .map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => assignUser(user)}
                            disabled={
                              (formData.assigned || []).length >=
                              (formData.maxUsers || 1)
                            }
                            className="ml-3 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-md transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Currently Assigned */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                Currently Assigned
              </h3>
              {(formData.assigned || []).length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No users assigned yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(formData.assigned || []).map((email) => {
                    const user = users.find((u) => u.email === email);
                    return (
                      <div
                        key={email}
                        className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-full text-sm"
                        title={
                          user ? `${user.firstName} ${user.lastName}` : email
                        }
                      >
                        <span className="text-sky-700 dark:text-sky-300 font-medium text-xs truncate max-w-[180px]">
                          {email}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAssignedUser(email)}
                          className="p-0.5 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-600 dark:text-sky-400 transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  isCreatingCustom ? "/admin/custom-plans" : "/admin/plans",
                )
              }
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
              ) : isCreatingCustom ? (
                "Create Custom Plan"
              ) : (
                "Create Plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
