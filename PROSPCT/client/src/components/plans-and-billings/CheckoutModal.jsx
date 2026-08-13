import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Info } from "lucide-react";
import ModalStepOne from "./ModalStepOne";
import ModalStepTwo from "./ModalStepTwo";
import HeleketCard from "./HeleketCard";
import API_CONFIG from "../../utils/apiConstant";
import useStore from "../../store/store";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const DEFAULT_PAYMENT_METHODS = [
  {
    title: "Credit/Debit Card (alternative)",
    src: "/images/payment-method/Visa-Mastercard.webp",
  },
  { title: "Pay Pro Global", src: "/images/payment-method/payproglobal.jfif" },
  { title: "Heleket", src: "/images/payment-method/heleket.png" },
  { title: "Fast Spring", src: "/images/payment-method/fast-spring.png" },
];

const CheckoutModal = ({
  isModalOpen,
  setIsModalOpen,
  selectedPlan,
  isAnnually,
  payableAmount,
  setPayableAmount,
  onCheckOut,
  additionalCredits,
  loading,
  error,
  handleInputChange,
  selectCoupon,
  removeCoupon,
  couponCode,
  coupon,
}) => {
  const { setPaymentRedirectMode, setPaymentMethods } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState("");
  const [orderedMethods, setOrderedMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [heleketUrl, setHeleketUrl] = useState("");

  // --- Professional Note Mapping ---
  // Using a lookup object handles string mismatches better than a switch
  const getMethodNote = (methodName) => {
    const name = methodName.toLowerCase();
    if (name.includes("card") || name.includes("visa"))
      return "Ensure your credit or debit card is enabled for international transactions.";
    if (name.includes("paypal"))
      return "This transaction will appear on your statement as FS*Prospect.";
    if (name.includes("pay pro") || name.includes("paypro"))
      return "Securely processed via PayPro Global encryption.";
    if (name.includes("heleket"))
      return "Follow the on-screen instructions in the Heleket portal to complete your transfer.";
    if (name.includes("fast spring") || name.includes("fastspring"))
      return "You will be redirected to FastSpring's secure checkout.";
    return "";
  };

   useEffect(() => {
     const loadOrder = async () => {
       try {
         const res = await axios.get(
           `${BASE_URL}/api/admin/settings/layout-order`,
         );
         const methods =
           res.data.paymentMethods || res.data.paymentCardOrder || [];
         
          const redirectMode = res.data.paymentRedirectMode || "same-tab";
         setPaymentRedirectMode(redirectMode);

         if (Array.isArray(methods) && methods.length > 0) {
           setPaymentMethods(methods);
           if (methods[0]?.src) {
             // Filter out disabled methods for users - only show enabled ones
             const enabledMethods = methods.filter(m => !m.disabled);
             setOrderedMethods(enabledMethods.length > 0 ? enabledMethods : methods);
           } else {
             const sorted = methods
               .map((t) => DEFAULT_PAYMENT_METHODS.find((m) => m.title === t))
               .filter(Boolean);
             const rest = DEFAULT_PAYMENT_METHODS.filter(
               (m) => !methods.includes(m.title),
             );
             setOrderedMethods([...sorted, ...rest]);
           }
         }
       } catch (err) {
         // console.error("Method Load Error:", err.message);
       }
     };

     if (isModalOpen) {
       loadOrder();
       setCurrentStep(1);
     }
   }, [isModalOpen, setPaymentRedirectMode, setPaymentMethods]);

  const handleSelectMethod = (methodTitle) => {
    setSelectedMethod(methodTitle);
    setNote(getMethodNote(methodTitle));
  };

  const handleCheckout = async (method) => {
    if (!method) return;
    setIsProcessing(true);
    try {
      if (method === "Heleket") {
        const url = await onCheckOut("Heleket");
        if (url) window.location.href = url;
      } else {
        await onCheckOut(method);
      }
    } catch (err) {
      // console.error("Checkout error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderModalContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ModalStepOne
            selectedPlan={selectedPlan}
            isAnnually={isAnnually}
            payableAmount={payableAmount}
            additionalCredits={additionalCredits}
            goToNextStep={() => setCurrentStep(2)}
            setPayableAmount={setPayableAmount}
            loading={loading}
            error={error}
            handleInputChange={handleInputChange}
            selectCoupon={selectCoupon}
            removeCoupon={removeCoupon}
            couponCode={couponCode}
            coupon={coupon}
          />
        );
      case 2:
        return (
          <ModalStepTwo
            paymentMethods={orderedMethods}
            selectedMethod={selectedMethod}
            handleSelectMethod={handleSelectMethod}
            goToPreviousStep={() => setCurrentStep(1)}
            onCheckOut={handleCheckout}
            isProcessing={isProcessing}
            note={note}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header Branding */}
              <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Secure Checkout
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Step {currentStep} of 2
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                  initial={{ width: "50%" }}
                  animate={{ width: currentStep === 1 ? "50%" : "100%" }}
                  className="h-full bg-blue-500"
                />
              </div>

              <div className="p-8">{renderModalContent()}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HeleketCard
        isOpen={!!heleketUrl}
        onClose={() => setHeleketUrl("")}
        checkoutUrl={heleketUrl}
      />
    </>
  );
};

export default CheckoutModal;
