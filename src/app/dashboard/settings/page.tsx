
"use client";

import * as React from "react";
import { 
  FileText, 
  User, 
  Gift, 
  Notebook, 
  BrainCircuit, 
  MessageSquare, 
  BarChart,
  Plus,
  Search,
  ArrowUpDown,
  FolderOpen
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AccountSettingsForm } from "./components/account-settings-form";
import { CreateFormModal } from "./components/create-form-modal";
import { FormBuilderSheet } from "./components/form-builder-sheet";

const settingsTabs = [
    { value: "forms", label: "Forms", icon: FileText },
    { value: "account", label: "Account", icon: User },
    { value: "referrals", label: "Referrals", icon: Gift },
    { value: "note_templates", label: "Note Templates", icon: Notebook },
    { value: "ai_llm_settings", label: "AI / LLM Settings", icon: BrainCircuit },
    { value: "ai_prompts", label: "AI Prompts", icon: MessageSquare },
    { value: "analytics", label: "Analytics", icon: BarChart },
];

export default function SettingsPage() {
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isFormBuilderOpen, setIsFormBuilderOpen] = React.useState(false);
  const [formBuilderInitialData, setFormBuilderInitialData] = React.useState<{title: string, description: string} | undefined>(undefined);

  const handleFormCreated = (values: {title: string, description?: string}) => {
    setFormBuilderInitialData({title: values.title, description: values.description || ''});
    setIsFormModalOpen(false);
    setIsFormBuilderOpen(true);
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="forms" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
            {settingsTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="forms" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Form Templates</CardTitle>
                    <CardDescription>Manage all your form templates in one place</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search forms" className="pl-9" />
                        </div>
                        <Button onClick={() => setIsFormModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Create New Form
                        </Button>
                    </div>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Form Name</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted">
                                <div className="flex items-center gap-1">
                                    Pages <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted">
                                <div className="flex items-center gap-1">
                                    Fields <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted">
                                <div className="flex items-center gap-1">
                                    Created <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted">
                                <div className="flex items-center gap-1">
                                    Last Updated <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <FolderOpen className="h-12 w-12 text-gray-400" />
                                        <span>No forms found.</span>
                                        <Button variant="link" className="p-0 h-auto" onClick={() => setIsFormModalOpen(true)}>Create your first form</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="account" className="mt-6">
          <AccountSettingsForm />
        </TabsContent>
        <TabsContent value="referrals">Referrals management will go here.</TabsContent>
        <TabsContent value="note_templates">Note templates management will go here.</TabsContent>
        <TabsContent value="ai_llm_settings">AI / LLM Settings will go here.</TabsContent>
        <TabsContent value="ai_prompts">AI prompts management will go here.</TabsContent>
        <TabsContent value="analytics">Analytics dashboard will go here.</TabsContent>
      </Tabs>
    </div>
    <CreateFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onFormCreated={handleFormCreated} />
    <FormBuilderSheet 
        isOpen={isFormBuilderOpen} 
        onClose={() => setIsFormBuilderOpen(false)} 
        initialData={formBuilderInitialData}
    />
    </>
  );
}
