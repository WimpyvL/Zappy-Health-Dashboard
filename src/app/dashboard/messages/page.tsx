
"use client";

import * as React from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewMessageModal } from "./components/new-message-modal";
import { ViewMessageModal } from "./components/view-message-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
<<<<<<< HEAD
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { db } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

type Conversation = {
    id: string;
    name: string;
    subject: string;
    preview: string;
    time: string;
    unread: boolean;
};

const fetchConversations = async () => {
    const response = await dbService.getAll<any>('conversations', { sortBy: 'updatedAt', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch conversations');
    return response.data.map((convo: any) => ({
        id: convo.id,
        name: convo.participants?.[0] || 'Unknown User',
        subject: convo.subject || 'No Subject',
        preview: convo.lastMessagePreview || '...',
        time: convo.updatedAt ? new Date(convo.updatedAt.seconds * 1000).toLocaleTimeString() : 'N/A',
        unread: convo.unread || false,
    }));
};

const createConversation = async (values: { to: string; subject: string; message: string; }) => {
    const convoData = {
        participants: [values.to],
        subject: values.subject,
        lastMessagePreview: values.message.substring(0, 50) + '...',
        unread: true,
    };
    const convoResponse = await dbService.create('conversations', convoData);
    if (convoResponse.error || !convoResponse.data) throw new Error(convoResponse.error || 'Failed to create conversation');

    const messageData = {
        sender: "provider",
        text: values.message,
    };
    // dbService needs a method for creating documents in subcollections. For now, this is a simplification.
    // await dbService.create(`conversations/${convoResponse.data.id}/messages`, messageData);
    
    return convoResponse.data;
};

export default function MessagesPage() {
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = React.useState(false);
  const [isViewMessageModalOpen, setIsViewMessageModalOpen] = React.useState(false);
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: loading } = useQuery<Conversation[], Error>({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    onError: (error) => toast({ variant: "destructive", title: "Error fetching conversations", description: error.message }),
  });

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        toast({ title: "Message Sent", description: `Your message has been sent.` });
        setIsNewMessageModalOpen(false);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error Sending Message", description: error.message }),
  });

  const handleViewMessage = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsViewMessageModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Messages</h1>
              <Button onClick={() => setIsNewMessageModalOpen(true)}>New Message</Button>
          </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox /></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                    ))
                ) : conversations.length > 0 ? (
                    conversations.map((conversation) => (
                    <TableRow key={conversation.id} onClick={() => handleViewMessage(conversation)} className="cursor-pointer">
                        <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {conversation.unread && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                                <span className="font-medium">{conversation.name}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="font-semibold">{conversation.subject}</span>
                            <span className="text-muted-foreground"> - {conversation.preview}</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">{conversation.time}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={4} className="h-48 text-center">No conversations found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <NewMessageModal isOpen={isNewMessageModalOpen} onClose={() => setIsNewMessageModalOpen(false)} onCreateConversation={createMutation.mutate} />
      <ViewMessageModal isOpen={isViewMessageModalOpen} onClose={() => setIsViewMessageModalOpen(false)} conversation={selectedConversation} />
    </>
  );
}

