import React from "react";

const ModalStepOne = ({
  selectedPlan,
  isAnnually,
  payableAmount,
  additionalCredits,
  goToNextStep,
  loading,
  error,
  handleInputChange,
  selectCoupon,
  removeCoupon,
  couponCode,
  coupon,
}) => {
  const billingCycle = isAnnually ? "Annually" : "Monthly";
  const planCost = isAnnually
    ? selectedPlan?.pricing?.yearly?.price || 0
    : selectedPlan?.pricing?.monthly?.price || 0;
  const planName = selectedPlan?.name || "No Plan Selected";
  const hasDiscount = !!coupon;

  return (
    <>
      <div>
        <h3 className="mb-2 font-semibold text-gray-800">Plan and period</h3>
        <p className="text-sm font-medium text-gray-700">{planName}</p>
        {selectedPlan && (
          <div className="grid grid-cols-2 mt-2 text-sm font-medium text-gray-700">
            <p>{selectedPlan?.features.emailCredits.max} valid emails</p>
            <p>{selectedPlan?.features.phoneCredits.max} phone credits</p>
            <p>
              {selectedPlan?.features.verificationCredits.max +
                additionalCredits?.quantity}{" "}
              verifications
            </p>
            <p>{selectedPlan?.features.exportCredits.max} export credits</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="mb-2 font-semibold text-gray-800">Summary</h3>
        <div className="grid grid-cols-2 mb-1 text-sm text-gray-600">
          <span>Period</span>
          <span className="text-blue-600 font-medium">{billingCycle}</span>
        </div>
        <div className="grid grid-cols-2 mb-1 text-sm text-gray-600">
          <span>Plan cost</span>
          <span>
            {hasDiscount ? (
              <>
                <span className="line-through text-gray-400 mr-1">${planCost} USD</span>
                <span className="text-green-600 font-semibold">${payableAmount} USD</span>
              </>
            ) : (
              <span>${planCost} USD</span>
            )}
          </span>
        </div>
        {additionalCredits?.price > 0 && (
          <div className="grid grid-cols-2 mb-1 text-sm text-gray-600">
            <span>Additional credits</span>
            <span>${additionalCredits.price} USD</span>
          </div>
        )}
        <div className="grid grid-cols-2 mb-1 text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${payableAmount + (additionalCredits?.price || 0)} USD</span>
        </div>
        <div className="grid grid-cols-2 mb-1 text-sm text-gray-600">
          <span>Tax</span>
          <span>$0 USD</span>
        </div>
        <div className="grid grid-cols-2 text-sm font-bold text-gray-800">
          <span>Total</span>
          <span>${payableAmount + (additionalCredits?.price || 0)} USD</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 font-semibold text-gray-800">Payer</h3>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="payer"
              value="individual"
              className="form-radio"
              defaultChecked
            />
            <span className="ml-2 text-gray-700">Individual</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="payer"
              value="company"
              className="form-radio"
            />
            <span className="ml-2 text-gray-700">Company</span>
          </label>
        </div>
      </div>

      <div className="py-3 mt-2">
        <h2 className="mb-2 font-semibold text-gray-800">Apply Coupon</h2>
        {hasDiscount ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-green-700 font-semibold">{coupon.code}</span>
              <span className="text-green-600 text-sm">({coupon.discountPercentage}% off)</span>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <form onSubmit={selectCoupon}>
              <input
                type="text"
                value={couponCode}
                onChange={handleInputChange}
                placeholder="Enter coupon code"
                className="border border-gray-300 px-2 py-1 w-40"
              />
              <button
                type="submit"
                className="bg-blue-500 ml-2 text-white px-3 py-1 rounded-sm"
              >
                Apply
              </button>
            </form>

            {loading && <p className="text-sm text-gray-500 ml-2">Loading...</p>}
            {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          className="flex items-center justify-center w-full py-2 text-white bg-blue-500 rounded hover:bg-blue-700 font-medium"
          onClick={goToNextStep}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ModalStepOne;
