
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Search, FileText, Calendar, PenSquare, FlaskConical, Receipt, AlertTriangle, Sparkles, Heart, Bot } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (values: { to: string; subject: string; message: string; }) => void;
}

const formSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message body is required"),
});

const quickTemplates = [
    { label: "Standard Acknowledgment", icon: FileText },
    { label: "Schedule Appointment", icon: Calendar },
    { label: "Prescription Update", icon: PenSquare },
    { label: "Lab Results Ready", icon: FlaskConical },
    { label: "Billing Inquiry", icon: Receipt },
    { label: "Emergency Protocol", icon: AlertTriangle },
];

const aiTemplates = [
    { label: "Generate AI Message (Personalized)", icon: Sparkles },
    { label: "Empathetic Outreach", icon: Heart },
    { label: "AI Care Plan Summary", icon: Bot },
];

export function NewMessageModal({ isOpen, onClose, onCreateConversation }: NewMessageModalProps) {
  const [showTemplates, setShowTemplates] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: "",
      subject: "",
      message: "",
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onCreateConversation(values);
    form.reset();
  };

  const toggleTemplates = () => setShowTemplates(prev => !prev);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">New Message</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="Search patient name or email..." className="pl-9" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                        <Input placeholder="Message subject..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Message</FormLabel>
                      <Button variant="link" type="button" className="p-0 h-auto text-xs" onClick={toggleTemplates}>
                        <FileText className="h-3 w-3 mr-1" />
                        Templates
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here..." 
                        {...field} 
                        className="resize-none"
                        rows={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showTemplates && (
                <div className="space-y-4 pt-2">
                    <div>
                        <h3 className="text-sm font-medium mb-2">Quick Templates</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {quickTemplates.map(template => (
                                <Button key={template.label} variant="outline" className="justify-start font-normal">
                                    <template.icon className="h-4 w-4 mr-2" />
                                    {template.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-sm font-medium mb-2">AI-Powered Templates</h3>
                         <div className="space-y-2">
                            {aiTemplates.map(template => (
                                <Button 
                                    key={template.label} 
                                    variant="outline" 
                                    className={`w-full justify-start font-normal ${template.label === 'AI Care Plan Summary' ? 'ring-2 ring-primary' : ''}`}
                                >
                                    <template.icon className="h-4 w-4 mr-2" />
                                    {template.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
