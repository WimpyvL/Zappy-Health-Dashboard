
"use client";

import * as React from "react";
import {
  FileText,
  BookOpen,
  TriangleAlert,
  BookMarked,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function EducationalResourcesPage() {
  const [activeTab, setActiveTab] = React.useState("product_info");
  const [activeStatus, setActiveStatus] = React.useState("all status");
  const [activeCategory, setActiveCategory] = React.useState("all categories");

  const statusFilters = ["All Status", "Active", "Draft", "In Review", "Archived"];
  const categoryFilters = ["All Categories"]; // Add more categories here

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-500">Product & Treatment Education</h1>
          <p className="text-3xl font-bold">Educational Resources</p>
        </div>
        <Button>Create New Content</Button>
      </div>

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
               <Alert variant="destructive">
                <TriangleAlert className="h-4 w-4" />
                <AlertDescription>
                Error loading resources: Error fetching educational resources: relation "public.educational_resources" does not exist
                </AlertDescription>
              </Alert>
            </TabsContent>
            <TabsContent value="treatment_guides">
                <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertDescription>
                    Error loading resources: Error fetching educational resources: relation "public.educational_resources" does not exist
                    </AlertDescription>
                </Alert>
            </TabsContent>
            <TabsContent value="side_effect_management">
                <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertDescription>
                    Error loading resources: Error fetching educational resources: relation "public.educational_resources" does not exist
                    </AlertDescription>
                </Alert>
            </TabsContent>
            <TabsContent value="condition_info">
                <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertDescription>
                    Error loading resources: Error fetching educational resources: relation "public.educational_resources" does not exist
                    </AlertDescription>
                </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
