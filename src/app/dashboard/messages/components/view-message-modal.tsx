
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, orderBy, Timestamp, addDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/client";

type Conversation = {
  id: string;
  name: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
};

type ChatMessage = {
    id: string;
    sender: "provider" | "patient";
    text: string;
    time: string;
};

interface ViewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export function ViewMessageModal({
  isOpen,
  onClose,
  conversation,
}: ViewMessageModalProps) {
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newMessage, setNewMessage] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && conversation) {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const messagesRef = collection(db, "conversations", conversation.id, "messages");
                const q = query(messagesRef, orderBy("time", "asc"));
                const querySnapshot = await getDocs(q);
                const messages = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        sender: data.sender,
                        text: data.text,
                        time: data.time ? new Date(data.time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                    } as ChatMessage;
                });
                setChatHistory(messages);
            } catch (error) {
                console.error("Error fetching messages:", error);
                toast({ variant: "destructive", title: "Failed to load messages." });
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }
  }, [isOpen, conversation, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;
    try {
        await addDoc(collection(db, "conversations", conversation.id, "messages"), {
            sender: "provider",
            text: newMessage,
            time: Timestamp.now()
        });
        setNewMessage("");
        // Optimistically update UI
        setChatHistory(prev => [...prev, {
            id: Date.now().toString(),
            sender: "provider",
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    } catch (error) {
        console.error("Error sending message:", error);
        toast({ variant: "destructive", title: "Failed to send message." });
    }
  };

  if (!conversation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 flex flex-col h-[600px]" hideCloseButton>
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-base font-semibold">{conversation.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{conversation.subject}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4">
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-12 w-1/2 ml-auto" />
                    <Skeleton className="h-8 w-2/3" />
                </div>
            ) : chatHistory.length > 0 ? (
                chatHistory.map((chat, index) => (
                <div
                    key={chat.id || index}
                    className={cn(
                    "flex items-end gap-2",
                    chat.sender === "provider" ? "justify-end" : "justify-start"
                    )}
                >
                    <div
                    className={cn(
                        "rounded-lg px-3 py-2 max-w-xs",
                        chat.sender === "provider"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                    >
                    <p className="text-sm">{chat.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">{chat.time}</p>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    No messages in this conversation yet.
                </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t bg-background">
          <div className="flex items-center w-full gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
