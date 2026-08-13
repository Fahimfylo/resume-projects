const MiniCard = ({ title, icon, number, footerNum }) => {
  return (
    <div className="bg-white border border-border rounded-xl p-5 w-1/2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <h1 className="text-secondary text-lg font-heading font-semibold">{title}</h1>
        <button
          className={`p-3 rounded-lg text-white text-xl shadow-sm ${
            title === "Total Earnings" ? "bg-green-500" : "bg-primary"
          }`}
        >
          {icon}
        </button>
      </div>
      <div className="mt-4">
        <h1 className="text-secondary text-4xl font-heading font-bold">
          {title === "Total Earnings" ? `₹${number}` : number}
        </h1>
        <p className="text-muted-foreground text-sm font-body mt-1">
          <span className="text-green-500 font-semibold">{footerNum}%</span> than yesterday
        </p>
      </div>
    </div>
  );
};

export default MiniCard;
