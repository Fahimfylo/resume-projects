import { Shield, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import type { DashboardStat, ChartDataPoint, SystemHealthItem, AlertItem } from "@/types";

export const DASHBOARD_STATS: DashboardStat[] = [
  { label: "Total Files Scanned", value: "1,284", icon: Shield, trend: "+12%", color: "text-primary" },
  { label: "Threats Blocked", value: "43", icon: AlertTriangle, trend: "+5%", color: "text-destructive" },
  { label: "Safe Domains", value: "892", icon: CheckCircle, trend: "+8%", color: "text-green-500" },
  { label: "Risk Score Index", value: "14/100", icon: Activity, trend: "-2%", color: "text-accent" },
];

export const CHART_DATA: ChartDataPoint[] = [
  { name: 'Mon', scans: 45, threats: 2 },
  { name: 'Tue', scans: 52, threats: 5 },
  { name: 'Wed', scans: 38, threats: 1 },
  { name: 'Thu', scans: 65, threats: 12 },
  { name: 'Fri', scans: 48, threats: 3 },
  { name: 'Sat', scans: 24, threats: 0 },
  { name: 'Sun', scans: 31, threats: 1 },
];

export const SYSTEM_HEALTH: SystemHealthItem[] = [
  { label: "Database Sync", value: "Synced", progress: 100, color: "bg-green-500" },
  { label: "Heuristic Accuracy", value: "98.4%", progress: 98, color: "bg-primary" },
  { label: "CPU Usage", value: "24%", progress: 24, color: "bg-accent" },
];

export const RECENT_ALERTS: AlertItem[] = [
  { type: 'File Blocked', target: 'invoice.pdf.exe', time: '2m ago' },
  { type: 'Phishing Detected', target: 'login-secure.xyz', time: '15m ago' },
];
