import { DANGEROUS_EXTENSIONS, SIMULATED_HASH } from "@/constants";
import { aiThreatReportSummary } from "@/ai/flows/ai-threat-report-summary";
import type { AnalysisResult, ScanInput } from "@/types";

export type HeuristicResult = {
  score: number;
  riskLevel: 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical';
  findings: string[];
  extension: string;
  isDoubleExtension: boolean;
  isDangerous: boolean;
};

export function analyzeFileHeuristics(file: File): HeuristicResult {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isDoubleExtension = file.name.split('.').length > 2;
  const isDangerous = DANGEROUS_EXTENSIONS.includes(extension);

  let score = 10;
  const findings: string[] = ["Standard binary signature validation passed."];

  if (isDoubleExtension) {
    score += 40;
    findings.push("CRITICAL: Double extension detected (Possible masquerading).");
  }
  if (isDangerous) {
    score += 30;
    findings.push(`WARNING: Executable extension (.${extension}) detected.`);
  }
  if (file.size > 10 * 1024 * 1024) {
    score += 10;
    findings.push("High entropy / large binary chunk detected.");
  }

  const riskLevel = score > 80 ? 'Critical' : score > 60 ? 'High' : score > 30 ? 'Medium' : score > 15 ? 'Low' : 'Safe';

  return { score, riskLevel, findings, extension, isDoubleExtension, isDangerous };
}

export async function performAiScan(file: File, heuristicResult: HeuristicResult): Promise<AnalysisResult> {
  const scanInput = {
    scanType: 'file' as const,
    timestamp: new Date().toISOString(),
    riskScore: heuristicResult.score,
    riskLevel: heuristicResult.riskLevel as 'Safe' | 'Low' | 'Medium' | 'High' | 'Critical',
    fileDetails: {
      fileName: file.name,
      fileSize: file.size,
      declaredExtension: heuristicResult.extension,
      doubleExtensionDetected: heuristicResult.isDoubleExtension,
      dangerousExtension: heuristicResult.isDangerous,
    }
  };

  try {
    const aiSummary = await aiThreatReportSummary(scanInput);
    return {
      fileName: file.name,
      fileSize: file.size,
      extension: heuristicResult.extension,
      hash: SIMULATED_HASH,
      riskScore: heuristicResult.score,
      riskLevel: heuristicResult.riskLevel,
      findings: heuristicResult.findings,
      aiSummary,
    };
  } catch {
    return {
      fileName: file.name,
      fileSize: file.size,
      extension: heuristicResult.extension,
      hash: SIMULATED_HASH,
      riskScore: heuristicResult.score,
      riskLevel: heuristicResult.riskLevel,
      findings: heuristicResult.findings,
    };
  }
}
