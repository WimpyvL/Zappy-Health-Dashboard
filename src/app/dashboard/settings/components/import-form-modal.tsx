
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Import } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateFormSchema, ValidationResult } from "@/lib/form-validator";
import { exampleFormJson } from './form-example';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';

interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormImported: () => void;
}

const importForm = async (formSchema: any) => {
    const newForm = {
        title: formSchema.title,
        description: formSchema.description,
        contentType: "form_template",
        category: "imported",
        contentBody: formSchema,
        status: "Draft",
        author: "admin",
    };
    const response = await dbService.resources.create(newForm);
    if (response.error) throw new Error(response.error);
    return response.data;
};

export function ImportFormModal({ isOpen, onClose, onFormImported }: ImportFormModalProps) {
  const [jsonString, setJsonString] = React.useState("");
  const [validationResult, setValidationResult] = React.useState<ValidationResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: importForm,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['resources'] });
        toast({ title: "Form Imported Successfully", description: `The form "${data?.title}" has been added.` });
        onFormImported();
        onClose();
    },
    onError: (error: Error) => {
        toast({ variant: "destructive", title: "Import Failed", description: error.message });
    }
  });

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonString = e.target.value;
    setJsonString(newJsonString);
    if (newJsonString.trim()) {
      try {
        const parsed = JSON.parse(newJsonString);
        setValidationResult(validateFormSchema(parsed));
      } catch (error) {
        setValidationResult({ isValid: false, errors: [{ path: 'JSON', message: 'Invalid JSON format.' }], warnings: [], formSchema: null });
      }
    } else {
      setValidationResult(null);
    }
  };

  const loadExample = () => {
    const exampleString = JSON.stringify(exampleFormJson, null, 2);
    setJsonString(exampleString);
    setValidationResult(validateFormSchema(exampleFormJson));
  };

  const handleImport = () => {
    if (!validationResult?.isValid || !validationResult.formSchema) {
        toast({ variant: "destructive", title: "Validation Error", description: "Cannot import an invalid form schema." });
        return;
    }
    importMutation.mutate(validationResult.formSchema);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader><DialogTitle>Import Form from JSON</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
            <Tabs defaultValue="import">
                <TabsList>
                    <TabsTrigger value="import">Import JSON</TabsTrigger>
                    <TabsTrigger value="preview" disabled={!validationResult?.isValid}>Preview Schema</TabsTrigger>
                </TabsList>
                <TabsContent value="import">
                    <Textarea value={jsonString} onChange={handleJsonChange} rows={15} />
                    <Button onClick={loadExample} variant="link">Load Example</Button>
                </TabsContent>
                <TabsContent value="preview">
                    {validationResult?.isValid && <pre>{JSON.stringify(validationResult.formSchema, null, 2)}</pre>}
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importMutation.isPending}>Cancel</Button>
          <Button onClick={handleImport} disabled={!validationResult?.isValid || importMutation.isPending}>
            {importMutation.isPending ? "Importing..." : "Import Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
