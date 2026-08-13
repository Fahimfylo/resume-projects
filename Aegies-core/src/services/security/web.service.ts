import type { WebScanInput, WebScanOutput, SecurityHeaderReport, WebVulnerability } from '@/types/security';

const SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
] as const;

function mockFetchHeaders(url: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const urlLower = url.toLowerCase();

  headers['content-security-policy'] = urlLower.includes('secure') || urlLower.includes('bank')
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    : '';
  headers['strict-transport-security'] = urlLower.includes('https') ? 'max-age=31536000; includeSubDomains' : '';
  headers['x-frame-options'] = urlLower.includes('bank') || urlLower.includes('secure') ? 'DENY' : '';
  headers['x-content-type-options'] = 'nosniff';
  headers['referrer-policy'] = 'strict-origin-when-cross-origin';
  headers['permissions-policy'] = urlLower.includes('secure') ? 'camera=(), microphone=(), geolocation=()' : '';

  return headers;
}

function mockSslCheck(url: string): { valid: boolean; details: string } {
  if (url.startsWith('https://')) {
    return {
      valid: true,
      details: 'Valid SSL certificate detected (simulated: Let\'s Encrypt, expires in 87 days)',
    };
  }
  return {
    valid: false,
    details: 'No SSL/TLS — connection is unencrypted (simulated)',
  };
}

function mockWhoisAge(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes('google') || hostname.includes('microsoft') || hostname.includes('amazon')) {
      return '20+ years (aged domain)';
    }
    if (hostname.match(/^\d/)) return 'Less than 6 months (new domain)';
    return '1-3 years (moderately aged)';
  } catch {
    return 'Unknown';
  }
}

function detectOpenRedirects(body: string): boolean {
  const openRedirectPatterns = [
    /window\.location\s*=\s*["'][^"']*["']/gi,
    /document\.location\.href\s*=\s*["'][^"']*["']/gi,
    /window\.open\(["'][^"']*["']\)/gi,
    /\.innerHTML\s*=.*(?:http|src|href)/gi,
  ];
  return openRedirectPatterns.some(p => p.test(body));
}

function detectMixedContent(body: string): boolean {
  const mixedContentPatterns = [
    /src=["']http:\/\//gi,
    /href=["']http:\/\//gi,
    /action=["']http:\/\//gi,
  ];
  return mixedContentPatterns.some(p => p.test(body));
}

function buildHeaderReport(responseHeaders: Record<string, string>): SecurityHeaderReport {
  const details: Record<string, string> = {};
  for (const header of SECURITY_HEADERS) {
    const value = responseHeaders[header] || '';
    details[header] = value || 'Not set';
  }
  return {
    contentSecurityPolicy: !!responseHeaders['content-security-policy'],
    hsts: !!responseHeaders['strict-transport-security'],
    xFrameOptions: !!responseHeaders['x-frame-options'],
    xContentTypeOptions: !!responseHeaders['x-content-type-options'],
    referrerPolicy: !!responseHeaders['referrer-policy'],
    permissionsPolicy: !!responseHeaders['permissions-policy'],
    details,
  };
}

function assessVulnerabilities(
  url: string,
  sslValid: boolean,
  headerReport: SecurityHeaderReport,
  openRedirectDetected: boolean,
  mixedContentDetected: boolean,
): WebVulnerability[] {
  const vulnerabilities: WebVulnerability[] = [];

  if (!sslValid) {
    vulnerabilities.push({
      type: 'Missing SSL/TLS',
      severity: 'critical',
      description: 'Connection is not encrypted. All data transmitted is visible to attackers.',
      recommendation: 'Install a valid SSL certificate from a trusted CA.',
    });
  }

  if (!headerReport.contentSecurityPolicy) {
    vulnerabilities.push({
      type: 'Missing Content-Security-Policy',
      severity: 'high',
      description: 'No CSP header. Risk of XSS and data injection attacks.',
      recommendation: 'Implement a strict Content-Security-Policy header.',
    });
  }

  if (!headerReport.hsts) {
    vulnerabilities.push({
      type: 'Missing HSTS',
      severity: 'medium',
      description: 'No HTTP Strict Transport Security. Users vulnerable to SSL stripping.',
      recommendation: 'Add Strict-Transport-Security header with a long max-age.',
    });
  }

  if (!headerReport.xFrameOptions) {
    vulnerabilities.push({
      type: 'Missing X-Frame-Options',
      severity: 'medium',
      description: 'Page can be embedded in iframes — risk of clickjacking.',
      recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
    });
  }

  if (openRedirectDetected) {
    vulnerabilities.push({
      type: 'Open Redirect',
      severity: 'high',
      description: 'Page contains patterns that suggest open redirect functionality.',
      recommendation: 'Validate and sanitize all redirect parameters.',
    });
  }

  if (mixedContentDetected) {
    vulnerabilities.push({
      type: 'Mixed Content',
      severity: 'medium',
      description: 'Page loads HTTP resources over HTTPS — broken security.',
      recommendation: 'Ensure all resources are loaded over HTTPS.',
    });
  }

  return vulnerabilities;
}

export async function analyzeWebsite(input: WebScanInput): Promise<WebScanOutput> {
  const sslResult = mockSslCheck(input.url);
  const responseHeaders = mockFetchHeaders(input.url);
  const headerReport = buildHeaderReport(responseHeaders);
  const whoisAge = mockWhoisAge(input.url);

  // Simulate a small page body for checks
  const simulatedBody = `<html><body>
    <img src="http://example.com/image.jpg" />
    <script>window.location = "http://evil.com";</script>
    <a href="http://mixed-content.com">Click</a>
  </body></html>`;

  const openRedirectDetected = detectOpenRedirects(simulatedBody);
  const mixedContentDetected = detectMixedContent(simulatedBody);

  const vulnerabilities = assessVulnerabilities(
    input.url, sslResult.valid, headerReport,
    openRedirectDetected, mixedContentDetected,
  );

  // Calculate security score (higher is safer)
  const maxScore = 100;
  let deductions = 0;
  if (!sslResult.valid) deductions += 25;
  if (!headerReport.contentSecurityPolicy) deductions += 15;
  if (!headerReport.hsts) deductions += 10;
  if (!headerReport.xFrameOptions) deductions += 8;
  if (!headerReport.xContentTypeOptions) deductions += 5;
  if (!headerReport.referrerPolicy) deductions += 3;
  if (openRedirectDetected) deductions += 15;
  if (mixedContentDetected) deductions += 10;

  const securityScore = Math.max(0, maxScore - deductions);

  const recommendation = securityScore > 80
    ? 'Website has strong security posture. Continue monitoring for new vulnerabilities.'
    : securityScore > 50
      ? 'Several security improvements recommended. Prioritize SSL and security headers.'
      : 'Urgent security improvements needed. SSL and essential headers are missing.';

  return {
    securityScore,
    sslValid: sslResult.valid,
    sslDetails: sslResult.details,
    headerReport,
    vulnerabilities,
    openRedirectDetected,
    mixedContentDetected,
    whoisEstimatedAge: whoisAge,
    recommendation,
  };
}
