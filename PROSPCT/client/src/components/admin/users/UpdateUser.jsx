import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiUserSharedLine,
  RiArrowLeftLine,
  RiShieldUserLine,
  RiSettings4Line,
  RiBuildingLine,
} from "react-icons/ri";
import AdminComponent from "../AdminComponent";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

// Moved OUTSIDE to prevent focus loss during typing
const InputWrapper = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

export default function UpdateUser() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);

  const [formData, setFormData] = useState({
    _id: "",
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "",
    company: "",
    googleId: "",
    telegramId: "",
    linkedInId: "",
    profilePicture: "",
    credits: {
      emailCredits: { current: "0", max: "0" },
      phoneCredits: { current: "0", max: "0" },
      verificationCredits: { current: "0", max: "0" },
      exportCredits: { current: "0", max: "0" },
    },
    selectedPlan: "",
    redeemedDeal: "",
    isBlocked: false,
    role: "user",
    password: "",
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
        // Fetch plans for the dropdown
        const plansResponse = await axios.get(`${BASE_URL}/api/plans/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plansResponse.data.plans || []);

        // Fetch user data if not provided in state or to ensure it's fresh
        const userResponse = await axios.get(`${BASE_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userData = userResponse.data.user;
        setFormData({
          _id: userData._id || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          countryCode: userData.countryCode || "",
          company: userData.company || "",
          googleId: userData.googleId || "",
          telegramId: userData.telegramId || "",
          linkedInId: userData.linkedInId || "",
          profilePicture: userData.profilePicture || "",
          credits: userData.credits
            ? {
                emailCredits: { current: String(userData.credits.emailCredits?.current ?? 0), max: String(userData.credits.emailCredits?.max ?? 0) },
                phoneCredits: { current: String(userData.credits.phoneCredits?.current ?? 0), max: String(userData.credits.phoneCredits?.max ?? 0) },
                verificationCredits: { current: String(userData.credits.verificationCredits?.current ?? 0), max: String(userData.credits.verificationCredits?.max ?? 0) },
                exportCredits: { current: String(userData.credits.exportCredits?.current ?? 0), max: String(userData.credits.exportCredits?.max ?? 0) },
              }
            : {
                emailCredits: { current: "0", max: "0" },
                phoneCredits: { current: "0", max: "0" },
                verificationCredits: { current: "0", max: "0" },
                exportCredits: { current: "0", max: "0" },
              },
          selectedPlan: userData.plan?.name || "",
          redeemedDeal: userData.redeemedDeal || "",
          isBlocked: userData.isBlocked || false,
          role: userData.role || "user",
          password: "",
        });
      } catch (err) {
        // console.error("Error fetching user data:", err);
        setError("Failed to load user data.");
        toast.error("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handlePlanChange = (e) => {
    const { value } = e.target;
    const selectedPlan = plans.find((plan) => plan.name === value);

    if (selectedPlan) {
      setFormData((prev) => ({
        ...prev,
        selectedPlan: value,
        credits: {
          emailCredits: {
            current: String(selectedPlan.features.emailCredits?.max || 0),
            max: String(selectedPlan.features.emailCredits?.max || 0),
          },
          phoneCredits: {
            current: String(selectedPlan.features.phoneCredits?.max || 0),
            max: String(selectedPlan.features.phoneCredits?.max || 0),
          },
          verificationCredits: {
            current: String(selectedPlan.features.verificationCredits?.max || 0),
            max: String(selectedPlan.features.verificationCredits?.max || 0),
          },
          exportCredits: {
            current: String(selectedPlan.features.exportCredits?.max || 0),
            max: String(selectedPlan.features.exportCredits?.max || 0),
          },
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedPlan: value }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("credits.")) {
      const [_, type, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        selectedPlan: "custom",
        credits: {
          ...prev.credits,
          [type]: {
            ...prev.credits[type],
            [field]: value,
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
      const submitData = {
        ...formData,
        credits: {
          emailCredits: { current: Number(formData.credits.emailCredits.current) || 0, max: Number(formData.credits.emailCredits.max) || 0 },
          phoneCredits: { current: Number(formData.credits.phoneCredits.current) || 0, max: Number(formData.credits.phoneCredits.max) || 0 },
          verificationCredits: { current: Number(formData.credits.verificationCredits.current) || 0, max: Number(formData.credits.verificationCredits.max) || 0 },
          exportCredits: { current: Number(formData.credits.exportCredits.current) || 0, max: Number(formData.credits.exportCredits.max) || 0 },
        },
      };
      await axios.put(
        `${BASE_URL}/api/users/update/${formData._id}`,
        submitData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("User updated successfully!");
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error updating user.");
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
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading user data...</p>
          </div>
        </div>
      </AdminComponent>
    );

  return (
    <AdminComponent>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2"
            >
              <RiArrowLeftLine /> Back to Users
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiUserSharedLine className="text-sky-500 dark:text-sky-400" /> Update User Profile
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information Section */}
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

              <InputWrapper label="Update Password">
                <input
                  type="password"
                  name="password"
                  placeholder="Leave blank to keep current"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
          </div>

          {/* Subscription & Credits Section */}
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
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                >
                  <option value="">Select Plan</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom">Custom Allocation</option>
                </select>
                {formData.redeemedDeal && !formData.selectedPlan && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                    Current deal: {formData.redeemedDeal}
                  </p>
                )}
              </InputWrapper>

              <InputWrapper label="Account Role">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
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
                      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                      : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
                  }`}
                >
                  {formData.isBlocked ? "Blocked / Inactive" : "Active"}
                </button>
              </InputWrapper>
            </div>

            {/* Nested Credits Grid */}
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
                      className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none"
                    />
                  </InputWrapper>
                  <InputWrapper label={`${type.replace("Credits", "")} Max`}>
                    <input
                      type="number"
                      name={`credits.${type}.max`}
                      value={formData.credits[type].max}
                      onChange={handleInputChange}
                      className="px-4 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-sky-500/20 outline-none"
                    />
                  </InputWrapper>
                </div>
              ))}
            </div>
          </div>

          {/* Professional Details Section */}
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
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </InputWrapper>
              <InputWrapper label="Country Code">
                <input
                  type="text"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  placeholder="+1"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </InputWrapper>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-2.5 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 transition-shadow shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-sky-200 rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
