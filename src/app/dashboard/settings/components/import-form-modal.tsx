
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Import, Eye, Code, CheckCircle, XCircle } from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs";
  import { Card, CardContent } from "@/components/ui/card";
  import { validateFormSchema, ValidationResult } from "@/lib/form-validator";
  import { exampleFormJson } from './form-example';
  import { FormRenderer } from "@/components/ui/form-renderer";
  import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportFormModal({ isOpen, onClose }: ImportFormModalProps) {
  const [jsonString, setJsonString] = React.useState("");
  const [validationResult, setValidationResult] = React.useState<ValidationResult | null>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonString = e.target.value;
    setJsonString(newJsonString);
    if (newJsonString.trim()) {
      try {
        const parsed = JSON.parse(newJsonString);
        setValidationResult(validateFormSchema(parsed));
      } catch (error) {
        setValidationResult({
          isValid: false,
          errors: [{ path: 'JSON', message: 'Invalid JSON format.' }],
          warnings: [],
          formSchema: null
        });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Import className="h-6 w-6 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-lg font-semibold">Import Form from JSON</DialogTitle>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
            <Tabs defaultValue="import">
                <TabsList>
                    <TabsTrigger value="import"><Import className="h-4 w-4 mr-2" />Import JSON</TabsTrigger>
                    <TabsTrigger value="preview" disabled={!validationResult?.isValid}><Eye className="h-4 w-4 mr-2" />Preview Schema</TabsTrigger>
                    <TabsTrigger value="live-preview" disabled={!validationResult?.isValid}><Code className="h-4 w-4 mr-2" />Live Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="import" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-2">Paste your form JSON below or <Button variant="link" className="p-0 h-auto" onClick={loadExample}>load an example</Button>.</p>
                            <Textarea 
                                placeholder="Paste your form JSON here..." 
                                value={jsonString}
                                onChange={handleJsonChange}
                                rows={25}
                                className={cn(
                                    "font-mono text-xs",
                                    validationResult && (validationResult.isValid ? "border-green-500" : "border-red-500")
                                )}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <h3 className="text-sm font-semibold mb-2">Validation Results</h3>
                            <ScrollArea className="h-[525px] border rounded-md p-3 bg-slate-50">
                                {validationResult ? (
                                    validationResult.isValid ? (
                                        <div className="text-green-600 flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            JSON is valid!
                                        </div>
                                    ) : (
                                        <div className="text-red-600 space-y-2">
                                            {validationResult.errors.map((error, i) => (
                                                <div key={i} className="flex items-start">
                                                    <XCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                                    <span><span className="font-semibold">{error.path}:</span> {error.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <p className="text-muted-foreground text-sm">Waiting for JSON input...</p>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="preview">
                    {validationResult?.isValid && validationResult.formSchema ? (
                      <ScrollArea className="h-[400px] border rounded-lg p-4 bg-slate-50">
                        <pre className="text-xs">{JSON.stringify(validationResult.formSchema, null, 2)}</pre>
                      </ScrollArea>
                    ) : (
                      <div className="text-center p-8 border rounded-lg bg-slate-50 min-h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Preview will appear here after validation.</p>
                      </div>
                    )}
                </TabsContent>
                 <TabsContent value="live-preview">
                    {validationResult?.isValid && validationResult.formSchema ? (
                        <Card className="max-h-[400px] overflow-y-auto">
                            <CardContent className="p-6">
                                <FormRenderer schema={validationResult.formSchema} />
                            </CardContent>
                        </Card>
                    ) : (
                      <div className="text-center p-8 border rounded-lg bg-slate-50 min-h-[300px] flex items-center justify-center">
                          <p className="text-muted-foreground">Live form preview will appear here.</p>
                      </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!validationResult?.isValid}>Import Form</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
