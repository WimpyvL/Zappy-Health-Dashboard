
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Square, Type, Hash, List, CheckSquare, ChevronDown, Calendar, Clock, Mail, Phone, User, MapPin, Import, Sparkles, FolderOpen, Plus } from "lucide-react";
import { AIGenerateFormModal } from "./ai-generate-form-modal";
import { ImportFormModal } from "./import-form-modal";
import { FormRenderer } from "@/components/ui/form-renderer";
import { templateBlocks, templateSections } from "./form-template-blocks";
import type { FormSchema, FormPage, FormElement } from "@/lib/form-validator";
import { useToast } from "@/hooks/use-toast";
<<<<<<< HEAD
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

interface FormBuilderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: { title: string; description: string; };
}

const createForm = async (formSchema: FormSchema) => {
    const newForm = {
        title: formSchema.title,
        description: formSchema.description,
        contentType: "form_template",
        category: "custom",
        contentBody: formSchema,
        status: "Draft",
        author: "admin",
    };
    const response = await dbService.create("resources", newForm);
    if (response.error) throw new Error(response.error);
    return response.data;
};

export function FormBuilderSheet({ isOpen, onClose, initialData }: FormBuilderSheetProps) {
  const [isAIGenModalOpen, setIsAIGenModalOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [activePageIndex, setActivePageIndex] = React.useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formSchema, setFormSchema] = React.useState<FormSchema>({
    title: "Untitled Form",
    description: "A new form created in the builder.",
    pages: [{ id: "page1", title: "Page 1", elements: [] }],
  });

  const createMutation = useMutation({
    mutationFn: createForm,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        toast({ title: "Form Created", description: `The form "${data?.title}" has been saved.` });
        onClose();
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Error Creating Form", description: error.message });
    }
  });

  const handleCreateForm = () => {
    if (!formSchema.title || formSchema.pages.every(p => p.elements.length === 0)) {
        toast({ variant: "destructive", title: "Cannot Create Form", description: "Please provide a title and add at least one field." });
        return;
    }
<<<<<<< HEAD
    createMutation.mutate(formSchema);
=======

    setIsCreating(true);
    try {
        const db = getFirebaseFirestore();
        if (!db) {
            throw new Error('Firebase not initialized');
        }
        
        await addDoc(collection(db, "resources"), {
            title: formSchema.title,
            description: formSchema.description,
            contentType: "form_template",
            category: "custom",
            contentBody: formSchema, // Saving the schema object
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
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
  };

  // Other component logic (addBlockToForm, handleDragStart, etc.) remains the same

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-none p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Form Builder: {formSchema.title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex">
            <aside className="w-80 border-r">
              {/* Sidebar content */}
            </aside>
<<<<<<< HEAD
            <main className="flex-1 p-4">
              {/* Main form builder content */}
=======

            {/* Main Content */}
            <main 
              className="flex-1 bg-slate-100 flex flex-col overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
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
                    formSchema.pages[activePageIndex] && (
                        <FormRenderer schema={{...formSchema, pages: [formSchema.pages[activePageIndex]]}} />
                    )
                )}
              </ScrollArea>
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
            </main>
          </div>
          <div className="p-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
            <Button onClick={handleCreateForm} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Form"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <AIGenerateFormModal isOpen={isAIGenModalOpen} onClose={() => setIsAIGenModalOpen(false)} />
      <ImportFormModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onFormImported={() => {}} />
    </>
  );
}
