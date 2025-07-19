
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  ChevronDown,
  Filter,
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
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { db } from "@/lib/firebase";

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
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedInvoices, setSelectedInvoices] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    try {
      const invoicesCollection = collection(db, "invoices");
      const invoiceSnapshot = await getDocs(query(invoicesCollection, orderBy("dueDate", "desc")));
      const invoiceList = invoiceSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate ? format(data.dueDate.toDate(), "MMM dd, yyyy") : "N/A",
        } as Invoice;
      });
      setInvoices(invoiceList);
    } catch (error) {
      console.error("Error fetching invoices: ", error);
      toast({
        variant: "destructive",
        title: "Error fetching invoices",
        description: "Could not retrieve invoice data from the database.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateInvoice = async (values: any) => {
    try {
        await addDoc(collection(db, "invoices"), {
            patientName: values.patientName,
            dueDate: Timestamp.fromDate(values.dueDate),
            subscriptionPlan: values.subscriptionPlan,
            lineItems: values.lineItems,
            discountAmount: values.discountAmount,
            taxRate: values.taxRate,
            amount: values.total,
            status: "Pending", // Default status for new invoices
            createdAt: Timestamp.now(),
        });
        toast({
            title: "Invoice Created",
            description: `A new invoice for ${values.patientName} has been created.`,
        });
        fetchInvoices();
        setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating invoice: ", error);
      toast({
        variant: "destructive",
        title: "Error Creating Invoice",
        description: "An error occurred while creating the invoice.",
      });
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const totalAmount = invoices.reduce((acc, invoice) => acc + (invoice.amount || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden md:block">
                  Total: <span className="font-semibold">{invoices.length}</span> |
                  Paid: <span className="font-semibold">{paidInvoices}</span> |
                  Pending: <span className="font-semibold">{pendingInvoices}</span> |
                  Total Amount: <span className="font-semibold">${totalAmount.toFixed(2)}</span>
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
                        checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                        onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Due Date</TableHead>
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
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Checkbox disabled/></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                          <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={() => handleSelect(invoice.id)}
                          />
                      </TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{invoice.patientName}</TableCell>
                      <TableCell className="font-mono text-xs">{invoice.id.substring(0, 8)}</TableCell>
                      <TableCell>{invoice.subscriptionPlan || invoice.lineItems[0]?.product}</TableCell>
                      <TableCell><StatusBadge status={invoice.status} /></TableCell>
                      <TableCell className="font-medium">${invoice.amount?.toFixed(2)}</TableCell>
                      <TableCell>${invoice.discountAmount?.toFixed(2) || '0.00'}</TableCell>
                       <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                                <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
          <div>Showing 1 to {invoices.length} of {invoices.length} results</div>
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
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={invoices.length === 0}>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={invoices.length === 0}>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <CreateInvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateInvoice} />
    </>
  );
}
