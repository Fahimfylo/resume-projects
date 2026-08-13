'use server';
/**
 * @fileOverview An AI strategic coach for competitive gamers.
 *
 * - aiStrategicCoach - A function that provides real-time strategic advice and detects tilt patterns.
 * - AiStrategicCoachInput - The input type for the aiStrategicCoach function.
 * - AiStrategicCoachOutput - The return type for the aiStrategicCoach function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiStrategicCoachInputSchema = z.object({
  gameContext: z
    .string()
    .describe(
      'A description of the current game state, including objectives, scores, team compositions, and time remaining.'
    ),
  playerPerformance: z
    .string()
    .describe(
      'Details on the player\'s recent performance, such as KDA, actions per minute, observed mistakes, and recent successes.'
    ),
  playerCommunication: z
    .string()
    .optional()
    .describe(
      'Relevant chat messages, voice cues, or other communication indicating the player\'s emotional state. Can be empty if no communication is available.'
    ),
});
export type AiStrategicCoachInput = z.infer<typeof AiStrategicCoachInputSchema>;

const AiStrategicCoachOutputSchema = z.object({
  strategicAdvice: z
    .string()
    .describe(
      'Actionable and concise strategic advice tailored to the current game context and player performance.'
    ),
  tiltDetected: z
    .boolean()
    .describe('True if signs of tilt are detected, false otherwise.')
    .default(false),
  tiltReason: z
    .string()
    .optional()
    .describe('A brief explanation of why tilt was detected. Only present if tiltDetected is true.')
    .default(''),
  tiltRecoverySuggestion: z
    .string()
    .optional()
    .describe(
      'A constructive suggestion for the player to recover from tilt. Only present if tiltDetected is true.'
    )
    .default(''),
  overallSentiment: z
    .enum(['Positive', 'Neutral', 'Frustrated', 'Angry', 'Calm'])
    .describe('The overall emotional sentiment of the player based on the provided input.')
    .default('Neutral'),
});
export type AiStrategicCoachOutput = z.infer<typeof AiStrategicCoachOutputSchema>;

export async function aiStrategicCoach(
  input: AiStrategicCoachInput
): Promise<AiStrategicCoachOutput> {
  return aiStrategicCoachFlow(input);
}

const aiStrategicCoachPrompt = ai.definePrompt({
  name: 'aiStrategicCoachPrompt',
  input: {schema: AiStrategicCoachInputSchema},
  output: {schema: AiStrategicCoachOutputSchema},
  prompt: `You are an expert AI strategic coach for competitive gamers. Your goal is to provide real-time, actionable strategic advice and detect signs of player tilt, offering constructive feedback to improve performance and mental state.

Analyze the provided game context, player performance, and communication to offer:
1. A concise strategic advice relevant to the current game situation.
2. Determine if the player is exhibiting signs of tilt.
3. If tilt is detected, explain why and suggest a recovery strategy.
4. Provide an overall sentiment of the player.

Game Context: {{{gameContext}}}
Player Performance: {{{playerPerformance}}}
Player Communication (if any): {{{playerCommunication}}}

Your response MUST be a JSON object matching the output schema. Ensure all fields are correctly populated.`,
});

const aiStrategicCoachFlow = ai.defineFlow(
  {
    name: 'aiStrategicCoachFlow',
    inputSchema: AiStrategicCoachInputSchema,
    outputSchema: AiStrategicCoachOutputSchema,
  },
  async input => {
    const {output} = await aiStrategicCoachPrompt(input);
    return output!;
  }
);
