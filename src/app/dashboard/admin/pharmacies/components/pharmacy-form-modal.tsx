
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
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

type Pharmacy = {
  id: string;
  name: string;
  type: "Compounding" | "Retail";
  status: "Active" | "Inactive";
};

interface PharmacyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacy?: Pharmacy | null;
  onSubmit: (values: any) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Pharmacy name is required"),
  type: z.string().min(1, "Pharmacy type is required"),
  status: z.string().min(1, "Status is required"),
});

export function PharmacyFormModal({ isOpen, onClose, pharmacy, onSubmit }: PharmacyFormModalProps) {
  const isEditMode = !!pharmacy;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isEditMode && pharmacy) {
      form.reset({
        name: pharmacy.name,
        type: pharmacy.type,
        status: pharmacy.status,
      });
    } else {
      form.reset({
        name: "",
        type: "Retail",
        status: "Active",
      });
    }
  }, [pharmacy, isEditMode, form, isOpen]);


  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">{isEditMode ? "Edit Pharmacy" : "Add New Pharmacy"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pharmacy name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Compounding">Compounding</SelectItem>
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                      </Select>
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
          <Button type="submit" onClick={form.handleSubmit(handleFormSubmit)}>
            {isEditMode ? "Save Changes" : "Add Pharmacy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
