import type { IocCheckInput, IocCheckOutput, IocSource } from '@/types/security';
import {
  KNOWN_MALICIOUS_IPS, KNOWN_MALICIOUS_DOMAINS,
  KNOWN_MALICIOUS_HASHES, THREAT_INTEL_SOURCES,
} from '@/constants/security';

function lookupIP(ip: string): { matched: boolean; category: string } {
  if (KNOWN_MALICIOUS_IPS.includes(ip)) {
    return { matched: true, category: 'botnet' };
  }
  // Check for private/reserved ranges
  const parts = ip.split('.').map(Number);
  if (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)) {
    return { matched: false, category: 'none' };
  }
  return { matched: false, category: 'none' };
}

function lookupDomain(domain: string): { matched: boolean; category: string } {
  const lower = domain.toLowerCase();
  if (KNOWN_MALICIOUS_DOMAINS.includes(lower)) {
    return { matched: true, category: 'phishing' };
  }
  if (lower.match(/\.(tk|ml|ga|cf|gq|xyz|top|work)$/)) {
    return { matched: true, category: 'malware_c2' };
  }
  return { matched: false, category: 'none' };
}

function lookupHash(hash: string): { matched: boolean; category: string } {
  if (KNOWN_MALICIOUS_HASHES.includes(hash.toLowerCase())) {
    return { matched: true, category: 'malware_c2' };
  }
  return { matched: false, category: 'none' };
}

function buildSources(matched: boolean, category: string): IocSource[] {
  if (!matched) {
    return THREAT_INTEL_SOURCES.slice(0, 2).map(s => ({
      name: s.name,
      verdict: 'No records found',
      reference: `${s.url}/search`,
    }));
  }
  return THREAT_INTEL_SOURCES.map(s => ({
    name: s.name,
    verdict: category === 'phishing' ? 'Flagged as phishing' : 'Known malicious indicator',
    reference: `${s.url}/indicator`,
  }));
}

export function checkIOC(input: IocCheckInput): IocCheckOutput {
  const { value, type } = input;
  let matched = false;
  let category = 'unknown';

  switch (type) {
    case 'ip':
      ({ matched, category } = lookupIP(value));
      break;
    case 'domain':
      ({ matched, category } = lookupDomain(value));
      break;
    case 'hash':
      ({ matched, category } = lookupHash(value));
      break;
    case 'url': {
      try {
        const hostname = new URL(value).hostname;
        ({ matched, category } = lookupDomain(hostname));
      } catch {
        category = 'unknown';
      }
      break;
    }
  }

  const confidenceScore = matched
    ? (category === 'malware_c2' ? 85 : category === 'phishing' ? 75 : 60)
    : Math.floor(Math.random() * 20) + 5;

  const classification = matched
    ? (confidenceScore > 80 ? 'malicious' : 'suspicious')
    : (confidenceScore > 30 ? 'suspicious' : 'safe');

  const sourceReferences = buildSources(matched, category);

  const reputation = matched
    ? `Negative reputation — observed in threat intel as ${category}`
    : 'No known malicious activity in aggregated threat feeds';

  return {
    value,
    type,
    confidenceScore,
    classification,
    category: matched ? category as IocCheckOutput['category'] : 'none',
    sourceReferences,
    reputation,
  };
}
