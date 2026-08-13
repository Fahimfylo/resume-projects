'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiEmailPhishingInputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email.'),
  sender: z.string().describe('The sender email address.'),
});
export type AiEmailPhishingInput = z.infer<typeof AiEmailPhishingInputSchema>;

const AiEmailPhishingOutputSchema = z.object({
  assessment: z.string().describe('A comprehensive plain-language assessment of whether this email is a phishing attempt.'),
  intentAnalysis: z.string().describe('Analysis of the apparent intent and social engineering techniques used.'),
  socialEngineeringScore: z.number().min(0).max(100).describe('A score from 0-100 indicating the level of social engineering manipulation detected.'),
  threatIndicators: z.array(z.string()).describe('Specific threat indicators found in the email.'),
  recommendedResponse: z.string().describe('Recommended action the recipient should take.'),
});
export type AiEmailPhishingOutput = z.infer<typeof AiEmailPhishingOutputSchema>;

const emailPhishingPrompt = ai.definePrompt({
  name: 'emailPhishingPrompt',
  input: { schema: AiEmailPhishingInputSchema },
  output: { schema: AiEmailPhishingOutputSchema },
  prompt: `You are a Senior Cybersecurity Analyst specializing in email threat detection and phishing analysis.

Analyze the following email for phishing indicators, social engineering techniques, and malicious intent.

From: {{{sender}}}
Subject: {{{subject}}}
Body:
{{{body}}}

Evaluate:
1. Does this email use urgency, fear, or authority to pressure the recipient?
2. Does it request sensitive information, credentials, or payments?
3. Are there inconsistencies in the sender identity or language used?
4. Does it contain suspicious links, attachments, or requests?
5. What is the overall social engineering score (0-100)?

Provide a structured assessment covering the overall analysis, intent breakdown, social engineering score, specific threat indicators, and recommended response.`,
});

const aiEmailPhishingAnalysisFlow = ai.defineFlow(
  {
    name: 'aiEmailPhishingAnalysisFlow',
    inputSchema: AiEmailPhishingInputSchema,
    outputSchema: AiEmailPhishingOutputSchema,
  },
  async (input) => {
    const { output } = await emailPhishingPrompt(input);
    if (!output) throw new Error('Failed to generate email phishing analysis');
    return output;
  }
);

export async function aiEmailPhishingAnalysis(input: AiEmailPhishingInput): Promise<AiEmailPhishingOutput> {
  return aiEmailPhishingAnalysisFlow(input);
}
