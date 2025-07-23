
"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Search, ChevronDown, Edit, Trash2, Percent, CircleDollarSign } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DiscountFormModal } from "./components/discount-form-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';

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
  description?: string;
  minPurchase?: number;
  usageLimit?: string;
};

const fetchDiscounts = async () => {
    const response = await dbService.discounts.getAll({ sortBy: 'name' });
    if (response.error || !response.data) throw new Error(response.error as string || 'Failed to fetch discounts');
    return response.data.map((d: any) => ({ ...d, validity: d.validUntil ? new Date(d.validUntil.seconds * 1000).toLocaleDateString() : "No expiration" }));
};

const saveDiscount = async (discount: Partial<Discount>) => {
    if (discount.id) {
        const { id, ...data } = discount;
        const response = await dbService.discounts.update(id, data);
        if (response.error) throw new Error(response.error as string);
        return response.data;
    } else {
        const response = await dbService.discounts.create({ ...discount, usage: 0 });
        if (response.error) throw new Error(response.error as string);
        return response.data;
    }
};

const deleteDiscount = async (discountId: string) => {
    const response = await dbService.discounts.delete(discountId);
    if (response.error) throw new Error(response.error as string);
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
                    <TableCell>{discount.type === "fixed" ? `$${discount.value}` : `${discount.value}%`}</TableCell>
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
    <DiscountFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} discount={editingDiscount} onSubmit={(values) => saveMutation.mutate(values)} />
    </>
  );
}
