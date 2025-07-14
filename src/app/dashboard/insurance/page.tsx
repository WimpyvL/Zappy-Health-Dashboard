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

const mockDocuments: any[] = [];

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: { [key: string]: { className: string; label: string } } = {
    "Active": { className: "bg-green-100 text-green-800", label: "Active" },
    "Pending": { className: "bg-yellow-100 text-yellow-800", label: "Pending" },
    "Expired": { className: "bg-red-100 text-red-800", label: "Expired" },
  };

  const currentStatus = statusMap[status] || { className: "bg-gray-100 text-gray-800", label: "Unknown" };

  return (
    <Badge variant="secondary" className={`${currentStatus.className} hover:${currentStatus.className}`}>
      {currentStatus.label}
    </Badge>
  );
};

export default function InsurancePage() {
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(timer);
    }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Insurance Documentation</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden md:block">
            Total: <span className="font-semibold">0</span> |
            Active: <span className="font-semibold">0</span> |
            Pending: <span className="font-semibold">0</span>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search insurance documents..." className="pl-9" />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
                All Types
                <ChevronDown className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Insurance Card</DropdownMenuItem>
                <DropdownMenuItem>Prior Authorization</DropdownMenuItem>
                <DropdownMenuItem>Claim Form</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
                All Statuses
                <ChevronDown className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Active</DropdownMenuItem>
                <DropdownMenuItem>Pending</DropdownMenuItem>
                <DropdownMenuItem>Expired</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Policy Number</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : mockDocuments.length > 0 ? (
                mockDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>{doc.patient}</TableCell>
                    <TableCell>{doc.policyNumber}</TableCell>
                    <TableCell>{doc.expiryDate}</TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
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
                          <DropdownMenuItem>View Document</DropdownMenuItem>
                          <DropdownMenuItem>Verify</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    No documents found.
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
