
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

interface Provider {
    id: string;
    name: string;
    uuid: string;
    specialty: string;
    email: string;
    phone: string | null;
    status: "Active" | "Inactive";
    patientCount: number;
}

interface ProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: Provider | null;
  onSubmit: (values: any) => void;
}

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  patientCount: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(0, "Patient count cannot be negative")
  ),
});

export function ProviderFormModal({ isOpen, onClose, provider, onSubmit }: ProviderFormModalProps) {
  const isEditMode = !!provider;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isEditMode && provider) {
      form.reset({
        fullName: provider.name,
        specialty: provider.specialty,
        email: provider.email,
        phone: provider.phone || "",
        address: "", // Address not in mock, default to empty
        status: provider.status,
        patientCount: provider.patientCount,
      });
    } else {
      form.reset({
        fullName: "",
        specialty: "",
        email: "",
        phone: "",
        address: "",
        status: "Active",
        patientCount: 0,
      });
    }
  }, [provider, isEditMode, form, isOpen]);


  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">{isEditMode ? "Edit Provider" : "Add New Provider"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Specialty <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select Specialty" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                            <SelectItem value="cardiology">Cardiology</SelectItem>
                            <SelectItem value="dermatology">Dermatology</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="doctor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Medical Center Dr, City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                 <FormField
                    control={form.control}
                    name="patientCount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Patient Count</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(handleFormSubmit)}>
            {isEditMode ? "Save Changes" : "Create Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    