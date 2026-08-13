"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/navigation/Navbar";
import { Search, ArrowUpRight, ArrowDownRight, Shield, AlertTriangle, CheckCircle, Activity, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardData {
  stats: {
    totalScans: number;
    fileScans: number;
    urlScans: number;
    threatsBlocked: number;
    safeItems: number;
    avgRisk: number;
    trendThreats: string;
    threatDiff: number;
    trendSafe: string;
    safeDiff: number;
  };
  chartData: { name: string; scans: number; threats: number }[];
  alerts: { type: string; target: string; time: string }[];
}

const statCards = [
  {
    label: "Total Scans",
    key: "totalScans" as const,
    icon: Shield,
    format: (v: number) => v.toLocaleString(),
    color: "text-primary",
    trendKey: null as null,
    sub: (d: DashboardData) => `${d.stats.fileScans} file, ${d.stats.urlScans} url`,
  },
  {
    label: "Threats Blocked",
    key: "threatsBlocked" as const,
    icon: AlertTriangle,
    format: (v: number) => v.toLocaleString(),
    color: "text-destructive",
    trendKey: { diff: "threatDiff" as const, dir: "trendThreats" as const },
  },
  {
    label: "Safe Items",
    key: "safeItems" as const,
    icon: CheckCircle,
    format: (v: number) => v.toLocaleString(),
    color: "text-green-500",
    trendKey: { diff: "safeDiff" as const, dir: "trendSafe" as const },
  },
  {
    label: "Risk Score Index",
    key: "avgRisk" as const,
    icon: Activity,
    format: (v: number) => `${v}/100`,
    color: "text-accent",
    trendKey: null,
  },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchDashboard]);

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold">Security Overview</h1>
            <p className="text-muted-foreground">
              Welcome back, Agent. System status:{" "}
              <span className="text-green-500 font-medium">
                {loading ? "Loading..." : data ? "Optimal" : "No Data"}
              </span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setRefreshing(true); fetchDashboard(true); }}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-muted-foreground rounded-lg hover:bg-white/10 transition-all font-medium text-sm border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Link href="/scanner/file">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium text-sm">
                <Search className="w-4 h-4" /> New File Scan
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => {
                const value = data.stats[stat.key];
                const trendValue = stat.trendKey
                  ? `${data.stats[stat.trendKey.dir]}${data.stats[stat.trendKey.diff]}%`
                  : undefined;
                const isUp = trendValue?.startsWith("+");
                return (
                  <Card key={stat.label} className="glass-dark border-white/5">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                        {trendValue && (
                          <span className={`text-xs font-bold flex items-center gap-1 ${isUp ? "text-green-500" : "text-primary"}`}>
                            {trendValue} {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold font-headline">{stat.format(value)}</p>
                        {"sub" in stat && data && <p className="text-xs text-muted-foreground">{stat.sub!(data)}</p>}
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Threat Activity Timeline</CardTitle>
                  <CardDescription>Daily scanning volume vs. detected threats</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] w-full pt-4">
                  {data.chartData.some(d => d.scans > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="name" stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0A0C16', borderColor: '#ffffff10', borderRadius: 8 }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#9CA3AF', fontSize: 12 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="scans"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorScans)"
                          dot={{ r: 4, fill: "#3B82F6", stroke: "#0A0C16", strokeWidth: 2 }}
                          label={{ position: "top", fill: "#9CA3AF", fontSize: 11, offset: 5 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="threats"
                          stroke="#EF4444"
                          strokeWidth={2}
                          fill="transparent"
                          dot={{ r: 4, fill: "#EF4444", stroke: "#0A0C16", strokeWidth: 2 }}
                          label={{ position: "top", fill: "#EF4444", fontSize: 11, offset: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No scan data for the last 7 days
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">System Health</CardTitle>
                  <CardDescription>Real-time defensive posture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Database Sync</span>
                      <span className="text-green-500 font-medium">Synced</span>
                    </div>
                    <Progress value={100} className="h-1 bg-white/5" indicatorClassName="bg-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Threat Detection Rate</span>
                      <span className="text-destructive font-medium">
                        {data.stats.totalScans > 0
                          ? `${Math.round((data.stats.threatsBlocked / data.stats.totalScans) * 100)}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{data.stats.threatsBlocked}/{data.stats.totalScans} threats</span>
                      <span>{data.stats.totalScans} total scans</span>
                    </div>
                    <Progress
                      value={data.stats.totalScans > 0 ? Math.round((data.stats.threatsBlocked / data.stats.totalScans) * 100) : 0}
                      className="h-1 bg-white/5"
                      indicatorClassName="bg-destructive"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Safe Rate</span>
                      <span className="text-green-500 font-medium">
                        {data.stats.totalScans > 0
                          ? `${Math.round((data.stats.safeItems / data.stats.totalScans) * 100)}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{data.stats.safeItems}/{data.stats.totalScans} safe</span>
                      <span>{data.stats.totalScans} total scans</span>
                    </div>
                    <Progress
                      value={data.stats.totalScans > 0 ? Math.round((data.stats.safeItems / data.stats.totalScans) * 100) : 0}
                      className="h-1 bg-white/5"
                      indicatorClassName="bg-green-500"
                    />
                  </div>
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">By Scan Type</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">File Scans</span>
                      <span className="font-medium">{data.stats.fileScans}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">URL Scans</span>
                      <span className="font-medium">{data.stats.urlScans}</span>
                    </div>
                  </div>

                  {data.alerts.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Alerts</h4>
                      <div className="space-y-4">
                        {data.alerts.map((alert, i) => (
                          <div key={i} className="flex gap-3 items-center">
                            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{alert.type}</p>
                              <p className="text-xs text-muted-foreground truncate">{alert.target}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{alert.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No scan data yet. Run a scan to see your dashboard stats.
          </div>
        )}
      </main>
    </div>
  );
}
