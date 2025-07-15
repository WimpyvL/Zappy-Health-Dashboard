
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Pill } from "lucide-react";

export function PatientOrdersTab() {
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
            <div>
              <label htmlFor="filter-medication" className="text-sm font-medium">Filter by Medication</label>
              <Select>
                <SelectTrigger id="filter-medication">
                  <SelectValue placeholder="All Medications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Medications</SelectItem>
                  {/* Options will be populated dynamically */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-pharmacy" className="text-sm font-medium">Filter by Pharmacy</label>
              <Select>
                <SelectTrigger id="filter-pharmacy">
                  <SelectValue placeholder="All Pharmacies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pharmacies</SelectItem>
                  {/* Options will be populated dynamically */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-status" className="text-sm font-medium">Filter by Order Status</label>
              <Select>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-center text-muted-foreground py-8">
            Loading orders...
          </div>
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
          <div className="text-center text-muted-foreground py-8">
            Loading prescriptions...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
