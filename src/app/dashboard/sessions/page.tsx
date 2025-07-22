
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
  DropdownMenuSeparator,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScheduleSessionModal } from "./components/schedule-session-modal";
import { useToast } from "@/hooks/use-toast";
import { Timestamp, addDoc, collection, updateDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from "date-fns";
import { useUpdateSessionStatus, useSessions, useCreateSession, Session } from "@/services/database/hooks";
import { useTelehealthFlow } from "@/hooks/useTelehealthFlow";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";

const SESSION_STATUSES = [
  'pending',
  'in-progress',
  'completed',
  'cancelled',
  'followup'
] as const;

type SessionStatus = typeof SESSION_STATUSES[number];

const StatusBadge = React.memo(({ status }: { status: SessionStatus }) => {
    const statusConfig: Record<SessionStatus, { label: string; className: string }> = React.useMemo(() => ({
      pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
      'in-progress': { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
      followup: { label: "Follow-up", className: "bg-purple-100 text-purple-800" },
    }), []);
  
    const currentStatus = React.useMemo(() =>
      statusConfig[status] || statusConfig.pending,
      [status, statusConfig]
    );
  
    return (
      <Badge variant="secondary" className={`${currentStatus.className} hover:${currentStatus.className}`}>
        {currentStatus.label}
      </Badge>
    );
});

StatusBadge.displayName = 'StatusBadge';

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
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();
  const updateStatusMutation = useUpdateSessionStatus();
  const { initializeFlow, loading: flowLoading } = useTelehealthFlow();
  
  const status = searchParams?.get('status') || undefined;
  const searchTerm = searchParams?.get('searchTerm') || undefined;
  
  const { data: sessionsResponse, isLoading: loading, refetch: fetchSessions } = useSessions({
    status: status || undefined,
    searchTerm: searchTerm || undefined
  });
  
  const sessions: (Session & { date: string })[] = React.useMemo(() => {
    if (!sessionsResponse?.data) return [];
    return sessionsResponse.data.map((s: any) => ({
      ...s,
      date: s.date && s.date.seconds ? format(new Date(s.date.seconds * 1000), "MMM dd, yyyy") : "N/A",
    }));
  }, [sessionsResponse]);


  const handleCreateSession = React.useCallback(async (values: any) => {
    try {
      const sessionDocRef = await addDoc(collection(db, "sessions"), {
          patientName: values.patient,
          patientId: 'mock-patient-id',
          patientEmail: 'mock-email@example.com',
          type: values.sessionType,
          plan: values.servicePlan,
          provider: values.provider,
          date: Timestamp.fromDate(values.dateTime),
          status: "pending",
      });
      
      const flowResult = await initializeFlow({
        patientId: 'mock-patient-id',
        categoryId: 'general',
        productId: null
      });

      if (flowResult.success && (flowResult.flow as any)?.id) {
        await updateDoc(sessionDocRef, { flowId: (flowResult.flow as any).id });
        toast({
            title: "Session Scheduled",
            description: `A new session has been scheduled and a telehealth flow has been initiated.`,
        });
        router.push(`/dashboard/sessions/${sessionDocRef.id}`);
      } else {
        throw new Error((flowResult.error as any)?.message || "Failed to initiate telehealth flow.");
      }

      fetchSessions();
      setIsModalOpen(false);
    } catch (error: any) {
       console.error("Error creating session or flow: ", error);
       toast({
        variant: "destructive",
        title: "Error Scheduling Session",
        description: error.message || "An error occurred while creating the session or flow.",
      });
    }
  }, [initializeFlow, toast, router, fetchSessions, setIsModalOpen]);

  const handleUpdateStatus = React.useCallback(async (sessionId: string, newStatus: SessionStatus) => {
    updateStatusMutation.mutate({ sessionId, status: newStatus });
  }, [updateStatusMutation]);


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-semibold">{sessions.length}</span> | 
              Pending: <span className="font-semibold">{sessions.filter(s => s.status === 'pending').length}</span> | 
              Completed: <span className="font-semibold">{sessions.filter(s => s.status === 'completed').length}</span>
            </div>
            <Button onClick={() => setIsModalOpen(true)} disabled={flowLoading}>
              <Plus className="h-4 w-4" /> {flowLoading ? "Initializing..." : "Add Session"}
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
            options={["initial_consultation", "follow_up", "check_in", "emergency"]}
          />
          <FilterDropdown
            label="All Statuses"
            options={["pending", "in-progress", "completed", "cancelled", "followup"]}
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
                            <Badge variant="outline" className="capitalize">{session.type.replace(/_/g, ' ')}</Badge>
                            </TableCell>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>{session.plan || 'N/A'}</TableCell>
                            <TableCell>{session.provider || 'N/A'}</TableCell>
                            <TableCell>
                                <StatusBadge status={session.status} />
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
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/sessions/${session.id}`}>View Details / Notes</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                    {SESSION_STATUSES.map(status => (
                                        <DropdownMenuItem 
                                            key={status}
                                            disabled={session.status === status}
                                            onClick={() => handleUpdateStatus(session.id, status)}
                                            className="capitalize"
                                        >
                                            Mark as {status.replace(/-/g, ' ')}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
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
          <div>Showing 1 to {sessions.length} of {sessionsResponse?.meta?.total || 0} sessions</div>
          {/* Pagination controls can be added here */}
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
