
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
<<<<<<< HEAD
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { db } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

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

<<<<<<< HEAD
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
=======
    const fetchPharmacies = React.useCallback(async () => {
        setLoading(true);
        try {
          if (!db) {
            throw new Error("Firebase not initialized");
          }
          
          const pharmaciesCollection = collection(db, "pharmacies");
          const pharmacySnapshot = await getDocs(query(pharmaciesCollection, orderBy("name", "asc")));
          const pharmacyList = pharmacySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Pharmacy));
          setPharmacies(pharmacyList);
        } catch (error) {
          console.error("Error fetching pharmacies: ", error);
          toast({
            variant: "destructive",
            title: "Error fetching pharmacies",
            description: "Could not retrieve pharmacy data from the database.",
          });
        } finally {
          setLoading(false);
        }
    }, [toast]);
    
    React.useEffect(() => {
        fetchPharmacies();
    }, [fetchPharmacies]);

    const handleOpenAddModal = () => {
        setEditingPharmacy(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (pharmacy: Pharmacy) => {
        setEditingPharmacy(pharmacy);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPharmacy(null);
    };

    const handleFormSubmit = async (values: Omit<Pharmacy, 'id' | 'prescriptions'>) => {
        try {
            if (!db) {
                throw new Error("Firebase not initialized");
            }
            
            if (editingPharmacy) {
                const pharmacyDoc = doc(db, "pharmacies", editingPharmacy.id);
                await updateDoc(pharmacyDoc, values);
                toast({
                    title: "Pharmacy Updated",
                    description: `${values.name}'s information has been saved.`,
                });
            } else {
                await addDoc(collection(db, "pharmacies"), {
                    ...values,
                    prescriptions: 0, // Default for new pharmacies
                });
                toast({
                    title: "Pharmacy Added",
                    description: `${values.name} has been added to the system.`,
                });
            }
            fetchPharmacies();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving pharmacy: ", error);
            toast({
                variant: "destructive",
                title: "Error Saving Pharmacy",
                description: "An error occurred while saving the pharmacy information.",
            });
        }
    };

    const handleDeletePharmacy = async (pharmacyId: string) => {
        try {
            if (!db) {
                throw new Error("Firebase not initialized");
            }
            
            await deleteDoc(doc(db, "pharmacies", pharmacyId));
            toast({
                title: "Pharmacy Deleted",
                description: "The pharmacy has been successfully deleted.",
            });
            fetchPharmacies();
        } catch (error) {
            console.error("Error deleting pharmacy: ", error);
            toast({
                variant: "destructive",
                title: "Error Deleting Pharmacy",
                description: "An error occurred while deleting the pharmacy.",
            });
        }
    };
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

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
<<<<<<< HEAD
    </div>
    <PharmacyFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} pharmacy={editingPharmacy} onSubmit={saveMutation.mutate} />
=======
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>Showing 1 to {pharmacies.length} of {pharmacies.length} results</div>
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
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    <PharmacyFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pharmacy={editingPharmacy}
        onSubmit={handleFormSubmit}
    />
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
    </>
  );
}
