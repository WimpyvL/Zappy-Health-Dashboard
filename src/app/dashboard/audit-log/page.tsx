
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

const FilterDropdown = ({ label, options }: { label: string; options: string[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline" className="flex items-center gap-2">{label}<ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">{options.map((option) => (<DropdownMenuItem key={option}>{option}</DropdownMenuItem>))}</DropdownMenuContent>
    </DropdownMenu>
);

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>A log of all significant actions taken within the system.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search logs..." className="pl-9" />
                </div>
                <FilterDropdown label="All Actions" options={["User Login", "Patient Created", "Order Updated"]} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Button variant="ghost" size="sm">Timestamp<ArrowUpDown className="ml-2 h-3 w-3" /></Button></TableHead>
                <TableHead><Button variant="ghost" size="sm">User<ArrowUpDown className="ml-2 h-3 w-3" /></Button></TableHead>
                <TableHead><Button variant="ghost" size="sm">Action<ArrowUpDown className="ml-2 h-3 w-3" /></Button></TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>
                      <div>{log.user}</div>
                      <div className="text-xs text-muted-foreground">{log.userRole}</div>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.details}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-48 text-center"><FolderOpen className="mx-auto h-12 w-12 text-gray-400" /><span>No data</span></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
