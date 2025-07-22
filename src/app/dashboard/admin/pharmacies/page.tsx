
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PharmacyFormModal } from "./components/pharmacy-form-modal";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";

type Pharmacy = {
  id: string;
  name: string;
  type: "Compounding" | "Retail";
  status: "Active" | "Inactive";
  prescriptions: number;
};

export default function PharmacyPage() {
    const [pharmacies, setPharmacies] = React.useState<Pharmacy[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingPharmacy, setEditingPharmacy] = React.useState<Pharmacy | null>(null);
    const { toast } = useToast();

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


  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pharmacy Management</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden md:block">
            Total: <span className="font-semibold">{pharmacies.length}</span> |
            Active: <span className="font-semibold">{pharmacies.filter(p => p.status === 'Active').length}</span> |
            Prescriptions: <span className="font-semibold">{pharmacies.reduce((acc, p) => acc + (p.prescriptions || 0), 0)}</span>
          </div>
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Pharmacy
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search pharmacies by name or location..." className="pl-9" />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
                All Types
                <ChevronDown className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Compounding</DropdownMenuItem>
                <DropdownMenuItem>Retail</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
                All Statuses
                <ChevronDown className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>Active</DropdownMenuItem>
                <DropdownMenuItem>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><Checkbox /></TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prescriptions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Checkbox disabled /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-8"/></TableCell>
                        <TableCell><div className="flex gap-1"><Skeleton className="h-8 w-8"/><Skeleton className="h-8 w-8"/></div></TableCell>
                    </TableRow>
                ))
              ) : pharmacies.length > 0 ? (
                pharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium">{pharmacy.name}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{pharmacy.type}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge className={pharmacy.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{pharmacy.status}</Badge>
                    </TableCell>
                    <TableCell>{pharmacy.prescriptions || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(pharmacy)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the pharmacy: <span className="font-semibold">{pharmacy.name}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePharmacy(pharmacy.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    No pharmacies found. Use the "Add Pharmacy" button to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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
    </>
  );
}
