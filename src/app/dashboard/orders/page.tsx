
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  CheckCircle,
  XCircle,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOrderModal } from "./components/create-order-modal";
import { useToast } from "@/hooks/use-toast";
import { useOrderList, useOrderWorkflow, Order } from "@/hooks/useOrderWorkflow";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type OrderStatus = 
  | "order_placed"
  | "consultation_pending" 
  | "intake_completed"
  | "provider_review"
  | "provider_approved"
  | "prescription_sent"
  | "pharmacy_received"
  | "pharmacy_filling"
  | "pharmacy_ready"
  | "pharmacy_dispensed"
  | "order_processing"
  | "order_shipped"
  | "out_for_delivery"
  | "order_delivered"
  | "canceled";

const OrderStatusBadge = ({ status, isPrescriptionOrder }: { 
  status: OrderStatus; 
  isPrescriptionOrder: boolean;
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case "order_placed": return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "consultation_pending": return { color: "bg-yellow-100 text-yellow-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "intake_completed": return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "provider_review": return { color: "bg-orange-100 text-orange-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "provider_approved": return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "prescription_sent": return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "pharmacy_received": return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "pharmacy_filling": return { color: "bg-yellow-100 text-yellow-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "pharmacy_ready": return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "pharmacy_dispensed": return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "order_processing": return { color: "bg-yellow-100 text-yellow-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "order_shipped": return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "out_for_delivery": return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "order_delivered": return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "canceled": return { color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> };
      default: return { color: "bg-gray-100 text-gray-800", icon: <CheckCircle className="w-3 h-3" /> };
    }
  };

  const { color, icon } = getStatusInfo();
  const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Badge className={`${color} flex items-center gap-1`}>
      {icon}
      {displayStatus}
    </Badge>
  );
};

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const { toast } = useToast();
  
  const { orders, loading, error } = useOrderList({ limit: 100 });

  const { updateOrderStatus, progressOrder, cancelOrder } = useOrderWorkflow(selectedOrder?.id || null);

  const filteredOrders = React.useMemo(() => {
    return (orders as Order[]).filter((order: Order) => {
      const matchesSearch = !searchQuery ||
        order.medication?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.patientId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      const matchesType = typeFilter === "all" ||
        (typeFilter === "prescription" && order.isPrescriptionRequired) ||
        (typeFilter === "otc" && !order.isPrescriptionRequired);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      setSelectedOrder(order);
      await updateOrderStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Order status has been updated to ${newStatus.replace(/_/g, ' ')}`,
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleProgressOrder = async (order: Order) => {
    try {
      setSelectedOrder(order);
      await progressOrder();
      toast({ title: "Order Progressed", description: "Order has been moved to the next stage" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleCancelOrder = async (order: Order) => {
    try {
      setSelectedOrder(order);
      await cancelOrder();
      toast({ title: "Order Canceled", description: "Order has been canceled successfully" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Input 
            placeholder="Search orders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Checkbox /></TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}><TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                  ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell>
                        <div className="font-medium">{order.patientName || order.patientId}</div>
                        <div className="text-sm text-muted-foreground">ID: {order.patientId}</div>
                      </TableCell>
                      <TableCell>{order.createdAt ? format(order.createdAt.toDate(), "MMM dd, yyyy") : "N/A"}</TableCell>
                      <TableCell>{order.medication}</TableCell>
                      <TableCell><Badge variant={order.isPrescriptionRequired ? "default" : "secondary"}>{order.isPrescriptionRequired ? "Prescription" : "OTC"}</Badge></TableCell>
                      <TableCell><OrderStatusBadge status={order.status as OrderStatus} isPrescriptionOrder={!!order.isPrescriptionRequired} /></TableCell>
                      <TableCell>${order.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}><Eye className="h-4 w-4 mr-2" /> View Timeline</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProgressOrder(order)}><CheckCircle className="h-4 w-4 mr-2" /> Progress Order</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleCancelOrder(order)} className="text-destructive"><XCircle className="h-4 w-4 mr-2" /> Cancel Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={8} className="h-48 text-center text-muted-foreground">No orders found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order Details & Timeline</DialogTitle></DialogHeader>
          {selectedOrder && <OrderTimeline order={selectedOrder} className="mt-4" />}
        </DialogContent>
      </Dialog>
      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={() => setIsCreateModalOpen(false)} 
      />
    </>
  );
}
