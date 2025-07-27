'use client';

import { cn } from '@/lib/utils';
import { Bot, Play, User } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/api';

const LoadingIndicator = () => (
    <div className="flex items-center space-x-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
    </div>
);


export function ChatMessage({ message, setAudioToPlay }: { message: Message; setAudioToPlay: (path: string | null) => void; }) {
  const isUser = message.role === 'user';
  
  const handlePlayAudio = () => {
    if (message.audioPath) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (apiBaseUrl) {
          setAudioToPlay(`${apiBaseUrl}/${message.audioPath}`);
        } else {
          console.error("NEXT_PUBLIC_API_BASE_URL is not set");
        }
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-3 text-sm shadow-sm animate-in fade-in zoom-in-95',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        )}
      >
        {message.content === null ? <LoadingIndicator /> : (
            <div className="prose prose-sm max-w-none text-inherit break-words prose-p:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {message.audioPath && (
                    <Button variant="ghost" size="sm" className="mt-2" onClick={handlePlayAudio}>
                        <Play className="mr-2 h-4 w-4" />
                        Play Audio
                    </Button>
                )}
            </div>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
