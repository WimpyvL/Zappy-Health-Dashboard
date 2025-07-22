
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database';

type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  details: string;
};

const fetchLogs = async () => {
    const response = await dbService.auditLogs.getAll({ sortBy: 'timestamp', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch audit logs');
    return response.data.map((log: any) => ({
        ...log,
        timestamp: log.timestamp ? format(log.timestamp.toDate(), "MMM dd, yyyy, hh:mm:ss a") : "N/A",
    }));
};

export default function AuditLogPage() {
    const { toast } = useToast();
    const { data: logs = [], isLoading: loading } = useQuery<AuditLog[], Error>({
        queryKey: ['auditLogs'],
        queryFn: fetchLogs,
        onError: (error) => toast({ variant: "destructive", title: "Error Fetching Logs", description: error.message }),
    });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Audit Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>A log of all significant actions taken within the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              : logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
