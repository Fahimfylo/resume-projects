import { useEffect } from "react";

export default function CreditsSlider({
  basePlanPrice = 0,
  setPayableAmount,
  initialCredits,
  additionalCredits,
  setAdditionalCredits,
}) {
  const marks = [
    { price: 0, credits: 0, label: "0" },
    { price: 15, credits: 5000, label: "5k" },
    { price: 24, credits: 10000, label: "10K" },
    { price: 49, credits: 25000, label: "25K" },
    { price: 89, credits: 50000, label: "50K" },
    { price: 169, credits: 100000, label: "100K" },
    { price: 349, credits: 250000, label: "250K" },
    { price: 459, credits: 500000, label: "500K" },
    { price: 599, credits: 1000000, label: "1M" },
    { price: 1190, credits: 2500000, label: "2.5M" },
    { price: 1990, credits: 5000000, label: "5M" },
    { price: 3290, credits: 10000000, label: "10M" },
  ];

  useEffect(() => {
    setPayableAmount(basePlanPrice + additionalCredits.price);
  }, [basePlanPrice, additionalCredits.price, setPayableAmount]);

  const handleChange = (e) => {
    const index = parseInt(e.target.value);
    const selectedMark = marks[index];
    setAdditionalCredits({
      price: selectedMark.price,
      quantity: selectedMark.credits,
    });
  };

  // Calculate price per email credit
  const pricePerEmail =
    additionalCredits.quantity > 0
      ? (additionalCredits.price / additionalCredits.quantity).toFixed(4) // Adjust to your desired decimal precision
      : 0;

  return (
    <div className="package-credits mx-auto p-6 border border-gray-300 rounded-t-md w-[calc(100%-60px)] flex flex-col items-start">
      <h1 className="mb-2 text-xl font-semibold text-gray-800 credits-title">
        Email Verification credits
      </h1>
      <div className="mb-4 text-sm text-gray-500 credits-subtitle">
        Choose the number of lifetime email verification credits for your team
      </div>

      <div className="flex justify-between w-full mb-6 credits-limit">
        <div className="text-gray-700">
          <span className="text-lg font-semibold credits-limit-l">
            {additionalCredits.quantity}{" "}
          </span>
          <span className="credits-limit-r"> credits </span>
        </div>

        <div>
          <span className="text-lg font-semibold credits-limit-l">
            ${additionalCredits.price}{" "}
          </span>
          <span className="credits-limit-r">/ lifetime</span>
        </div>
      </div>

      {/* Price per email credit display */}
      <div className="mb-4 text-sm text-gray-500 credits-price-per-email">
        <span className="font-semibold ">
          Price per email: ${pricePerEmail}
        </span>
      </div>

      <div className="w-full mb-5 credits-slider-container">
        <input
          type="range"
          min="0"
          max={marks.length - 1}
          step="1"
          onChange={handleChange}
          value={marks.findIndex(
            (mark) => mark.price === additionalCredits.price
          )}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <div className="relative flex justify-between mt-4">
          {marks.map((mark, index) => (
            <span
              key={index}
              className="absolute text-xs text-gray-500"
              style={{
                left: `${(index / (marks.length - 1)) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
