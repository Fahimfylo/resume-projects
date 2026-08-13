import { useEffect, useState } from "react";
import PaymentCard from "./PaymentCard";
import { motion } from "framer-motion"; // Highly recommended for that "industry" feel
import { ChevronLeft, CreditCard, Loader2 } from "lucide-react";

const ModalStepTwo = ({
  paymentMethods = [],
  selectedMethod,
  handleSelectMethod,
  goToPreviousStep,
  onCheckOut,
  isProcessing,
  note,
}) => {
  const [methods, setMethods] = useState(paymentMethods);

  useEffect(() => {
    setMethods(paymentMethods || []);
  }, [paymentMethods]);

  return (
    <>
      <div className="mt-6">
        <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-500">
          Payment Method
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-stretch">
          {methods?.map((method) => (
            <PaymentCard
              key={method._id || method.title}
              title={method.title}
              imgSrc={method.src}
              selectedMethod={selectedMethod}
              onSelect={handleSelectMethod}
            />
          ))}
        </div>
      </div>

      {/* Button Container */}
      <div className="flex items-center justify-between mt-10">
        {/* Back Button: Subtle & Ghost-like */}
        <button
          type="button"
          onClick={goToPreviousStep}
          className="group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all duration-200 rounded-xl hover:bg-slate-100 active:scale-95"
        >
          <ChevronLeft
            size={18}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back
        </button>

        {/* Checkout Button: High Contrast & Interactive */}
        <button
          type="button"
          disabled={isProcessing || !selectedMethod}
          onClick={() => onCheckOut(selectedMethod)}
          className={`
            relative flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm
            transition-all duration-300 shadow-lg active:scale-95
            ${
              !selectedMethod
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-blue-600 text-white shadow-blue-500/25 hover:bg-blue-700 hover:shadow-blue-500/40"
            }
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Complete Purchase</span>
              <CreditCard size={18} className="opacity-70" />
            </>
          )}
        </button>
      </div>

      {note && (
        <div className="flex justify-center mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-center leading-relaxed text-slate-500 uppercase tracking-tight">
            {note}
          </p>
        </div>
      )}
    </>
  );
};

export default ModalStepTwo;
