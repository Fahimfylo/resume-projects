import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Gift } from "lucide-react";
import { submitVoucherRequest, setVoucherApiUrl, setVoucherApiKey } from "../../lib/voucherApi";

const STORAGE_KEY = "voucher_payload";

export default function VoucherThankYouPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vouchers, setVouchers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const apiUrl = searchParams.get("apiUrl");
    const apiKey = searchParams.get("apiKey");
    if (apiUrl) setVoucherApiUrl(apiUrl);
    if (apiKey) setVoucherApiKey(apiKey);

    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
      setError("No voucher request data found.");
      return;
    }

    let payload;
    try {
      payload = JSON.parse(stored);
    } catch {
      setError("Invalid voucher request data.");
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const invoiceNumber =
      payload?.payment?.invoice_number || payload?.invoice_number;
    if (!invoiceNumber) {
      setError("Missing invoice number in voucher request.");
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    submitVoucherRequest(payload)
      .then((res) => {
        setVouchers(res.vouchers || (res.voucher ? [res.voucher] : []));
        sessionStorage.removeItem(STORAGE_KEY);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const count = vouchers?.length || 0;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex items-center px-6 py-3 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full border border-slate-700">
          {!vouchers && !error ? (
            <div className="text-center py-8">
              <Loader2 size={40} className="animate-spin text-blue-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Processing Your Voucher...</h2>
              <p className="text-slate-400 text-sm">Please wait while we generate your voucher code(s).</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Voucher Generation Failed</h2>
              <p className="text-slate-400 text-sm mb-6">{error}</p>
              <button
                onClick={() => navigate("/plans-and-billings")}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Return to Billing
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
              <p className="text-slate-400 text-sm mb-8">
                {count === 1
                  ? "Your special deal voucher has been generated successfully."
                  : `Your special deal package (${count} codes) has been processed successfully.`}
              </p>

              <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-700">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
                  <Gift size={20} />
                  <span className="text-lg font-semibold">
                    {count === 1 ? "1 Voucher Code" : `${count} Voucher Codes`}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  {count === 1
                    ? "Your voucher code is ready. Go to your dashboard to redeem it and start using Prospct!"
                    : "Your voucher codes are ready. Go to your dashboard to redeem them one by one and start using Prospct!"}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
                >
                  <Gift size={16} />
                  Go to Dashboard to Redeem
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
