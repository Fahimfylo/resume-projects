import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiUserLine,
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

export default function UpdateAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    _id: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    role: "",
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
        const response = await axios.get(`${BASE_URL}/api/admins/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const adminData = response.data.admin;
        setFormData({
          _id: adminData._id || "",
          firstName: adminData.firstName || "",
          lastName: adminData.lastName || "",
          email: adminData.email || "",
          mobile: adminData.mobile || "",
          role: adminData.role || "admin",
          password: "",
        });
      } catch (err) {
        // console.error("Error fetching admin data:", err);
        setError("Failed to load admin data.");
        toast.error("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update other fields as usual
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = Cookies.get("adminAccessToken");

    try {
      await axios.put(
        `${BASE_URL}/api/admins/update/${formData._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Admin updated successfully!");
      setTimeout(() => navigate("/admin/admins"), 1500);
    } catch (error) {
      // console.error("Error updating admin:", error);
      const errorMsg = error?.response?.data?.message || "Error updating admin.";
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
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading admin data...</p>
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
              <RiArrowLeftLine /> Back to Admins
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RiShieldCheckLine className="text-sky-500 dark:text-sky-400" /> Update Admin
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiUserLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="First Name">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Last Name">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Email">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Mobile">
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 dark:border-gray-700">
              <RiShieldCheckLine className="text-gray-400 dark:text-gray-500" />
              <h2 className="font-semibold text-gray-700 dark:text-gray-300">Security & Access</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputWrapper label="Password">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current"
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                />
              </InputWrapper>
              <InputWrapper label="Role">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="admin">Admin</option>
                </select>
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
                "Update Admin"
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminComponent>
  );
}
