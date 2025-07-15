
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
import { X, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  patientId: z.string().min(1, "Please select a patient."),
  lineItems: z.array(z.object({
    description: z.string().min(1, "Description is required."),
    quantity: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().min(1)),
    price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive()),
  })).min(1, "At least one line item is required."),
  discountCode: z.string().optional(),
  taxRate: z.preprocess((a) => (a === '' ? 0 : parseFloat(z.string().parse(a))), z.number().min(0).max(100).optional()),
});

export function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      lineItems: [{ description: "", quantity: 1, price: 0 }],
      discountCode: "",
      taxRate: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItems = form.watch("lineItems");
  const taxRate = form.watch("taxRate") || 0;

  const subtotal = React.useMemo(() => 
    lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0),
    [lineItems]
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Invoice created:", values);
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
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a patient" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="patient1">John Doe</SelectItem>
                          <SelectItem value="patient2">Jane Smith</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                    <FormLabel>Line Items <span className="text-destructive">*</span></FormLabel>
                    <div className="space-y-3 mt-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.description`}
                                    render={({ field }) => <FormItem className="col-span-6"><FormControl><Input placeholder="Item description" {...field} /></FormControl><FormMessage /></FormItem>}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.quantity`}
                                    render={({ field }) => <FormItem className="col-span-2"><FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl><FormMessage /></FormItem>}
                                />
                                <FormField
                                    control={form.control}
                                    name={`lineItems.${index}.price`}
                                    render={({ field }) => <FormItem className="col-span-3"><FormControl><Input type="number" placeholder="Price" {...field} /></FormControl><FormMessage /></FormItem>}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-1 text-destructive hover:text-destructive mt-1"><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, price: 0 })} className="mt-3">
                        <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="discountCode"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Discount Code</FormLabel>
                                <div className="flex gap-2">
                                <FormControl><Input placeholder="Enter code" {...field} /></FormControl>
                                <Button type="button" variant="secondary">Apply</Button>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="taxRate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tax Rate (%)</FormLabel>
                                <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-2 rounded-lg bg-slate-50 p-4">
                        <h4 className="font-semibold">Summary</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount</span>
                            <span>-$0.00</span>
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
                </div>

            </form>
          </Form>
        </div>
        <DialogFooter className="p-6 pt-4 border-t">
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
