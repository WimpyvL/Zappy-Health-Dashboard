
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, FileStack, History, Plus, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { getFirebaseFirestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/billing/PaymentModal";

interface PatientBillingTabProps {
  patientId: string;
}

type Invoice = {
  id: string;
  dueDate: { toDate: () => Date };
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export function PatientBillingTab({ patientId }: PatientBillingTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!patientId) {
          setLoading(false);
          return;
      };
      
      const db = getFirebaseFirestore();
      if (!db) {
        console.warn("Firebase not initialized - using demo data for billing");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch invoices
        const q = query(collection(db, "invoices"), where("patientId", "==", patientId), orderBy("dueDate", "desc"));
        const querySnapshot = await getDocs(q);
        const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        setInvoices(invoicesData);

        // Fetch patient info for payment modal
        const patientQuery = query(collection(db, "patients"), where("__name__", "==", patientId));
        const patientSnapshot = await getDocs(patientQuery);
        if (!patientSnapshot.empty) {
          const patientData = patientSnapshot.docs[0]?.data();
          if (patientData) {
            setPatientName(`${patientData.firstName || ''} ${patientData.lastName || ''}`.trim());
          }
        }
      } catch (error) {
        console.error("Error fetching billing data: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch billing information.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [patientId, toast]);

  // Calculate total balance due
  const totalBalance = invoices
    .filter(invoice => invoice.status !== 'Paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  // Handle payment modal
  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const handlePayBalance = () => {
    const unpaidInvoices = invoices.filter(invoice => invoice.status !== 'Paid');
    if (unpaidInvoices.length > 0) {
      // For balance payment, we'll use the oldest unpaid invoice
      const oldestInvoice = unpaidInvoices[unpaidInvoices.length - 1];
      if (oldestInvoice) {
        handlePayInvoice(oldestInvoice);
      }
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedInvoice(null);
    // Refresh billing data
    const fetchBillingData = async () => {
      const db = getFirebaseFirestore();
      if (!db) return;
      
      try {
        const q = query(collection(db, "invoices"), where("patientId", "==", patientId), orderBy("dueDate", "desc"));
        const querySnapshot = await getDocs(q);
        const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Error refreshing billing data: ", error);
      }
    };
    fetchBillingData();
  };
  
  return (
    <div className="space-y-6">
      {/* Billing Summary Card */}
      <Card className="bg-yellow-50/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Billing Summary</CardTitle>
          </div>
          <Button
            onClick={handlePayBalance}
            disabled={totalBalance === 0}
          >
            Pay Balance
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase">Current Balance Due</p>
            {loading ? <Skeleton className="h-8 w-24 mt-1" /> : <p className="text-3xl font-bold text-yellow-600 mt-1">${totalBalance.toFixed(2)}</p>}
            {loading ? <Skeleton className="h-4 w-32 mt-1" /> : <p className="text-xs text-muted-foreground">Due by {invoices.length > 0 ? format(invoices.find(i => i.status !== 'Paid')?.dueDate?.toDate() || new Date(), 'MMM dd, yyyy') : 'N/A'}</p>}
          </div>
          <div className="md:col-span-2 space-y-4">
             <div>
                <p className="text-sm font-semibold">Payment Method</p>
                <div className="flex justify-between items-center mt-1 text-sm p-3 border rounded-md bg-white">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {loading ? <Skeleton className="h-5 w-40" /> : <span>No payment method on file</span>}
                    </div>
                    <Button variant="secondary" size="sm">Add</Button>
                </div>
            </div>
             <div>
                <p className="text-sm font-semibold">Active Subscription</p>
                 <div className="flex justify-between items-center mt-1 text-sm p-3 border rounded-md bg-white">
                    {loading ? <Skeleton className="h-5 w-32" /> : <span className="text-muted-foreground">No active subscription</span>}
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <FileStack className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Invoices</CardTitle>
            </div>
            <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length: 2}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                ))
              ) : invoices.length > 0 ? (
                invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">{invoice.id.substring(0,8)}...</TableCell>
                        <TableCell>{format(invoice.dueDate.toDate(), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'} className={invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}>{invoice.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">View</Button>
                            {invoice.status !== 'Paid' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handlePayInvoice(invoice)}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No invoices to display.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment History Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Payment History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No payment history to display.
                    </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {paymentModalOpen && selectedInvoice && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          invoice={{
            id: selectedInvoice.id,
            amount: selectedInvoice.amount,
            patientName: patientName || 'Unknown Patient',
            dueDate: format(selectedInvoice.dueDate.toDate(), 'MMM dd, yyyy')
          }}
          patientId={patientId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
