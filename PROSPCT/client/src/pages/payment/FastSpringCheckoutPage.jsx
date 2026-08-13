import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

const FASTSPRING_CHECKOUT_KEY = "fs_checkout_data";

const FastSpringCheckoutPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [checkoutOpened, setCheckoutOpened] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(FASTSPRING_CHECKOUT_KEY);

    if (!storedData) {
      setError("No checkout session found. Please try again.");
      setIsProcessing(false);
      return;
    }

    try {
      const { securePayload, secureKey, redirectAfter } = JSON.parse(storedData);

      localStorage.removeItem(FASTSPRING_CHECKOUT_KEY);

      if (!window.fastspring?.builder) {
        setError("FastSpring checkout not loaded. Please refresh and try again.");
        setIsProcessing(false);
        return;
      }

      window.fastspring.builder.secure(securePayload, secureKey);

      const originalPopupClosed = window.onFSPopupClosed;
      window.onFSPopupClosed = function (orderRef) {
        if (orderRef?.id) {
          if (redirectAfter) {
            window.location.href = redirectAfter;
          } else {
            window.close();
          }
        } else {
          if (window.opener) {
            window.close();
          } else {
            navigate("/plans-and-billings");
          }
        }
        if (typeof originalPopupClosed === "function") {
          originalPopupClosed(orderRef);
        }
      };

      setTimeout(() => {
        try {
          window.fastspring.builder.checkout();
          setIsProcessing(false);
          setCheckoutOpened(true);
        } catch (err) {
          // console.error("FastSpring checkout error:", err);
          setError("Failed to open checkout. Please try again.");
          setIsProcessing(false);
        }
      }, 200);
    } catch (err) {
      // console.error("Failed to process checkout data:", err);
      setError("Invalid checkout session. Please try again.");
      setIsProcessing(false);
    }
  }, [navigate]);

  const handleGoBack = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate("/plans-and-billings");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Secure Payment</h2>
            <p className="text-slate-400 text-xs">Powered by FastSpring</p>
          </div>
        </div>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white text-sm"
        >
          <X size={16} />
          <span className="hidden sm:inline">Cancel</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-slate-900">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-700">
          {isProcessing ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Preparing Checkout...
              </h2>
              <p className="text-slate-400 text-sm">
                Please wait while we connect to FastSpring's secure payment system.
              </p>
            </>
          ) : error ? (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Checkout Error
              </h2>
              <p className="text-slate-400 text-sm mb-6">{error}</p>
              <button
                onClick={handleGoBack}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Go Back to Billing
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Checkout Window Open
              </h2>
              <p className="text-slate-400 text-sm mb-2">
                A secure FastSpring payment window should have opened.
              </p>
              <p className="text-slate-500 text-xs">
                If you completed payment, this page will automatically close.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={handleGoBack}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  ← Cancel and return to billing
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FastSpringCheckoutPage;
