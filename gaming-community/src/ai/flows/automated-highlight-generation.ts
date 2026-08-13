'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating cinematic highlight reel descriptions
 * from gaming session summaries.
 *
 * - automatedHighlightGeneration - A function that processes a gaming session description to produce cinematic highlights.
 * - AutomatedHighlightGenerationInput - The input type for the automatedHighlightGeneration function.
 * - AutomatedHighlightGenerationOutput - The return type for the automatedHighlightGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedHighlightGenerationInputSchema = z
  .string()
  .describe(
    'A detailed textual description of a gaming session, including notable events, actions, and epic moments. The AI will identify the most cinematic moments to create a highlight reel.'
  );
export type AutomatedHighlightGenerationInput = z.infer<typeof AutomatedHighlightGenerationInputSchema>;

const AutomatedHighlightGenerationOutputSchema = z.object({
  cinematicDescription: z
    .string()
    .describe(
      'A detailed narrative description of the cinematic highlight reel, including camera angles, special effects, and emotional impact, focusing on the most epic moments.'
    ),
  videoGenerationPrompt: z
    .string()
    .describe(
      'A concise, powerful prompt suitable for a text-to-video generation model, capturing the essence of the most epic moment for a short video clip.'
    ),
});
export type AutomatedHighlightGenerationOutput = z.infer<typeof AutomatedHighlightGenerationOutputSchema>;

export async function automatedHighlightGeneration(
  input: AutomatedHighlightGenerationInput
): Promise<AutomatedHighlightGenerationOutput> {
  return automatedHighlightGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatedHighlightGenerationPrompt',
  input: {schema: AutomatedHighlightGenerationInputSchema},
  output: {schema: AutomatedHighlightGenerationOutputSchema},
  prompt: `You are an expert cinematic director and game analyst for a premium gaming platform called NEXUS. Your task is to identify the most "mythic-tier cinematic moments" from a user's gaming session description and craft a compelling highlight reel narrative.

Instructions:
1. Analyze the provided gaming session description to pinpoint the single most epic and visually dramatic moment.
2. Write a detailed "cinematicDescription" of this highlight reel. Imagine you are directing a high-budget trailer. Describe camera angles, slow-motion effects, particle effects (like jade chi energy, glowing spirit orbs, fog energy), sound design cues (epic music, intense sound effects), and the emotional journey of the player during this moment. Integrate the aesthetic inspirations: NVIDIA, Black Myth Wukong, Master Kai, Cyberpunk 2077, Valorant. Ensure it feels like a GPU-accelerated, immersive, and emotionally powerful experience.
3. Create a concise and powerful "videoGenerationPrompt" that can be used directly with a text-to-video AI model (e.g., Veo). This prompt should vividly capture the core visual and emotional essence of that epic moment in under 20 words, focusing on strong imagery and action.

Gaming Session Description:
{{{this}}}`,
});

const automatedHighlightGenerationFlow = ai.defineFlow(
  {
    name: 'automatedHighlightGenerationFlow',
    inputSchema: AutomatedHighlightGenerationInputSchema,
    outputSchema: AutomatedHighlightGenerationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate highlight reel description.');
    }
    return output;
  }
);
