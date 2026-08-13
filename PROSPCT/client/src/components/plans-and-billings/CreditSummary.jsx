const CreditSummary = ({
  payableAmount,
  setIsModalOpen,
  selectedPlan,
  additionalCredits,
}) => {
  const planName = selectedPlan?.name || "";
  const exportCredits = selectedPlan?.features?.exportCredits?.max || 0;
  const creditsText =
    additionalCredits?.quantity > 0
      ? ` + ${additionalCredits.quantity} email verification credits`
      : "";
  const exportText =
    exportCredits > 0 ? ` (${exportCredits} export credits)` : "";

  return (
    <div className="package-summary mx-auto bg-gray-100 py-4 px-6 flex justify-between items-center border-b border-l border-r border-gray-300 rounded-b-md w-[calc(100%-60px)]">
      <div>
        <div className="mb-2 text-xl font-semibold package-summary-title">
          Summary
        </div>

        <div className="text-sm text-gray-800 package-summary-p">
          {planName}
          {exportText}
          {creditsText}
        </div>
      </div>
      <div className="flex flex-wrap items-center package-subscribe">
        <div className="pr-6 mb-2 mr-6 border-r package-price-div">
          <div className="text-2xl font-semibold text-gray-600 package-price text-end">
            ${payableAmount}
          </div>
        </div>
        <button
          type="button"
          className={`package-subscribe-btn bg-blue-600 text-white rounded-sm px-10 py-2.5 text-sm font-semibold hover:bg-blue-700 transition flex justify-center ${
            payableAmount ? "" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => setIsModalOpen(true)}
          disabled={!payableAmount}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
};

export default CreditSummary;
