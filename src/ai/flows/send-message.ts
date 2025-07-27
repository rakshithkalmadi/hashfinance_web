'use server';

/**
 * @fileOverview This file defines the sendMessage flow, which sends a user message to the external AI agent and returns the AI's response.
 *
 * - sendMessage - A function that sends a message to the AI agent and returns the response.
 * - SendMessageInput - The input type for the sendMessage function.
 * - SendMessageOutput - The return type for the sendMessage function.
 */

import { z } from 'zod';

const SendMessageInputSchema = z.object({
  message: z.string().describe('The message to send to the AI agent.'),
  sessionId: z.string().describe('The current session ID.'),
  userId: z.string().describe('The current user ID.'),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

const SendMessageOutputSchema = z.object({
  response: z.string().describe("The AI agent's response to the message."),
  audioPath: z.string().optional().describe('The path to the generated audio file, if any.'),
});
export type SendMessageOutput = z.infer<typeof SendMessageOutputSchema>;

export async function sendMessage(input: SendMessageInput): Promise<SendMessageOutput> {
  const { sessionId, message, userId } = input;
  const appName = "hashfinance_orchestrator";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  const response = await fetch(`${apiBaseUrl}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_name: appName,
      user_id: userId,
      session_id: sessionId,
      new_message: { role: 'user', parts: [{ text: message }] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
  }

  const events = await response.json();

  let assistantMessage: string | null = null;
  let audioFilePath: string | null = null;

  for (const event of events) {
    const content = event.content;
    if (!content) continue;

    const parts = content.parts || [{}];
    
    if (content.role === "model" && parts[0].text) {
      assistantMessage = parts[0].text;
    }

    if (parts[0].functionResponse) {
      const funcResponse = parts[0].functionResponse;
      if (funcResponse.name === "speach_agent") {
          const resultText = funcResponse.response?.result || "";
          if (resultText.includes("saved at")) {
              try {
                  const pathPart = resultText.split("saved at")[1].trim().replace(/`/g, '');
                  if (pathPart.includes(".mp3")) {
                      audioFilePath = pathPart.split(".mp3")[0] + ".mp3";
                  }
              } catch (e) {
                  console.error("Error parsing audio path", e);
              }
          }
      }
    }
  }
  
  return {
    response: assistantMessage || "Action completed.",
    audioPath: audioFilePath || undefined,
  };
}
