'use server';
/**
 * @fileOverview An AI-powered tool that analyzes suspicious URLs for phishing patterns and evaluates domain reputation through generative risk assessment.
 *
 * - aiUrlRiskAssessment - A function that performs an AI-generated risk assessment of a given URL.
 * - AiUrlRiskAssessmentInput - The input type for the aiUrlRiskAssessment function.
 * - AiUrlRiskAssessmentOutput - The return type for the aiUrlRiskAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiUrlRiskAssessmentInputSchema = z.object({
  url: z.string().url().describe('The suspicious URL to be analyzed.'),
});
export type AiUrlRiskAssessmentInput = z.infer<typeof AiUrlRiskAssessmentInputSchema>;

const AiUrlRiskAssessmentOutputSchema = z.object({
  overallAssessment: z
    .string()
    .describe('A comprehensive, plain-language summary of the URL\'s risk level and findings.'),
  phishingThreats: z
    .array(z.string())
    .describe('A list of potential phishing indicators found in the URL or associated content.'),
  domainReputation: z
    .string()
    .describe('A detailed evaluation of the domain\'s reputation, including any known history or suspicious patterns.'),
  defensiveActions: z
    .array(z.string())
    .describe('A list of concrete, actionable steps the user can take to protect themselves.'),
  riskScore: z.object({
    score: z.number().min(0).max(100).describe('A numeric risk score from 0 to 100.'),
    level: z.enum(['Safe', 'Low', 'Medium', 'High', 'Critical']).describe('The qualitative risk level corresponding to the score.'),
  }).describe('The calculated risk score and its qualitative level.'),
});
export type AiUrlRiskAssessmentOutput = z.infer<typeof AiUrlRiskAssessmentOutputSchema>;

const urlRiskAssessmentPrompt = ai.definePrompt({
  name: 'urlRiskAssessmentPrompt',
  input: { schema: AiUrlRiskAssessmentInputSchema },
  output: { schema: AiUrlRiskAssessmentOutputSchema },
  prompt: `You are a Senior Cybersecurity Engineer specializing in defensive security. Your task is to analyze a given URL for potential threats, evaluate its domain reputation, and provide clear, actionable advice to users.\n\nAnalyze the following URL: {{{url}}}\n\nBased on your expertise, provide a comprehensive assessment in a structured JSON format. Pay close attention to:\n1.  **Overall Assessment**: A plain-language summary of the URL's risk level and your findings.\n2.  **Phishing Threats**: Identify any potential phishing indicators. This could include suspicious keywords, unusual URL structure, common phishing techniques, or deceptive elements.\n3.  **Domain Reputation**: Evaluate the domain's reputation. Consider factors like domain age (if discernible), known associations with malicious activity, or any red flags in the domain name itself.\n4.  **Defensive Actions**: Provide specific, actionable steps the user should take to protect themselves, tailored to the identified risks.\n5.  **Risk Score**: Assign a numeric risk score from 0 (very safe) to 100 (critical threat) and categorize it as 'Safe', 'Low', 'Medium', 'High', or 'Critical'.\n\nExample output structure for a safe URL:\n{\n  "overallAssessment": "This URL appears to be safe based on initial analysis. No immediate threats or suspicious patterns were detected.",\n  "phishingThreats": [],\n  "domainReputation": "The domain appears legitimate with no known suspicious history.",\n  "defensiveActions": [\n    "Always verify the legitimacy of websites before entering sensitive information.",\n    "Keep your web browser and security software updated."\n  ],\n  "riskScore": {\n    "score": 10,\n    "level": "Safe"\n  }\n}\n\nExample output structure for a high-risk URL:\n{\n  "overallAssessment": "This URL is highly suspicious and presents a significant phishing risk. It contains deceptive elements and aims to trick users into revealing sensitive information.",\n  "phishingThreats": [\n    "Contains misleading domain name 'login-secure-paypal.com'.",\n    "Uses non-standard port or complex subdomains to obscure true origin.",\n    "Implies urgency or threat to illicit action."\n  ],\n  "domainReputation": "The domain is likely newly registered or associated with known phishing campaigns.",\n  "defensiveActions": [\n    "DO NOT click on this link or enter any information.",\n    "Report this URL to your email provider or security team.",\n    "Verify legitimate services by typing their official URL directly into your browser."\n  ],\n  "riskScore": {\n    "score": 95,\n    "level": "Critical"\n  }\n}\n\nEnsure your output is valid JSON and directly adheres to the schema provided.\n`,
});

const aiUrlRiskAssessmentFlow = ai.defineFlow(
  {
    name: 'aiUrlRiskAssessmentFlow',
    inputSchema: AiUrlRiskAssessmentInputSchema,
    outputSchema: AiUrlRiskAssessmentOutputSchema,
  },
  async (input) => {
    const { output } = await urlRiskAssessmentPrompt(input);
    if (!output) {
      throw new Error('Failed to generate URL risk assessment.');
    }
    return output;
  }
);

export async function aiUrlRiskAssessment(input: AiUrlRiskAssessmentInput): Promise<AiUrlRiskAssessmentOutput> {
  return aiUrlRiskAssessmentFlow(input);
}
