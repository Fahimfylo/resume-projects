export type IocCheckInput = {
  value: string;
  type: 'ip' | 'domain' | 'url' | 'hash';
};

export type IocCheckOutput = {
  value: string;
  type: 'ip' | 'domain' | 'url' | 'hash';
  confidenceScore: number;
  classification: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  category: 'malware_c2' | 'phishing' | 'botnet' | 'scanner' | 'none' | 'unknown';
  sourceReferences: IocSource[];
  reputation: string;
};

export type IocSource = {
  name: string;
  verdict: string;
  reference: string;
};
