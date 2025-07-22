
"use client";

import * as React from "react";
import { MoreHorizontal, Plus, Search, ChevronDown, User, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ProviderFormModal } from "./components/provider-form-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';

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

const fetchProviders = async () => {
    const response = await dbService.providers.getAll({ sortBy: 'name' });
    if (response.error || !response.data) throw new Error(response.error as string || 'Failed to fetch providers');
    return response.data as Provider[];
};

const saveProvider = async (provider: Partial<Provider>) => {
    if (provider.id) {
        const { id, ...data } = provider;
        const response = await dbService.providers.update(id, data);
        if (response.error) throw new Error(response.error as string);
        return response.data;
    } else {
        const response = await dbService.providers.create({ ...provider, uuid: crypto.randomUUID() });
        if (response.error) throw new Error(response.error as string);
        return response.data;
    }
};

const deleteProvider = async (providerId: string) => {
    const response = await dbService.providers.delete(providerId);
    if (response.error) throw new Error(response.error as string);
};

export default function ProvidersPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingProvider, setEditingProvider] = React.useState<Provider | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: providers = [], isLoading: loading } = useQuery<Provider[], Error>({
        queryKey: ['providers'],
        queryFn: fetchProviders,
        onError: (error) => toast({ variant: "destructive", title: "Error fetching providers", description: error.message }),
    });

    const saveMutation = useMutation({
        mutationFn: saveProvider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            toast({ title: `Provider ${editingProvider ? 'Updated' : 'Added'}` });
            setIsModalOpen(false);
            setEditingProvider(null);
        },
        onError: (error: Error) => toast({ variant: "destructive", title: "Error Saving Provider", description: error.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProvider,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers'] });
            toast({ title: "Provider Deleted" });
        },
        onError: (error: Error) => toast({ variant: "destructive", title: "Error Deleting Provider", description: error.message }),
    });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Provider Management</h1>
          <Button onClick={() => { setEditingProvider(null); setIsModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Provider</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                : providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>{provider.name}</TableCell>
                      <TableCell><Badge variant={provider.status === 'Active' ? 'default' : 'secondary'}>{provider.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingProvider(provider); setIsModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(provider.id)}>Delete</AlertDialogAction>
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
      <ProviderFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} provider={editingProvider} onSubmit={saveMutation.mutate} />
    </>
  );
}
