export type LiveThreatFeedEntry = {
  id: string;
  timestamp: string;
  source: 'AlienVault OTX' | 'MISP' | 'VirusTotal' | 'Aegis HoneyNet' | 'Dark Web Monitor';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'phishing' | 'c2' | 'vulnerability' | 'botnet' | 'apt' | 'ransomware';
  indicatorType?: 'ip' | 'domain' | 'hash' | 'url';
  indicatorValue?: string;
  mitreTechnique?: string;
  tags: string[];
};

export type ThreatFeedSummary = {
  totalThreats: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  topIndicators: { type: string; value: string; score: number }[];
  recentCampaigns: string[];
};
