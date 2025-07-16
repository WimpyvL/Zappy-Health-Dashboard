
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
import { AIGenerateFormModal } from "./ai-generate-form-modal";
import { ImportFormModal } from "./import-form-modal";
import { FormRenderer } from "@/components/ui/form-renderer";
import { templateBlocks, templateSections } from "./form-template-blocks";
import type { FormSchema, FormPage, FormElement } from "@/lib/form-validator";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyBVV_vq5fjNSASYQndmbRbEtlfyOieFVTs",
    authDomain: "zappy-health-c1kob.firebaseapp.com",
    databaseURL: "https://zappy-health-c1kob-default-rtdb.firebaseio.com",
    projectId: "zappy-health-c1kob",
    storageBucket: "zappy-health-c1kob.appspot.com",
    messagingSenderId: "833435237612",
    appId: "1:833435237612:web:53731373b2ad7568f279c9"
  };
  
  let app;
  try {
    app = initializeApp(firebaseConfig, "form-builder-app");
  } catch (e) {
    app = initializeApp(firebaseConfig);
  }
  const db = getFirestore(app);

interface FormBuilderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    title: string;
    description: string;
  };
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

export function FormBuilderSheet({ isOpen, onClose, initialData }: FormBuilderSheetProps) {
  const [isAIGenModalOpen, setIsAIGenModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [activePageIndex, setActivePageIndex] = React.useState(0);
  const [isCreating, setIsCreating] = React.useState(false);
  const { toast } = useToast();

  const [formSchema, setFormSchema] = React.useState<FormSchema>({
    title: "Untitled Form",
    description: "A new form created in the builder.",
    pages: [{ id: "page1", title: "Page 1", elements: [] }],
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
        setFormSchema(prev => ({
            ...prev,
            title: initialData.title,
            description: initialData.description,
            pages: [{ id: "page1", title: "Page 1", elements: [] }]
        }));
        setActivePageIndex(0);
    }
  }, [isOpen, initialData]);

  const addBlockToForm = (blockName: keyof typeof templateBlocks) => {
    const block = templateBlocks[blockName];
    if (!block) return;

    setFormSchema(prevSchema => {
        const newSchema = JSON.parse(JSON.stringify(prevSchema));
        const currentPage = newSchema.pages[activePageIndex];

        const existingElementIds = new Set(currentPage.elements.map(el => el.id));
        const elementsToAdd = block.elements.filter(el => !existingElementIds.has(el.id));

        if (elementsToAdd.length === 0) {
            toast({
                title: "Block Already Added",
                description: `All fields from the "${block.title}" block are already in the form.`,
                variant: "default",
            });
            return prevSchema;
        }

        currentPage.elements.push(...elementsToAdd);
        
        toast({
            title: "Block Added",
            description: `The "${block.title}" block has been added to your form.`,
        });

        return newSchema;
    });
  };

  const addPage = () => {
    setFormSchema(prevSchema => {
      const newPageNumber = prevSchema.pages.length + 1;
      const newPage: FormPage = {
        id: `page${newPageNumber}`,
        title: `Page ${newPageNumber}`,
        elements: []
      };
      const updatedSchema = { ...prevSchema, pages: [...prevSchema.pages, newPage] };
      setActivePageIndex(updatedSchema.pages.length - 1); // Switch to the new page
      return updatedSchema;
    });
  };

  const createForm = async () => {
    setIsCreating(true);
    try {
        await addDoc(collection(db, "resources"), {
            title: formSchema.title,
            description: formSchema.description,
            contentType: "form_template",
            category: "custom", // Or derive from somewhere
            contentBody: formSchema, // Store the entire schema
            status: "Draft",
            author: "admin",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        toast({
            title: "Form Created Successfully",
            description: `The form "${formSchema.title}" has been saved.`,
        });
        onClose();
    } catch(e) {
        console.error("Error creating form: ", e);
        toast({
            variant: "destructive",
            title: "Error",
            description: "There was a problem creating the form.",
        });
    } finally {
        setIsCreating(false);
    }
  };


  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:w-full sm:max-w-none p-0 flex flex-col h-screen" side="right">
          <SheetHeader className="p-4 border-b flex-row justify-between items-center bg-background">
            <SheetTitle className="text-lg">Form Builder: {formSchema.title}</SheetTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isCreating}>Cancel</Button>
              <Button onClick={createForm} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Form"}
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-grow flex overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-96 border-r bg-slate-50 flex flex-col">
              <div className="p-4 border-b">
                  <Tabs defaultValue="fields">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="fields">Pages & Fields</TabsTrigger>
                          <TabsTrigger value="logic">Conditionals & Logic</TabsTrigger>
                      </TabsList>
                  </Tabs>
              </div>
              <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold mb-2">QUICK START</h3>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setIsAIGenModalOpen(true)}><Sparkles className="h-4 w-4 mr-2" /> AI Gen</Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setIsImportModalOpen(true)}><Import className="h-4 w-4 mr-2" /> Import Form</Button>
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
                                      <Button size="sm" className="w-full mt-3 text-xs" onClick={() => addBlockToForm(section.blockName)}>
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
                    {formSchema.pages.map((page, index) => (
                      <Button
                        key={page.id}
                        variant={activePageIndex === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActivePageIndex(index)}
                      >
                        {page.title}
                      </Button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addPage}><Plus className="h-4 w-4 mr-2" /> Add Page</Button>
              </header>
              <ScrollArea className="flex-grow p-8">
                {formSchema.pages[activePageIndex]?.elements.length === 0 ? (
                    <div className="bg-white rounded-lg p-6 min-h-[60vh] flex flex-col items-center justify-center border-2 border-dashed">
                        <div className="text-center text-muted-foreground">
                            <FolderOpen className="h-16 w-16 mx-auto text-gray-300" />
                            <p className="mt-4 font-semibold">Start building your form</p>
                            <p className="text-sm">Drag & drop fields from the left panel or use a template to get started.</p>
                        </div>
                    </div>
                ) : (
                    <FormRenderer schema={{...formSchema, pages: [formSchema.pages[activePageIndex]]}} />
                )}
              </ScrollArea>
            </main>
          </div>
        </SheetContent>
      </Sheet>
      <AIGenerateFormModal isOpen={isAIGenModalOpen} onClose={() => setIsAIGenModalOpen(false)} />
      <ImportFormModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onFormImported={() => {}} />
    </>
  );
}
