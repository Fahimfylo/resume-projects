import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiUserAddLine,
  RiArrowLeftLine,
  RiShieldUserLine,
  RiSettings4Line,
  RiBuildingLine,
} from "react-icons/ri";
import AdminComponent from "../AdminComponent";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

// FIX: Move InputWrapper OUTSIDE the main component to prevent
// the input from losing focus on every keystroke.
const InputWrapper = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

export default function AddUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    countryCode: "",
    company: "",
    googleId: "",
    telegramId: "",
    linkedInId: "",
    profilePicture: "",
    password: "",
    selectedPlan: "",
    selectedStatus: "active",
    selectedBillingCycle: "monthly",
    role: "user",
    isBlocked: false,
    credits: {
      emailCredits: { current: 0, max: 0 },
      phoneCredits: { current: 0, max: 0 },
      verificationCredits: { current: 0, max: 0 },
      exportCredits: { current: 0, max: 0 },
    },
  });

  useEffect(() => {
    const fetchPlanData = async () => {
      const token = Cookies.get("adminAccessToken");
      if (!token) {
        setError("Session expired. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${BASE_URL}/api/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(response.data.plans || []);
      } catch (err) {
        setError("Failed to load subscription plans.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlanData();
  }, []);

  const handlePlanChange = (e) => {
    const { value } = e.target;
    const selectedPlan = plans.find((plan) => plan.name === value);

    if (selectedPlan) {
      setFormData((prev) => ({
        ...prev,
        selectedPlan: value,
        credits: {
          emailCredits: {
            current: selectedPlan.features.emailCredits?.max || 0,
            max: selectedPlan.features.emailCredits?.max || 0,
          },
          phoneCredits: {
            current: selectedPlan.features.phoneCredits?.max || 0,
            max: selectedPlan.features.phoneCredits?.max || 0,
          },
          verificationCredits: {
            current: selectedPlan.features.verificationCredits?.max || 0,
            max: selectedPlan.features.verificationCredits?.max || 0,
          },
          exportCredits: {
            current: selectedPlan.features.exportCredits?.max || 0,
            max: selectedPlan.features.exportCredits?.max || 0,
          },
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedPlan: value }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Handle nested credits: credits.emailCredits.current
    if (name.startsWith("credits.")) {
      const [_, type, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        selectedPlan: "custom",
        credits: {
          ...prev.credits,
          [type]: {
            ...prev.credits[type],
            [field]: value === "" ? 0 : Number(value),
          },
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");
    try {
      await axios.post(`${BASE_URL}/api/users/addUser`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User created successfully!");
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error adding user.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <AdminComponent>
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
          </div>
        </div>
      </AdminComponent>
    );

  return (
    <AdminComponent>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2"
            >
              <RiArrowLeftLine /> Back to Users
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiUserAddLine className="text-sky-500 dark:text-sky-400" /> Create New User
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiShieldUserLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Account Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="First Name">
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Last Name">
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Email Address">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>

              <InputWrapper label="Password">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
          </div>

          {/* Subscription & Credits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiSettings4Line className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Subscription & Credits
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <InputWrapper label="Subscription Plan">
                <select
                  name="selectedPlan"
                  value={formData.selectedPlan}
                  onChange={handlePlanChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                >
                  <option value="">Select Plan</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom">Custom Allocation</option>
                </select>
              </InputWrapper>

              <InputWrapper label="Account Role">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </InputWrapper>

              <InputWrapper label="Account Status">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, isBlocked: !p.isBlocked }))
                  }
                  className={`py-2 px-4 rounded-lg font-medium border transition-all ${
                    formData.isBlocked
                      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                      : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                  }`}
                >
                  {formData.isBlocked ? "Blocked" : "Active"}
                </button>
              </InputWrapper>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              {Object.keys(formData.credits).map((type) => (
                <div key={type} className="grid grid-cols-2 gap-4">
                  <InputWrapper
                    label={`${type.replace("Credits", "")} Current`}
                  >
                    <input
                      type="number"
                      name={`credits.${type}.current`}
                      value={formData.credits[type].current}
                      onChange={handleInputChange}
                      className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </InputWrapper>
                  <InputWrapper label={`${type.replace("Credits", "")} Max`}>
                    <input
                      type="number"
                      name={`credits.${type}.max`}
                      value={formData.credits[type].max}
                      onChange={handleInputChange}
                      className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </InputWrapper>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiBuildingLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">
                Professional Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InputWrapper label="Company">
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </InputWrapper>
              <InputWrapper label="Mobile">
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </InputWrapper>
              <InputWrapper label="Country Code">
                <input
                  type="text"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  placeholder="+1"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </InputWrapper>
            </div>
          </div>

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
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
