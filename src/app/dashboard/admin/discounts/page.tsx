"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  Percent,
  CircleDollarSign
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

type Discount = {
  id: string;
  name: string;
  description: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  status: "Active" | "Inactive" | "Expired";
  validity: string;
  usage: number;
};

const mockDiscounts: Discount[] = [
  {
    id: "disc_1",
    name: "Fixed Amount Discount",
    description: "$25 off any order over $100",
    code: "SAVE25",
    type: "fixed",
    value: 25,
    status: "Inactive",
    validity: "7/13/2025",
    usage: 0,
  },
  {
    id: "disc_2",
    name: "Loyalty Discount",
    description: "15% off for returning patients",
    code: "LOYAL15",
    type: "percentage",
    value: 15,
    status: "Inactive",
    validity: "No expiration",
    usage: 0,
  },
  {
    id: "disc_3",
    name: "New Patient Discount",
    description: "10% off first order for new patients",
    code: "NEWPATIENT10",
    type: "percentage",
    value: 10,
    status: "Inactive",
    validity: "7/13/2025",
    usage: 0,
  },
    {
    id: "disc_4",
    name: "Seasonal Promo",
    description: "20% off spring promotion",
    code: "SPRING20",
    type: "percentage",
    value: 20,
    status: "Inactive",
    validity: "No expiration",
    usage: 0,
  },
];

const FilterDropdown = ({
  label,
  options,
}: {
  label: string;
  options: string[];
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2">
        {label}
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {options.map((option) => (
        <DropdownMenuItem key={option}>{option}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const StatusBadge = ({ status }: { status: Discount["status"] }) => {
    const statusMap = {
        Active: { className: "bg-green-100 text-green-800 hover:bg-green-200" },
        Inactive: { className: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
        Expired: { className: "bg-red-100 text-red-800 hover:bg-red-200" },
    };
    const currentStatus = statusMap[status] || statusMap.Inactive;

    return (
        <Badge variant="secondary" className={currentStatus.className}>
        {status}
        </Badge>
    );
};

export default function DiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discount Management</h1>
        <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
                Total: <span className="font-semibold">4</span> | 
                Active: <span className="font-semibold">0</span> | 
                Expired: <span className="font-semibold">0</span>
            </div>
            <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Discount
            </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search discounts by name or code..." className="pl-9" />
        </div>
        <FilterDropdown label="All Types" options={["Percentage", "Fixed Amount"]} />
        <FilterDropdown label="All Statuses" options={["Active", "Inactive", "Expired"]} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell>
                    <div className="font-medium">{discount.name}</div>
                    <div className="text-xs text-muted-foreground">{discount.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{discount.code}</Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                        {discount.type === "fixed" ? <CircleDollarSign className="h-4 w-4 text-muted-foreground" /> : <Percent className="h-4 w-4 text-muted-foreground" />}
                        <span>
                            {discount.type === "fixed" ? `$${discount.value.toFixed(2)}` : `${discount.value}%`}
                        </span>
                    </div>
                   </TableCell>
                  <TableCell>
                    <StatusBadge status={discount.status} />
                  </TableCell>
                  <TableCell>
                    <div>{discount.validity}</div>
                    {discount.validity !== "No expiration" && <div className="text-xs text-muted-foreground">No expiration</div>}
                  </TableCell>
                  <TableCell>{discount.usage} uses</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
