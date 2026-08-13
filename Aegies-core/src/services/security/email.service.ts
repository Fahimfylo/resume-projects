import {
  URGENCY_KEYWORDS, LOGIN_KEYWORDS, FINANCIAL_KEYWORDS,
  PERSONAL_INFO_KEYWORDS, MALICIOUS_KEYWORDS,
  SUSPICIOUS_TLDs, TRUSTED_DOMAINS, SIMULATED_SPF_RECORDS,
} from '@/constants/security';
import type {
  EmailAnalysisInput, EmailAnalysisOutput,
  EmailUrlFinding, KeywordFlag,
} from '@/types/security';
import { aiEmailPhishingAnalysis } from '@/ai/flows/security/ai-email-phishing';

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"']+|(?:www\.)[^\s<>"']+/gi;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

function scoreUrlRisk(url: string): { score: number; label: string } {
  let score = 0;
  const lowerUrl = url.toLowerCase();

  if (SUSPICIOUS_TLDs.some(tld => lowerUrl.endsWith(tld))) {
    score += 35;
  }

  const trustedDomainMatch = TRUSTED_DOMAINS.some(d =>
    lowerUrl.includes(d) && !lowerUrl.startsWith(`https://${d}`) && !lowerUrl.startsWith(`http://${d}`)
  );
  if (trustedDomainMatch) {
    score += 30;
  }

  const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  if (ipPattern.test(lowerUrl)) {
    score += 25;
  }

  if (lowerUrl.includes('@')) {
    score += 20;
  }

  if (/\d{5,}/.test(lowerUrl)) {
    score += 10;
  }

  if (lowerUrl.split('/').length > 6) {
    score += 15;
  }

  const label = score > 70 ? 'High' : score > 40 ? 'Medium' : score > 15 ? 'Low' : 'Safe';
  return { score: Math.min(score, 100), label };
}

function detectTyposquatting(domain: string): string[] {
  const matches: string[] = [];
  const lower = domain.toLowerCase();

  for (const trusted of TRUSTED_DOMAINS) {
    const base = trusted.split('.')[0];

    const levenshteinDistance = (a: string, b: string): number => {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
      return dp[m][n];
    };

    for (const part of lower.split(/[.\-]/)) {
      if (part.includes(base) && part.length <= base.length + 4 && part !== base) {
        matches.push(`${part} → ${trusted}`);
        break;
      }
      if (levenshteinDistance(part, base) <= 2 && part !== base && part.length > 3) {
        matches.push(`${part} → ${trusted}`);
        break;
      }
    }
  }

  return [...new Set(matches)];
}

function simulateSPFCheck(senderDomain: string): 'pass' | 'fail' | 'neutral' | 'none' {
  const record = SIMULATED_SPF_RECORDS[senderDomain];
  if (!record) return 'neutral';
  return record.includes('-all') ? 'pass' : 'neutral';
}

function simulateDKIMCheck(): 'pass' | 'fail' | 'neutral' | 'none' {
  return Math.random() > 0.2 ? 'pass' : 'neutral';
}

function simulateDMARCCheck(): 'pass' | 'fail' | 'neutral' | 'none' {
  return Math.random() > 0.25 ? 'pass' : 'neutral';
}

function detectKeywords(text: string): KeywordFlag[] {
  const lower = text.toLowerCase();
  const flags: KeywordFlag[] = [];

  for (const kw of URGENCY_KEYWORDS) {
    if (lower.includes(kw)) flags.push({ keyword: kw, category: 'urgency', severity: 20 });
  }
  for (const kw of LOGIN_KEYWORDS) {
    if (lower.includes(kw)) flags.push({ keyword: kw, category: 'login', severity: 15 });
  }
  for (const kw of FINANCIAL_KEYWORDS) {
    if (lower.includes(kw)) flags.push({ keyword: kw, category: 'financial', severity: 15 });
  }
  for (const kw of PERSONAL_INFO_KEYWORDS) {
    if (lower.includes(kw)) flags.push({ keyword: kw, category: 'personal_info', severity: 25 });
  }
  for (const kw of MALICIOUS_KEYWORDS) {
    if (lower.includes(kw)) flags.push({ keyword: kw, category: 'malicious', severity: 20 });
  }

  return flags;
}

function extractSenderDomain(sender: string): string {
  const match = sender.match(/@([^\s>]+)/);
  return match ? match[1].toLowerCase() : '';
}

export function analyzeEmailHeuristics(input: EmailAnalysisInput): {
  spfStatus: string;
  dkimStatus: string;
  dmarcStatus: string;
  urlsFound: EmailUrlFinding[];
  typosquattingDetected: boolean;
  typosquattingMatches: string[];
  keywordFlags: KeywordFlag[];
  heuristicScore: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let heuristicScore = 0;

  const senderDomain = extractSenderDomain(input.sender);
  const spfStatus = simulateSPFCheck(senderDomain);
  const dkimStatus = simulateDKIMCheck();
  const dmarcStatus = simulateDMARCCheck();

  if (spfStatus === 'fail') {
    heuristicScore += 25;
    reasons.push('SPF validation failed — sender domain not authorized');
  }
  if (dkimStatus === 'fail') {
    heuristicScore += 15;
    reasons.push('DKIM signature invalid — email may have been tampered');
  }
  if (dmarcStatus === 'fail') {
    heuristicScore += 15;
    reasons.push('DMARC policy not aligned — domain spoofing possible');
  }

  const keywordFlags = detectKeywords(`${input.subject} ${input.body}`);
  const urgencyCount = keywordFlags.filter(k => k.category === 'urgency').length;
  const loginCount = keywordFlags.filter(k => k.category === 'login').length;
  const personalInfoCount = keywordFlags.filter(k => k.category === 'personal_info').length;

  if (urgencyCount > 2) {
    heuristicScore += 15;
    reasons.push(`Multiple urgency keywords detected (${urgencyCount}) — social engineering indicator`);
  }
  if (loginCount > 1) {
    heuristicScore += 10;
    reasons.push('Login/credential related keywords — possible credential phishing');
  }
  if (personalInfoCount > 0) {
    heuristicScore += 20;
    reasons.push('Request for personal identifiable information detected');
  }
  if (keywordFlags.some(k => k.category === 'financial')) {
    heuristicScore += 10;
    reasons.push('Financial language detected — possible invoice/billing scam');
  }

  const urlStrings = extractUrls(`${input.body} ${input.rawHeaders || ''}`);
  const urlsFound: EmailUrlFinding[] = urlStrings.map(url => {
    const { score, label } = scoreUrlRisk(url);
    return { url, riskScore: score, riskLabel: label };
  });

  const highRiskUrls = urlsFound.filter(u => u.riskScore > 50);
  if (highRiskUrls.length > 0) {
    heuristicScore += 10 * Math.min(highRiskUrls.length, 3);
    reasons.push(`Found ${highRiskUrls.length} suspicious URL(s) in email`);
  }

  const fullText = `${input.subject} ${input.body} ${input.rawHeaders || ''}`;
  const allDomains = [...new Set(urlStrings.map(u => {
    try { return new URL(u).hostname; } catch { return ''; }
  }).filter(Boolean))];

  let typosquattingDetected = false;
  const typosquattingMatches: string[] = [];
  for (const domain of allDomains) {
    const matches = detectTyposquatting(domain);
    if (matches.length > 0) {
      typosquattingDetected = true;
      typosquattingMatches.push(...matches);
    }
  }
  if (typosquattingDetected) {
    heuristicScore += 25;
    reasons.push('Typosquatting detected — domain impersonating trusted brand');
  }

  return {
    spfStatus, dkimStatus, dmarcStatus,
    urlsFound, typosquattingDetected, typosquattingMatches,
    keywordFlags, heuristicScore: Math.min(heuristicScore, 100), reasons,
  };
}

export async function analyzeEmailFull(input: EmailAnalysisInput): Promise<EmailAnalysisOutput> {
  const heuristics = analyzeEmailHeuristics(input);

  let aiAssessment: {
    summary: string;
    intent: string;
    socialEngineeringScore: number;
  } | undefined;
  try {
    const aiResult = await aiEmailPhishingAnalysis({
      subject: input.subject,
      body: input.body,
      sender: input.sender,
    });
    aiAssessment = {
      summary: aiResult.assessment,
      intent: aiResult.intentAnalysis,
      socialEngineeringScore: aiResult.socialEngineeringScore,
    };
  } catch {
    // AI analysis is optional; fall back to heuristics
  }

  const combinedScore = aiAssessment
    ? Math.round(heuristics.heuristicScore * 0.6 + aiAssessment.socialEngineeringScore * 0.4)
    : heuristics.heuristicScore;

  const riskLevel = combinedScore > 80 ? 'Critical' : combinedScore > 60 ? 'High' : combinedScore > 30 ? 'Medium' : combinedScore > 15 ? 'Low' : 'Safe';

  const recommendedActions: string[] = [];
  if (combinedScore > 30) {
    recommendedActions.push('Do not click any links or open attachments in this email');
    recommendedActions.push('Verify sender identity through a separate communication channel');
    recommendedActions.push('Report the email to your security team');
  }
  if (heuristics.typosquattingDetected) {
    recommendedActions.push('Check the actual sender domain carefully for lookalike characters');
  }
  if (combinedScore < 30) {
    recommendedActions.push('No immediate action required, but remain vigilant');
  }

  const reasons = heuristics.reasons;
  if (aiAssessment) {
    reasons.push(`AI analysis: ${aiAssessment.summary}`);
  }

  return {
    riskScore: combinedScore,
    riskLevel,
    reasons: reasons.slice(0, 10),
    recommendedActions,
    spfStatus: heuristics.spfStatus as EmailAnalysisOutput['spfStatus'],
    dkimStatus: heuristics.dkimStatus as EmailAnalysisOutput['dkimStatus'],
    dmarcStatus: heuristics.dmarcStatus as EmailAnalysisOutput['dmarcStatus'],
    urlsFound: heuristics.urlsFound,
    typosquattingDetected: heuristics.typosquattingDetected,
    typosquattingMatches: heuristics.typosquattingMatches,
    keywordFlags: heuristics.keywordFlags,
    aiAssessment,
  };
}
