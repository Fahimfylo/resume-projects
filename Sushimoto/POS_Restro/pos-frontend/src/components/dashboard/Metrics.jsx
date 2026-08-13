import { itemsData, metricsData } from "../../constants";

const Metrics = () => {
  return (
    <div data-aos="fade-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading font-semibold text-secondary text-xl">Overall Performance</h2>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Key metrics at a glance
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-body border border-border text-muted-foreground bg-white hover:bg-muted transition-colors">
          Last 1 Month
          <svg className="w-3 h-3" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className="rounded-xl p-5 shadow-sm"
            style={{ backgroundColor: metric.color }}
          >
            <div className="flex justify-between items-center">
              <p className="font-body font-medium text-xs text-white/80">{metric.title}</p>
              <div className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  style={{ color: metric.isIncrease ? "#fff" : "#ff6b6b" }}
                >
                  <path d={metric.isIncrease ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
                <p
                  className="font-body font-medium text-xs"
                  style={{ color: metric.isIncrease ? "#fff" : "#ff6b6b" }}
                >
                  {metric.percentage}
                </p>
              </div>
            </div>
            <p className="mt-2 font-heading font-bold text-2xl text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-heading font-semibold text-secondary text-xl">Item Details</h2>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Categories, dishes, orders, and tables overview
        </p>

        <div className="mt-5 grid grid-cols-4 gap-4">
          {itemsData.map((item, index) => (
            <div
              key={index}
              className="rounded-xl p-5 shadow-sm"
              style={{ backgroundColor: item.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-body font-medium text-xs text-white/80">{item.title}</p>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" fill="none">
                    <path d="M5 15l7-7 7 7" />
                  </svg>
                  <p className="font-body font-medium text-xs text-white">{item.percentage}</p>
                </div>
              </div>
              <p className="mt-2 font-heading font-bold text-2xl text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
