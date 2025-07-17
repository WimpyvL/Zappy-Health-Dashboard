
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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Patient = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Inactive" | "Pending";
  plan: string;
  lastActive: string;
  orders: number;
  tags: string[];
  phone?: string;
  dob?: Date;
  address?: string;
  pharmacy?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  groupNumber?: string;
  insuranceHolder?: string;
};

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dob: z.date({ required_error: "Date of birth is required." }),
  address: z.string().min(1, "Address is required"),
  pharmacy: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  groupNumber: z.string().optional(),
  insuranceHolder: z.string().optional(),
});

export function PatientFormModal({ isOpen, onClose, patient, onSubmit, isSubmitting }: PatientFormModalProps) {
  const isEditMode = !!patient;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isEditMode && patient) {
      const [firstName, ...lastNameParts] = patient.name.split(" ");
      const lastName = lastNameParts.join(" ");
      
      form.reset({
        firstName: firstName,
        lastName: lastName,
        email: patient.email,
        phone: patient.phone || '',
        dob: patient.dob ? new Date(patient.dob) : undefined,
        address: patient.address || '',
        pharmacy: patient.pharmacy || '',
        insuranceProvider: patient.insuranceProvider || '',
        policyNumber: patient.policyNumber || '',
        groupNumber: patient.groupNumber || '',
        insuranceHolder: patient.insuranceHolder || '',
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: undefined,
        address: "",
        pharmacy: "",
        insuranceProvider: "",
        policyNumber: "",
        groupNumber: "",
        insuranceHolder: "",
      });
    }
  }, [patient, isEditMode, form]);

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">{isEditMode ? "Edit Patient" : "Add New Patient"}</DialogTitle>
        </DialogHeader>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
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
                      <Input type="email" placeholder="Email" {...field} />
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
                    <FormLabel>Phone <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="(XXX) XXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth <span className="text-destructive">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "MM/dd/yyyy")
                            ) : (
                              <span>mm/dd/yyyy</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          captionLayout="dropdown-nav"
                          fromYear={1920}
                          toYear={new Date().getFullYear()}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Start typing to search for an address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pharmacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Pharmacy</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter preferred pharmacy name and location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="insuranceProvider"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <FormControl>
                        <Input placeholder="Insurance Provider" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="policyNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormControl>
                        <Input placeholder="Policy Number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="groupNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Group Number</FormLabel>
                        <FormControl>
                        <Input placeholder="Group Number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="insuranceHolder"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Primary Insurance Holder</FormLabel>
                        <FormControl>
                        <Input placeholder="If not the patient" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-0 border-t mt-6">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Patient")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
