
"use client";

import * as React from "react";
import { Box, Plus, Trash2, FilePenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductFormModal } from "./components/product-form-modal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';

type Product = { id: string; name: string; sku: string; category: string; price: number; status: string; isActive: boolean; };

const fetchProducts = async () => {
    const response = await dbService.products.getAll({ sortBy: 'name' });
    if (response.error || !response.data) throw new Error(response.error as string || 'Failed to fetch products');
    return response.data as Product[];
};

const saveProduct = async (product: Partial<Product>) => {
    if (product.id) {
        const { id, ...data } = product;
        const response = await dbService.products.update(id, data);
        if (response.error) throw new Error(response.error as string);
        return response.data;
    } else {
        const response = await dbService.products.create(product);
        if (response.error) throw new Error(response.error as string);
        return response.data;
    }
};

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loading } = useQuery<Product[], Error>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    onError: (error: Error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const saveMutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toast({ title: `Product ${editingProduct ? 'Updated' : 'Added'}` });
        setIsModalOpen(false);
        setEditingProduct(null);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error Saving Product", description: error.message }),
  });

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products & Subscriptions</h1>
        <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add New</Button>
      </div>
      <Tabs defaultValue="products">
        <TabsList><TabsTrigger value="products"><Box className="mr-2 h-4 w-4" /> Products</TabsTrigger></TabsList>
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  : products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell><Badge variant={product.isActive ? 'default' : 'secondary'}>{product.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}><FilePenLine className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={editingProduct} onSubmit={saveMutation.mutate} />
    </>
  );
}
