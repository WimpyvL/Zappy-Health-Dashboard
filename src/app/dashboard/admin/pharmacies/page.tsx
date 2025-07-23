
"use client";

import * as React from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PharmacyFormModal } from "./components/pharmacy-form-modal";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, UseQueryResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';
import type { Pharmacy as DBPharmacy, DatabaseError } from '@/services/database';

interface PharmacyDisplay {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  isActive: boolean;
  prescriptions: number;
  type: "Compounding" | "Retail";
  status: "Active" | "Inactive";
}

type QueryError = Error;

const formatPharmacy = (pharmacy: DBPharmacy): PharmacyDisplay => ({
  id: pharmacy.id,
  name: pharmacy.name,
  address: pharmacy.address,
  phone: pharmacy.phone,
  email: pharmacy.email,
  licenseNumber: pharmacy.licenseNumber,
  isActive: pharmacy.isActive,
  prescriptions: 0,
  type: "Retail", // Default type
  status: pharmacy.isActive ? "Active" : "Inactive"
});

const fetchPharmacies = async (): Promise<PharmacyDisplay[]> => {
    const response = await dbService.pharmacies.getAll({ sortBy: 'name' });
    if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch pharmacies');
    }
    if (!response.data) {
        throw new Error('No pharmacies found');
    }
    return response.data.map(formatPharmacy);
};

const savePharmacy = async (pharmacy: Partial<PharmacyDisplay>): Promise<PharmacyDisplay> => {
    const { id, prescriptions, type, status, ...dbPharmacy } = pharmacy;
    
    // Ensure required fields are present
    if (!dbPharmacy.name || !dbPharmacy.address || !dbPharmacy.phone || !dbPharmacy.licenseNumber) {
        throw new Error('Missing required pharmacy fields');
    }

    // Convert display model to DB model
    const dbData = {
        name: dbPharmacy.name,
        address: dbPharmacy.address,
        phone: dbPharmacy.phone,
        email: dbPharmacy.email,
        licenseNumber: dbPharmacy.licenseNumber,
        isActive: status === "Active"
    };

    if (id) {
        const response = await dbService.pharmacies.update(id, dbData);
        if (response.error) {
            throw new Error(response.error.message || 'Failed to update pharmacy');
        }
        return formatPharmacy(response.data!);
    } else {
        const response = await dbService.pharmacies.create(dbData);
        if (response.error) {
            throw new Error(response.error.message || 'Failed to create pharmacy');
        }
        return formatPharmacy(response.data!);
    }
};

const deletePharmacy = async (pharmacyId: string): Promise<void> => {
    const response = await dbService.pharmacies.delete(pharmacyId);
    if (response.error) {
        throw new Error(response.error.message || 'Failed to delete pharmacy');
    }
};

export default function PharmacyPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingPharmacy, setEditingPharmacy] = React.useState<PharmacyDisplay | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        data: pharmacies = [],
        isLoading: loading
    }: UseQueryResult<PharmacyDisplay[], QueryError> = useQuery({
        queryKey: ['pharmacies'],
        queryFn: fetchPharmacies
    });

    const handleError = React.useCallback((error: QueryError) => {
        toast({
            variant: "destructive",
            title: "Error with Pharmacy Operation",
            description: error.message
        });
    }, [toast]);

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
