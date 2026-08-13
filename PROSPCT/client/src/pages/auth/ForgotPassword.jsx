import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../../api/mutation";
import { getCurrentUser } from "../../api/mutation";

export default function ForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromLogin = location.state?.email || "";
  const [email, setEmail] = useState(emailFromLogin);
  const [selectedEmail, setSelectedEmail] = useState(emailFromLogin);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [alternativeEmails, setAlternativeEmails] = useState([]);
  const [showAltEmails, setShowAltEmails] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);

  // When navigated from login/profile with an email, lock it — user can't change it
  const isEmailLocked = !!emailFromLogin;

  // Fetch user to get alternative emails if we have a locked email
  useEffect(() => {
    if (emailFromLogin) {
      setNotFound(false);
      setSelectedEmail(emailFromLogin);
      const fetchAltEmails = async () => {
        try {
          const { user: u } = await getCurrentUser();
          if (u && u.alternativeEmails?.length > 0) {
            setAlternativeEmails(u.alternativeEmails);
            setShowAltEmails(true);
          }
          setFetchedUser(u);
        } catch {
          // Silently fail — alt emails are optional
        }
      };
      fetchAltEmails();
    }
  }, [emailFromLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);

    try {
      await forgotPassword(selectedEmail);
      setSubmitted(true);
      toast.success(`Reset instructions sent to ${selectedEmail}`);
    } catch (error) {
      const message = error.response?.data?.message || "Something went wrong";

      if (error.response?.status === 404) {
        setNotFound(true);
        toast.error("User not found. Please check the email and try again.");
      } else if (error.response?.status === 400) {
        toast.error(message);
      } else {
        toast.error(
          error.response?.status === 429
            ? "Too many requests. Slow down!"
            : message,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAltEmailSelect = (altEmail) => {
    setSelectedEmail((prev) => (prev === altEmail ? emailFromLogin : altEmail));
    setNotFound(false);
  };

  // Determine which email is currently selected for display
  const displayEmail = selectedEmail || email;

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
                    Reset your password
                  </h1>
                  <p className="mt-2 text-slate-500 text-[15px]">
                    Enter your email and we'll send you a link to get back into
                    your account.
                  </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email selection — toggle between work and alternative emails */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Select Email for Password Reset
                    </label>

                    {/* Work Email button */}
                    <button
                      type="button"
                      onClick={() => { setSelectedEmail(emailFromLogin); setNotFound(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-all mb-2 ${
                        selectedEmail === emailFromLogin
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{emailFromLogin}</span>
                      <span className="ml-auto text-[10px] uppercase font-semibold tracking-wide opacity-60">Work</span>
                      {selectedEmail === emailFromLogin && (
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Alternative Emails */}
                    {isEmailLocked && showAltEmails && alternativeEmails.length > 0 && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {alternativeEmails.map((altEmail) => (
                          <button
                            key={altEmail}
                            type="button"
                            onClick={() => handleAltEmailSelect(altEmail)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-all ${
                              selectedEmail === altEmail
                                ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                          >
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{altEmail}</span>
                            <span className="ml-auto text-[10px] uppercase font-semibold tracking-wide opacity-60">Backup</span>
                            {selectedEmail === altEmail && (
                              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hidden input so form still has value for validation */}
                  <input type="hidden" name="email" value={selectedEmail} />

                  {notFound && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 -mt-3">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      User not found. Please select a valid email.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !selectedEmail}
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
                        Sending Request...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
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
                  <span className="font-medium text-slate-900">{selectedEmail}</span>.
                  Please click the link to reset your password.
                </p>
                <Link
                  to="/login"
                  className="block w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all"
                >
                  Return to Login
                </Link>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setNotFound(false);
                  }}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Didn't get the email? Try again
                </button>
              </div>
            )}
          </div>

          {/* Footer Link - Only show if not submitted */}
          {!submitted && (
            <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
              <Link
                to="/settings"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </Link>
            </div>
          )}
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
