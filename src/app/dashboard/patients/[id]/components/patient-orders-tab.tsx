
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Pill } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const firebaseConfig = {
    apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
    authDomain: "zappy-health-c1kob.firebaseapp.com",
    databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
    projectId: "zappy-health-c1kob",
    storageBucket: "zappy-health-c1kob.appspot.com",
    messagingSenderId: "833435237612",
    appId: "1:833435237612:web:53731373b2ad7568f279c9"
};

let app;
try {
  app = initializeApp(firebaseConfig, "patient-orders-app");
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

interface PatientOrdersTabProps {
  patientId: string;
}

export function PatientOrdersTab({ patientId }: PatientOrdersTabProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!patientId) return;
      setLoading(true);
      try {
        const q = query(collection(db, "orders"), where("patientId", "==", patientId), orderBy("orderDate", "desc"));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [patientId]);

  const activePrescriptions = orders.filter(
    (order) => order.orderType === "prescription" && order.status !== "Canceled"
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Orders</CardTitle>
          </div>
          <Button>New Order</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select><SelectTrigger><SelectValue placeholder="All Medications" /></SelectTrigger><SelectContent><SelectItem value="all">All Medications</SelectItem></SelectContent></Select>
            <Select><SelectTrigger><SelectValue placeholder="All Pharmacies" /></SelectTrigger><SelectContent><SelectItem value="all">All Pharmacies</SelectItem></SelectContent></Select>
            <Select><SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem></SelectContent></Select>
          </div>
          {loading ? (
             <div className="text-center text-muted-foreground py-8">Loading orders...</div>
          ) : orders.length > 0 ? (
            <Table>
                <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Date</TableHead><TableHead>Medication</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                    {orders.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono">{order.id.substring(0,8)}</TableCell>
                            <TableCell>{format(order.orderDate.toDate(), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{order.medication}</TableCell>
                            <TableCell><Badge>{order.status}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">No orders found for this patient.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Pill className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Active Prescriptions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading prescriptions...</div>
            ) : activePrescriptions.length > 0 ? (
                <Table>
                    <TableHeader><TableRow><TableHead>Medication</TableHead><TableHead>Status</TableHead><TableHead>Refills</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {activePrescriptions.map(rx => (
                            <TableRow key={rx.id}>
                                <TableCell>{rx.medication}</TableCell>
                                <TableCell><Badge>{rx.status}</Badge></TableCell>
                                <TableCell>{rx.refillsRemaining || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground py-8">No active prescriptions found.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    