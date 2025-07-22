
"use client";

import * as React from "react";
import { FileText, BookOpen, TriangleAlert, BookMarked, Search, Plus, FolderOpen, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateContentModal } from "./components/create-content-modal";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';
import { DefaultFormSetup } from "@/components/admin/DefaultFormSetup";
import { JsonBFormDemo } from "@/components/admin/JsonBFormDemo";

type Resource = {
  id: string;
  title: string;
  contentType: string;
  category: string;
  status: "Published" | "Draft";
  author: string;
  updatedAt: { toDate: () => Date };
};

const fetchResources = async () => {
    const response = await dbService.getAll<Resource>('resources', { sortBy: 'updatedAt', sortDirection: 'desc' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch resources');
    return response.data;
};

const createResource = async (values: any) => {
    const response = await dbService.create('resources', values);
    if (response.error) throw new Error(response.error);
    return response.data;
};

const ResourceTable = ({ resources, loading }: { resources: Resource[], loading: boolean }) => {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (resources.length === 0) return <div className="text-center py-12">No resources found.</div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Last Updated</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>
        {resources.map((resource) => (
          <TableRow key={resource.id}>
            <TableCell>{resource.title}</TableCell>
            <TableCell><Badge variant={resource.status === 'Published' ? 'default' : 'secondary'}>{resource.status}</Badge></TableCell>
            <TableCell>{format(resource.updatedAt.toDate(), "MMM d, yyyy")}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default function EducationalResourcesPage() {
  const [activeTab, setActiveTab] = React.useState("product_info");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading: loading } = useQuery<Resource[], Error>({
    queryKey: ['resources'],
    queryFn: fetchResources,
    onError: (error) => toast({ variant: "destructive", title: "Failed to load resources.", description: error.message }),
  });

  const createMutation = useMutation({
    mutationFn: createResource,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        toast({ title: "Content Created", description: "Your new resource has been saved." });
        setIsModalOpen(false);
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const filteredResources = resources.filter(r => r.contentType === activeTab);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Educational Resources</h1>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Create Content</Button>
        </div>

        {/* Dynamic Form Templates Setup */}
        <DefaultFormSetup />
        
        {/* JSONB Form Processing Demo */}
        <JsonBFormDemo />

        <Card>
          <CardHeader><CardTitle>Content Library</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="product_info"><FileText className="mr-2 h-4 w-4" /> Product Info</TabsTrigger>
                <TabsTrigger value="treatment_guides"><BookOpen className="mr-2 h-4 w-4" /> Treatment Guides</TabsTrigger>
              </TabsList>
              <TabsContent value="product_info" className="mt-4">
                <ResourceTable resources={filteredResources} loading={loading} />
              </TabsContent>
              <TabsContent value="treatment_guides" className="mt-4">
                <ResourceTable resources={filteredResources} loading={loading} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <CreateContentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={createMutation.mutate} isSubmitting={createMutation.isPending} />
    </>
  );
}
