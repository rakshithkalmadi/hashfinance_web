'use client';

import { sendMessage } from '@/ai/flows/send-message';
import { startNewSession } from '@/ai/flows/start-new-session';
import { zodResolver } from '@hookform/resolvers/zod';
import { CornerDownLeft, Loader, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChatMessage } from './chat-message';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './logo';
import { useAuth } from '@/hooks/use-auth';
import { getMessagesForSession, type Message } from '@/lib/api';
import { SidebarTrigger } from './ui/sidebar';

const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionCreated: (newSessionId: string) => void;
}

export function ChatInterface({ sessionId: activeSessionId, onSessionCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(activeSessionId);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [audioToPlay, setAudioToPlay] = useState<string | null>(null);
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
    },
  });

  const handleNewChat = async () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to start a new chat.',
        });
        return;
    }
    setIsLoading(true);
    setMessages([]);
    try {
      const { sessionId: newSessionId } = await startNewSession({ userId: user.uid });
      setCurrentSessionId(newSessionId);
      onSessionCreated(newSessionId);
    } catch (error) {
      console.error('Error starting new session:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not start a new chat session.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionMessages = async (sid: string) => {
    if (!user) return;
    setIsLoading(true);
    setMessages([]);
    try {
      const history = await getMessagesForSession(user.uid, sid);
      setMessages(history);
    } catch (error) {
      console.error("Failed to load session messages", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load chat history."
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (activeSessionId) {
      setCurrentSessionId(activeSessionId);
      loadSessionMessages(activeSessionId);
    } else if (user) {
      handleNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const userInput = values.message;
    if (!currentSessionId || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No active session. Please start a new chat.",
      });
      return;
    }
    form.reset();

    const newUserMessage: Message = { id: crypto.randomUUID(), role: 'user', content: userInput };
    const aiResponsePlaceholder: Message = { id: crypto.randomUUID(), role: 'assistant', content: null };

    setMessages((prev) => [...prev, newUserMessage, aiResponsePlaceholder]);
    setIsLoading(true);

    try {
      const { response, audioPath } = await sendMessage({ sessionId: currentSessionId, message: userInput, userId: user.uid });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiResponsePlaceholder.id
            ? { ...msg, content: response, audioPath, role: 'assistant' }
            : msg
        )
      );
      if (audioPath) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (apiBaseUrl) {
          setAudioToPlay(`${apiBaseUrl}/${audioPath}`);
        } else {
          console.error("NEXT_PUBLIC_API_BASE_URL is not set");
        }
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI.",
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== aiResponsePlaceholder.id && msg.id !== newUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <header className="p-4 border-b flex items-center justify-between gap-4 md:hidden">
        <Logo />
        <SidebarTrigger />
      </header>
       <header className="p-4 border-b hidden md:flex items-center justify-center text-sm text-muted-foreground">
        {currentSessionId && user ? `Session: ${currentSessionId.slice(-6)} | User: ${user.uid.slice(0,6)}...` : 'No active session'}
      </header>

      <div className="flex-1 relative">
        <ScrollArea className="h-full absolute inset-0" ref={scrollAreaRef}>
          <div className="p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                <CornerDownLeft className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to HashFinance</h2>
                <p>Start a conversation by typing your financial question below.</p>
              </div>
            ) : (
              messages.map((message) => <ChatMessage key={message.id} message={message} setAudioToPlay={setAudioToPlay} />)
            )}
            { isLoading && messages[messages.length-1]?.role !== 'assistant' && (
                <ChatMessage key="loading" message={{id: 'loading', role: 'assistant', content: null}} setAudioToPlay={setAudioToPlay} />
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t bg-background">
        {audioToPlay && (
            <div className="mb-4">
                <audio src={audioToPlay} controls autoPlay onEnded={() => setAudioToPlay(null)} className="w-full" />
            </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
            <Avatar>
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ask about your finances, e.g., 'How can I save for retirement?'"
                      className="min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (field.value.trim()) {
                            form.handleSubmit(onSubmit)();
                          }
                        }
                      }}
                      disabled={isLoading || !currentSessionId}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={isLoading || !currentSessionId} className="h-10 w-10">
              {isLoading ? <Loader className="animate-spin" /> : <Send />}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
