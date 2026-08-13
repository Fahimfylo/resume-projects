"use client";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../../utils/apiConstant";
import useStore from "../../../store/store";

export default function UsageChart({
  selectedDate,
  planName,
  emailCredits = { current: 0, max: 0 },
  phoneCredits = { current: 0, max: 0 },
  exportCredits = { current: 0, max: 0 },
  verificationCredits = { current: 0, max: 0 },
}) {
  const totalMax =
    (emailCredits.max || 0) +
    (phoneCredits.max || 0) +
    (exportCredits.max || 0) +
    (verificationCredits.max || 0);
  const totalCurrent =
    (emailCredits.current || 0) +
    (phoneCredits.current || 0) +
    (exportCredits.current || 0) +
    (verificationCredits.current || 0);
  const totalUsed = Math.max(0, totalMax - totalCurrent);

  const [chartData, setChartData] = useState([]);
  const creditHistoryRefreshKey = useStore((s) => s.creditHistoryRefreshKey);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token =
          localStorage.getItem("userAccessToken") ||
          Cookies.get("userAccessToken");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(
          `${API_CONFIG.API_ENDPOINT}/api/credits/history`,
          {
            headers,
            params: { endDate: selectedDate.toISOString() },
          },
        );
        setChartData(res.data);
      } catch (err) {
        // console.error("Failed to fetch credit history:", err);
      }
    };
    fetchHistory();
  }, [
    selectedDate,
    emailCredits.current,
    phoneCredits.current,
    exportCredits.current,
    verificationCredits.current,
    creditHistoryRefreshKey,
  ]);

  // 🔥 auto stats

  const formatDate = (d) => d.toISOString().split("T")[0];

  const todayData = chartData.find((d) => d.date === formatDate(selectedDate));

  const yesterday = new Date(selectedDate);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayData = chartData.find((d) => d.date === formatDate(yesterday));

  const todayEmail = todayData?.email ?? 0;
  const todayPhone = todayData?.phone ?? 0;
  const todayExport = todayData?.export ?? 0;
  const todayVerification = todayData?.verification ?? 0;
  const yesterdayEmail = yesterdayData?.email ?? 0;
  const yesterdayPhone = yesterdayData?.phone ?? 0;
  const yesterdayExport = yesterdayData?.export ?? 0;
  const yesterdayVerification = yesterdayData?.verification ?? 0;

  const avg =
    chartData.length > 0
      ? Math.round(
          chartData.reduce(
            (acc, d) =>
              acc +
              (d.email || 0) +
              (d.phone || 0) +
              (d.export || 0) +
              (d.verification || 0),
            0,
          ) / chartData.length,
        )
      : 0;

  const peak =
    chartData.length > 0
      ? Math.max(
          ...chartData.map(
            (d) =>
              (d.email || 0) +
              (d.phone || 0) +
              (d.export || 0) +
              (d.verification || 0),
          ),
        )
      : 0;

  return (
    <div className="w-full bg-white text-gray-900">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Total credits Used
          </p>
          <h2 className="text-5xl font-bold text-gray-900">
            {totalUsed.toLocaleString()}
          </h2>
          <p className="text-sm text-gray-500 pt-2 font-medium">
            <span className="font-semibold text-gray-500 text-[18px]">
              {totalCurrent}{" "}
            </span>
            credits remaining
          </p>
          {planName && (
            <p className="text-[15px] text-gray-500 pt-1 font-medium">
              Plan :{" "}
              <span className=" text-gray-700 font-bold">{planName}</span>
            </p>
          )}
        </div>
        <div className="text-right space-y-2">
          {emailCredits && (
            <div className="flex items-center justify-end gap-3.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                Email credits
              </span>
              <span className="text-[12px] font-semibold">
                {Math.max(0, emailCredits.max - emailCredits.current)}
                <span className="text-gray-400 font-semibold text-[12px]">
                  {" "}
                  / {emailCredits.max}
                </span>
              </span>
            </div>
          )}

          {phoneCredits && (
            <div className="flex items-center justify-end gap-3.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                Phone credits
              </span>
              <span className="text-[12px] font-semibold">
                {Math.max(0, phoneCredits.max - phoneCredits.current)}
                <span className="text-gray-400 font-semibold text-[12px]">
                  {" "}
                  / {phoneCredits.max}
                </span>
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3.5">
            <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Export credits
            </span>
            <span className="text-[12px] font-semibold">
              {Math.max(0, exportCredits.max - exportCredits.current)}
              <span className="text-gray-400 font-bold text-[12px]">
                {" "}
                / {exportCredits.max}
              </span>
            </span>
          </div>

          {verificationCredits && (
            <div className="flex items-center justify-end gap-3.5">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                Verification credits
              </span>
              <span className="text-[12px] font-semibold">
                {Math.max(
                  0,
                  verificationCredits.max - verificationCredits.current,
                )}
                <span className="text-gray-400 font-semibold text-[12px]">
                  {" "}
                  / {verificationCredits.max}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container — UNCHANGED */}
      <div className="h-[250px] w-full mt-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="emailGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="phoneGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="exportGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient
                id="verificationGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>

              <linearGradient id="emailLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="phoneLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="exportLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="verificationLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#f3f4f6"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              dy={10}
              interval={0}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                const colorMap = {
                  "Email usage": "#3b82f6",
                  "Phone usage": "#38bdf8",
                  "Export usage": "#10b981",
                  "Verification usage": "#f59e0b",
                };

                const verificationEntry = payload.find(
                  (p) => p.name === "Verification usage",
                );

                const fullPayload = [
                  ...payload.map((p) => ({
                    ...p,
                    color: colorMap[p.name] || p.color,
                  })),
                  {
                    name: "Verification credits",
                    value: verificationEntry?.value || 0,
                    extra: "",
                    color: "#f59e0b",
                  },
                ];

                return (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #f3f4f6",
                      borderRadius: "12px",
                      boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                      padding: "12px",
                      minWidth: "220px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {label}
                    </div>

                    {fullPayload.map((entry, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "4px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: entry.color,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: entry.color,
                          }}
                        />
                        <span>
                          {entry.name}: {entry.value.toLocaleString()}
                          {entry.extra && entry.extra}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 10 }}
            />

            <Area
              type="monotone"
              dataKey="email"
              name="Email usage"
              stroke="url(#emailLine)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#emailGradient)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="phone"
              name="Phone usage"
              stroke="url(#phoneLine)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#phoneGradient)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="export"
              name="Export usage"
              stroke="url(#exportLine)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#exportGradient)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="verification"
              name="Verification usage"
              stroke="url(#verificationLine)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#verificationGradient)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Stats — UNCHANGED */}
      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">
              AVG. DAILY
            </span>
            <b className="text-gray-900">{avg.toLocaleString()}</b>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">PEAK</span>
            <b className="text-gray-900">{peak.toLocaleString()}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
