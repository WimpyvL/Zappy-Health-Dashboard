
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, FileStack, History, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database';

interface PatientBillingTabProps {
  patientId: string;
}

type Invoice = {
  id: string;
  dueDate: { toDate: () => Date };
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

const fetchBillingData = async (patientId: string) => {
    if (!patientId) return [];
    const response = await dbService.getAll<Invoice>('invoices', {
        filters: [{ field: 'patientId', op: '==', value: patientId }],
        sortBy: 'dueDate',
        sortDirection: 'desc'
    });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch billing data');
    return response.data;
};

export function PatientBillingTab({ patientId }: PatientBillingTabProps) {
  const { toast } = useToast();
  const { data: invoices = [], isLoading: loading } = useQuery<Invoice[], Error>({
    queryKey: ['patientBilling', patientId],
    queryFn: () => fetchBillingData(patientId),
    enabled: !!patientId,
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              : invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                        <TableCell>{invoice.id.substring(0,8)}</TableCell>
                        <TableCell>{format(invoice.dueDate.toDate(), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                        <TableCell><Badge>{invoice.status}</Badge></TableCell>
                    </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
