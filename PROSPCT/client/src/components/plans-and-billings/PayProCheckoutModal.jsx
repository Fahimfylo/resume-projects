import { useEffect, useState } from "react";
import { X } from "lucide-react";

const PayProCheckoutModal = ({ isOpen, onClose, checkoutUrl }) => {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsIframeLoading(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsIframeLoading(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">Secure Payment</h2>
            <p className="text-slate-400 text-xs">Powered by PayPro Global</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white text-sm"
        >
          <X size={16} />
          <span className="hidden sm:inline">Cancel</span>
        </button>
      </div>

      <div className="relative flex-1 bg-white">
        {isIframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading secure checkout...</p>
          </div>
        )}
        <iframe
          src={checkoutUrl}
          className="w-full h-full border-0"
          frameBorder="0"
          onLoad={() => setIsIframeLoading(false)}
          title="PayPro Global Checkout"
          allow="payment"
        />
      </div>
    </div>
  );
};

export default PayProCheckoutModal;
