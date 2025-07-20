
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';

type Conversation = {
  id: string;
  name: string;
  subject: string;
};

type ChatMessage = {
    id: string;
    sender: "provider" | "patient";
    text: string;
    time: string;
};

const fetchMessages = async (conversationId: string) => {
    // dbService needs a method for fetching from subcollections. This is a placeholder.
    // const response = await dbService.getAll<any>(`conversations/${conversationId}/messages`, { sortBy: 'time', sortDirection: 'asc' });
    // if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch messages');
    // return response.data.map((msg: any) => ({ ...msg, time: msg.time?.toDate().toLocaleTimeString() }));
    return []; // Placeholder
};

const sendMessage = async ({ conversationId, text }: { conversationId: string, text: string }) => {
    // const response = await dbService.create(`conversations/${conversationId}/messages`, { sender: 'provider', text });
    // if (response.error) throw new Error(response.error);
    // return response.data;
    return { id: Date.now().toString(), sender: 'provider', text, time: new Date().toLocaleTimeString() }; // Placeholder
};

export function ViewMessageModal({ isOpen, onClose, conversation }: { isOpen: boolean; onClose: () => void; conversation: Conversation | null; }) {
  const [newMessage, setNewMessage] = React.useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chatHistory = [], isLoading: loading } = useQuery<ChatMessage[], Error>({
    queryKey: ['messages', conversation?.id],
    queryFn: () => fetchMessages(conversation!.id),
    enabled: !!conversation,
    onError: (error) => toast({ variant: "destructive", title: "Failed to load messages.", description: error.message }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversation?.id] });
        setNewMessage("");
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Failed to send message.", description: error.message }),
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversation) return;
    sendMessageMutation.mutate({ conversationId: conversation.id, text: newMessage });
  };

  if (!conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{conversation.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          {loading ? <Skeleton className="h-full w-full" /> : chatHistory.map((chat) => (
            <div key={chat.id} className={cn("flex", chat.sender === "provider" ? "justify-end" : "justify-start")}>
              <div className={cn("rounded-lg px-3 py-2 m-1", chat.sender === "provider" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p>{chat.text}</p>
                <p className="text-xs opacity-70 mt-1 text-right">{chat.time}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
        <DialogFooter>
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
          <Button onClick={handleSendMessage}><Send className="h-5 w-5" /></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
