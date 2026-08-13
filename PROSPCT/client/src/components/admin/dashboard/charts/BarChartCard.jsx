import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const BAR_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

function formatData(raw, labelKey, valueKey) {
  if (Array.isArray(raw)) {
    return raw.map((d, i) => ({ label: d[labelKey] || d.name || `Item ${i + 1}`, value: d[valueKey] || d.value || 0 }));
  }
  return Object.entries(raw || {}).map(([label, value]) => ({
    label,
    value: typeof value === 'object' ? value[valueKey] || value.count || 0 : value,
  })).filter((d) => d.value > 0);
}

export default function BarChartCard({ data = [], loading, emptyMessage = "No data", labelKey = "label", valueKey = "value", valuePrefix = "", valueSuffix = "", colorIndex = 0 }) {
  const chartData = formatData(data, labelKey, valueKey);

  if (loading) {
    return <div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />;
  }

  if (chartData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">{emptyMessage}</div>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={6} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dx={-4} allowDecimals={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{d.label}</p>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{valuePrefix}{d.value.toLocaleString()}{valueSuffix}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[(colorIndex + i) % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}