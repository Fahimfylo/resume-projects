'use server';
/**
 * @fileOverview This file implements a Genkit flow that generates a human-readable security advisory
 * by summarizing complex file or URL scan results. It highlights detected threats, explains their
 * implications, and provides personalized mitigation recommendations.
 *
 * - aiThreatReportSummary - A function that triggers the AI-generated threat report summary.
 * - ThreatReportSummaryInput - The input type for the aiThreatReportSummary function.
 * - ThreatReportSummaryOutput - The return type for the aiThreatReportSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ThreatReportSummaryInputSchema = z.object({
  scanType: z.enum(['file', 'url']).describe('Type of scan performed: "file" or "url".'),
  timestamp: z.string().datetime().describe('Timestamp of when the scan was performed.'),
  riskScore: z.number().int().min(0).max(100).describe('Overall risk score (0-100).'),
  riskLevel: z.enum(['Safe', 'Low', 'Medium', 'High', 'Critical']).describe('Categorical risk level.'),

  // File Scan Specifics (optional)
  fileDetails: z.object({
    fileName: z.string().optional().describe('Name of the scanned file.'),
    fileHash: z.string().optional().describe('SHA256 hash of the scanned file.'),
    fileSize: z.number().int().optional().describe('Size of the file in bytes.'),
    declaredExtension: z.string().optional().describe('The file extension declared by the user/system.'),
    detectedMimeType: z.string().optional().describe('The MIME type detected by binary signature.'),
    magicByteMismatch: z.boolean().optional().describe('True if declared extension does not match binary signature.'),
    doubleExtensionDetected: z.boolean().optional().describe('True if a double extension (e.g., .jpg.exe) was found.'),
    dangerousExtension: z.boolean().optional().describe('True if a dangerous executable extension was detected.'),
    clamAVDetections: z.array(z.string()).optional().describe('List of threats detected by ClamAV.'),
    yaraDetections: z.array(z.string()).optional().describe('List of threats detected by YARA rules.'),
    virusTotalResultsSummary: z.string().optional().describe('Summary of VirusTotal scan results.'),
  }).optional().describe('Details specific to a file scan.'),

  // URL Scan Specifics (optional)
  urlDetails: z.object({
    url: z.string().url().optional().describe('The URL that was scanned.'),
    isPhishingDetected: z.boolean().optional().describe('True if phishing patterns were detected.'),
    domainAge: z.string().optional().describe('Estimated age of the domain (e.g., "New", "Old", "Unknown").'),
    sslValid: z.boolean().optional().describe('True if the SSL certificate is valid.'),
    shortenedUrlDetected: z.boolean().optional().describe('True if the URL appears to be shortened.'),
    googleSafeBrowsingMatch: z.boolean().optional().describe('True if Google Safe Browsing flagged the URL.'),
    threatCategories: z.array(z.string()).optional().describe('List of threat categories identified for the URL.'),
  }).optional().describe('Details specific to a URL scan.'),
});
export type ThreatReportSummaryInput = z.infer<typeof ThreatReportSummaryInputSchema>;

const ThreatReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise overall summary of the scan results.'),
  detectedThreats: z.array(z.string()).describe('A list of specific threats or suspicious indicators found.'),
  implications: z.string().describe('An explanation of the potential impact or risks associated with the detected threats.'),
  recommendations: z.array(z.string()).describe('Actionable steps and best practices to mitigate the identified risks.'),
});
export type ThreatReportSummaryOutput = z.infer<typeof ThreatReportSummaryOutputSchema>;

export async function aiThreatReportSummary(input: ThreatReportSummaryInput): Promise<ThreatReportSummaryOutput> {
  return aiThreatReportSummaryFlow(input);
}

const threatReportSummaryPrompt = ai.definePrompt({
  name: 'threatReportSummaryPrompt',
  input: { schema: ThreatReportSummaryInputSchema },
  output: { schema: ThreatReportSummaryOutputSchema },
  prompt: `You are a Senior Cybersecurity Engineer and Security Analyst. Your task is to analyze the provided scan results and generate a clear, human-readable security advisory. Focus on detected threats, their implications, and actionable mitigation recommendations.

---
Scan Details:
Scan Type: {{{scanType}}}
Timestamp: {{{timestamp}}}
Risk Score: {{{riskScore}}}/100 (Level: {{{riskLevel}}})

{{#if fileDetails.fileName}}
  File Name: {{{fileDetails.fileName}}}
  SHA256 Hash: {{{fileDetails.fileHash}}}
  File Size: {{{fileDetails.fileSize}}} bytes
  Declared Extension: {{{fileDetails.declaredExtension}}}
  Detected MIME Type: {{{fileDetails.detectedMimeType}}}

  {{#if fileDetails.magicByteMismatch}}
  - WARNING: Declared extension "{{{fileDetails.declaredExtension}}}" does NOT match actual binary signature (Detected MIME Type: {{{fileDetails.detectedMimeType}}}). This indicates a potential cloaked file.
  {{/if}}
  {{#if fileDetails.doubleExtensionDetected}}
  - WARNING: Double extension detected (e.g., photo.jpg.exe), often used in malware to hide executables.
  {{/if}}
  {{#if fileDetails.dangerousExtension}}
  - WARNING: Dangerous executable extension "{{{fileDetails.declaredExtension}}}" detected.
  {{/if}}

  {{#if fileDetails.clamAVDetections.length}}
  ClamAV Detections:
  {{#each fileDetails.clamAVDetections}}
  - {{{this}}}
  {{/each}}
  {{/if}}

  {{#if fileDetails.yaraDetections.length}}
  YARA Rule Detections:
  {{#each fileDetails.yaraDetections}}
  - {{{this}}}
  {{/each}}
  {{/if}}

  {{#if fileDetails.virusTotalResultsSummary}}
  VirusTotal Summary: {{{fileDetails.virusTotalResultsSummary}}}
  {{/if}}

{{else}}
  URL: {{{urlDetails.url}}}

  {{#if urlDetails.isPhishingDetected}}
  - WARNING: Phishing patterns detected.
  {{/if}}
  {{#if urlDetails.shortenedUrlDetected}}
  - WARNING: Shortened URL detected. These are often used to obscure malicious destinations.
  {{/if}}
  {{#if urlDetails.googleSafeBrowsingMatch}}
  - WARNING: This URL was flagged by Google Safe Browsing as potentially dangerous.
  {{/if}}
  {{#if urlDetails.sslValid}}
  SSL Certificate: Valid
  {{else}}
  SSL Certificate: INVALID or missing. This is a significant red flag.
  {{/if}}
  Domain Age: {{{urlDetails.domainAge}}}

  {{#if urlDetails.threatCategories.length}}
  Threat Categories:
  {{#each urlDetails.threatCategories}}
  - {{{this}}}
  {{/each}}
  {{/if}}
{{/if}}

Based on the above scan data, provide the following in JSON format:
`,
});

const aiThreatReportSummaryFlow = ai.defineFlow(
  {
    name: 'aiThreatReportSummaryFlow',
    inputSchema: ThreatReportSummaryInputSchema,
    outputSchema: ThreatReportSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await threatReportSummaryPrompt(input);
    return output!;
  }
);
