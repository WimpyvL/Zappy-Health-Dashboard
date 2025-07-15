
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
import { Input } from "@/components/ui/input";
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
  Plus
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
              <Tabs defaultValue="basic" className="p-4">
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
                    <p className="text-sm text-muted-foreground">Template library coming soon.</p>
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
