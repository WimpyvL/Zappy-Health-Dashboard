
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIGenerateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  prompt: z.string().min(10, "Please provide a more detailed description for the form."),
});

export function AIGenerateFormModal({ isOpen, onClose }: AIGenerateFormModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Generating form with prompt:", values.prompt);
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
        setIsGenerating(false);
        toast({
            title: "Draft Generated!",
            description: "The AI has generated a draft of your form.",
        })
        onClose();
        form.reset();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
                <DialogTitle className="text-lg font-semibold">Generate Form with AI</DialogTitle>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe the form you want to generate: <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="e.g., Create an intake form for anxiety symptoms, including demographics, symptom severity scale (PHQ-9), and past treatment history." 
                            {...field} 
                            rows={6}
                            className="resize-none"
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t bg-slate-50">
          <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isGenerating}>
            {isGenerating && <Sparkles className="h-4 w-4 mr-2 animate-spin" />}
            {isGenerating ? "Generating..." : "Generate Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
