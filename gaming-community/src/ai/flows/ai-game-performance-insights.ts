'use server';
/**
 * @fileOverview An AI agent that analyzes game data to provide concise, actionable insights and recommendations.
 *
 * - aiGamePerformanceInsights - A function that handles the game performance insights generation process.
 * - AIGamePerformanceInsightsInput - The input type for the aiGamePerformanceInsights function.
 * - AIGamePerformanceInsightsOutput - The return type for the aiGamePerformanceInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIGamePerformanceInsightsInputSchema = z.object({
  gameType: z.string().describe('The genre or type of the game (e.g., FPS, MOBA, RTS).'),
  gameName: z.string().describe('The name of the game being analyzed (e.g., Valorant, League of Legends).'),
  matchHistory: z.string().describe('A summary or log of recent match data, including outcomes, scores, and key events. This can be raw text or a JSON string representation.'),
  playerStats: z.string().describe('Overall player statistics like KDA, win rate, accuracy, and specific performance metrics for the game. This can be raw text or a JSON string representation.'),
  playerFeedback: z.string().optional().describe('Optional self-reflection or specific questions from the player about their performance.'),
});
export type AIGamePerformanceInsightsInput = z.infer<typeof AIGamePerformanceInsightsInputSchema>;

const AIGamePerformanceInsightsOutputSchema = z.object({
  summary: z.string().describe('A concise overall summary of the player\u0027s current playstyle and performance.'),
  strengths: z.array(z.string()).describe('A list of the player\u0027s key strengths identified from the game data.'),
  weaknesses: z.array(z.string()).describe('A list of areas where the player can improve, based on the analysis.'),
  recommendations: z.array(z.string()).describe('Actionable advice and specific strategies for the player to improve their skills and address weaknesses.'),
});
export type AIGamePerformanceInsightsOutput = z.infer<typeof AIGamePerformanceInsightsOutputSchema>;

export async function aiGamePerformanceInsights(input: AIGamePerformanceInsightsInput): Promise<AIGamePerformanceInsightsOutput> {
  return aiGamePerformanceInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGamePerformanceInsightsPrompt',
  input: {schema: AIGamePerformanceInsightsInputSchema},
  output: {schema: AIGamePerformanceInsightsOutputSchema},
  prompt: `You are a world-class, performance-driven game analyst and strategic coach for NEXUS, the ultimate gaming ecosystem. Your task is to analyze a player's game data, identify their playstyle, and provide concise, actionable insights and recommendations to help them improve.

Analyze the provided game data for the game: '{{{gameName}}}' (Game Type: '{{{gameType}}}').

Match History:
{{{matchHistory}}}

Player Statistics:
{{{playerStats}}}

{{#if playerFeedback}}
Player's Self-Reflection/Questions:
{{{playerFeedback}}}
{{/if}}

Based on this information, generate:
1. A concise overall summary of the player's current playstyle and performance.
2. A list of their key strengths.
3. A list of their weaknesses or areas for improvement.
4. Actionable recommendations and specific strategies to improve their skills and address identified weaknesses.

Ensure your analysis is sharp, professional, and directly applicable for a high-performance gamer.`,
});

const aiGamePerformanceInsightsFlow = ai.defineFlow(
  {
    name: 'aiGamePerformanceInsightsFlow',
    inputSchema: AIGamePerformanceInsightsInputSchema,
    outputSchema: AIGamePerformanceInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
