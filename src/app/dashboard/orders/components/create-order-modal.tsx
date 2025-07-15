
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

const formSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  medication: z.string().min(1, "Medication/Product is required"),
  pharmacy: z.string().min(1, "Pharmacy is required"),
  linkedSession: z.string().optional(),
  notes: z.string().optional(),
});

export function CreateOrderModal({ isOpen, onClose, onSubmit }: CreateOrderModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        patientId: "",
        medication: "",
        pharmacy: "",
        linkedSession: "",
        notes: "",
    }
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Create New Order</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* This should be populated with real patient data */}
                        <SelectItem value="patient1_id">John Doe</SelectItem>
                        <SelectItem value="patient2_id">Jane Smith</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication/Product <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a medication or product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {/* This should be populated with real product data */}
                        <SelectItem value="Semaglutide">Semaglutide</SelectItem>
                        <SelectItem value="Metformin">Metformin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pharmacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pharmacy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* This should be populated with real pharmacy data */}
                        <SelectItem value="CVS Main Street">CVS Main Street</SelectItem>
                        <SelectItem value="Walgreens Downtown">Walgreens Downtown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Session (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a session (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* This should be populated with real session data */}
                        <SelectItem value="session1">Session on Jul 14, 2025</SelectItem>
                        <SelectItem value="session2">Session on Jul 10, 2025</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes about this order..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(handleSubmit)}>
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
