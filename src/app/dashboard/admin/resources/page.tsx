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

export default function EducationalResourcesPage() {
  const [activeTab, setActiveTab] = React.useState("product_info");
  const [activeStatus, setActiveStatus] = React.useState("all");

  const statusFilters = ["All Status", "Active", "Draft", "In Review", "Archived"];

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Content Library</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search content..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
                <TabsList>
                <TabsTrigger value="product_info">
                    <FileText className="mr-2 h-4 w-4" /> Product Information
                </TabsTrigger>
                <TabsTrigger value="treatment_guides">
                    <BookOpen className="mr-2 h-4 w-4" /> Treatment Guides
                </TabsTrigger>
                <TabsTrigger value="side_effect_management">
                    <TriangleAlert className="mr-2 h-4 w-4" /> Side Effect Management
                </TabsTrigger>
                <TabsTrigger value="condition_info">
                    <BookMarked className="mr-2 h-4 w-4" /> Condition Information
                </TabsTrigger>
                </TabsList>
                 <div className="flex items-center gap-2">
                    {statusFilters.map((status) => (
                    <Button
                        key={status}
                        variant={activeStatus.toLowerCase() === status.toLowerCase() ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveStatus(status.toLowerCase())}
                    >
                        {status}
                    </Button>
                    ))}
                 </div>
            </div>
            
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
