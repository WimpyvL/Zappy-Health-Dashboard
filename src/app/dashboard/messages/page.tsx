
"use client";

import * as React from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewMessageModal } from "./components/new-message-modal";
import { ViewMessageModal } from "./components/view-message-modal";
import { useToast } from "@/hooks/use-toast";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
  authDomain: "zappy-health-c1kob.firebaseapp.com",
  databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
  projectId: "zappy-health-c1kob",
  storageBucket: "zappy-health-c1kob.appspot.com",
  messagingSenderId: "833435237612",
  appId: "1:833435237612:web:53731373b2ad7568f279c9"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig, "messages-app");
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

type Conversation = {
    id: string;
    name: string;
    subject: string;
    preview: string;
    time: string;
    unread: boolean;
};

export default function MessagesPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = React.useState(false);
  const [isViewMessageModalOpen, setIsViewMessageModalOpen] = React.useState(false);
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
  const { toast } = useToast();

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const convosCollection = collection(db, "conversations");
      const convoSnapshot = await getDocs(query(convoCollection, orderBy("updatedAt", "desc")));
      const convoList = convoSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.participants?.[0] || 'Unknown User', // Placeholder for participant logic
          subject: data.subject || 'No Subject',
          preview: data.lastMessagePreview || '...',
          time: data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toLocaleTimeString() : 'N/A',
          unread: data.unread || false,
        } as Conversation;
      });
      setConversations(convoList);
    } catch (error) {
      console.error("Error fetching conversations: ", error);
      toast({
        variant: "destructive",
        title: "Error fetching conversations",
        description: "Could not retrieve message data from the database.",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConversations();
  }, []);

  const handleCreateConversation = async (values: { to: string; subject: string; message: string; }) => {
    try {
      // In a real app, 'to' would be resolved to a user ID.
      // Here we'll just store the string.
      const docRef = await addDoc(collection(db, "conversations"), {
        participants: [values.to], // Simple participant mock
        subject: values.subject,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastMessagePreview: values.message.substring(0, 50) + '...',
        unread: true,
      });

      // Add the first message to a subcollection
      await addDoc(collection(db, "conversations", docRef.id, "messages"), {
        sender: "provider", // Assuming the sender is the provider
        text: values.message,
        time: Timestamp.now(),
      });
      
      toast({
        title: "Message Sent",
        description: `Your message to ${values.to} has been sent.`,
      });
      fetchConversations(); // Refresh list
      setIsNewMessageModalOpen(false);
    } catch (error) {
      console.error("Error creating conversation: ", error);
      toast({
        variant: "destructive",
        title: "Error Sending Message",
        description: "An error occurred while sending the message.",
      });
    }
  };


  const handleViewMessage = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsViewMessageModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Messages</h1>
          </div>

          <div className="flex items-center gap-4">
              <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-9" />
              </div>
              <Button onClick={() => setIsNewMessageModalOpen(true)}>New Message</Button>
          </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Checkbox disabled /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-16" /></TableCell>
                        </TableRow>
                    ))
                ) : conversations.length > 0 ? (
                    conversations.map((conversation) => (
                    <TableRow key={conversation.id} onClick={() => handleViewMessage(conversation)} className="cursor-pointer">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox />
                        </TableCell>
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
                    <TableRow>
                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                            No conversations found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {conversations.length} of {conversations.length} results</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <NewMessageModal 
        isOpen={isNewMessageModalOpen} 
        onClose={() => setIsNewMessageModalOpen(false)}
        onCreateConversation={handleCreateConversation}
      />
      <ViewMessageModal 
        isOpen={isViewMessageModalOpen} 
        onClose={() => setIsViewMessageModalOpen(false)}
        conversation={selectedConversation}
      />
    </>
  );
}
