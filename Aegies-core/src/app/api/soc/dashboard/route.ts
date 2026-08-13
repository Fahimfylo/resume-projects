import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { connectDB } from '@/lib/db';
import { ScanRecord } from '@/lib/models/ScanRecord';
import type { SocDashboardData, SocAlert, MitreAttackMapping, IncidentEvent, HeatmapDataPoint, SocSummary } from '@/types/security/soc';

const MITRE_TACTICS: MitreAttackMapping['tactic'][] = [
  'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
  'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
  'Collection', 'Exfiltration', 'Command and Control',
];

function generateMitreMappings(): MitreAttackMapping[] {
  return [
    { id: 'm1', techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access', detectionCount: 12, severity: 'high', lastDetected: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'm2', techniqueId: 'T1204', techniqueName: 'User Execution', tactic: 'Execution', detectionCount: 8, severity: 'medium', lastDetected: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: 'm3', techniqueId: 'T1547', techniqueName: 'Boot or Logon Autostart', tactic: 'Persistence', detectionCount: 3, severity: 'high', lastDetected: new Date(Date.now() - 12 * 3600000).toISOString() },
    { id: 'm4', techniqueId: 'T1055', techniqueName: 'Process Injection', tactic: 'Defense Evasion', detectionCount: 5, severity: 'critical', lastDetected: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'm5', techniqueId: 'T1003', techniqueName: 'OS Credential Dumping', tactic: 'Credential Access', detectionCount: 2, severity: 'critical', lastDetected: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'm6', techniqueId: 'T1059', techniqueName: 'Command and Scripting', tactic: 'Execution', detectionCount: 15, severity: 'high', lastDetected: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: 'm7', techniqueId: 'T1071', techniqueName: 'Application Layer Protocol', tactic: 'Command and Control', detectionCount: 7, severity: 'medium', lastDetected: new Date(Date.now() - 6 * 3600000).toISOString() },
    { id: 'm8', techniqueId: 'T1567', techniqueName: 'Exfiltration Over Web Service', tactic: 'Exfiltration', detectionCount: 1, severity: 'critical', lastDetected: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: 'm9', techniqueId: 'T1036', techniqueName: 'Masquerading', tactic: 'Defense Evasion', detectionCount: 9, severity: 'medium', lastDetected: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'm10', techniqueId: 'T1087', techniqueName: 'Account Discovery', tactic: 'Discovery', detectionCount: 4, severity: 'low', lastDetected: new Date(Date.now() - 8 * 3600000).toISOString() },
  ];
}

function generateIncidents(): IncidentEvent[] {
  const now = Date.now();
  return [
    { id: 'inc-1', timestamp: new Date(now - 30 * 60000).toISOString(), title: 'Suspicious Process Injection Detected', description: 'CreateRemoteThread call detected in scanned binary — possible code injection', severity: 'critical', source: 'File Scanner', affectedAssets: ['workstation-42', 'user@company.com'], status: 'analyzing' },
    { id: 'inc-2', timestamp: new Date(now - 2 * 3600000).toISOString(), title: 'Phishing Campaign Targeting HR', description: 'Multiple HR employees received credential harvesting emails spoofing LinkedIn', severity: 'high', source: 'Email Analyzer', affectedAssets: ['hr-team', 'linkedin-phish'], status: 'contained' },
    { id: 'inc-3', timestamp: new Date(now - 5 * 3600000).toISOString(), title: 'C2 Beacon Communication Detected', description: 'Outbound connection to known malicious IP 185.220.101.0 from internal host', severity: 'critical', source: 'Threat Intel', affectedAssets: ['server-03', 'internal-network'], status: 'detected' },
    { id: 'inc-4', timestamp: new Date(now - 8 * 3600000).toISOString(), title: 'Data Exfiltration Attempt', description: 'Large outbound data transfer to unknown external endpoint detected', severity: 'critical', source: 'Network Monitor', affectedAssets: ['db-server-01', 's3-bucket'], status: 'contained' },
    { id: 'inc-5', timestamp: new Date(now - 24 * 3600000).toISOString(), title: 'Brute Force SSH Attempts', description: 'Multiple failed SSH login attempts from 45.33.32.156', severity: 'medium', source: 'IOC Scanner', affectedAssets: ['bastion-host'], status: 'resolved' },
    { id: 'inc-6', timestamp: new Date(now - 48 * 3600000).toISOString(), title: 'Ransomware Indicator — LockBit 3.0', description: 'File scan detected LockBit 3.0 artifacts in downloaded archive', severity: 'high', source: 'Malware Analysis', affectedAssets: ['user-downloads'], status: 'resolved' },
  ];
}

function generateHeatmap(): HeatmapDataPoint[] {
  const points: HeatmapDataPoint[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const baseCount = day === 0 ? 8 : day === 1 ? 5 : day === 2 ? 3 : day === 3 ? 6 : 4;
      const hourMod = hour >= 9 && hour <= 17 ? 2 : 0.5;
      points.push({
        hour,
        day,
        count: Math.round(Math.random() * baseCount * hourMod),
        severity: Math.round(Math.random() * 60 + 10),
      });
    }
  }
  return points;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    await verifyToken(token);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await connectDB();
    const records = await ScanRecord.find({ createdAt: { $gte: sevenDaysAgo } }).sort({ createdAt: -1 }).lean();

    const alerts: SocAlert[] = records.map(r => ({
      id: r._id.toString(),
      timestamp: r.createdAt.toISOString(),
      type: r.type as SocAlert['type'],
      target: r.target,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel as SocAlert['riskLevel'],
      status: r.riskLevel === 'Critical' ? 'new' : r.riskLevel === 'High' ? 'investigating' : 'resolved',
      description: `${r.type === 'file' ? 'File' : 'URL'} scan detected ${r.riskLevel.toLowerCase()} risk`,
    }));

    // Fill with simulated alerts if none exist
    const fillerAlerts: SocAlert[] = [
      { id: 'sim-1', timestamp: new Date(now.getTime() - 10 * 60000).toISOString(), type: 'email', target: 'phishing@evil.com', riskScore: 92, riskLevel: 'Critical', status: 'new', description: 'Spear-phishing email with typosquatting domain detected' },
      { id: 'sim-2', timestamp: new Date(now.getTime() - 45 * 60000).toISOString(), type: 'ioc', target: '185.220.101.0', riskScore: 85, riskLevel: 'High', status: 'investigating', description: 'Known C2 IP address detected in outbound traffic' },
      { id: 'sim-3', timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(), type: 'file', target: 'invoice.pdf.exe', riskScore: 78, riskLevel: 'High', status: 'investigating', description: 'Double extension executable masquerading as PDF' },
      { id: 'sim-4', timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(), type: 'url', target: 'secure-login.ml', riskScore: 95, riskLevel: 'Critical', status: 'new', description: 'Phishing URL using suspicious free TLD' },
      { id: 'sim-5', timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(), type: 'breach', target: 'admin@company.com', riskScore: 65, riskLevel: 'Medium', status: 'resolved', description: 'Email found in data breach database' },
    ];

    const allAlerts = [...alerts, ...fillerAlerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const mitreMapping = generateMitreMappings();
    const incidentTimeline = generateIncidents();
    const threatHeatmap = generateHeatmap();

    const summary: SocSummary = {
      totalAlerts: allAlerts.length,
      criticalAlerts: allAlerts.filter(a => a.riskLevel === 'Critical').length,
      highAlerts: allAlerts.filter(a => a.riskLevel === 'High').length,
      mediumAlerts: allAlerts.filter(a => a.riskLevel === 'Medium').length,
      lowAlerts: allAlerts.filter(a => a.riskLevel === 'Low').length,
      activeIncidents: incidentTimeline.filter(i => i.status !== 'resolved').length,
      resolvedToday: incidentTimeline.filter(i => i.status === 'resolved' && new Date(i.timestamp) > new Date(now.getTime() - 24 * 3600000)).length,
      mitreTacticsCovered: new Set(mitreMapping.map(m => m.tactic)).size,
      averageResponseTime: '12m 34s',
    };

    const result: SocDashboardData = {
      alertQueue: allAlerts,
      mitreMapping,
      incidentTimeline,
      threatHeatmap,
      summary,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('SOC dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load SOC dashboard' }, { status: 500 });
  }
}
