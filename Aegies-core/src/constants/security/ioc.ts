export const KNOWN_MALICIOUS_IPS = [
  '185.220.101.0', '45.33.32.156', '104.160.16.0',
  '192.168.1.1', '10.0.0.1',
];

export const KNOWN_MALICIOUS_DOMAINS = [
  'evil.com', 'malware-host.net', 'phishing-bank.xyz',
  'free-prize.tk', 'secure-login.ml', 'update-paypal.ga',
  'download-movies.top', 'win-iphone.work',
];

export const KNOWN_MALICIOUS_HASHES = [
  'e99a18c428cb38d5f260853678922e03', 'd41d8cd98f00b204e9800998ecf8427e',
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
];

export const C2_PATTERNS = [/\.(top|work|date|men|tk|ml|ga)$/, /^\d+\.\d+\.\d+\.\d+$/];

export const THREAT_INTEL_SOURCES = [
  { name: 'AlienVault OTX', url: 'https://otx.alienvault.com' },
  { name: 'VirusTotal', url: 'https://virustotal.com' },
  { name: 'AbuseIPDB', url: 'https://abuseipdb.com' },
  { name: 'MISP', url: 'https://www.misp-project.org' },
];
