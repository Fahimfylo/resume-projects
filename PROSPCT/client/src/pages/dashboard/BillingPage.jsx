import MainLayout from "../../components/layout/MainLayout";
import CreditsSlider from "../../components/plans-and-billings/CreditsSlider";
import PackageSection from "../../components/plans-and-billings/PackageSection";
import CreditSummary from "../../components/plans-and-billings/CreditSummary";
import { useState, useEffect } from "react";
import CheckoutModal from "../../components/plans-and-billings/CheckoutModal";
import CustomPlanCard from "../../components/plans-and-billings/CustomPlanCard";
import LoadingSpinner from "../../components/plans-and-billings/LoadingSpinner";
import PayProCheckoutModal from "../../components/plans-and-billings/PayProCheckoutModal";
import axios from "axios";
import Cookies from "js-cookie";
import useCheckout from "../../hooks/useCheckout";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";

export default function BillingPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAnnually, setIsAnnually] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payableAmount, setPayableAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPlanName, setCurrentPlanName] = useState(null);

  const [additionalCredits, setAdditionalCredits] = useState({
    quantity: 0,
    price: 0,
  });

  const BASE_URL = API_CONFIG.API_ENDPOINT;

  const sortPlansByName = (plansList) => {
    if (!plansList || plansList.length === 0) return [];
    
    const plansCopy = [...plansList];
    
    return plansCopy.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase().trim();
      const nameB = (b.name || "").toLowerCase().trim();
      
      const getPlanOrder = (name) => {
        if (name === 'free' || name === 'free plan') return 1;
        if (name === 'basic' || name === 'basic plan') return 2;
        if (name === 'professional' || name === 'professional plan') return 3;
        if (name === 'premium' || name === 'premium plan') return 4;
        if (name === 'custom' || name === 'custom plan') return 5;
        
        if (name.includes('free')) return 1;
        if (name.includes('basic')) return 2;
        if (name.includes('professional')) return 3;
        if (name.includes('premium')) return 4;
        if (name.includes('custom')) return 5;
        
        return 999;
      };
      
      const orderA = getPlanOrder(nameA);
      const orderB = getPlanOrder(nameB);
      
      return orderA - orderB;
    });
  };

  // Fetch plans only ONCE on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("userAccessToken");
        if (!token) throw new Error("No token found. Please login.");

        const response = await axios.get(`${BASE_URL}/api/plans/official`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedPlans = response.data.plans || [];
        const sortedPlans = sortPlansByName(fetchedPlans);
        setPlans(sortedPlans);

        if (sortedPlans.length > 0) {
          const user = useStore.getState().user;
          const userPlanName = user?.plan?.name || null;
          setCurrentPlanName(userPlanName);
          const matched = userPlanName
            ? sortedPlans.find((p) => p.name?.toLowerCase() === userPlanName.toLowerCase())
            : null;
          const targetPlan = matched || sortedPlans[0];
          setSelectedPlan(targetPlan);
          setPayableAmount(targetPlan.pricing.monthly.price);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Error fetching plans.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [BASE_URL]);

  const updatePayableAmount = (plan, annually) => {
    if (plan) {
      const amount = annually
        ? plan.pricing.yearly.price
        : plan.pricing.monthly.price;
      setPayableAmount(amount);
      // Reset coupon if billing cycle changes to avoid calculation errors
      setIsDiscountApplied(false);
      setCoupon(null);
      setCouponCode("");
    }
  };

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    updatePayableAmount(plan, isAnnually);
  };

  const handleBillingCycleChange = (annually) => {
    setIsAnnually(annually);
    if (selectedPlan) {
      updatePayableAmount(selectedPlan, annually);
    }
  };

  const handleInputChange = (event) => {
    setCouponCode(event.target.value);
    setError(null);
    setIsDiscountApplied(false);
  };

  const selectCoupon = async (event) => {
    event.preventDefault();
    setCoupon(null);
    setError(null);

    if (!couponCode) {
      setError("Please enter a coupon code");
      return;
    }

    if (isDiscountApplied) {
      setError("Discount has already been applied");
      return;
    }

    try {
      const token = Cookies.get("userAccessToken");
      const response = await axios.get(
        `${BASE_URL}/api/coupons/code/${couponCode}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const fetchedCoupon = response.data.coupon;
      if (fetchedCoupon && fetchedCoupon.discountPercentage) {
        const currentBasePrice = isAnnually
          ? selectedPlan.pricing.yearly.price
          : selectedPlan.pricing.monthly.price;

        const discountedPrice =
          currentBasePrice * ((100 - fetchedCoupon.discountPercentage) / 100);

        setPayableAmount(parseFloat(Math.max(0, discountedPrice).toFixed(2)));
        setCoupon(fetchedCoupon);
        setIsDiscountApplied(true);
      } else {
        setError("Invalid coupon or no discount available");
      }
    } catch (err) {
      setCoupon(null);
      setError(err.response?.data?.message || "Error fetching coupon");
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    setIsDiscountApplied(false);
    setError(null);
    const originalPrice = isAnnually
      ? selectedPlan.pricing.yearly.price
      : selectedPlan.pricing.monthly.price;
    setPayableAmount(originalPrice);
  };

  const {
    handleFastSpringCheckout,
    handleStripeCheckout,
    handlePayProGlobal,
    handleHeleketCheckout,
    isPayProModalOpen,
    setIsPayProModalOpen,
    payProCheckoutUrl,
  } = useCheckout({
    selectedPlan,
    additionalCredits,
    payableAmount,
    isAnnually,
    setIsLoading: setLoading,
    coupon,
  });

  const handleCheckout = async (method) => {
    const fastSpringMethods = [
      "Paypal",
      "Amazon Pay",
      "Google Pay",
      "Credit/Debit Card",
      "Fast Spring",
    ];
    if (fastSpringMethods.includes(method)) {
      handleFastSpringCheckout();
      setIsModalOpen(false);
    } else if (method === "Credit/Debit Card (alternative)") {
      handleStripeCheckout();
      setIsModalOpen(false);
    } else if (method === "Pay Pro Global") {
      handlePayProGlobal();
      setIsModalOpen(false);
    } else if (method === "Heleket") {
      const url = await handleHeleketCheckout();
      return url;
    }
  };

  return (
    <MainLayout>
      <section className="box-border flex flex-col w-full min-h-full bg-gray-100 py-14">
        <div className="container relative w-full bg-white border-t border-gray-300 mb-22">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 border-b px-7 gap-4">
            <div className="text-xl font-semibold text-gray-900">
              Choose your plan
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${!isAnnually ? "text-gray-800" : "text-gray-600"}`}
              >
                Monthly
              </span>
              <button
                type="button"
                onClick={() => handleBillingCycleChange(!isAnnually)}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-400 transition-colors focus:outline-none"
              >
                <span
                  className={`${isAnnually ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                />
              </button>
              <span
                className={`text-sm font-medium ${isAnnually ? "text-gray-800" : "text-gray-600"}`}
              >
                Annual
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 mt-4 rounded text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20">
              <LoadingSpinner isLoading={loading} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-10 mb-5 gap-6 px-4">
                {plans?.slice(0, 4).map((plan) => (
                  <PackageSection
                    key={plan._id}
                    packageData={plan}
                    annually={isAnnually}
                    isSelected={selectedPlan?._id === plan._id}
                    isCurrentPlan={plan.name?.toLowerCase() === currentPlanName?.toLowerCase()}
                    onClick={() => handlePlanSelection(plan)}
                    showAdvanced={showAdvanced}
                    onToggleAdvanced={() => setShowAdvanced((v) => !v)}
                  />
                ))}
              </div>

              <CreditsSlider
                basePlanPrice={
                  isAnnually
                    ? selectedPlan?.pricing.yearly.price
                    : selectedPlan?.pricing.monthly.price
                }
                setPayableAmount={setPayableAmount}
                initialCredits={
                  selectedPlan?.features.verificationCredits.max || 0
                }
                additionalCredits={additionalCredits}
                setAdditionalCredits={setAdditionalCredits}
              />

              <CreditSummary
                payableAmount={payableAmount}
                setIsModalOpen={setIsModalOpen}
                selectedPlan={selectedPlan}
                additionalCredits={additionalCredits}
              />

              <CustomPlanCard />
            </>
          )}
        </div>

        <CheckoutModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          payableAmount={payableAmount}
          selectedPlan={selectedPlan}
          isAnnually={isAnnually}
          onCheckOut={handleCheckout}
          additionalCredits={additionalCredits}
          setPayableAmount={setPayableAmount}
          loading={loading}
          error={error}
          handleInputChange={handleInputChange}
          selectCoupon={selectCoupon}
          removeCoupon={removeCoupon}
          couponCode={couponCode}
          coupon={coupon}
        />

        <PayProCheckoutModal
          isOpen={isPayProModalOpen}
          checkoutUrl={payProCheckoutUrl}
          onClose={() => setIsPayProModalOpen(false)}
        />
      </section>
    </MainLayout>
  );
}
