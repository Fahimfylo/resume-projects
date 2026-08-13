'use server';
/**
 * @fileOverview This file implements a Genkit flow for creating a unique AI-generated gamer identity.
 * It includes generating a personalized gamer bio and a distinctive AI-generated avatar.
 *
 * - createAIGamerIdentity - A function that orchestrates the generation of gamer bio and avatar.
 * - AIGamerIdentityCreationInput - The input type for the createAIGamerIdentity function.
 * - AIGamerIdentityCreationOutput - The return type for the createAIGamerIdentity function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIGamerIdentityCreationInputSchema = z.object({
  gamerTag: z.string().describe('The user\'s desired gamer tag.'),
  gamingPreferences: z.array(z.string()).describe('A list of the user\'s preferred game genres, play styles, or favorite games.'),
  personalityTraits: z.array(z.string()).optional().describe('Optional: User-defined personality traits to infuse into the bio and avatar concept.'),
});
export type AIGamerIdentityCreationInput = z.infer<typeof AIGamerIdentityCreationInputSchema>;

const AIGamerIdentityCreationOutputSchema = z.object({
  gamerBio: z.string().describe('A unique, personalized gamer biography.'),
  avatarImageUrl: z.string().describe('URL to a unique avatar image.'),
});
export type AIGamerIdentityCreationOutput = z.infer<typeof AIGamerIdentityCreationOutputSchema>;

export async function createAIGamerIdentity(input: AIGamerIdentityCreationInput): Promise<AIGamerIdentityCreationOutput> {
  return aiGamerIdentityCreationFlow(input);
}

const generateGamerBioPrompt = ai.definePrompt({
  name: 'generateGamerBioPrompt',
  input: { schema: AIGamerIdentityCreationInputSchema },
  output: { schema: z.object({ gamerBio: z.string() }) },
  prompt: `You are an AI assistant specialized in creating unique and personalized gamer bios for a futuristic gaming community called NEXUS.
Based on the user's gamer tag, gaming preferences, and optional personality traits, craft a compelling and distinctive gamer biography.

Gamer Tag: {{{gamerTag}}}
Gaming Preferences: {{{gamingPreferences}}}
{{#if personalityTraits}}
Personality Traits: {{{personalityTraits}}}
{{/if}}

Your bio should capture the essence of a player ready to 'FORGE THEIR GAMING LEGACY' within NEXUS. The tone should be epic, futuristic, and reflect the player's unique style.
Generate only the gamer bio.`,
});

const generateAvatarDescriptionPrompt = ai.definePrompt({
  name: 'generateAvatarDescriptionPrompt',
  input: { schema: AIGamerIdentityCreationInputSchema },
  output: { schema: z.object({ avatarDescription: z.string() }) },
  prompt: `You are an AI assistant specialized in creating vivid and detailed descriptions for futuristic gaming avatars.
Based on the user's gamer tag, gaming preferences, and optional personality traits, generate a description suitable for an avatar generation system.
The avatar should embody the "NEXUS" aesthetic: "Steam + NVIDIA + Cyberpunk 2077 + Black Myth Wukong + Master Kai's spirit realm + AI-powered esports universe".
It should be a high-quality, cinematic, and distinctive avatar that stands out in a premium gaming platform.

Gamer Tag: {{{gamerTag}}}
Gaming Preferences: {{{gamingPreferences}}}
{{#if personalityTraits}}
Personality Traits: {{{personalityTraits}}}
{{/if}}

Focus on:
- Style: futuristic, cybernetic, spiritual, mythic, high-tech, elite.
- Colors: Jade Glow (#76ff03), Spirit Teal (#00e5cc), Void Black (#050505), Dark Carbon (#0f1115), Wukong Gold (#ffb300).
- Elements: glowing chi energy, spirit orbs, digital HUD elements, sleek armor, mystical symbols, holographic projections, Master Kai-inspired subtle elements.
- Composition: headshot or bust, dynamic pose, cinematic lighting, sharp details.

Generate only a short, vivid avatar description (max 2 sentences).`,
});

const aiGamerIdentityCreationFlow = ai.defineFlow(
  {
    name: 'aiGamerIdentityCreationFlow',
    inputSchema: AIGamerIdentityCreationInputSchema,
    outputSchema: AIGamerIdentityCreationOutputSchema,
  },
  async (input) => {
    const { output: bioOutput } = await generateGamerBioPrompt(input);
    const gamerBio = bioOutput!.gamerBio;

    const { output: avatarDescOutput } = await generateAvatarDescriptionPrompt(input);
    const avatarDescription = avatarDescOutput!.avatarDescription;

    const avatarImageUrl = `https://api.dicebear.com/9.x/identicon/svg?seed=${input.gamerTag}&backgroundColor=transparent`;

    return { gamerBio, avatarImageUrl };
  }
);
