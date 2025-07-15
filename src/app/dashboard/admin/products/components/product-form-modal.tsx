
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null; // Use a proper type for product
}

const formSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string(),
  description: z.string().optional(),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "Price must be a positive number")
  ),
  stripePriceId: z.string().optional(),
  isActive: z.boolean().default(true),
  requiresPrescription: z.boolean().default(false),
  isProgram: z.boolean().default(false),
  associatedServices: z.string().optional(),
});

const categories = ["Weight Management", "ED", "Hair", "Skin", "General Health"];

export function ProductFormModal({ isOpen, onClose, product }: ProductFormModalProps) {
  const isEditMode = !!product;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Weight Management",
      description: "",
      price: 0,
      stripePriceId: "",
      isActive: true,
      requiresPrescription: false,
      isProgram: false,
      associatedServices: "",
    },
  });
  
  React.useEffect(() => {
    if (isEditMode && product) {
      form.reset({
        name: product.name,
        category: product.category,
        description: product.description || '',
        price: product.price,
        stripePriceId: product.stripePriceId || '',
        isActive: product.status === 'Active',
        requiresPrescription: product.requiresPrescription || false,
        isProgram: product.isProgram || false,
        associatedServices: product.associatedServices?.join(', ') || ''
      });
    } else {
       form.reset({
        name: "",
        category: "Weight Management",
        description: "",
        price: 0,
        stripePriceId: "",
        isActive: true,
        requiresPrescription: false,
        isProgram: false,
        associatedServices: "",
    });
    }
  }, [product, isEditMode, form, isOpen]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form values:", values);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b">
          <DialogTitle className="text-lg font-semibold">{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <h3 className="text-base font-semibold">Basic Information</h3>
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Product Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category}
                          type="button"
                          variant={field.value === category ? "default" : "outline"}
                          onClick={() => field.onChange(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                          <Textarea placeholder="Enter product description" {...field} rows={4} className="resize-none"/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Price <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="$ 0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="stripePriceId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stripe Price ID</FormLabel>
                        <FormControl>
                            <Input placeholder="price_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <div className="flex space-x-6 items-center">
                 <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                           <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Active</FormLabel>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="requiresPrescription"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                           <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Requires Prescription</FormLabel>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isProgram"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                           <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Is Program</FormLabel>
                        </FormItem>
                    )}
                />
              </div>

              <h3 className="text-base font-semibold pt-4 border-t">Associated Services</h3>
              <FormField
                  control={form.control}
                  name="associatedServices"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Select services related to this product</FormLabel>
                       <FormControl>
                          <Textarea placeholder="Select services... (e.g. Telehealth Consultation, Prescription Refill)" {...field} rows={4} className="resize-none"/>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">This helps organize products by related services in the admin interface.</p>
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
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {isEditMode ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
