import { useState } from "react";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";

import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function AdminLogin() {
  const { setAdminIsLoggedIn, setAdmin } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }

    if (loading) return; // Prevent multiple submissions
    setLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auth/adminLogin`,
        formData,
      );

      const { success, message, adminAccessToken, admin } = response.data;

      // STRICT validation
      if (!success) {
        toast.error(message || "Invalid credentials");
        setLoading(false);
        return;
      }

      if (!adminAccessToken || !admin) {
        toast.error("Authentication failed");
        setLoading(false);
        return;
      }

      // Save admin token in cookie (never overwrites user token)
      Cookies.set("adminAccessToken", adminAccessToken, { expires: 30 });

      setAdmin(admin);
      setAdminIsLoggedIn(true);

      toast.success(`Welcome back, ${admin.firstName}`);
      navigate("/admin/dashboard");
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.email.trim() !== "" && formData.password.trim() !== "";

  return (
    <div className="lg:flex h-[100vh]">
      {/* LEFT */}
      <div className="bg-[#f8f8f8] h-full lg:w-4/6">
        <div className="px-4 py-4 md:px-12">
          <a href="https://prospct.io">
            <img
              width={130}
              height={50}
              src="/logo/logo-3.png"
              alt="Company logo"
            />
          </a>
        </div>

        <div className="flex justify-center">
          <div className="w-full px-4 sm:w-auto sm:px-0">
            <div className="mt-20 mb-8 text-4xl font-bold text-gray-800">
              Welcome Admin!
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@mail.com"
                  className="w-full sm:w-[400px] px-4 py-2 mt-2 text-gray-900 border rounded-sm focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-sm text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full sm:w-[400px] px-4 py-2 mt-2 text-gray-900 border rounded-sm focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full sm:w-[400px] py-2 rounded-sm text-[15px] transition ${
                  isFormValid && !loading
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-white cursor-not-allowed"
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative py-10 text-center bg-blue-600 lg:w-2/6">
        <h2 className="text-4xl font-bold text-gray-50 mt-24">
          Welcome Back, Admin
        </h2>

        <div className="flex justify-center mt-8">
          <span className="flex items-center px-3 py-1 text-white bg-blue-700 rounded-sm">
            <FaUser size={12} />
            <span className="ml-2">admin</span>
          </span>
        </div>

        <div className="mt-12">
          <img src="/images/admin.png" alt="Admin" />
        </div>
      </div>
    </div>
  );
}
