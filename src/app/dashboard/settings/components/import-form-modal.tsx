
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
import { X, Import, Eye, Code } from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs";
  import { Badge } from "@/components/ui/badge";

interface ImportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportFormModal({ isOpen, onClose }: ImportFormModalProps) {
  const [jsonString, setJsonString] = React.useState("");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0" hideCloseButton>
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
                    <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-2" />Preview Form</TabsTrigger>
                    <TabsTrigger value="live-preview"><Code className="h-4 w-4 mr-2" />Live Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="import" className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Paste your form JSON below. The JSON structure should include:</p>
                    <div className="text-sm space-y-1 mb-4">
                        <div><Badge variant="secondary" className="mr-2 font-mono">title</Badge> - The form title (required)</div>
                        <div><Badge variant="secondary" className="mr-2 font-mono">description</Badge> - Form description (optional)</div>
                        <div><Badge variant="secondary" className="mr-2 font-mono">pages</Badge> - Array of form pages with elements (required)</div>
                        <div><Badge variant="secondary" className="mr-2 font-mono">conditionals</Badge> - Array of conditional logic (optional)</div>
                    </div>
                    <Textarea 
                        placeholder="Paste your form JSON here..." 
                        value={jsonString}
                        onChange={(e) => setJsonString(e.target.value)}
                        rows={10}
                        className="font-mono text-xs"
                    />
                     <div className="mt-4 flex justify-between">
                        <Button variant="link" className="p-0 h-auto">Load Example JSON</Button>
                        <div className="flex gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button disabled>Validate JSON</Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="preview">
                    <div className="text-center p-8 border rounded-lg bg-slate-50 min-h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Preview will appear here after validation.</p>
                    </div>
                </TabsContent>
                 <TabsContent value="live-preview">
                    <div className="text-center p-8 border rounded-lg bg-slate-50 min-h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Live form preview will appear here.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
