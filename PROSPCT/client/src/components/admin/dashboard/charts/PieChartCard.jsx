import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  COMPLETED: "#10b981",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
  REFUNDED: "#8b5cf6",
  active: "#10b981",
  inactive: "#94a3b8",
  expired: "#f59e0b",
  cancelled: "#ef4444",
  monthly: "#3b82f6",
  anually: "#8b5cf6",
  lifetime: "#f59e0b",
  official: "#3b82f6",
  custom: "#8b5cf6",
  free: "#10b981",
};

const LABEL_MAP = {
  COMPLETED: "Completed",
  PENDING: "Pending",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  cancelled: "Cancelled",
  monthly: "Monthly",
  anually: "Annual",
  lifetime: "Lifetime",
  official: "Official",
  custom: "Custom",
  free: "Free",
};

function formatPieData(raw) {
  if (Array.isArray(raw)) return raw;
  return Object.entries(raw || {}).map(([name, value]) => ({
    name,
    value: typeof value === 'object' ? value.count || 0 : value,
  })).filter((d) => d.value > 0);
}

function getColor(name) {
  return COLORS[name] || "#6366f1";
}

function getLabel(name) {
  return LABEL_MAP[name] || name;
}

export default function PieChartCard({ data = [], loading, emptyMessage = "No data" }) {
  const pieData = formatPieData(data);
  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return <div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />;
  }

  if (pieData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="flex items-center gap-4 h-48">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" animationDuration={800}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.name)} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
                return (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{getLabel(d.name)}</p>
                    <p className="text-sm font-bold" style={{ color: getColor(d.name) }}>{d.value.toLocaleString()} ({pct}%)</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 space-y-1.5">
        {pieData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(d.name) }} />
              <span className="text-slate-500 dark:text-slate-400 truncate">{getLabel(d.name)}</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}