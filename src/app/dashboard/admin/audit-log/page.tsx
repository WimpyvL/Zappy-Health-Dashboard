
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, FolderOpen, ArrowUpDown, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
<<<<<<< HEAD
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { db } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  details: string;
};

const fetchLogs = async () => {
    const response = await dbService.getAll<any>('audit_logs', { sortBy: 'timestamp', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch audit logs');
    return response.data.map((log: any) => ({
        ...log,
        timestamp: log.timestamp ? format(log.timestamp.toDate(), "MMM dd, yyyy, hh:mm:ss a") : "N/A",
    }));
};

export default function AuditLogPage() {
    const { toast } = useToast();
<<<<<<< HEAD
    const { data: logs = [], isLoading: loading } = useQuery<AuditLog[], Error>({
        queryKey: ['auditLogs'],
        queryFn: fetchLogs,
        onError: (error) => toast({ variant: "destructive", title: "Error Fetching Logs", description: error.message }),
    });
=======

    React.useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                if (!db) {
                    throw new Error("Firebase not initialized");
                }
                
                const logsCollection = collection(db, "audit_logs");
                const q = query(logsCollection, orderBy("timestamp", "desc"));
                const logsSnapshot = await getDocs(q);
                const logsList = logsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp ? format(data.timestamp.toDate(), "MMM dd, yyyy, hh:mm:ss a") : "N/A",
                    } as AuditLog;
                });
                setLogs(logsList);
            } catch (error) {
                console.error("Error fetching audit logs: ", error);
                toast({
                    variant: "destructive",
                    title: "Error Fetching Logs",
                    description: "Could not retrieve audit log data from the database.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [toast]);
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

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
