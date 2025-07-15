
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
  DialogDescription,
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
import { Checkbox } from "@/components/ui/checkbox";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Content title is required"),
  contentType: z.string().min(1, "Content type is required"),
  category: z.string().min(1, "Category is required"),
  contentBody: z.string().min(1, "Content body is required"),
  isFeatured: z.boolean().default(false),
  status: z.string().min(1, "Status is required"),
  publishDate: z.date().optional(),
  author: z.string().min(1, "Author is required"),
});

export function CreateContentModal({ isOpen, onClose }: CreateContentModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: "",
        contentType: "product_info",
        category: "general",
        contentBody: "",
        isFeatured: false,
        status: "Draft",
        author: "admin",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form values:", values);
    onClose();
    form.reset();
  };

  const handleSaveAsDraft = () => {
    form.setValue("status", "Draft");
    form.handleSubmit(onSubmit)();
  }

  const handlePublish = () => {
    form.setValue("status", "Published");
    form.handleSubmit(onSubmit)();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl p-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b">
          <div>
            <DialogTitle className="text-lg font-semibold">Create New Content</DialogTitle>
            <DialogDescription>Fill in the details to create a new educational resource.</DialogDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Content Title <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Understanding Your Medication" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Content Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="product_info">Product Information</SelectItem>
                            <SelectItem value="treatment_guides">Treatment Guides</SelectItem>
                            <SelectItem value="side_effect_management">Side Effect Management</SelectItem>
                            <SelectItem value="condition_info">Condition Information</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="weight_management">Weight Management</SelectItem>
                        <SelectItem value="hair_loss">Hair Loss</SelectItem>
                        <SelectItem value="ed_treatment">ED Treatment</SelectItem>
                        <SelectItem value="skin_care">Skin Care</SelectItem>
                      </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />

              <FormField
                  control={form.control}
                  name="contentBody"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Content Body <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                          <Textarea placeholder="Enter the main content here. Supports Markdown." {...field} rows={12} className="resize-y"/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pb-2">
                           <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Featured Content</FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="publishDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Publish Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "MM/dd/yyyy") : <span>Pick a date</span>}
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
                        name="author"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Author <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select an author" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="dr_smith">Dr. John Smith</SelectItem>
                                <SelectItem value="dr_jones">Dr. Sarah Johnson</SelectItem>
                            </SelectContent>
                            </Select>
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
          <div className="flex-grow" />
          <Button type="button" variant="secondary" onClick={handleSaveAsDraft}>
            Save as Draft
          </Button>
          <Button type="button" onClick={handlePublish}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
