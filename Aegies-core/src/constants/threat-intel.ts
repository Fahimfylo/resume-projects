import type { ThreatBulletin, ActiveVector } from "@/types";

export const STATIC_THREATS: ThreatBulletin[] = [
  { id: 1, title: "CVE-2025-0192: Critical RCE in legacy webservers", date: "4h ago", category: "Vulnerability" },
  { id: 2, title: "Botnet 'Mirai-X' targeting unsecured industrial IoT", date: "8h ago", category: "Malware" },
  { id: 3, title: "Phishing campaign spoofing Enterprise MFA prompts", date: "12h ago", category: "Phishing" },
];

export const ACTIVE_VECTORS: ActiveVector[] = [
  { label: "Credential Harvesting", val: 82, color: "bg-primary" },
  { label: "Supply Chain Infiltration", val: 45, color: "bg-accent" },
  { label: "Zero-Day Exploitation", val: 12, color: "bg-destructive" },
];

export const TELEMETRY_SOURCES = [
  'AlienVault OTX',
  'MISP Open Intel',
  'Aegis Core HoneyNet',
  'VirusTotal Live',
];
