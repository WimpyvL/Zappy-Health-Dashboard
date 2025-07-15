
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  Filter,
  Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Checkbox } from "@/components/ui/checkbox";
import { CreateInvoiceModal } from "./components/create-invoice-modal";

const mockInvoices: any[] = [
  // Empty to show the empty state as per design
];

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: { [key: string]: string } = {
    Paid: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Overdue: "bg-red-100 text-red-800",
    Draft: "bg-gray-100 text-gray-800",
  };
  return (
    <Badge className={`${statusMap[status]} hover:${statusMap[status]}`}>
      {status}
    </Badge>
  );
};

export default function InvoicesPage() {
  const [selectedInvoices, setSelectedInvoices] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedInvoices(mockInvoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden md:block">
                  Total: <span className="font-semibold">0</span> | 
                  Paid: <span className="font-semibold">0</span> | 
                  Overdue: <span className="font-semibold">0</span>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by patient, invoice #, or amount..." className="pl-9" />
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                  All Statuses
                  <ChevronDown className="h-4 w-4" />
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem>Paid</DropdownMenuItem>
                  <DropdownMenuItem>Pending</DropdownMenuItem>
                  <DropdownMenuItem>Overdue</DropdownMenuItem>
                  <DropdownMenuItem>Draft</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {selectedInvoices.length > 0 && (
          <Card>
              <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{selectedInvoices.length} selected</p>
                      <div className="flex gap-2">
                          <Button variant="outline" size="sm">Mark Paid</Button>
                          <Button variant="outline" size="sm">Mark Pending</Button>
                          <Button variant="outline" size="sm">Send Reminders</Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
                      </div>
                  </div>
              </CardHeader>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                      <Checkbox
                          checked={selectedInvoices.length === mockInvoices.length && mockInvoices.length > 0}
                          onCheckedChange={handleSelectAll}
                      />
                  </TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.length > 0 ? (
                  mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                          <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={() => handleSelect(invoice.id)}
                          />
                      </TableCell>
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{invoice.patientName}</TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                            <DropdownMenuItem><Download className="h-4 w-4 mr-2" /> Download PDF</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <CreateInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
