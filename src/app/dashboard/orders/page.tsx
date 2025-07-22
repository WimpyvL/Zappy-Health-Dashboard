"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  ChevronDown,
  Filter,
  Save,
  Eye,
  Edit,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Bell,
  Activity
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateOrderModal } from "./components/create-order-modal";
import { useToast } from "@/hooks/use-toast";
import { useOrderList, useOrderWorkflow } from "@/hooks/useOrderWorkflow";
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

interface Order {
  id: string;
  patientName?: string;
  patientId: string;
  createdAt: any;
  medication: string;
  status: OrderStatus;
  isPrescriptionRequired: boolean;
  total: number;
  linkedSession?: string;
  pharmacyName?: string;
  trackingNumber?: string;
  prescriptionDetails?: any;
  pharmacyDetails?: any;
  shippingDetails?: any;
  statusHistory?: any[];
}

const OrderStatusBadge = ({ status, isPrescriptionOrder }: { 
  status: OrderStatus; 
  isPrescriptionOrder: boolean;
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case "order_placed":
        return { color: "bg-blue-100 text-blue-800", icon: <Package className="w-3 h-3" /> };
      case "consultation_pending":
        return { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> };
      case "intake_completed":
        return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "provider_review":
        return { color: "bg-orange-100 text-orange-800", icon: <Clock className="w-3 h-3" /> };
      case "provider_approved":
        return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "prescription_sent":
        return { color: "bg-blue-100 text-blue-800", icon: <Package className="w-3 h-3" /> };
      case "pharmacy_received":
        return { color: "bg-blue-100 text-blue-800", icon: <Package className="w-3 h-3" /> };
      case "pharmacy_filling":
        return { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> };
      case "pharmacy_ready":
        return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "pharmacy_dispensed":
        return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "order_processing":
        return { color: "bg-yellow-100 text-yellow-800", icon: <Package className="w-3 h-3" /> };
      case "order_shipped":
        return { color: "bg-blue-100 text-blue-800", icon: <Truck className="w-3 h-3" /> };
      case "out_for_delivery":
        return { color: "bg-blue-100 text-blue-800", icon: <Truck className="w-3 h-3" /> };
      case "order_delivered":
        return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> };
      case "canceled":
        return { color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: <Clock className="w-3 h-3" /> };
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

const OrderQuickStats = ({ orders }: { orders: Order[] }) => {
  const stats = {
    total: orders.length,
    prescriptions: orders.filter(o => o.isPrescriptionRequired).length,
    otc: orders.filter(o => !o.isPrescriptionRequired).length,
    pending: orders.filter(o => !['order_delivered', 'pharmacy_dispensed', 'canceled'].includes(o.status)).length,
    completed: orders.filter(o => ['order_delivered', 'pharmacy_dispensed'].includes(o.status)).length,
    canceled: orders.filter(o => o.status === 'canceled').length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <Card className="p-4">
        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-sm text-muted-foreground">Total Orders</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-purple-600">{stats.prescriptions}</div>
        <div className="text-sm text-muted-foreground">Prescriptions</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-green-600">{stats.otc}</div>
        <div className="text-sm text-muted-foreground">OTC Orders</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        <div className="text-sm text-muted-foreground">Pending</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </Card>
      <Card className="p-4">
        <div className="text-2xl font-bold text-red-600">{stats.canceled}</div>
        <div className="text-sm text-muted-foreground">Canceled</div>
      </Card>
    </div>
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

  // Use our new hooks for real-time data
  const { orders, loading, error } = useOrderList({
    limit: 100 // Adjust as needed
  });

  const {
    updateOrderStatus,
    progressOrder,
    cancelOrder,
    updating
  } = useOrderWorkflow(selectedOrder?.id);

  // Filter orders based on current filters
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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
    }
  };

  const handleProgressOrder = async (order: Order) => {
    try {
      setSelectedOrder(order);
      await progressOrder();
      toast({
        title: "Order Progressed",
        description: "Order has been moved to the next stage",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to progress order",
      });
    }
  };

  const handleCancelOrder = async (order: Order) => {
    try {
      setSelectedOrder(order);
      await cancelOrder();
      toast({
        title: "Order Canceled",
        description: "Order has been canceled successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel order",
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error Loading Orders</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time Updates
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <OrderQuickStats orders={orders} />

        {/* Filters and Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders by patient, medication, or ID..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="consultation_pending">Consultation Pending</SelectItem>
              <SelectItem value="provider_review">Provider Review</SelectItem>
              <SelectItem value="prescription_sent">Prescription Sent</SelectItem>
              <SelectItem value="pharmacy_filling">Pharmacy Filling</SelectItem>
              <SelectItem value="pharmacy_ready">Ready for Pickup</SelectItem>
              <SelectItem value="order_shipped">Shipped</SelectItem>
              <SelectItem value="order_delivered">Delivered</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="prescription">Prescription</SelectItem>
              <SelectItem value="otc">Over-the-counter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox />
                  </TableHead>
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
                    <TableRow key={index}>
                      <TableCell><Checkbox disabled /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.patientName || order.patientId}</div>
                        <div className="text-sm text-muted-foreground">ID: {order.patientId}</div>
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? format(order.createdAt.toDate(), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>{order.medication}</TableCell>
                      <TableCell>
                        <Badge variant={order.isPrescriptionRequired ? "default" : "secondary"}>
                          {order.isPrescriptionRequired ? "Prescription" : "OTC"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge 
                          status={order.status} 
                          isPrescriptionOrder={order.isPrescriptionRequired}
                        />
                      </TableCell>
                      <TableCell>${order.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Timeline
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProgressOrder(order)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Progress Order
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleCancelOrder(order)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all" 
                        ? "No orders found matching your filters" 
                        : "No orders found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {filteredOrders.length} of {orders.length} orders</div>
          <div className="text-xs">Real-time updates enabled</div>
        </div>
      </div>

      {/* Order Detail Modal with Timeline */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details & Timeline</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <OrderTimeline order={selectedOrder} className="mt-4" />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order Modal */}
      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={() => {
          // The useOrderList hook will automatically update with new orders
          setIsCreateModalOpen(false);
        }} 
      />
    </>
  );
}
