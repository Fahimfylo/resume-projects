function PaymentCard({ title, imgSrc, selectedMethod, onSelect }) {
  return (
    <label
      className={`relative flex items-center w-full h-full p-4 transition-all duration-300 border rounded-lg cursor-pointer
        ${
          selectedMethod === title
            ? "border-blue-300 shadow-md bg-blue-50"
            : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-md"
        }`}
      onClick={() => onSelect(title)}
    >
      <div className="flex items-center gap-3 min-w-0 w-full">
        <input
          type="radio"
          name="payment-method"
          className="hidden peer"
          checked={selectedMethod === title}
          onChange={() => onSelect(title)}
        />

        <img src={imgSrc} alt={title} className="object-contain w-12 h-8 shrink-0" />
        <span className="font-medium text-gray-700 text-sm leading-tight truncate">{title}</span>
      </div>

      <div className="absolute inset-0 border-2 border-transparent rounded-lg peer-checked:border-blue-500 peer-checked:shadow-lg"></div>
    </label>
  );
}

export default PaymentCard;
