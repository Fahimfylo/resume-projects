import type { LiveThreatFeedEntry, ThreatFeedSummary } from '@/types/security/threat-intel';

const THREAT_ACTORS = [
  'APT29 (Cozy Bear)', 'Lazarus Group', 'UNC1878', 'TA505',
  'FIN7', 'Wizard Spider', 'Sandworm', 'Kimsuky',
];

const MALWARE_FAMILIES = [
  'Emotet', 'TrickBot', 'Conti', 'LockBit 3.0', 'BlackCat',
  'QakBot', 'IcedID', 'BumbleBee', 'Raccoon Stealer',
];

const RECENT_CVES = [
  'CVE-2026-0189', 'CVE-2026-0123', 'CVE-2025-49124',
  'CVE-2026-0051', 'CVE-2025-48763',
];

function generateFeedEntry(offset: number): LiveThreatFeedEntry {
  const sources: LiveThreatFeedEntry['source'][] = [
    'AlienVault OTX', 'MISP', 'VirusTotal', 'Aegis HoneyNet', 'Dark Web Monitor',
  ];

  const categories: LiveThreatFeedEntry['category'][] = [
    'malware', 'phishing', 'c2', 'vulnerability', 'botnet', 'apt', 'ransomware',
  ];

  const severities: LiveThreatFeedEntry['severity'][] = ['low', 'medium', 'high', 'critical'];
  const indicatorTypes = ['ip', 'domain', 'hash', 'url'] as const;

  const seed = offset % 7;

  const entries: LiveThreatFeedEntry[] = [
    {
      id: `feed-${Date.now()}-${offset}`,
      timestamp: new Date(Date.now() - offset * 3600000).toISOString(),
      source: sources[offset % sources.length],
      title: `C${offset}: New ${categories[seed]} campaign targeting enterprises`,
      description: `Analysis reveals ongoing ${categories[seed]} operation using ${MALWARE_FAMILIES[offset % MALWARE_FAMILIES.length]} variants. Affected sectors include finance, healthcare, and government.`,
      severity: severities[offset % severities.length],
      category: categories[seed],
      indicatorType: indicatorTypes[offset % indicatorTypes.length],
      indicatorValue: offset % 2 === 0 ? `185.${offset}.${100 + offset}.1` : `malicious-${offset}.xyz`,
      mitreTechnique: seed === 0 ? 'T1059.001' : seed === 1 ? 'T1566.002' : 'T1071.001',
      tags: [categories[seed], severities[offset % severities.length], MALWARE_FAMILIES[offset % MALWARE_FAMILIES.length]],
    },
    {
      id: `feed-${Date.now()}-${offset + 100}`,
      timestamp: new Date(Date.now() - (offset + 1) * 1800000).toISOString(),
      source: sources[(offset + 2) % sources.length],
      title: `${THREAT_ACTORS[offset % THREAT_ACTORS.length]} linked to new ${RECENT_CVES[offset % RECENT_CVES.length]} exploitation`,
      description: `Threat actor ${THREAT_ACTORS[offset % THREAT_ACTORS.length]} observed exploiting ${RECENT_CVES[offset % RECENT_CVES.length]} in the wild. Initial access through spear-phishing with malicious documents.`,
      severity: severities[(offset + 2) % severities.length],
      category: categories[(seed + 1) % categories.length],
      indicatorType: 'hash',
      indicatorValue: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      mitreTechnique: 'T1190',
      tags: [THREAT_ACTORS[offset % THREAT_ACTORS.length], RECENT_CVES[offset % RECENT_CVES.length], 'exploit'],
    },
    {
      id: `feed-${Date.now()}-${offset + 200}`,
      timestamp: new Date(Date.now() - (offset + 1) * 7200000).toISOString(),
      source: sources[(offset + 4) % sources.length],
      title: `Phishing kit targeting ${['Microsoft 365', 'Google Workspace', 'AWS Console', 'GitHub OAuth'][offset % 4]} credentials`,
      description: `Sophisticated phishing kit detected in the wild using reverse proxy technique to bypass MFA. Kit hosted on ${offset % 2 === 0 ? 'compromised WordPress sites' : 'bulletproof hosting providers'}.`,
      severity: 'high',
      category: 'phishing',
      indicatorType: 'url',
      indicatorValue: `https://${['secure-login', 'account-verify', 'mfa-update', 'portal-auth'][offset % 4]}-${offset}.com`,
      mitreTechnique: 'T1566.002',
      tags: ['phishing', 'mfa-bypass', 'credential-theft'],
    },
  ];

  return entries[offset % entries.length];
}

export function getLiveThreatFeed(limit: number = 20): LiveThreatFeedEntry[] {
  const feed: LiveThreatFeedEntry[] = [];
  for (let i = 0; i < limit; i++) {
    feed.push(generateFeedEntry(i));
  }
  return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getThreatFeedSummary(feed: LiveThreatFeedEntry[]): ThreatFeedSummary {
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byCategory: Record<string, number> = {};

  for (const entry of feed) {
    bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
  }

  const topIndicators = feed
    .filter(e => e.indicatorValue)
    .slice(0, 5)
    .map(e => ({
      type: e.indicatorType || 'unknown',
      value: e.indicatorValue || '',
      score: e.severity === 'critical' ? 90 : e.severity === 'high' ? 70 : e.severity === 'medium' ? 40 : 15,
    }));

  const campaigns = [...new Set(feed.map(e => {
    const match = e.title.match(/New\s+(.+?)\s+(campaign|targeting)/);
    return match ? match[1] : e.category;
  }))].slice(0, 5);

  return {
    totalThreats: feed.length,
    bySeverity,
    byCategory,
    topIndicators,
    recentCampaigns: campaigns,
  };
}
