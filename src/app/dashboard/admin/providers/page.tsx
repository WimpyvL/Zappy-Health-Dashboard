
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronDown,
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderFormModal } from "./components/provider-form-modal";
import { useToast } from "@/hooks/use-toast";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
  authDomain: "zappy-health-c1kob.firebaseapp.com",
  databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
  projectId: "zappy-health-c1kob",
  storageBucket: "zappy-health-c1kob.appspot.com",
  messagingSenderId: "833435237612",
  appId: "1:833435237612:web:53731373b2ad7568f279c9"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig, "providers-app");
} catch (e) {
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app);

type Provider = {
  id: string;
  name: string;
  uuid: string;
  specialty: string;
  email: string;
  phone: string | null;
  status: "Active" | "Inactive";
  patientCount: number;
};

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

export default function ProvidersPage() {
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingProvider, setEditingProvider] = React.useState<Provider | null>(null);
    const { toast } = useToast();

    const fetchProviders = React.useCallback(async () => {
        setLoading(true);
        try {
          const providersCollection = collection(db, "providers");
          const providerSnapshot = await getDocs(query(providersCollection, orderBy("name", "asc")));
          const providerList = providerSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Provider));
          setProviders(providerList);
        } catch (error) {
          console.error("Error fetching providers: ", error);
          toast({
            variant: "destructive",
            title: "Error fetching providers",
            description: "Could not retrieve provider data from the database.",
          });
        } finally {
          setLoading(false);
        }
    }, [toast]);
    
    React.useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const handleOpenAddModal = () => {
        setEditingProvider(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (provider: Provider) => {
        setEditingProvider(provider);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProvider(null);
    };

    const handleFormSubmit = async (values: any) => {
        const providerData = {
          name: values.fullName,
          specialty: values.specialty,
          email: values.email,
          phone: values.phone,
          status: values.status,
          patientCount: values.patientCount,
          // address is not in Provider type, handle as needed
        };
    
        try {
          if (editingProvider) {
            const providerDoc = doc(db, "providers", editingProvider.id);
            await updateDoc(providerDoc, providerData);
            toast({
              title: "Provider Updated",
              description: `${values.fullName}'s information has been saved.`,
            });
          } else {
            await addDoc(collection(db, "providers"), { ...providerData, uuid: crypto.randomUUID() });
            toast({
              title: "Provider Added",
              description: `${values.fullName} has been added to the system.`,
            });
          }
          fetchProviders();
          handleCloseModal();
        } catch (error) {
          console.error("Error saving provider: ", error);
          toast({
            variant: "destructive",
            title: "Error Saving Provider",
            description: "An error occurred while saving the provider information.",
          });
        }
    };

    const handleDeleteProvider = async (providerId: string) => {
        try {
            await deleteDoc(doc(db, "providers", providerId));
            toast({
                title: "Provider Deleted",
                description: "The provider has been successfully deleted.",
            });
            fetchProviders();
        } catch (error) {
            console.error("Error deleting provider: ", error);
            toast({
                variant: "destructive",
                title: "Error Deleting Provider",
                description: "An error occurred while deleting the provider.",
            });
        }
    };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Provider Management</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              Total: <span className="font-semibold">{providers.length}</span> |
              Active: <span className="font-semibold">{providers.filter(p => p.status === 'Active').length}</span> |
              Patients: <span className="font-semibold">{providers.reduce((acc, p) => acc + p.patientCount, 0)}</span>
            </div>
            <Button onClick={handleOpenAddModal}>
              <Plus className="mr-2 h-4 w-4" /> Add Provider
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search providers by name, specialty, or location..." className="pl-9" />
          </div>
          <FilterDropdown
            label="All Specialties"
            options={["Internal Medicine", "Cardiology", "Dermatology"]}
          />
          <FilterDropdown
            label="All Statuses"
            options={["Active", "Inactive"]}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox /></TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Checkbox disabled /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                        <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                        <TableCell><div className="space-y-1"><Skeleton className="h-4 w-40"/><Skeleton className="h-4 w-24"/></div></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-8"/></TableCell>
                        <TableCell><div className="flex gap-1"><Skeleton className="h-8 w-8"/><Skeleton className="h-8 w-8"/></div></TableCell>
                    </TableRow>
                  ))
                ) : providers.length > 0 ? (
                  providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-3">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                  <div className="font-medium">{provider.name}</div>
                                  <div className="text-xs text-muted-foreground">ID: {provider.uuid}</div>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.specialty}</Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {provider.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {provider.phone || 'No phone'}
                          </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={provider.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}>{provider.status}</Badge>
                      </TableCell>
                      <TableCell>{provider.patientCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditModal(provider)}>
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
                                    This action cannot be undone. This will permanently delete the provider: <span className="font-semibold">{provider.name}</span>.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProvider(provider.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      No providers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing 1 to {providers.length} of {providers.length} results</div>
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
      <ProviderFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        provider={editingProvider}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}

