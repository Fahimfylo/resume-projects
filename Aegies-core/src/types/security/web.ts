export type WebScanInput = {
  url: string;
};

export type WebScanOutput = {
  securityScore: number;
  sslValid: boolean;
  sslDetails: string;
  headerReport: SecurityHeaderReport;
  vulnerabilities: WebVulnerability[];
  openRedirectDetected: boolean;
  mixedContentDetected: boolean;
  whoisEstimatedAge: string;
  recommendation: string;
};

export type SecurityHeaderReport = {
  contentSecurityPolicy: boolean;
  hsts: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  details: Record<string, string>;
};

export type WebVulnerability = {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
};
