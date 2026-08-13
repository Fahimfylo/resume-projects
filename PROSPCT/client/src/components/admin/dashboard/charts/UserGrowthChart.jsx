import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users } from "lucide-react";
import ChartCard from "./ChartCard";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatData(raw) {
  return raw.map((d) => ({
    label: `${monthNames[d.month - 1]} ${d.year}`,
    users: d.count || 0,
  }));
}

export default function UserGrowthChart({ data = [], loading }) {
  const chartData = formatData(data);

  return (
    <ChartCard title="User Signups" subtitle="New users per month" icon={Users} iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-50 dark:bg-blue-900/30">
      {loading ? (
        <div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">No signup data</div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dx={-4} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{d.label}</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{d.users.toLocaleString()} users</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} fill="url(#usersGradient)" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}