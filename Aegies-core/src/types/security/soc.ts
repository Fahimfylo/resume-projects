export type SocDashboardData = {
  alertQueue: SocAlert[];
  mitreMapping: MitreAttackMapping[];
  incidentTimeline: IncidentEvent[];
  threatHeatmap: HeatmapDataPoint[];
  summary: SocSummary;
};

export type SocAlert = {
  id: string;
  timestamp: string;
  type: 'file' | 'url' | 'email' | 'ioc' | 'breach';
  target: string;
  riskScore: number;
  riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  description: string;
};

export type MitreAttackMapping = {
  id: string;
  techniqueId: string;
  techniqueName: string;
  tactic: MitreTactic;
  detectionCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastDetected: string;
};

export type MitreTactic =
  | 'Initial Access'
  | 'Execution'
  | 'Persistence'
  | 'Privilege Escalation'
  | 'Defense Evasion'
  | 'Credential Access'
  | 'Discovery'
  | 'Lateral Movement'
  | 'Collection'
  | 'Exfiltration'
  | 'Command and Control';

export type IncidentEvent = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  affectedAssets: string[];
  status: 'detected' | 'analyzing' | 'contained' | 'resolved';
};

export type HeatmapDataPoint = {
  hour: number;
  day: number;
  count: number;
  severity: number;
};
export type SocSummary = {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  activeIncidents: number;
  resolvedToday: number;
  mitreTacticsCovered: number;
  averageResponseTime: string;
};
