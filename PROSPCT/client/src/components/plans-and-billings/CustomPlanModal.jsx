import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function CustomPlanModal({ isOpen, onClose }) {
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    description: "",
    features: {
      emailCredits: "",
      phoneCredits: "",
      verificationCredits: "",
      exportCredits: "",
      additional: "",
    },
    pricing: {
      monthlyBudget: "",
      yearlyBudget: "",
      duration: "monthly",
    },
    notes: "",
  });

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
    if (user?.firstName || user?.lastName) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      setFormData((prev) => ({ ...prev, name: fullName }));
    }
  }, [user?.email, user?.firstName, user?.lastName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const keys = name.split(".");
      setFormData((prev) => {
        let newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get("userAccessToken");
      if (!token) {
        toast.error("Please log in to submit a custom plan request");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/contact/custom-plan`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Custom plan request sent successfully!");
        onClose();
        // Reset form
        setFormData({
          name: "",
          email: "",
          description: "",
          features: {
            emailCredits: "",
            phoneCredits: "",
            verificationCredits: "",
            exportCredits: "",
            additional: "",
          },
          pricing: {
            monthlyBudget: "",
            yearlyBudget: "",
            duration: "monthly",
          },
          notes: "",
        });
      }
    } catch (error) {
      // console.error("Error submitting custom plan request:", error);
      toast.error(
        error.response?.data?.message || "Failed to send custom plan request"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:m-4">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Custom Plan Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RxCross2 size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  readOnly
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 cursor-not-allowed"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  readOnly
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          {/* Plan Description */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Plan Description
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Describe your needs *
              </label>
              <textarea
                name="description"
                required
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please describe your specific needs and use case"
              />
            </div>
          </div>

          {/* Features Required */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Features Required
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email Credits
                </label>
                <input
                  type="number"
                  min="0"
                  name="features.emailCredits"
                  value={formData.features.emailCredits}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone Credits
                </label>
                <input
                  type="number"
                  min="0"
                  name="features.phoneCredits"
                  value={formData.features.phoneCredits}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Verification Credits
                </label>
                <input
                  type="number"
                  min="0"
                  name="features.verificationCredits"
                  value={formData.features.verificationCredits}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Export Credits
                </label>
                <input
                  type="number"
                  min="0"
                  name="features.exportCredits"
                  value={formData.features.exportCredits}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Additional Features
              </label>
              <textarea
                name="features.additional"
                rows="2"
                value={formData.features.additional}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="List any other features you need"
              />
            </div>
          </div>

          {/* Pricing Expectations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Pricing Expectations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Monthly Budget ($)
                </label>
                <input
                  type="number"
                  min="0"
                  name="pricing.monthlyBudget"
                  value={formData.pricing.monthlyBudget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Yearly Budget ($)
                </label>
                <input
                  type="number"
                  min="0"
                  name="pricing.yearlyBudget"
                  value={formData.pricing.yearlyBudget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Preferred Duration
              </label>
              <select
                name="pricing.duration"
                value={formData.pricing.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Additional Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Any other requirements or questions
              </label>
              <textarea
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any other requirements or questions"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}