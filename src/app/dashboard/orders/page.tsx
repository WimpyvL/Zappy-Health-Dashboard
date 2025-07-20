
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Search, ChevronDown, Filter, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateOrderModal } from "./components/create-order-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';

type Order = {
  id: string;
  patientName?: string;
  patientId: string;
  orderDate: string;
  medication: string;
  status: "Processing" | "Shipped" | "Delivered" | "Canceled";
  linkedSession?: string;
  pharmacy?: string;
  tracking?: string;
};

const fetchOrders = async () => {
    const response = await dbService.getAll<any>('orders', { sortBy: 'orderDate', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch orders');
    return response.data.map((order: any) => ({
        ...order,
        orderDate: order.orderDate ? format(order.orderDate.toDate(), "MMM dd, yyyy") : "N/A",
    }));
};

const createOrder = async (newOrder: Omit<Order, 'id' | 'orderDate'>) => {
    const response = await dbService.create('orders', { ...newOrder, status: 'Processing' });
    if (response.error) throw new Error(response.error);
    return response.data;
};

const OrderStatusBadge = ({ status }: { status: string }) => {
  const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Processing": "secondary", "Shipped": "default", "Delivered": "outline", "Canceled": "destructive",
  };
  const colorMap: { [key: string]: string } = {
    "Processing": "bg-yellow-100 text-yellow-800", "Shipped": "bg-blue-100 text-blue-800",
    "Delivered": "bg-green-100 text-green-800", "Canceled": "bg-red-100 text-red-800",
  };
  return <Badge variant={variantMap[status] || 'secondary'} className={colorMap[status]}>{status}</Badge>;
};

export default function OrdersPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading } = useQuery<Order[], Error>({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    onError: (error) => toast({ variant: "destructive", title: "Error fetching orders", description: error.message }),
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        toast({ title: "Order Created", description: `A new order for patient ID ${data?.patientId} has been created.` });
        setIsModalOpen(false);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error Creating Order", description: error.message }),
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders</h1>
          <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="h-4 w-4 mr-2" />Create Order</Button>
        </div>
        {/* Search and filter UI remains the same */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox /></TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>{order.patientName || order.patientId}</TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>{order.medication}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-48 text-center">No orders found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <CreateOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={createMutation.mutate} />
    </>
  );
}
