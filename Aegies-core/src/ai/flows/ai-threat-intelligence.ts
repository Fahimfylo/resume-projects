'use server';
/**
 * @fileOverview A Genkit flow that generates a simulated daily security intelligence briefing.
 *
 * - aiDailySecurityBrief - Generates a daily overview of global cybersecurity threats.
 * - DailyBriefInput - Input schema (empty for now as it's a global brief).
 * - DailyBriefOutput - Structured security intelligence report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailyBriefInputSchema = z.object({
  topic: z.string().optional().describe('Optional focus area for the brief (e.g., "ransomware", "iot").'),
});
export type DailyBriefInput = z.infer<typeof DailyBriefInputSchema>;

const DailyBriefOutputSchema = z.object({
  headline: z.string().describe('A catchy, professional headline for the daily brief.'),
  summary: z.string().describe('A high-level summary of today\'s threat landscape.'),
  keyThreats: z.array(z.object({
    name: z.string().describe('Name of the threat or malware family.'),
    type: z.string().describe('Type of threat (e.g., Trojan, APT, Zero-Day).'),
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
    description: z.string().describe('Brief technical summary of the threat.'),
  })).describe('A list of the most significant threats identified.'),
  mitigationTips: z.array(z.string()).describe('General defensive recommendations for system administrators.'),
});
export type DailyBriefOutput = z.infer<typeof DailyBriefOutputSchema>;

export async function aiDailySecurityBrief(input: DailyBriefInput): Promise<DailyBriefOutput> {
  return aiDailySecurityBriefFlow(input);
}

const dailyBriefPrompt = ai.definePrompt({
  name: 'dailyBriefPrompt',
  input: { schema: DailyBriefInputSchema },
  output: { schema: DailyBriefOutputSchema },
  prompt: `You are a Global Security Operations Center (GSOC) Analyst. 
Generate a comprehensive, professional daily security intelligence briefing for today, {{#if topic}}focusing on {{{topic}}}{{else}}covering the general landscape{{/if}}.

The briefing should feel urgent, authoritative, and include:
1. A headline that summarizes the current state.
2. A summary of active global trends.
3. At least 3 specific (but simulated/realistic) current threats (malware, campaigns, or vulnerabilities).
4. Actionable mitigation strategies.

Provide the response in valid JSON.`,
});

const aiDailySecurityBriefFlow = ai.defineFlow(
  {
    name: 'aiDailySecurityBriefFlow',
    inputSchema: DailyBriefInputSchema,
    outputSchema: DailyBriefOutputSchema,
  },
  async (input) => {
    const { output } = await dailyBriefPrompt(input);
    if (!output) throw new Error('Failed to generate daily brief');
    return output;
  }
);
