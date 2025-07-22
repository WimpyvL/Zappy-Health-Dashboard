
"use client";

import * as React from "react";
import {
  FileText,
  BookOpen,
  TriangleAlert,
  BookMarked,
  Search,
  Plus,
  FolderOpen,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateContentModal } from "./components/create-content-modal";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { DefaultFormSetup } from "@/components/admin/DefaultFormSetup";
import { JsonBFormDemo } from "@/components/admin/JsonBFormDemo";

type Resource = {
  id: string;
  title: string;
  contentType: string;
  category: string;
  status: "Published" | "Draft";
  author: string;
  publishDate?: { toDate: () => Date };
  updatedAt: { toDate: () => Date };
};

const EmptyState = ({ onAction }: { onAction: () => void }) => (
    <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4">No resources found in this category.</p>
        <p className="text-sm">Start by <Button variant="link" className="p-0 h-auto" onClick={onAction}>creating new content</Button>.</p>
    </div>
);

const ResourceTable = ({ resources, loading, onEdit, onDelete }: { resources: Resource[], loading: boolean, onEdit: (resource: Resource) => void, onDelete: (resourceId: string) => void }) => {
  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Checkbox disabled /></TableHead>
            <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Author</TableHead><TableHead>Last Updated</TableHead><TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-5" /></TableCell>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (resources.length === 0) {
    return <EmptyState onAction={() => {}} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><Checkbox /></TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((resource) => (
          <TableRow key={resource.id}>
            <TableCell><Checkbox /></TableCell>
            <TableCell className="font-medium">{resource.title}</TableCell>
            <TableCell><Badge variant="outline">{resource.category}</Badge></TableCell>
            <TableCell>{resource.contentType.replace(/_/g, ' ')}</TableCell>
            <TableCell>
              <Badge variant={resource.status === 'Published' ? 'default' : 'secondary'}
               className={resource.status === 'Published' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {resource.status}
              </Badge>
            </TableCell>
            <TableCell>{resource.author}</TableCell>
            <TableCell>{format(resource.updatedAt.toDate(), "MMM d, yyyy")}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(resource)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(resource.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
};

export default function EducationalResourcesPage() {
  const [activeTab, setActiveTab] = React.useState("product_info");
  const [activeStatus, setActiveStatus] = React.useState("all status");
  const [activeCategory, setActiveCategory] = React.useState("all categories");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [resources, setResources] = React.useState<Resource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchResources = React.useCallback(async () => {
    setLoading(true);
    try {
      const resourcesCollection = collection(db, "resources");
      const q = query(resourcesCollection, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const resourcesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Resource));
      setResources(resourcesList);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast({ variant: "destructive", title: "Failed to load resources." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchResources();
  }, [fetchResources]);
  
  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "resources"), {
        ...values,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({ title: "Content Created", description: "Your new educational resource has been saved." });
      setIsModalOpen(false);
      fetchResources();
    } catch (error) {
      console.error("Error creating content:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save the content." });
    } finally {
      setIsSubmitting(false);
    }
  };


  const statusFilters = ["All Status", "Active", "Draft", "In Review", "Archived"];
  const categoryFilters = ["All Categories"]; // Add more categories here

  const filteredResources = resources.filter(resource => {
    const statusMatch = activeStatus === 'all status' || resource.status.toLowerCase() === activeStatus;
    const tabMatch = resource.contentType === activeTab;
    return statusMatch && tabMatch;
  });

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-500">Product & Treatment Education</h1>
            <p className="text-3xl font-bold">Educational Resources</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Content
          </Button>
        </div>

        {/* Dynamic Form Templates Setup */}
        <DefaultFormSetup />
        
        {/* JSONB Form Processing Demo */}
        <JsonBFormDemo />

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Content Library</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search content..." className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                      <Button
                          variant={activeCategory === 'all categories' ? 'default' : 'outline'}
                          onClick={() => setActiveCategory('all categories')}
                      >
                          All Categories
                      </Button>
                  </div>
                  <div className="flex items-center gap-2">
                      {statusFilters.map((status) => (
                      <Button
                          key={status}
                          variant={activeStatus === status.toLowerCase() ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveStatus(status.toLowerCase())}
                          className="text-xs"
                      >
                          {status}
                      </Button>
                      ))}
                  </div>
              </div>
              
              <Separator className="my-4" />

              <TabsList className="bg-transparent p-0 justify-start border-b rounded-none gap-6">
                <TabsTrigger value="product_info" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
                    <FileText className="mr-2 h-4 w-4" /> Product Information
                </TabsTrigger>
                <TabsTrigger value="treatment_guides" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
                    <BookOpen className="mr-2 h-4 w-4" /> Treatment Guides
                </TabsTrigger>
                <TabsTrigger value="side_effect_management" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
                    <TriangleAlert className="mr-2 h-4 w-4" /> Side Effect Management
                </TabsTrigger>
                <TabsTrigger value="condition_info" className="data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent p-0 h-auto">
                    <BookMarked className="mr-2 h-4 w-4" /> Condition Information
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="product_info" className="mt-6">
                <ResourceTable resources={filteredResources} loading={loading} onEdit={() => {}} onDelete={() => {}} />
              </TabsContent>
              <TabsContent value="treatment_guides" className="mt-6">
                  <ResourceTable resources={filteredResources} loading={loading} onEdit={() => {}} onDelete={() => {}} />
              </TabsContent>
              <TabsContent value="side_effect_management" className="mt-6">
                  <ResourceTable resources={filteredResources} loading={loading} onEdit={() => {}} onDelete={() => {}} />
              </TabsContent>
              <TabsContent value="condition_info" className="mt-6">
                  <ResourceTable resources={filteredResources} loading={loading} onEdit={() => {}} onDelete={() => {}} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <CreateContentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
