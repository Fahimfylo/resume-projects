import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword } from "../../api/mutation";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("user"); // 'user' or 'admin'

  useEffect(() => {
    // Debug: Log full URL

    // Extract token from URL (try both search and hash)
    let tokenFromUrl = searchParams.get("token");
    const type = searchParams.get("type") || "user";

    // If not in search, check hash (some email clients move it there)
    if (!tokenFromUrl && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      tokenFromUrl = hashParams.get("token");
    }

    if (!tokenFromUrl) {
      // console.error("❌ Token missing from URL!");
      toast.error("Invalid or missing reset token");
      navigate(type === "admin" ? "/admin-forgot-password" : "/forgot-password");
      return;
    }

    setUserType(type);
    setToken(tokenFromUrl);
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords
    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, formData.newPassword);
      toast.success("Password reset successful! You can now log in.");
      // Clear any existing tokens to prevent auto-redirect to dashboard
      localStorage.removeItem("userAccessToken");
      localStorage.removeItem("memberAccessToken");
      document.cookie = "adminAccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate(userType === "admin" ? "/admin-login" : "/login");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password";
      toast.error(message);
      // console.error("Error during password reset:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.newPassword.trim() !== "" &&
    formData.confirmPassword.trim() !== "" &&
    formData.newPassword.length >= 8 &&
    formData.newPassword === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <a href="https://prospct.io">
            <img
              width={130}
              height={50}
              loading="lazy"
              src="/logo/logo-3.png"
              className="mr-4"
              alt="Company logo"
            />
          </a>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Reset Password
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="newPassword"
                className="block text-sm text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-sm"
                required
              />
              {formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-2 rounded-sm transition duration-300 text-[15px] ${
                isFormValid && !loading
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-white cursor-not-allowed"
              }`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          {/* Back to login link */}
          <div className="mt-6 text-center">
            <Link
              to={userType === "admin" ? "/admin-login" : "/login"}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              ← Back to {userType === "admin" ? "Admin " : ""}Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
