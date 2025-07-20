
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';

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
    createMutation.mutate(formSchema);
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
            <main className="flex-1 p-4">
              {/* Main form builder content */}
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
