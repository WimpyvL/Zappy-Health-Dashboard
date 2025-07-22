
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Pill } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
<<<<<<< HEAD
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database';
import { Skeleton } from "@/components/ui/skeleton";
=======
import { db } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

interface PatientOrdersTabProps {
  patientId: string;
}

const fetchOrders = async (patientId: string) => {
    if (!patientId) return [];
    const response = await dbService.getAll<any>('orders', {
        filters: [{ field: 'patientId', op: '==', value: patientId }],
        sortBy: 'orderDate',
        sortDirection: 'desc'
    });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch orders');
    return response.data.map((order: any) => ({
        ...order,
        orderDate: order.orderDate ? format(order.orderDate.toDate(), 'MMM dd, yyyy') : 'N/A'
    }));
};

export function PatientOrdersTab({ patientId }: PatientOrdersTabProps) {
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ['patientOrders', patientId],
    queryFn: () => fetchOrders(patientId),
    enabled: !!patientId,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Orders</CardTitle>
          <Button>New Order</Button>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" />
          : orders.length > 0 ? (
            <Table>
                <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                    {orders.map((order: any) => (
                        <TableRow key={order.id}>
                            <TableCell>{order.id.substring(0,8)}</TableCell>
                            <TableCell>{order.orderDate}</TableCell>
                            <TableCell><Badge>{order.status}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <p>No orders found for this patient.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
