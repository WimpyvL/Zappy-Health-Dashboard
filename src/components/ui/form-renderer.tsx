
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface FormElementOption {
  id: string;
  value: string;
  label: string;
}

interface FormElement {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: FormElementOption[];
}

interface FormPage {
  id: string;
  title: string;
  elements: FormElement[];
}

interface FormSchema {
  title: string;
  description?: string;
  pages: FormPage[];
}

interface FormRendererProps {
  schema: FormSchema;
}

const renderElement = (element: FormElement) => {
  const { id, type, label, required, placeholder, options } = element;

  return (
    <div key={id} className="mb-4">
      <Label htmlFor={id} className="font-semibold">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="mt-1">
        {type === 'text' && <Input id={id} placeholder={placeholder} />}
        {type === 'email' && <Input type="email" id={id} placeholder={placeholder} />}
        {type === 'date' && <Input type="date" id={id} />}
        {type === 'textarea' && <Textarea id={id} placeholder={placeholder} />}
        {type === 'radio' && (
          <RadioGroup id={id}>
            {options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.id} />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
        {type === 'checkbox' && (
           <div className="space-y-2">
            {options?.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox id={option.id} />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </div>
        )}
        {type === 'select' && (
            <Select>
                <SelectTrigger><SelectValue placeholder={placeholder || "Select an option"} /></SelectTrigger>
                <SelectContent>
                    {options?.map(option => (
                        <SelectItem key={option.id} value={option.value}>{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )}
      </div>
    </div>
  );
};

export const FormRenderer: React.FC<FormRendererProps> = ({ schema }) => {
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-none border-none">
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
        {schema.description && <CardDescription>{schema.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {schema.pages.map(page => (
            <div key={page.id}>
              {schema.pages.length > 1 && <h3 className="text-lg font-semibold border-b pb-2 mb-4">{page.title}</h3>}
              {page.elements.map(renderElement)}
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="submit">Submit Form</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
