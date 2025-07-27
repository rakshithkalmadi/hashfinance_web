'use server';

/**
 * @fileOverview Genkit flow for starting a new chat session.
 *
 * - startNewSession - A function that initiates a new chat session with the external API.
 * - StartNewSessionInput - The input type for the startNewSession function.
 * - StartNewSessionOutput - The return type for the startNewSession function. Returns a session ID and user ID.
 */

import { z } from 'zod';

const StartNewSessionInputSchema = z.object({
  userId: z.string().describe("The user's Firebase UID."),
});
export type StartNewSessionInput = z.infer<typeof StartNewSessionInputSchema>;

const StartNewSessionOutputSchema = z.object({
  sessionId: z.string().describe('The ID of the newly created session.'),
  userId: z.string().describe('The ID of the user for the session.'),
});
export type StartNewSessionOutput = z.infer<typeof StartNewSessionOutputSchema>;

export async function startNewSession(input: StartNewSessionInput): Promise<StartNewSessionOutput> {
  const { userId } = input;
  const sessionId = `session-${Date.now()}`;
  const appName = "hashfinance_orchestrator";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  const response = await fetch(`${apiBaseUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
  });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create session: ${response.statusText} - ${errorText}`);
  }

  return {sessionId, userId};
}
