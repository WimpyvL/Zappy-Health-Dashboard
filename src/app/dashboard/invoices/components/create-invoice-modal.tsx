
"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X, Search, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  patientName: z.string().min(1, "Customer name is required."),
  dueDate: z.date({ required_error: "Due date is required." }),
  subscriptionPlan: z.string().optional(),
  lineItems: z.array(z.object({
    product: z.string(),
    description: z.string().max(150, "Description cannot exceed 150 characters."),
    quantity: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().min(1)),
    price: z.preprocess((a) => parseFloat(z.string().parse(a) || '0'), z.number().min(0)),
  })).min(1, "At least one line item is required."),
  discountAmount: z.preprocess((a) => (a === "" ? 0 : parseFloat(z.string().parse(a))), z.number().min(0).optional()),
  taxRate: z.preprocess((a) => (a === '' ? 0 : parseFloat(z.string().parse(a))), z.number().min(0).max(100).optional()),
});

export function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      subscriptionPlan: "",
      lineItems: [{ product: "", description: "", quantity: 1, price: 0 }],
      discountAmount: 0,
      taxRate: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });
  
  const lineItems = form.watch("lineItems");
  const taxRate = form.watch("taxRate") || 0;
  const discountAmount = form.watch("discountAmount") || 0;

  const subtotal = React.useMemo(() => 
    lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0),
    [lineItems]
  );
  
  const totalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (totalAfterDiscount > 0 ? totalAfterDiscount : 0) * (taxRate / 100);
  const total = totalAfterDiscount + taxAmount;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Invoice created:", { ...values, subtotal, taxAmount, total });
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Create New Invoice</DialogTitle>
           <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <h3 className="text-sm font-medium text-muted-foreground">Customer Information</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl><Input placeholder="Search for a patient..." className="pl-9" {...field} /></FormControl>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Due Date <span className="text-destructive">*</span></FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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
                </div>

                <h3 className="text-sm font-medium text-muted-foreground">Subscription Plan</h3>
                 <FormField
                  control={form.control}
                  name="subscriptionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="plan1">Weight Management - Monthly</SelectItem>
                          <SelectItem value="plan2">Hair Loss - Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div>
                    <FormLabel>Line Items <span className="text-destructive">*</span></FormLabel>
                    <div className="text-xs grid grid-cols-12 gap-2 mt-2 px-2 text-muted-foreground">
                        <div className="col-span-4">Product/Service</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-2 text-right">Price/Item ($)</div>
                    </div>
                    <div className="space-y-2 mt-1">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-2 rounded-md">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.product`}
                                    render={({ field }) => <FormItem className="col-span-4"><FormControl><Input placeholder="Product/Service" {...field} /></FormControl><Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1">Switch to product list</Button></FormItem>}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.description`}
                                    render={({ field }) => <FormItem className="col-span-4"><FormControl><Input placeholder="Description (up to 150 characters)" {...field} /></FormControl></FormItem>}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.quantity`}
                                    render={({ field }) => <FormItem className="col-span-1"><FormControl><Input type="number" {...field} className="text-center" /></FormControl></FormItem>}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.price`}
                                    render={({ field }) => <FormItem className="col-span-2"><FormControl><Input type="number" placeholder="Price" {...field} className="text-right" /></FormControl></FormItem>}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-1 text-destructive hover:text-destructive h-8 w-8 mt-1"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ product: "", description: "", quantity: 1, price: 0 })} className="mt-3">
                        <Plus className="h-4 w-4 mr-2" /> Add Line Item
                    </Button>
                </div>
                
                <h3 className="text-sm font-medium text-muted-foreground">Discount and Tax</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="discountAmount" render={({ field }) => ( <FormItem><FormLabel>Discount Amount ($)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl></FormItem> )} />
                    <FormField control={form.control} name="taxRate" render={({ field }) => ( <FormItem><FormLabel>Tax Rate (%)</FormLabel><FormControl><Input type="number" placeholder="0" {...field} /></FormControl></FormItem> )} />
                </div>
                
                <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
                <div className="space-y-2 rounded-lg bg-slate-50 p-4 border">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                        <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t bg-slate-50">
          <Button type="button" variant="ghost">Save as Draft</Button>
          <div className="flex-grow" />
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
