
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Search, ChevronDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateInvoiceModal } from "./components/create-invoice-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';

type Invoice = {
  id: string;
  patientName: string;
  dueDate: string;
  subscriptionPlan?: string;
  lineItems: { product: string; description: string; quantity: number; price: number }[];
  discountAmount?: number;
  taxRate?: number;
  status: "Paid" | "Pending" | "Overdue" | "Draft";
  amount: number;
};

const fetchInvoices = async () => {
    const response = await dbService.getAll<any>('invoices', { sortBy: 'dueDate', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch invoices');
    return response.data.map((invoice: any) => ({
        ...invoice,
        dueDate: invoice.dueDate ? format(invoice.dueDate.toDate(), "MMM dd, yyyy") : "N/A",
    }));
};

const createInvoice = async (values: any) => {
    const newInvoice = {
        patientName: values.patientName,
        dueDate: new Date(values.dueDate),
        subscriptionPlan: values.subscriptionPlan,
        lineItems: values.lineItems,
        discountAmount: values.discountAmount,
        taxRate: values.taxRate,
        amount: values.total,
        status: "Pending",
    };
    const response = await dbService.create('invoices', newInvoice);
    if (response.error) throw new Error(response.error);
    return response.data;
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: { [key: string]: string } = {
    Paid: "bg-green-100 text-green-800", Pending: "bg-yellow-100 text-yellow-800",
    Overdue: "bg-red-100 text-red-800", Draft: "bg-gray-100 text-gray-800",
  };
  return <Badge className={`${statusMap[status]} hover:${statusMap[status]}`}>{status}</Badge>;
};

export default function InvoicesPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading: loading } = useQuery<Invoice[], Error>({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    onError: (error) => toast({ variant: "destructive", title: "Error fetching invoices", description: error.message }),
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        toast({ title: "Invoice Created", description: `A new invoice for ${data?.patientName} has been created.` });
        setIsModalOpen(false);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error Creating Invoice", description: error.message }),
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Create Invoice</Button>
        </div>
        {/* Search and filter UI remains the same */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox /></TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                  ))
                ) : invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>{invoice.patientName}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell><StatusBadge status={invoice.status} /></TableCell>
                      <TableCell>${invoice.amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center">No invoices found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <CreateInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={createMutation.mutate} />
    </>
  );
}
