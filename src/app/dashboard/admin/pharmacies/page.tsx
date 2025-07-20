
"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Search, ChevronDown, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PharmacyFormModal } from "./components/pharmacy-form-modal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';

type Pharmacy = {
  id: string;
  name: string;
  type: "Compounding" | "Retail";
  status: "Active" | "Inactive";
  prescriptions: number;
};

const fetchPharmacies = async () => {
    const response = await dbService.getAll<Pharmacy>('pharmacies', { sortBy: 'name' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch pharmacies');
    return response.data;
};

const savePharmacy = async (pharmacy: Partial<Pharmacy>) => {
    if (pharmacy.id) {
        const { id, ...data } = pharmacy;
        const response = await dbService.update('pharmacies', id, data);
        if (response.error) throw new Error(response.error);
        return response.data;
    } else {
        const response = await dbService.create('pharmacies', { ...pharmacy, prescriptions: 0 });
        if (response.error) throw new Error(response.error);
        return response.data;
    }
};

const deletePharmacy = async (pharmacyId: string) => {
    const response = await dbService.delete('pharmacies', pharmacyId);
    if (response.error) throw new Error(response.error);
};

export default function PharmacyPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingPharmacy, setEditingPharmacy] = React.useState<Pharmacy | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: pharmacies = [], isLoading: loading } = useQuery<Pharmacy[], Error>({
        queryKey: ['pharmacies'],
        queryFn: fetchPharmacies,
        onError: (error) => toast({ variant: "destructive", title: "Error fetching pharmacies", description: error.message }),
    });

    const saveMutation = useMutation({
        mutationFn: savePharmacy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
            toast({ title: `Pharmacy ${editingPharmacy ? 'Updated' : 'Added'}` });
            setIsModalOpen(false);
            setEditingPharmacy(null);
        },
        onError: (error: Error) => toast({ variant: "destructive", title: "Error Saving Pharmacy", description: error.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deletePharmacy,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
            toast({ title: "Pharmacy Deleted" });
        },
        onError: (error: Error) => toast({ variant: "destructive", title: "Error Deleting Pharmacy", description: error.message }),
    });

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pharmacy Management</h1>
        <Button onClick={() => { setEditingPharmacy(null); setIsModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Pharmacy</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Pharmacy</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              : pharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy.id}>
                    <TableCell>{pharmacy.name}</TableCell>
                    <TableCell><Badge variant={pharmacy.status === 'Active' ? 'default' : 'secondary'}>{pharmacy.status}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPharmacy(pharmacy); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(pharmacy.id)}>Delete</AlertDialogAction>
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
    <PharmacyFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pharmacy={editingPharmacy} onSubmit={saveMutation.mutate} />
    </>
  );
}
