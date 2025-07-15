
"use client";

import React from "react";
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
import { Separator } from "@/components/ui/separator";
import { CreditCard, FileStack, History, Plus } from "lucide-react";

export function PatientBillingTab() {
  return (
    <div className="space-y-6">
      {/* Billing Summary Card */}
      <Card className="bg-yellow-50/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Billing Summary</CardTitle>
          </div>
          <Button>Pay Balance</Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase">Current Balance Due</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">$0.00</p>
            <p className="text-xs text-muted-foreground">Due by Jan 1, 1970</p>
          </div>
          <div className="md:col-span-2 space-y-4">
             <div>
                <p className="text-sm font-semibold">Payment Method</p>
                <div className="flex justify-between items-center mt-1 text-sm p-3 border rounded-md bg-white">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>No payment method on file</span>
                    </div>
                    <Button variant="secondary" size="sm">Add</Button>
                </div>
            </div>
             <div>
                <p className="text-sm font-semibold">Active Subscription</p>
                 <div className="flex justify-between items-center mt-1 text-sm p-3 border rounded-md bg-white">
                    <span className="text-muted-foreground">No active subscription</span>
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
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No invoices to display.
                </TableCell>
              </TableRow>
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
    </div>
  );
}
