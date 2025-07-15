
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                  Pending: <span className="font-semibold">0</span> |
                  Total Amount: <span className="font-semibold">$0.00</span>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices by patient or ID..." className="pl-9" />
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
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Product/Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Discount</TableHead>
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
                      {/* Cells with data */}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

         <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 0 to 0 of 0 results</div>
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
      <CreateInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
