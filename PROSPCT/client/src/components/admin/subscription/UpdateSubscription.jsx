import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiCalendarLine,
  RiSettings4Line,
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

export default function UpdateSubscription() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [subscriptionUser, setSubscriptionUser] = useState(null);
  
  const [formData, setFormData] = useState({
    planId: "",
    startDate: "",
    endDate: "",
    status: "active",
    billingCycle: "monthly",
  });

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("adminAccessToken");
      if (!token) {
        setError("Session expired. Please log in.");
        setLoading(false);
        return;
      }

      try {
        // Fetch subscription details
        const subscriptionResponse = await axios.get(
          `${BASE_URL}/api/subscriptions/${subscriptionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const subscriptionData = subscriptionResponse.data.subscription;
        setSubscriptionUser(subscriptionData.user);
        setFormData({
          planId: subscriptionData.plan._id,
          startDate: formatDate(subscriptionData.startDate),
          endDate: formatDate(subscriptionData.endDate),
          status: subscriptionData.status || "active",
          billingCycle: subscriptionData.billingCycle || "monthly",
        });

        // Fetch available plans
        const plansResponse = await axios.get(`${BASE_URL}/api/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plansResponse.data.plans || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Error fetching data.");
        toast.error(err?.response?.data?.message || "Error fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subscriptionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    if (!formData.planId) {
      toast.error("Please select a plan.");
      setSubmitting(false);
      return;
    }

    try {
      await axios.put(
        `${BASE_URL}/api/subscriptions/update/${subscriptionId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Subscription updated successfully!");
      setTimeout(() => navigate("/admin/subscriptions"), 1500);
    } catch (error) {
      // console.error("Error updating subscription:", error);
      toast.error(error?.response?.data?.message || "Error updating subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <AdminComponent>
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-40">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="w-12 h-12 border-4 border-sky-200 dark:border-sky-800 border-t-sky-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading subscription data...</p>
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
              <RiArrowLeftLine /> Back to Subscriptions
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> Update Subscription
            </h1>
            {subscriptionUser && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {subscriptionUser.firstName} {subscriptionUser.lastName} ({subscriptionUser.email})
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiSettings4Line className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Plan Selection</h2>
            </div>
            
            <InputWrapper label="Select Plan">
              <select
                name="planId"
                required
                value={formData.planId}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
              >
                <option value="">Choose a plan...</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </InputWrapper>
          </div>

          {/* Date Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiCalendarLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Date Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Start Date">
                <input
                  type="date"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="End Date">
                <input
                  type="date"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
          </div>

          {/* Settings & Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiSettings4Line className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Settings & Status</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Billing Cycle">
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none cursor-pointer"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </InputWrapper>
              <InputWrapper label="Status">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, status: p.status === "active" ? "inactive" : "active" }))
                  }
                  className={`py-2 px-4 rounded-lg font-medium border transition-all w-full text-left ${
                    formData.status === "inactive"
                      ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                      : "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50"
                  }`}
                >
                  {formData.status === "active" ? "🟢 Active" : "🔴 Inactive"}
                </button>
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
                  <span>Updating...</span>
                </>
              ) : (
                "Update Subscription"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
