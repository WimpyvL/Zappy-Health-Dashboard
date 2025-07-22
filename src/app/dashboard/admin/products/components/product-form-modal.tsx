
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null; // Use a proper type for product
  onSubmit: (values: any) => void;
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
  // Enhanced prescription fields
  productType: z.enum(['prescription', 'otc', 'controlled', 'supplement', 'device']).default('otc'),
  controlledSchedule: z.enum(['', 'CI', 'CII', 'CIII', 'CIV', 'CV']).optional(),
  deaRequired: z.boolean().default(false),
  specialHandling: z.boolean().default(false),
  ndcNumber: z.string().optional(),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  strengthDosage: z.string().optional(),
  dosageForm: z.string().optional(),
  routeOfAdministration: z.string().optional(),
  complianceFlags: z.string().optional(),
});

const categories = ["Weight Management", "ED", "Hair", "Skin", "General Health"];

export function ProductFormModal({ isOpen, onClose, product, onSubmit }: ProductFormModalProps) {
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
      productType: "otc",
      controlledSchedule: "",
      deaRequired: false,
      specialHandling: false,
      ndcNumber: "",
      genericName: "",
      brandName: "",
      strengthDosage: "",
      dosageForm: "",
      routeOfAdministration: "",
      complianceFlags: "",
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
        isActive: product.status === 'Active' || product.isActive,
        requiresPrescription: product.requiresPrescription || false,
        isProgram: product.isProgram || false,
        associatedServices: product.associatedServices?.join(', ') || '',
        productType: product.productType || 'otc',
        controlledSchedule: product.controlledSchedule || '',
        deaRequired: product.deaRequired || false,
        specialHandling: product.specialHandling || false,
        ndcNumber: product.ndcNumber || '',
        genericName: product.genericName || '',
        brandName: product.brandName || '',
        strengthDosage: product.strengthDosage || '',
        dosageForm: product.dosageForm || '',
        routeOfAdministration: product.routeOfAdministration || '',
        complianceFlags: product.complianceFlags || '',
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
        productType: "otc",
        controlledSchedule: "",
        deaRequired: false,
        specialHandling: false,
        ndcNumber: "",
        genericName: "",
        brandName: "",
        strengthDosage: "",
        dosageForm: "",
        routeOfAdministration: "",
        complianceFlags: "",
    });
    }
  }, [product, isEditMode, form, isOpen]);

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

              <h3 className="text-base font-semibold pt-4 border-t">Prescription Classification</h3>
              
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="otc">Over-the-Counter (OTC)</SelectItem>
                          <SelectItem value="prescription">Prescription Required</SelectItem>
                          <SelectItem value="controlled">Controlled Substance</SelectItem>
                          <SelectItem value="supplement">Supplement</SelectItem>
                          <SelectItem value="device">Medical Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("productType") === "controlled") && (
                <FormField
                  control={form.control}
                  name="controlledSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Controlled Schedule</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select schedule" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CI">Schedule I (CI)</SelectItem>
                            <SelectItem value="CII">Schedule II (CII)</SelectItem>
                            <SelectItem value="CIII">Schedule III (CIII)</SelectItem>
                            <SelectItem value="CIV">Schedule IV (CIV)</SelectItem>
                            <SelectItem value="CV">Schedule V (CV)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex space-x-6 items-center">
                <FormField
                  control={form.control}
                  name="deaRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">DEA Authorization Required</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialHandling"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Special Handling Required</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {(form.watch("productType") === "prescription" || form.watch("productType") === "controlled") && (
                <>
                  <h3 className="text-base font-semibold pt-4 border-t">Medication Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="genericName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generic Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter generic name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="brandName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter brand name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="strengthDosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strength/Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 25mg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dosageForm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosage Form</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Tablet, Capsule" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="routeOfAdministration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Oral, Topical" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ndcNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NDC Number</FormLabel>
                        <FormControl>
                          <Input placeholder="National Drug Code (NDC)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complianceFlags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compliance Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Special compliance requirements, warnings, or notes" {...field} rows={3} className="resize-none"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

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
