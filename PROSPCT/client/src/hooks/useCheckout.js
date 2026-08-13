import { useStripe } from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import useFastSpringGateway from "../payment/gateway/FastSpring";
import { openPaymentUrl, PAYMENT_REDIRECT_MODES } from "../services/paymentWindowService";
import API_CONFIG from "../utils/apiConstant";
import useStore from "../store/store";
import { useState } from "react";

const BASE_URL = API_CONFIG.API_ENDPOINT;
const FASTSPRING_CHECKOUT_KEY = "fs_checkout_data";

const useCheckout = ({
  selectedPlan,
  additionalCredits,
  payableAmount,
  isAnnually,
  setIsLoading,
  coupon,
}) => {
  const { user, addNotification, paymentRedirectMode } = useStore();
  const stripe = useStripe();
  const { pushToFastSpring } = useFastSpringGateway();
  const [isPayProModalOpen, setIsPayProModalOpen] = useState(false);
  const [payProCheckoutUrl, setPayProCheckoutUrl] = useState("");

  const redirectMode = paymentRedirectMode || PAYMENT_REDIRECT_MODES.SAME_TAB;

  const FASTSPRING_PRODUCT_PATH = "b2bemail";

  const getProductId = () => {
    return FASTSPRING_PRODUCT_PATH;
  };

  const createPaymentData = () => {
    const data = [];
    if (selectedPlan) {
      data.push({
        name: getProductId(),
        planId: selectedPlan._id,
        price: isAnnually
          ? selectedPlan.pricing.yearly.price
          : selectedPlan.pricing.monthly.price,
        type: "Plan",
        billingCycle: isAnnually ? "anually" : "monthly",
        quantity: 1,
      });
    }
    if (additionalCredits.quantity > 0) {
      data.push({
        name: `additional-credits (${additionalCredits.quantity})`,
        price: additionalCredits.price,
        type: "Credit",
        quantity: additionalCredits.quantity,
      });
    }
    return data;
  };

  const productData = createPaymentData();

  // ---------------------- FastSpring ----------------------
  const getFastSpringSecurePayload = async (items) => {
    const formattedItems = items.map((item) => ({
      product: item.product,
      quantity: item.quantity || 1,
      price: item.price,
      label: item.label,
    }));


    const { data } = await axios.post(
      `${BASE_URL}/api/payment/fastspring/secure-payload`,
      { items: formattedItems, productData },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("userAccessToken")}`,
        },
      }
    );

    const { securePayload, secureKey } = data;
    if (!securePayload || !secureKey) {
      throw new Error("Server returned empty securePayload or secureKey.");
    }

    return { securePayload, secureKey };
  };

  const handleFastSpringCheckout = async () => {
    const isFreePlan = selectedPlan?.type === "free" || selectedPlan?.name?.toLowerCase() === "free";
    if (isFreePlan) {
      toast.success("Free Plan activated! No payment required.");
      return;
    }

    const currentRedirectMode = useStore.getState().paymentRedirectMode || PAYMENT_REDIRECT_MODES.SAME_TAB;

    const items = [];
    if (selectedPlan) {
      const planProductId = getProductId();
      const period = isAnnually ? "Yearly" : "Monthly";
      items.push({
        product: planProductId,
        quantity: 1,
        price: isAnnually
          ? selectedPlan.pricing.yearly.price
          : selectedPlan.pricing.monthly.price,
        label: `${selectedPlan.name} - ${period}`,
      });
    }
    if (additionalCredits.quantity > 0) {
      items.push({
        product: FASTSPRING_PRODUCT_PATH,
        quantity: 1,
        price: additionalCredits.price,
        label: `Additional Credits (${additionalCredits.quantity})`,
      });
    }

    setIsLoading(true);
    toast.info("Preparing secure checkout...");

    try {
      if (currentRedirectMode === PAYMENT_REDIRECT_MODES.POPUP) {
        await pushToFastSpring(user?.email, user?.firstName, user?.lastName, items, productData);
      } else {
        const { securePayload, secureKey } = await getFastSpringSecurePayload(items);

        const checkoutData = {
          securePayload,
          secureKey,
          redirectAfter: `${window.location.origin}/dashboard`,
        };

        localStorage.setItem(FASTSPRING_CHECKOUT_KEY, JSON.stringify(checkoutData));

        const checkoutPageUrl = `${window.location.origin}/fastspring-checkout`;
        openPaymentUrl(checkoutPageUrl, currentRedirectMode, { 
          windowName: "FastSpringCheckout",
          width: 550,
          height: 750,
        });
      }
    } catch (err) {
      // console.error("[FastSpring] Secure checkout failed:", err);
      const msg = err?.response?.data?.message || err.message || "FastSpring checkout failed";
      toast.error(msg);
      addNotification({
        title: "Checkout failed",
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------- Stripe ----------------------
  const handleStripeCheckout = async () => {
    const currentRedirectMode = useStore.getState().paymentRedirectMode || PAYMENT_REDIRECT_MODES.SAME_TAB;

    try {
      const discountDecimal = coupon?.discountPercentage
        ? coupon.discountPercentage / 100
        : 0;

      const discountedProductData = productData.map((item) => {
        const discount = item.price * discountDecimal;
        const discountedPrice = Math.max(0, item.price - discount);
        return { ...item, price: discountedPrice.toFixed(2) };
      });

      const { data } = await axios.post(
        `${BASE_URL}/api/payment/stripe/create-checkout-session`,
        discountedProductData,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("userAccessToken")}`,
          },
        },
      );

      if (currentRedirectMode === PAYMENT_REDIRECT_MODES.SAME_TAB) {
        const result = await stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        if (data.url) {
          openPaymentUrl(data.url, currentRedirectMode, { windowName: "StripeCheckout" });
        } else {
          const result = await stripe.redirectToCheckout({ sessionId: data.id });
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Stripe checkout failed";
      toast.error(msg);
      addNotification({
        title: "Checkout failed",
        message: msg,
        type: "error",
      });
    }
  };

  // ---------------------- CoinPayments ----------------------
  const handleCoinPayment = async () => {
    const currentRedirectMode = useStore.getState().paymentRedirectMode || PAYMENT_REDIRECT_MODES.SAME_TAB;

    try {
      const { data } = await axios.post(`${BASE_URL}/api/coin/payment`, {
        amount: payableAmount,
        email: user?.email,
        item_name: "Prospct",
      });
      if (data.url) {
        openPaymentUrl(data.url, currentRedirectMode, { windowName: "CoinPayments" });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "CoinPayment failed";
      toast.error(msg);
      addNotification({
        title: "Checkout failed",
        message: msg,
        type: "error",
      });
    }
  };

  // ---------------------- PayProGlobal ----------------------
  const handlePayProGlobal = async () => {
    const currentRedirectMode = useStore.getState().paymentRedirectMode || PAYMENT_REDIRECT_MODES.SAME_TAB;

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/payment/payproglobal/checkout`,
        {
          productData,
          totalAmount: payableAmount,
          paymentGateway: "PayProGlobal",
          coupon,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("userAccessToken")}`,
          },
        },
      );

      if (currentRedirectMode === PAYMENT_REDIRECT_MODES.SAME_TAB) {
        setPayProCheckoutUrl(data.url);
        setIsPayProModalOpen(true);
      } else {
        openPaymentUrl(data.url, currentRedirectMode, { windowName: "PayProGlobal" });
      }
    } catch (err) {
      const msg = "PayProGlobal checkout failed";
      toast.error(msg);
      addNotification({
        title: "Checkout failed",
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------- Heleket ----------------------
  const [heleketUrl, setHeleketUrl] = useState("");

  const handleHeleketCheckout = async () => {
    const currentRedirectMode = useStore.getState().paymentRedirectMode || PAYMENT_REDIRECT_MODES.SAME_TAB;

    try {
      setIsLoading(true);

      const { data } = await axios.post(
        `${BASE_URL}/api/payment/heleket/checkout`,
        {
          productData,
          totalAmount: payableAmount,
          paymentGateway: "Heleket",
          coupon,
        },
        { headers: { Authorization: `Bearer ${Cookies.get("userAccessToken")}` } },
      );

      setHeleketUrl(data.url);
      
      if (currentRedirectMode === PAYMENT_REDIRECT_MODES.SAME_TAB) {
        return data.url;
      } else {
        openPaymentUrl(data.url, currentRedirectMode, { windowName: "Heleket" });
        return null;
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err.message;
      const msg = serverMsg || "Heleket checkout failed";
      toast.error(msg);
      addNotification({
        title: "Checkout failed",
        message: msg,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleFastSpringCheckout,
    handleStripeCheckout,
    handleCoinPayment,
    handlePayProGlobal,
    handleHeleketCheckout,
    isPayProModalOpen,
    setIsPayProModalOpen,
    payProCheckoutUrl,
    coupon,
  };
};

export default useCheckout;
