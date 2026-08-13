export type DashboardStat = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  color: string;
};

export type ChartDataPoint = {
  name: string;
  scans: number;
  threats: number;
};

export type SystemHealthItem = {
  label: string;
  value: string;
  progress: number;
  color: string;
};

export type AlertItem = {
  type: string;
  target: string;
  time: string;
};
