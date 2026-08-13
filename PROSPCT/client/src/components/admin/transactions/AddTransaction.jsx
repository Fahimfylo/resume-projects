import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function AddTransaction() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    userId: "",
    type: "PLAN & CREDIT PURCHASE", // Default transaction type
    status: "PENDING", // Default status
    totalAmount: 0,
    items: [
      {
        plan: { planId: "", name: "", price: 0, billingCycle: "monthly", quantity: 1 },
        credit: { name: "", quantity: 0, packagePrice: 0 }
      }
    ],
    paymentGateway: { name: "PayProGlobal" }, // Adjusted to object
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
        const [plansResponse, usersResponse] = await Promise.all([
          axios.get(`${BASE_URL}/api/plans`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setPlans(plansResponse.data.plans || []);
        setUsers(usersResponse.data.users || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Error fetching data.");
        toast.error(err?.response?.data?.message || "Error fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      userId: value,
    }));
  };

  const handlePlanChange = (e, index) => {
    const { value } = e.target;
    const selectedPlan = plans.find((plan) => plan.name === value);
    if (selectedPlan) {
      const updatedItems = [...formData.items];
      updatedItems[index].plan = {
        planId: selectedPlan._id,
        name: selectedPlan.name,
        price: selectedPlan.price,
        billingCycle: selectedPlan.billingCycle,
        quantity: 1, // Default quantity
      };
      setFormData((prevData) => ({
        ...prevData,
        items: updatedItems,
      }));
    }
  };

  const handleCreditChange = (e, index) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    const [itemType, creditField] = name.split(".");

    updatedItems[index][itemType][creditField] = value;

    setFormData((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "paymentGateway.name") {
      setFormData((prevData) => ({
        ...prevData,
        paymentGateway: { ...prevData.paymentGateway, name: value }, // Update name inside paymentGateway object
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleAddItem = () => {
    setFormData((prevData) => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          plan: { planId: "", name: "", price: 0, billingCycle: "monthly", quantity: 1 },
          credit: { name: "", quantity: 0, packagePrice: 0 },
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    if (!formData.userId || formData.items.length === 0) {
      toast.error("User and items are required.");
      setSubmitting(false);
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Transaction added successfully!");
      setTimeout(() => navigate("/admin/transactions"), 1500);
    } catch (error) {
      // console.error("Error adding transaction:", error);
      toast.error(error?.response?.data?.message || "Error adding transaction.");
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
              <RiArrowLeftLine /> Back to Transactions
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> Create New Transaction
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiInformationLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Basic Selection</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Select User">
                <select
                  name="userId"
                  required
                  value={formData.userId}
                  onChange={handleUserChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </InputWrapper>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Item {index + 1}</h3>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputWrapper label="Plan">
                      <select
                        name="plan"
                        value={item.plan.name}
                        onChange={(e) => handlePlanChange(e, index)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                      >
                        <option value="">Select a plan...</option>
                        {plans.map((plan) => (
                          <option key={plan._id} value={plan.name}>
                            {plan.name} (${plan.price})
                          </option>
                        ))}
                      </select>
                    </InputWrapper>

                    <InputWrapper label="Quantity">
                      <input
                        type="number"
                        value={item.plan.quantity}
                        onChange={(e) => {
                          const updatedItems = [...formData.items];
                          updatedItems[index].plan.quantity = parseInt(e.target.value) || 1;
                          setFormData((p) => ({ ...p, items: updatedItems }));
                        }}
                        min="1"
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </InputWrapper>

                    <InputWrapper label="Credit Name">
                      <input
                        type="text"
                        name="credit.name"
                        value={item.credit.name}
                        onChange={(e) => handleCreditChange(e, index)}
                        placeholder="Enter credit name"
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </InputWrapper>

                    <InputWrapper label="Credit Quantity">
                      <input
                        type="number"
                        name="credit.quantity"
                        value={item.credit.quantity}
                        onChange={(e) => handleCreditChange(e, index)}
                        placeholder="0"
                        min="0"
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </InputWrapper>

                    <InputWrapper label="Credit Package Price">
                      <input
                        type="number"
                        name="credit.packagePrice"
                        value={item.credit.packagePrice}
                        onChange={(e) => handleCreditChange(e, index)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                      />
                    </InputWrapper>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="mt-4 px-4 py-2.5 text-sm font-semibold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
            >
              + Add Another Item
            </button>
          </div>

          {/* Payment Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiMoneyDollarCircleLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Payment Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Payment Gateway">
                <input
                  type="text"
                  name="paymentGateway.name"
                  value={formData.paymentGateway.name}
                  onChange={handleInputChange}
                  placeholder="e.g., PayProGlobal"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Total Amount">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 mr-2">$</span>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                  />
                </div>
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
                "Create Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
