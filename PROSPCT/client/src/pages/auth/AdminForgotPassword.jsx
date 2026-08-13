import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
      setSubmitted(true);
      toast.success("If this email exists, a reset link has been sent");
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";
      
      if (error.response?.status === 404) {
        toast.error("Email not found. Please check and try again.");
      } else if (error.response?.status === 400) {
        toast.error(message);
      } else if (error.response?.status === 429) {
        toast.error("Too many requests. Please wait and try again later.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      {/* Brand Header */}
      <div className="mb-10 transition-all hover:opacity-80">
        <Link to="/">
          <img src="/logo/logo-3.png" alt="CMS Logo" className="h-10 w-auto" />
        </Link>
      </div>

      <div className="w-full max-w-[440px]">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 md:p-10">
            {!submitted ? (
              <>
                <header className="mb-8">
                  <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                    Reset admin password
                  </h1>
                  <p className="mt-2 text-slate-500 text-[15px]">
                    Enter your admin email and we'll send you a link to reset your password.
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-blue-200"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/admin-login"
                    className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                  >
                    ← Back to Admin Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                  Check your inbox
                </h1>
                <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
                  We've sent a recovery link to{" "}
                  <span className="font-medium text-slate-900">{email}</span>.
                  Please click the link to reset your password.
                </p>
                <Link
                  to="/admin-login"
                  className="block w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  Return to Admin Login
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Didn't get the email? Try again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Help text */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Need help?{" "}
          <a
            href="#"
            className="underline decoration-slate-300 hover:text-slate-600"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
