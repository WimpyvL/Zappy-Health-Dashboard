
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

type Message = {
    id: string;
    name: string;
    subject: string;
    preview: string;
    time: string;
    unread: boolean;
};

const mockMessages: Message[] = [
    {
        id: "msg_1",
        name: "John Doe",
        subject: "Patient Check-in",
        preview: "Thank you for the appointment reminder",
        time: "2:00 AM",
        unread: true,
    },
    {
        id: "msg_2",
        name: "Jane Smith",
        subject: "Insurance Question",
        preview: "Can you help with my coverage?",
        time: "1:00 AM",
        unread: false,
    },
    {
        id: "msg_3",
        name: "Bob Johnson",
        subject: "Prescription Refill",
        preview: "I need to refill my medication",
        time: "12:00 AM",
        unread: true,
    }
];

export default function MessagesPage() {
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = React.useState(false);
  const [isViewMessageModalOpen, setIsViewMessageModalOpen] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
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
                {mockMessages.map((message) => (
                  <TableRow key={message.id} onClick={() => handleViewMessage(message)} className="cursor-pointer">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {message.unread && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                        <span className="font-medium">{message.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{message.subject}</span>
                      <span className="text-muted-foreground"> - {message.preview}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">{message.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {mockMessages.length} of {mockMessages.length} results</div>
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
      <NewMessageModal isOpen={isNewMessageModalOpen} onClose={() => setIsNewMessageModalOpen(false)} />
      <ViewMessageModal 
        isOpen={isViewMessageModalOpen} 
        onClose={() => setIsViewMessageModalOpen(false)}
        message={selectedMessage}
      />
    </>
  );
}
