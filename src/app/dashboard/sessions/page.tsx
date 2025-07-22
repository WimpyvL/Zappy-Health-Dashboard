
"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScheduleSessionModal } from "./components/schedule-session-modal";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
import { telehealthFlowOrchestrator } from '@/services/telehealthFlowOrchestrator';
import { Skeleton } from "@/components/ui/skeleton";

const SESSION_STATUSES = ['pending', 'in-progress', 'completed', 'cancelled', 'followup'] as const;
type SessionStatus = typeof SESSION_STATUSES[number];

interface Session {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  type: string;
  plan?: string;
  provider?: string;
  date: string;
  status: SessionStatus;
}

const fetchSessions = async (status?: string | null, searchTerm?: string | null) => {
    const filters: any[] = [];
    if (status) filters.push({ field: 'status', op: '==', value: status });
    
    // Note: Firestore does not support case-insensitive 'contains' queries.
    // This search is limited and a more robust solution like Algolia would be better for production.
    if (searchTerm) filters.push({ field: 'patientName', op: '>=', value: searchTerm });

    const response = await dbService.sessions.getAll({ filters, sortBy: 'date', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error as string || 'Failed to fetch sessions');
    
    return response.data.map((s: any) => ({
      ...s,
      date: s.date && s.date.seconds ? format(new Date(s.date.seconds * 1000), "MMM dd, yyyy") : "N/A",
    }));
};

const createSession = async (values: any) => {
    const flowResult = await telehealthFlowOrchestrator.initializeFlow({
        patientId: 'mock-patient-id', // This should come from a patient selection UI
        categoryId: 'general',
        productId: undefined
    });

    if (!flowResult.success || !flowResult.flow?.id) {
        throw new Error(flowResult.error?.message || "Failed to initiate telehealth flow.");
    }

    const sessionData = {
        patientName: values.patient,
        patientId: 'mock-patient-id',
        patientEmail: 'mock-email@example.com',
        type: values.sessionType,
        plan: values.servicePlan,
        provider: values.provider,
        date: new Date(values.dateTime),
        status: "pending",
        flowId: flowResult.flow.id,
    };

    const response = await dbService.sessions.create(sessionData);
    if (response.error || !response.data) throw new Error(response.error as string || 'Failed to create session');
    return { ...response.data, flowId: flowResult.flow.id };
};

const updateSessionStatus = async ({ sessionId, status }: { sessionId: string, status: SessionStatus }) => {
    const response = await dbService.sessions.update(sessionId, { status });
    if (response.error) throw new Error(response.error as string);
    return response.data;
};


const StatusBadge = ({ status }: { status: SessionStatus }) => {
    const statusConfig: Record<SessionStatus, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
      'in-progress': { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
      followup: { label: "Follow-up", className: "bg-purple-100 text-purple-800" },
    };
    const currentStatus = statusConfig[status] || statusConfig.pending;
    return <Badge variant="secondary" className={`${currentStatus.className} hover:${currentStatus.className}`}>{currentStatus.label}</Badge>;
};

export default function SessionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const status = searchParams.get('status');
  const searchTerm = searchParams.get('searchTerm');

  const { data: sessions = [], isLoading: loading } = useQuery<Session[], Error>({
    queryKey: ['sessions', { status, searchTerm }],
    queryFn: () => fetchSessions(status, searchTerm),
  });

  const createMutation = useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        toast({ title: "Session Scheduled", description: "A new session has been scheduled." });
        router.push(`/dashboard/sessions/${data.id}`);
        setIsModalOpen(false);
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Error Scheduling Session", description: error.message });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateSessionStatus,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] });
        toast({ title: "Status Updated", description: "The session status has been updated." });
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Error Updating Status", description: error.message });
    }
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsModalOpen(true)} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" /> {createMutation.isPending ? "Initializing..." : "Add Session"}
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell>
                                <Link href={`/dashboard/patients/${session.patientId}`} className="font-medium text-primary hover:underline">{session.patientName || 'N/A'}</Link>
                                <div className="text-sm text-muted-foreground">{session.patientEmail || session.patientId}</div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{session.type.replace(/_/g, ' ')}</Badge></TableCell>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>{session.provider || 'N/A'}</TableCell>
                            <TableCell><StatusBadge status={session.status} /></TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild><Link href={`/dashboard/sessions/${session.id}`}>View Details</Link></DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {SESSION_STATUSES.map(status => (
                                            <DropdownMenuItem key={status} disabled={session.status === status} onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status })}>
                                                Mark as {status.replace(/-/g, ' ')}
                                            </DropdownMenuItem>
                                        ))}
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
      </div>
      <ScheduleSessionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={createMutation.mutate} />
    </>
  );
}
