
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScheduleSessionModal } from "./components/schedule-session-modal";
import { useToast } from "@/hooks/use-toast";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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
  app = initializeApp(firebaseConfig, "sessions-app");
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

type Session = {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  type: string;
  date: string;
  plan: string;
  provider: string;
  status: "Scheduled" | "Completed" | "Canceled";
};

const FilterDropdown = ({
  label,
  options,
}: {
  label: string;
  options: string[];
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2">
        {label}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {options.map((option) => (
        <DropdownMenuItem key={option}>{option}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default function SessionsPage() {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();

  const fetchSessions = React.useCallback(async () => {
    setLoading(true);
    try {
      const sessionsCollection = collection(db, "sessions");
      const sessionSnapshot = await getDocs(query(sessionsCollection, orderBy("date", "desc")));
      const sessionList = sessionSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date ? format(data.date.toDate(), "MMM dd, yyyy") : "N/A",
          ...data,
        } as Session;
      });
      setSessions(sessionList);
    } catch (error) {
      console.error("Error fetching sessions: ", error);
      toast({
        variant: "destructive",
        title: "Error fetching sessions",
        description: "Could not retrieve session data from the database.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreateSession = async (values: any) => {
    try {
      await addDoc(collection(db, "sessions"), {
          patientName: values.patient, // In real app, you'd use patientId and join
          patientId: 'mock-patient-id', // Placeholder
          patientEmail: 'mock-email@example.com', // Placeholder
          type: values.sessionType,
          plan: values.servicePlan,
          provider: values.provider,
          date: Timestamp.fromDate(values.dateTime),
          status: "Scheduled",
      });
      toast({
        title: "Session Scheduled",
        description: `A new session has been scheduled for ${values.patient}.`,
      });
      fetchSessions();
      setIsModalOpen(false);
    } catch (error) {
       console.error("Error creating session: ", error);
       toast({
        variant: "destructive",
        title: "Error Scheduling Session",
        description: "An error occurred while creating the session.",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold">{sessions.length}</span> | 
              Active: <span className="font-semibold">{sessions.filter(s => s.status === 'Scheduled').length}</span> | 
              Completed: <span className="font-semibold">{sessions.filter(s => s.status === 'Completed').length}</span>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add Session
            </Button>
             <div className="flex items-center space-x-2">
              <Switch id="batch-mode" />
              <Label htmlFor="batch-mode">Batch Mode</Label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sessions by patient name or type..." className="pl-9" />
          </div>
          <FilterDropdown
            label="All Types"
            options={["Check-in", "Consultation", "Follow-up"]}
          />
          <FilterDropdown
            label="All Statuses"
            options={["Scheduled", "Completed", "Canceled"]}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell>
                            <Link href={`/dashboard/patients/${session.patientId}`} className="font-medium text-primary hover:underline">{session.patientName || 'N/A'}</Link>
                            <div className="text-sm text-muted-foreground">
                                {session.patientEmail || session.patientId}
                            </div>
                            </TableCell>
                            <TableCell>
                            <Badge variant="outline">{session.type}</Badge>
                            </TableCell>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>{session.plan || 'N/A'}</TableCell>
                            <TableCell>{session.provider || 'N/A'}</TableCell>
                            <TableCell>
                            <Badge variant={session.status === 'Scheduled' ? 'secondary' : 'default'} className={session.status === 'Scheduled' ? 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200' : 'bg-green-100 text-green-800'}>
                                {session.status}
                            </Badge>
                            </TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild><Link href={`/dashboard/sessions/${session.id}`}>View Details</Link></DropdownMenuItem>
                                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    Cancel Session
                                </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {sessions.length} of {sessions.length} sessions</div>
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
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ScheduleSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSession}
      />
    </>
  );
}
