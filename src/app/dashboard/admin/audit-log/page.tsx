
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';
import type { AuditLog, DatabaseError } from '@/services/database';

interface AuditLogDisplay {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  userAgent?: string;
}

type QueryError = Error;

const formatAuditLog = (log: AuditLog): AuditLogDisplay => ({
  id: log.id,
  timestamp: log.timestamp ? format(new Date(log.timestamp), "MMM dd, yyyy, hh:mm:ss a") : "N/A",
  userId: log.userId,
  action: log.action,
  resource: log.resource,
  resourceId: log.resourceId,
  changes: log.changes,
  userAgent: log.userAgent
});

const fetchLogs = async (): Promise<AuditLogDisplay[]> => {
    const response = await dbService.auditLogs.getAll({ sortBy: 'timestamp', sortDirection: 'desc' });
    if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch audit logs');
    }
    if (!response.data) {
        throw new Error('Failed to fetch audit logs');
    }
    return response.data.map(formatAuditLog);
};

export default function AuditLogPage() {
    const { toast } = useToast();
    const {
        data: logs = [],
        isLoading: loading
    }: UseQueryResult<AuditLogDisplay[], QueryError> = useQuery({
        queryKey: ['auditLogs'],
        queryFn: fetchLogs
    });

    const handleError = React.useCallback((error: QueryError) => {
        toast({
            variant: "destructive",
            title: "Error Fetching Logs",
            description: error.message
        });
    }, [toast]);

    React.useEffect(() => {
        return () => {
            // Cleanup effect
        };
    }, []);

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
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{`${log.resource} (${log.resourceId})`}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
