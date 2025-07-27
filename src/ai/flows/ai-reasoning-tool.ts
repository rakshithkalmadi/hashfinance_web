'use server';
/**
 * @fileOverview AI tool that reasons over current and prior turns of conversation.
 *
 * - aiReasoningTool - A function that handles the reasoning process.
 * - AiReasoningToolInput - The input type for the aiReasoningTool function.
 * - AiReasoningToolOutput - The return type for the aiReasoningTool function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiReasoningToolInputSchema = z.object({
  message: z.string().describe('The current user message.'),
  conversationHistory: z
    .array(z.object({user: z.string(), ai: z.string()}))
    .optional()
    .describe('The history of the conversation.'),
});
export type AiReasoningToolInput = z.infer<typeof AiReasoningToolInputSchema>;

const AiReasoningToolOutputSchema = z.object({
  response: z.string().describe('The AI response to the user message.'),
});
export type AiReasoningToolOutput = z.infer<typeof AiReasoningToolOutputSchema>;

export async function aiReasoningTool(input: AiReasoningToolInput): Promise<AiReasoningToolOutput> {
  return aiReasoningToolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiReasoningToolPrompt',
  input: {schema: AiReasoningToolInputSchema},
  output: {schema: AiReasoningToolOutputSchema},
  prompt: `You are an AI financial advisor.  You are conversing with a user who is seeking financial advice.
Reason over the current and prior turns of conversation in order to answer the user's questions appropriately.
Use follow-up questions and entity recognition to resolve ambiguity and ensure you understand the user's needs.

Here is the conversation history:
{{#each conversationHistory}}
User: {{{this.user}}}
AI: {{{this.ai}}}
{{/each}}

User: {{{message}}}
AI: `,
});

const aiReasoningToolFlow = ai.defineFlow(
  {
    name: 'aiReasoningToolFlow',
    inputSchema: AiReasoningToolInputSchema,
    outputSchema: AiReasoningToolOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
