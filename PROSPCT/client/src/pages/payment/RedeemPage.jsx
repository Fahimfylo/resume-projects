import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Gift, Mail, User, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function getAuthHeaders() {
  const token = localStorage.getItem("userAccessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function RedeemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIsLoggedIn, setUser, refreshUser } = useStore();

  const token = searchParams.get("token") || "";
  const code = searchParams.get("code") || "";
  const identifier = token || code;

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState(null);
  const [redeemed, setRedeemed] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const [isLoggedIn, setIsLoggedInState] = useState(!!localStorage.getItem("userAccessToken"));

  const [formData, setFormData] = useState({ email: "", firstName: "", lastName: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!identifier) {
      setError("No voucher code provided. Please use the link from your purchase confirmation.");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const url = token
          ? `${BASE_URL}/api/vouchers/validate/token/${encodeURIComponent(token)}`
          : `${BASE_URL}/api/vouchers/validate/${encodeURIComponent(code)}`;
        const res = await axios.get(url);
        if (res.data.success) {
          setDeal(res.data.deal);
        } else {
          setError(res.data.message || "Invalid voucher code.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to validate voucher code.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [identifier, token, code]);

  useEffect(() => {
    setIsLoggedInState(!!localStorage.getItem("userAccessToken"));
  }, []);

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const body = token ? { token } : { code };
      const res = await axios.post(
        `${BASE_URL}/api/vouchers/redeem`,
        body,
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        setRedeemed(true);
        await refreshUser();
        toast.success("Voucher redeemed successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to redeem voucher.");
    } finally {
      setRedeeming(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterAndRedeem = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setRegistering(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/vouchers/register-and-redeem`, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        token: token || undefined,
        voucherCode: code || undefined,
      });

      if (res.data.success) {
        localStorage.setItem("userAccessToken", res.data.accessToken);
        document.cookie = `userAccessToken=${res.data.accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;
        if (res.data.user) setUser(res.data.user);
        setIsLoggedIn(true);
        setRedeemed(true);
        await refreshUser();
        toast.success("Account created and voucher redeemed successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account.");
    } finally {
      setRegistering(false);
    }
  };

  const renderCreditsList = () => {
    if (!deal) return null;
    const items = [];
    if (deal.emailCredits > 0) items.push(`${deal.emailCredits.toLocaleString()} Email Credits`);
    if (deal.phoneCredits > 0) items.push(`${deal.phoneCredits.toLocaleString()} Phone Credits`);
    if (deal.verificationCredits > 0) items.push(`${deal.verificationCredits.toLocaleString()} Verification Credits`);
    if (deal.exportCredits > 0) items.push(`${deal.exportCredits.toLocaleString()} Export Credits`);
    if (deal.emailSeats > 0) items.push(`${deal.emailSeats} Email Seats`);
    return items;
  };

  const renderSuccess = () => (
    <div className="text-center py-4">
      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} className="text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Voucher Redeemed!</h2>
      <p className="text-slate-400 text-sm mb-8">
        Your credits have been added to your account. They will refresh automatically each month.
      </p>
      {deal && (
        <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-700">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Credits Granted</p>
          <div className="space-y-2">
            {renderCreditsList().map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={14} />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  const renderDealInfo = () => (
    <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-700">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Your Offer</p>
      {deal.description && (
        <p className="text-slate-300 text-sm mb-3">{deal.description}</p>
      )}
      {deal.discount && (
        <p className="text-blue-400 text-sm font-medium mb-3">{deal.discount} OFF</p>
      )}
      <div className="space-y-2">
        {renderCreditsList().map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
            <Gift size={14} className="text-blue-400 shrink-0" />
            {item}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        Credits refresh automatically each month.
      </p>
    </div>
  );

  const renderRedeemButton = () => (
    <button
      onClick={handleRedeem}
      disabled={redeeming}
      className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
    >
      {redeeming ? (
        <><Loader2 size={18} className="animate-spin" /> Redeeming...</>
      ) : (
        <><Gift size={18} /> Redeem Now</>
      )}
    </button>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleRegisterAndRedeem} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1">Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
            required
          />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-1">First Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First name"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
              required
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-1">Last Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last name"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
              required
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password (min 8 characters)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition text-sm"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={registering}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
      >
        {registering ? (
          <><Loader2 size={18} className="animate-spin" /> Creating account...</>
        ) : (
          <><Gift size={18} /> Sign Up & Redeem</>
        )}
      </button>
      <div className="text-center">
        <span className="text-slate-500 text-sm">Already have an account? </span>
        <button
          type="button"
          onClick={() => {
            const returnUrl = token ? `/redeem?token=${token}` : `/redeem?code=${code}`;
            navigate("/login", { state: { from: returnUrl } });
          }}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center gap-1"
        >
          <LogIn size={14} />
          Log in
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex items-center px-6 py-3 bg-slate-800 border-b border-slate-700">
        <a href="https://prospct.io" className="flex items-center gap-2">
          <img src="/logo/logo-3.png" width={100} alt="Prospct" />
        </a>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full border border-slate-700">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 size={40} className="animate-spin text-blue-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Validating Your Code...</h2>
              <p className="text-slate-400 text-sm">Please wait.</p>
            </div>
          ) : redeemed ? (
            renderSuccess()
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Invalid Voucher</h2>
              <p className="text-slate-400 text-sm mb-6">{error}</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift size={32} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">You've Got a Gift!</h2>
                <p className="text-slate-400 text-sm">
                  Redeem your voucher code and get free credits that refresh monthly.
                </p>
              </div>

              {renderDealInfo()}

              {isLoggedIn ? (
                <div className="space-y-3">
                  {renderRedeemButton()}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px bg-slate-700 flex-1" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Create an account to redeem</span>
                    <div className="h-px bg-slate-700 flex-1" />
                  </div>
                  {renderRegisterForm()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
