import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiInformationLine,
  RiStackLine,
  RiMoneyDollarCircleLine,
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

export default function UpdateTransaction() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);

  const [formData, setFormData] = useState({
    type: "",
    status: "",
    totalAmount: 0,
    items: [],
    paymentGateway: { name: "" },
    createdAt: "",
    updatedAt: "",
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
        // Fetch plans for dropdown
        const plansResponse = await axios.get(`${BASE_URL}/api/plans/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plansResponse.data.plans || []);

        // Fetch transaction details
        const transactionResponse = await axios.get(
          `${BASE_URL}/api/transactions/${transactionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const transData = transactionResponse.data.transaction;
        setFormData({
          type: transData.type || "",
          status: transData.status || "",
          totalAmount: transData.totalAmount || 0,
          items: transData.items || [],
          paymentGateway: transData.paymentGateway || { name: "" },
          createdAt: transData.createdAt || "",
          updatedAt: transData.updatedAt || "",
        });
      } catch (err) {
        // console.error("Error fetching transaction data:", err);
        setError("Failed to load transaction data.");
        toast.error("Failed to load transaction data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [transactionId]);

  const handlePlanChange = (e) => {
    const { value } = e.target;
    const selectedPlan = plans.find((plan) => plan.name === value);

    if (selectedPlan) {
      const updatedItems = formData.items.map((item) => {
        if (item.plan) {
          return {
            ...item,
            plan: {
              ...item.plan,
              name: value,
              price: selectedPlan.price,
              billingCycle: selectedPlan.billingCycle,
            },
          };
        }
        return item;
      });

      setFormData((prevData) => ({
        ...prevData,
        items: updatedItems,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("items.")) {
      const [_, index, field] = name.split(".");
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      setFormData((prevData) => ({
        ...prevData,
        items: updatedItems,
      }));
    } else if (name === "paymentGateway.name") {
      setFormData((prevData) => ({
        ...prevData,
        paymentGateway: {
          ...prevData.paymentGateway,
          name: value,
        },
      }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    try {
      await axios.put(
        `${BASE_URL}/api/transactions/update/${transactionId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Transaction updated successfully!");
      setTimeout(() => navigate("/admin/transactions"), 1500);
    } catch (error) {
      // console.error("Error updating transaction:", error);
      toast.error(error?.response?.data?.message || "Error updating transaction.");
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
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline mb-2"
            >
              <RiArrowLeftLine /> Back to Transactions
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> Update Transaction
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiInformationLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Transaction Type">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                >
                  <option value="PLAN & CREDIT PURCHASE">Plan & Credit Purchase</option>
                  <option value="REFUND">Refund</option>
                  <option value="CHARGE">Charge</option>
                </select>
              </InputWrapper>
              <InputWrapper label="Status">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </InputWrapper>
            </div>
          </div>

          {/* Items Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiStackLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Items Configuration</h2>
            </div>

            <div className="space-y-6">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 border border-gray-100 dark:border-gray-700">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Item {index + 1}</h3>

                  {item.plan && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWrapper label="Plan Name">
                        <input
                          type="text"
                          name={`items.${index}.plan.name`}
                          value={item.plan.name}
                          onChange={handleInputChange}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                      <InputWrapper label="Plan Price">
                        <input
                          type="number"
                          name={`items.${index}.plan.price`}
                          value={item.plan.price}
                          onChange={handleInputChange}
                          step="0.01"
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                      <InputWrapper label="Billing Cycle">
                        <input
                          type="text"
                          name={`items.${index}.plan.billingCycle`}
                          value={item.plan.billingCycle}
                          onChange={handleInputChange}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                      <InputWrapper label="Quantity">
                        <input
                          type="number"
                          name={`items.${index}.plan.quantity`}
                          value={item.plan.quantity}
                          onChange={handleInputChange}
                          min="1"
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                    </div>
                  )}

                  {item.credit && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWrapper label="Credit Name">
                        <input
                          type="text"
                          name={`items.${index}.credit.name`}
                          value={item.credit.name}
                          onChange={handleInputChange}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                      <InputWrapper label="Quantity">
                        <input
                          type="number"
                          name={`items.${index}.credit.quantity`}
                          value={item.credit.quantity}
                          onChange={handleInputChange}
                          min="0"
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                      <InputWrapper label="Package Price">
                        <input
                          type="number"
                          name={`items.${index}.credit.packagePrice`}
                          value={item.credit.packagePrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        />
                      </InputWrapper>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiMoneyDollarCircleLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Payment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Total Amount">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </div>
              </InputWrapper>
              <InputWrapper label="Payment Gateway">
                <input
                  type="text"
                  name="paymentGateway.name"
                  value={formData.paymentGateway.name}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
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
                  <span>Updating...</span>
                </>
              ) : (
                "Update Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
