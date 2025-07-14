"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, FolderOpen, ArrowUpDown, ChevronDown } from "lucide-react";

type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  details: string;
};

const mockLogs: AuditLog[] = [
  // No mock logs to show the empty state
];

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

export default function AuditLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Audit Log</h1>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>
                A log of all significant actions taken within the system.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search logs by user or action..." className="pl-9" />
                </div>
                <FilterDropdown label="All Actions" options={["User Login", "Patient Created", "Order Updated"]} />
                <FilterDropdown label="All Roles" options={["Admin", "Provider", "Patient"]} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        Timestamp
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        User
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        Action
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                </TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.length > 0 ? (
                mockLogs.map((log) => (
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
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FolderOpen className="h-12 w-12 text-gray-400" />
                      <span>No data</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
