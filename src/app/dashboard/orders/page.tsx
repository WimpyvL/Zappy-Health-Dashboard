
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  ChevronDown,
  Filter,
  Save,
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
import { CreateOrderModal } from "./components/create-order-modal";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { db } from "@/lib/firebase/client";

type Order = {
  id: string;
  patientName?: string; // This might need a join or separate fetch
  patientId: string;
  orderDate: string;
  medication: string;
  status: "Processing" | "Shipped" | "Delivered" | "Canceled";
  linkedSession?: string;
  pharmacy?: string;
  tracking?: string;
};

const OrderStatusBadge = ({ status }: { status: string }) => {
  const variantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Processing": "secondary",
    "Shipped": "default",
    "Delivered": "outline",
    "Canceled": "destructive",
  };
  const colorMap: { [key: string]: string } = {
    "Processing": "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    "Shipped": "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "Delivered": "bg-green-100 text-green-800 hover:bg-green-200",
    "Canceled": "bg-red-100 text-red-800 hover:bg-red-200",
  };

  return (
    <Badge variant={variantMap[status] || 'secondary'} className={colorMap[status]}>
      {status}
    </Badge>
  );
};

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersCollection = collection(db, "orders");
      const orderSnapshot = await getDocs(query(ordersCollection, orderBy("orderDate", "desc")));
      const orderList = orderSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          orderDate: data.orderDate ? format(data.orderDate.toDate(), "MMM dd, yyyy") : "N/A",
          ...data,
        } as Order;
      });
      setOrders(orderList);
    } catch (error) {
      console.error("Error fetching orders: ", error);
      toast({
        variant: "destructive",
        title: "Error fetching orders",
        description: "Could not retrieve order data from the database.",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (values: Omit<Order, 'id' | 'orderDate'>) => {
    try {
      await addDoc(collection(db, "orders"), {
        ...values,
        orderDate: Timestamp.now(),
        status: "Processing",
      });
      toast({
        title: "Order Created",
        description: `A new order for patient ID ${values.patientId} has been created.`,
      });
      fetchOrders();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating order: ", error);
      toast({
        variant: "destructive",
        title: "Error Creating Order",
        description: "An error occurred while creating the order.",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              Total: <span className="font-semibold">{orders.length}</span> |
              Processing: <span className="font-semibold">{orders.filter(o => o.status === 'Processing').length}</span> |
              Shipped: <span className="font-semibold">{orders.filter(o => o.status === 'Shipped').length}</span>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders by patient or medication..." className="pl-9" />
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                  All Statuses
                  <ChevronDown className="h-4 w-4" />
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem>Processing</DropdownMenuItem>
                  <DropdownMenuItem>Shipped</DropdownMenuItem>
                  <DropdownMenuItem>Delivered</DropdownMenuItem>
                  <DropdownMenuItem>Canceled</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline" size="icon">
              <Save className="h-4 w-4" />
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked Session</TableHead>
                  <TableHead>Pharmacy</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Checkbox disabled /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.patientName || order.patientId}</div>
                        <div className="text-sm text-muted-foreground">
                          {/* Patient Email would go here */}
                        </div>
                      </TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>{order.medication}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{order.linkedSession || 'N/A'}</TableCell>
                      <TableCell>{order.pharmacy || 'N/A'}</TableCell>
                      <TableCell>{order.tracking || 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Order</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {orders.length} of {orders.length} results</div>
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
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={orders.length === 0}>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={orders.length === 0}>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <CreateOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateOrder} />
    </>
  );
}
