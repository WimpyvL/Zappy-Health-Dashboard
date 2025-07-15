
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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Discount = {
    id: string;
    name: string;
    description: string;
    code: string;
    type: "fixed" | "percentage";
    value: number;
    status: "Active" | "Inactive" | "Expired";
    validity: string;
    usage: number;
  };

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount?: Discount | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  code: z.string().min(1, "Discount code is required"),
  type: z.string().min(1, "Discount type is required"),
  value: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("Value must be greater than 0")
  ),
  description: z.string().optional(),
  validFrom: z.date({ required_error: "Start date is required." }),
  validUntil: z.date().optional(),
  minPurchase: z.preprocess(
    (a) => (a === "" ? 0 : parseFloat(z.string().parse(a))),
    z.number().min(0, "Minimum purchase cannot be negative")
  ),
  usageLimit: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

export function DiscountFormModal({ isOpen, onClose, discount }: DiscountFormModalProps) {
  const isEditMode = !!discount;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isEditMode && discount) {
      form.reset({
        name: discount.name,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description,
        validFrom: discount.validity === "No expiration" ? new Date() : new Date(discount.validity),
        validUntil: undefined, // Needs logic for parsing
        minPurchase: 0, // Mocked
        usageLimit: "Unlimited", // Mocked
        status: discount.status,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        type: "percentage",
        value: 0,
        description: "",
        validFrom: new Date(),
        validUntil: undefined,
        minPurchase: 0,
        usageLimit: "Unlimited",
        status: "Active",
      });
    }
  }, [discount, isEditMode, form, isOpen]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form values:", values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b">
          <DialogTitle className="text-lg font-semibold">{isEditMode ? "Edit Discount" : "Add New Discount"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Discount Name <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter discount name" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Discount Code <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter discount code" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discount Type <span className="text-destructive">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Value <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Enter discount description" {...field} rows={5} className="resize-none" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="validFrom"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Valid From <span className="text-destructive">*</span></FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="validUntil"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Valid Until</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="minPurchase"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Minimum Purchase</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="0" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="usageLimit"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Usage Limit Per User</FormLabel>
                                <FormControl>
                                    <Input placeholder="Unlimited" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {isEditMode ? "Save Changes" : "Create Discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
