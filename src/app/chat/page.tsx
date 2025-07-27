'use client';
import { ChatInterface } from '@/components/chat-interface';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader, Trash, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuAction,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { getSessionHistory, deleteSession, type Session } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Logo } from '@/components/logo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';


export default function ChatPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined | null>(undefined);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const fetchSessions = async (selectLatest = true) => {
    if (user) {
      setSessionsLoading(true);
      try {
        const sessionHistory = await getSessionHistory(user.uid);
        const sortedSessions = sessionHistory.sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
        setSessions(sortedSessions);

        if (selectLatest && sortedSessions.length > 0) {
          setActiveSessionId(sortedSessions[0].id);
        } else if (sortedSessions.length === 0) {
          setActiveSessionId(null); // No sessions, will trigger new chat creation
        }

      } catch (error) {
        console.error('Failed to fetch sessions', error);
      } finally {
        setSessionsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && activeSessionId === undefined) {
      fetchSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeSessionId]);

  const handleNewChat = () => {
    setActiveSessionId(null); // Setting active session to null will trigger a new one in ChatInterface
  };
  
  const handleSessionCreated = (newSessionId: string) => {
    fetchSessions(false).then(() => { // Don't auto-select latest, stick with the new one
      setActiveSessionId(newSessionId);
    });
  }

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
  }

  const handleConfirmDelete = async () => {
    if (!sessionToDelete || !user) return;
    try {
      await deleteSession(user.uid, sessionToDelete);
      toast({
        title: "Success",
        description: "Session deleted successfully."
      });
      
      const wasActive = activeSessionId === sessionToDelete;
      // Refetch sessions and select the latest one if the active one was deleted.
      fetchSessions(wasActive); 

    } catch (error) {
      console.error("Failed to delete session", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete session.',
      });
    } finally {
      setSessionToDelete(null);
    }
  }

  const handleLogout = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
      router.push('/');
    } catch (error) {
      console.error("Failed to log out", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out.',
      });
    }
  };

  if (loading || !user || activeSessionId === undefined) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="w-[280px]">
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Logo />
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col">
          <div className="flex-1">
            <Button onClick={handleNewChat} className="w-full mb-4">
              <Plus className="mr-2" /> New Chat
            </Button>
            <SidebarMenu>
              {sessionsLoading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSessionId(session.id)}
                      isActive={activeSessionId === session.id}
                      tooltip={session.id.slice(-6)}
                      className="pr-10"
                    >
                      <span>{`Session ${session.id.slice(-6)}`}</span>
                    </SidebarMenuButton>
                     <SidebarMenuAction
                        onClick={() => handleDeleteClick(session.id)}
                        aria-label="Delete session"
                        showOnHover
                      >
                        <Trash />
                      </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex h-screen w-full flex-col">
         {activeSessionId !== undefined && (
            <ChatInterface
              sessionId={activeSessionId}
              onSessionCreated={handleSessionCreated}
              key={activeSessionId || 'new'}
            />
          )}
      </main>
       <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this chat session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
