
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  name: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
};

interface ViewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}

const mockChatHistory = [
  {
    sender: "provider",
    text: "Hello! How can I help you today?",
    time: "2:15 PM",
  },
  {
    sender: "patient",
    text: "Thank you for the appointment reminder",
    time: "2:00 AM",
  },
];

export function ViewMessageModal({
  isOpen,
  onClose,
  message,
}: ViewMessageModalProps) {
  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 flex flex-col h-[600px]" hideCloseButton>
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{message.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-base font-semibold">{message.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{message.subject}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4">
            {mockChatHistory.map((chat, index) => (
              <div
                key={index}
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
            ))}
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
            />
            <Button>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
