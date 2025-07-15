
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Square,
  Type,
  Hash,
  List,
  CheckSquare,
  ChevronDown,
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  MapPin,
  FileText,
  Import,
  Sparkles,
  FolderOpen,
  Plus,
  HeartPulse,
  Shield,
  CreditCard,
} from "lucide-react";

interface FormBuilderSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const formElements = [
    { icon: Type, label: "Short Text" },
    { icon: Square, label: "Paragraph" },
    { icon: Hash, label: "Number" },
    { icon: List, label: "Multiple Choice" },
    { icon: CheckSquare, label: "Checkboxes" },
    { icon: ChevronDown, label: "Dropdown" },
    { icon: Calendar, label: "Date" },
    { icon: Clock, label: "Time" },
    { icon: Mail, label: "Email" },
    { icon: Phone, label: "Phone" },
    { icon: User, label: "Name" },
    { icon: MapPin, label: "Address" },
];

const templateSections = [
    {
        icon: User,
        title: "Personal Information",
        description: "Basic contact and personal details.",
        fields: ["Full Name", "Email Address", "Phone Number", "Date of Birth", "Home Address"],
        action: "Add Personal Information Block"
    },
    {
        icon: HeartPulse,
        title: "Medical History",
        description: "Patient medical background information.",
        fields: ["Do you have any pre-existing medical conditions?", "Please list any pre-existing conditions", "Are you currently taking any medications?", "Please list all current medications"],
        action: "Add Medical History Block"
    },
    {
        icon: Shield,
        title: "Insurance Information",
        description: "Health insurance details.",
        fields: ["Insurance Provider", "Policy Number", "Group Number", "Relationship to Subscriber"],
        action: "Add Insurance Information Block"
    },
    {
        icon: CreditCard,
        title: "Payment Information",
        description: "Subscription and payment details.",
        fields: ["Select Payment Plan", "Payment Method"],
        action: "Add Payment Information Block"
    }
]

export function FormBuilderSheet({ isOpen, onClose }: FormBuilderSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-full sm:max-w-none p-0 flex flex-col h-screen" side="right">
        <SheetHeader className="p-4 border-b flex-row justify-between items-center bg-background">
          <SheetTitle className="text-lg">Form Builder: good</SheetTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button>Create Form</Button>
          </div>
        </SheetHeader>

        <div className="flex-grow flex overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-64 border-r bg-slate-50 flex flex-col">
            <div className="p-4 border-b">
                <Tabs defaultValue="fields">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="fields">Pages & Fields</TabsTrigger>
                        <TabsTrigger value="logic">Conditionals</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="p-4 border-b">
                 <h3 className="text-sm font-semibold mb-2">QUICK START</h3>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full justify-start"><Sparkles className="h-4 w-4 mr-2" /> Generate with AI</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start"><Import className="h-4 w-4 mr-2" /> Import Form</Button>
                 </div>
            </div>
            <ScrollArea className="flex-grow">
              <Tabs defaultValue="templates" className="p-4">
                <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="basic">Basic Fields</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="basic">
                  <div className="grid grid-cols-2 gap-2">
                    {formElements.map((el) => (
                      <Button key={el.label} variant="outline" className="h-16 flex-col gap-1 items-start justify-start p-2 font-normal text-left bg-white">
                        <el.icon className="h-5 w-5 mb-1" />
                        <span className="text-xs">{el.label}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="templates">
                    <Accordion type="single" collapsible className="w-full">
                        {templateSections.map((section, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <section.icon className="h-4 w-4" />
                                        {section.title}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-white p-3 rounded-md border">
                                    <p className="text-xs text-muted-foreground mb-2">{section.description}</p>
                                    <p className="text-xs font-semibold mb-1">Includes {section.fields.length} Fields:</p>
                                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                                        {section.fields.map(field => <li key={field}>{field}</li>)}
                                    </ul>
                                    <Button size="sm" className="w-full mt-3 text-xs">
                                        <Plus className="h-3 w-3 mr-1" />
                                        {section.action}
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-slate-100 flex flex-col overflow-hidden">
            <header className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Page 1</Badge>
                </div>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" /> Add Page</Button>
            </header>
            <ScrollArea className="flex-grow p-8">
              <div className="bg-white rounded-lg p-6 min-h-[60vh] flex flex-col items-center justify-center border-2 border-dashed">
                <h2 className="text-xl font-semibold mb-4">Page 1</h2>
                <div className="text-center text-muted-foreground">
                    <FolderOpen className="h-16 w-16 mx-auto text-gray-300" />
                    <p className="mt-4">No form elements added yet.</p>
                    <p className="text-sm">Click on an element type from the left sidebar to add it to your form.</p>
                </div>
              </div>
            </ScrollArea>
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
