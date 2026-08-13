import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

/**
 * VerifyEmailOTP
 * Shown to new Google sign-up users who need to verify their email.
 * Expects { tempToken, user: { email, firstName } } to be passed via
 * react-router's location state.
 */
export default function VerifyEmailOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsLoggedIn, setUser, setAdminIsLoggedIn, setAdmin } = useStore();

  // Grab data passed from the Login page
  const { tempToken, user: pendingUser } = location.state || {};

  // Redirect away if someone lands here without the required state
  useEffect(() => {
    if (!tempToken || !pendingUser) {
      navigate("/login", { replace: true });
    }
  }, [tempToken, pendingUser, navigate]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle each digit input with auto-advance
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return; // allow only single digits
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/verify-otp`,
        { otp: code },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      const { accessToken, user } = res.data;

      localStorage.setItem("userAccessToken", accessToken);
      document.cookie = `userAccessToken=${accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;
      setUser(user);
      setIsLoggedIn(true);
      toast.success("Email verified! Welcome to Prospct 🎉");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/resend-otp`,
        {},
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      
      // Update tempToken if a new one is returned (for Google registration)
      const newTempToken = res.data.tempToken;
      if (newTempToken) {
        // Navigate back to verify-email with the new token
        navigate("/verify-email", { 
          state: { tempToken: newTempToken, user: pendingUser },
          replace: true 
        });
      }
      
      toast.success("A new 6-digit code has been sent to your email");
      setResendCooldown(60);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to resend code";
      toast.error(msg);
      setResendCooldown(60);
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken || !pendingUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          <div className="px-8 pt-8 pb-10">
            {/* Logo / Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">
              Verify your email
            </h1>
            <p className="text-sm text-gray-500 text-center mb-2">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-indigo-600 text-center mb-7">
              {pendingUser.email}
            </p>

            {/* OTP inputs */}
            <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all duration-200
                    ${digit
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-gray-50 text-gray-800"
                    }
                    focus:border-indigo-500 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-100`}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={loading || otp.join("").length !== 6}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
                ${otp.join("").length === 6 && !loading
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : (
                "Verify & continue"
              )}
            </button>

            {/* Resend */}
            <div className="mt-5 text-center text-sm text-gray-500">
              Didn&apos;t receive a code?{" "}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`font-semibold transition-colors ${
                  resendCooldown > 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-indigo-600 hover:text-indigo-800"
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            {/* Back to login */}
            <div className="mt-3 text-center">
              <button
                onClick={() => navigate("/login")}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          The code expires in 10 minutes.
        </p>
      </div>
    </div>
  );
}
