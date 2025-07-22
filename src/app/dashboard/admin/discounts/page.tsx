
"use client";

import * as React from "react";
<<<<<<< HEAD
import { MoreHorizontal, Plus, Search, ChevronDown, Edit, Trash2, Percent, CircleDollarSign } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DiscountFormModal } from "./components/discount-form-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { Percent, CircleDollarSign, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminPage, AdminPageConfig } from "@/components/ui/admin-page";
import { DataTableColumn } from "@/components/ui/data-table";
import { DiscountFormModal } from "./components/discount-form-modal";
import { adminServices } from "@/services/database/hooks";
import { Timestamp } from "firebase/firestore";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

interface Discount {
  id: string;
  name: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  status: "Active" | "Inactive" | "Expired";
  validUntil?: any;
  validFrom?: any;
  usage: number;
<<<<<<< HEAD
};

const fetchDiscounts = async () => {
    const response = await dbService.getAll<any>('discounts', { sortBy: 'name' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch discounts');
    return response.data.map((d: any) => ({ ...d, validity: d.validUntil ? new Date(d.validUntil.seconds * 1000).toLocaleDateString() : "No expiration" }));
};

const saveDiscount = async (discount: Partial<Discount>) => {
    if (discount.id) {
        const { id, ...data } = discount;
        const response = await dbService.update('discounts', id, data);
        if (response.error) throw new Error(response.error);
        return response.data;
    } else {
        const response = await dbService.create('discounts', { ...discount, usage: 0 });
        if (response.error) throw new Error(response.error);
        return response.data;
    }
};

const deleteDiscount = async (discountId: string) => {
    const response = await dbService.delete('discounts', discountId);
    if (response.error) throw new Error(response.error);
};

export default function DiscountsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<Discount | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: discounts = [], isLoading: loading } = useQuery<Discount[], Error>({
    queryKey: ['discounts'],
    queryFn: fetchDiscounts,
    onError: (error) => toast({ variant: "destructive", title: "Error fetching discounts", description: error.message }),
  });

  const saveMutation = useMutation({
    mutationFn: saveDiscount,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['discounts'] });
        toast({ title: `Discount ${editingDiscount ? 'Updated' : 'Added'}` });
        setIsModalOpen(false);
        setEditingDiscount(null);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error Saving Discount", description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['discounts'] });
        toast({ title: "Discount Deleted" });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error Deleting Discount", description: error.message }),
  });

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discount Management</h1>
        <Button onClick={() => { setEditingDiscount(null); setIsModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Discount</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Discount</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              : discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>{discount.name}</TableCell>
                    <TableCell>{discount.type === "fixed" ? `${discount.value}` : `${discount.value}%`}</TableCell>
                    <TableCell><Badge variant={discount.status === 'Active' ? 'default' : 'secondary'}>{discount.status}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingDiscount(discount); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(discount.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <DiscountFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} discount={editingDiscount} onSubmit={saveMutation.mutate} />
    </>
  );
=======
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
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
}
