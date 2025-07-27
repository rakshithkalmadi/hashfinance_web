'use server';

import { z } from 'zod';

const SessionSchema = z.object({
  id: z.string(),
  appName: z.string(),
  userId: z.string(),
  state: z.record(z.unknown()),
  events: z.array(z.unknown()),
  lastUpdateTime: z.number(),
});

export type Session = z.infer<typeof SessionSchema>;

const SessionsSchema = z.array(SessionSchema);

export async function getSessionHistory(userId: string): Promise<Session[]> {
  const appName = "hashfinance_orchestrator";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  const response = await fetch(`${apiBaseUrl}/apps/${appName}/users/${userId}/sessions`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return SessionsSchema.parse(data);
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const appName = "hashfinance_orchestrator";
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  const response = await fetch(`${apiBaseUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`, {
      method: 'DELETE',
  });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
  }
}


const MessageSchema = z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string().nullable(),
    audioPath: z.string().optional().nullable(),
});

export type Message = z.infer<typeof MessageSchema>;

const EventSchema = z.object({
  type: z.string(),
  time: z.string(),
  content: z.object({
    role: z.string(),
    parts: z.array(z.object({
        text: z.string().optional(),
        functionResponse: z.any().optional(),
    }).optional()),
  }).optional(),
});

type Event = z.infer<typeof EventSchema>;

function transformEventsToMessages(events: Event[]): Message[] {
  const messages: Message[] = [];
  let nextId = 1;

  for (const event of events) {
    if (event.content) {
        const { role, parts } = event.content;
        if (parts && parts.length > 0) {
          const textPart = parts.find(p => p && typeof p === 'object' && 'text' in p);
            if (role === 'user' || role === 'model') {
                messages.push({
                    id: `msg-${nextId++}`,
                    role: role === 'user' ? 'user' : 'assistant',
                    content: textPart?.text ?? null
                });
            }
        }
    }
  }

  return messages;
}

export async function getMessagesForSession(userId: string, sessionId: string): Promise<Message[]> {
    const appName = "hashfinance_orchestrator";
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
    }

    const response = await fetch(`${apiBaseUrl}/apps/${appName}/users/${userId}/sessions/${sessionId}`);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
    }

    const sessionData = await response.json();
    
    if (sessionData.events && Array.isArray(sessionData.events)) {
        return transformEventsToMessages(sessionData.events);
    }
    
    return [];
}
