function CreditBar({ label, currentCredits, maxCredits }) {
  const used = Math.max(0, maxCredits - currentCredits);
  const percentageUsed = maxCredits > 0 ? Math.min((used / maxCredits) * 100, 100) : 0;

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1 text-xs">
        <p>{label}</p>
        <p className={`font-semibold text-blue-500`}>
          {used} of {maxCredits}
        </p>
      </div>
      <div className="w-full h-[5px] bg-gray-200 rounded-full">
        <div
          className={`percentage h-full ${
            percentageUsed >= 90 ? "bg-red-500" : "bg-blue-500"
          }  rounded-full`}
          style={{ width: `${percentageUsed}%` }}
        ></div>
      </div>
    </div>
  );
}

export default CreditBar;
