
"use client";

import * as React from "react";
import { Percent, CircleDollarSign, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminPage, AdminPageConfig } from "@/components/ui/admin-page";
import { DataTableColumn } from "@/components/ui/data-table";
import { DiscountFormModal } from "./components/discount-form-modal";
import { adminServices } from "@/services/database/hooks";
import { Timestamp } from "firebase/firestore";

interface Discount {
  id: string;
  name: string;
  description: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  status: "Active" | "Inactive" | "Expired";
  validUntil?: any;
  validFrom?: any;
  usage: number;
  createdAt: any;
  updatedAt: any;
}

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
  // Column configuration
  const columns: DataTableColumn<Discount>[] = [
    {
      key: 'name',
      header: 'Discount',
      cell: (discount) => (
        <div>
          <div className="font-medium">{discount.name}</div>
          <div className="text-xs text-muted-foreground">{discount.description}</div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      cell: (discount) => <Badge variant="outline">{discount.code}</Badge>,
    },
    {
      key: 'value',
      header: 'Value',
      cell: (discount) => (
        <div className="flex items-center gap-2">
          {discount.type === "fixed" ?
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" /> :
            <Percent className="h-4 w-4 text-muted-foreground" />
          }
          <span>
            {discount.type === "fixed" ? `$${discount.value.toFixed(2)}` : `${discount.value}%`}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (discount) => <StatusBadge status={discount.status} />,
    },
    {
      key: 'validUntil',
      header: 'Validity',
      cell: (discount) => {
        const validity = discount.validUntil ?
          new Date(discount.validUntil.seconds * 1000).toLocaleDateString() :
          "No expiration";
        return <div>{validity}</div>;
      },
    },
    {
      key: 'usage',
      header: 'Usage',
      cell: (discount) => `${discount.usage} uses`,
    },
  ];

  // Admin page configuration
  const config: AdminPageConfig<Discount> = {
    title: "Discount Management",
    description: "Manage discount codes and promotional offers",
    entityName: "discount",
    entityNamePlural: "discounts",
    
    // Data operations
    fetchData: () => adminServices.fetchCollection<Discount>('discounts'),
    createEntity: (data: any) => adminServices.createEntity<Discount>('discounts', {
      name: data.name,
      description: data.description,
      code: data.code,
      type: data.type,
      value: data.value,
      status: data.status || 'Active',
      usage: 0,
      validFrom: data.validFrom ? Timestamp.fromDate(data.validFrom) : undefined,
      validUntil: data.validUntil ? Timestamp.fromDate(data.validUntil) : null,
    } as any),
    updateEntity: (id, data: any) => adminServices.updateEntity<Discount>('discounts', id, {
      ...data,
      validFrom: data.validFrom ? Timestamp.fromDate(data.validFrom) : undefined,
      validUntil: data.validUntil ? Timestamp.fromDate(data.validUntil) : null,
    } as any),
    deleteEntity: (id) => adminServices.deleteEntity('discounts', id),
    
    // Table configuration
    columns,
    searchPlaceholder: "Search discounts by name or code...",
    filters: [
      {
        label: "All Types",
        options: ["Percentage", "Fixed Amount"],
      },
      {
        label: "All Statuses",
        options: ["Active", "Inactive", "Expired"],
      },
    ],
    
    // Stats calculation
    calculateStats: (data) => [
      { label: "Total", value: data.length },
      { label: "Active", value: data.filter(d => d.status === 'Active').length },
      { label: "Expired", value: data.filter(d => d.status === 'Expired').length },
    ],
    
    // Header actions
    headerActions: [
      {
        label: "Add Discount",
        icon: Plus,
        onClick: () => {}, // Will be overridden by AdminPage
        permission: 'manage:discounts',
      },
    ],
    
    // Form component
    FormComponent: DiscountFormModal,
    
    // Permissions
    permissions: {
      read: 'read:all',
      create: 'manage:discounts',
      update: 'manage:discounts',
      delete: 'manage:discounts',
    },
  };

  return <AdminPage config={config} />;
}
