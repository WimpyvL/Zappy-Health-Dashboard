"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2, Upload, Scale, Camera, Activity } from "lucide-react";

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

interface DynamicFormRendererProps {
  schema: FormSchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  allowMultiPage?: boolean;
  onFormDataChange?: (data: Record<string, any>) => void;
  onPageChange?: (pageIndex: number) => void;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ 
  schema, 
  onSubmit, 
  isSubmitting = false,
  submitButtonText = "Submit Form",
  allowMultiPage = true,
  onFormDataChange,
  onPageChange
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pageErrors, setPageErrors] = useState<Record<string, string[]>>({});

  const currentPage = schema.pages[currentPageIndex];
  const totalPages = schema.pages.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;
  const progressPercentage = totalPages > 1 ? ((currentPageIndex + 1) / totalPages) * 100 : 100;

  const handleInputChange = useCallback((elementId: string, value: any) => {
    const newFormData = {
      ...formData,
      [elementId]: value
    };
    
    setFormData(newFormData);
    
    // Call the callback with updated form data
    if (onFormDataChange) {
      onFormDataChange(newFormData);
    }
    
    // Clear error for this field if it exists
    if (currentPage) {
      setPageErrors(prev => ({
        ...prev,
        [currentPage.id]: (prev[currentPage.id] || []).filter(error => !error.includes(elementId))
      }));
    }
  }, [currentPage, formData, onFormDataChange]);

  const validateCurrentPage = useCallback(() => {
    if (!currentPage) return false;
    
    const errors: string[] = [];
    const requiredElements = currentPage.elements.filter(el => el.required);
    
    requiredElements.forEach(element => {
      const value = formData[element.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${element.label} is required`);
      }
    });

    setPageErrors(prev => ({
      ...prev,
      [currentPage.id]: errors
    }));

    return errors.length === 0;
  }, [currentPage, formData]);

  const handleNextPage = useCallback(() => {
    if (validateCurrentPage() && currentPageIndex < totalPages - 1) {
      const newPageIndex = currentPageIndex + 1;
      setCurrentPageIndex(newPageIndex);
      if (onPageChange) {
        onPageChange(newPageIndex);
      }
    }
  }, [validateCurrentPage, currentPageIndex, totalPages, onPageChange]);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      const newPageIndex = currentPageIndex - 1;
      setCurrentPageIndex(newPageIndex);
      if (onPageChange) {
        onPageChange(newPageIndex);
      }
    }
  }, [currentPageIndex, onPageChange]);

  // Call onPageChange when component mounts
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPageIndex);
    }
  }, [onPageChange, currentPageIndex]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentPage()) {
      return;
    }

    // If multi-page and not on last page, go to next page
    if (allowMultiPage && !isLastPage) {
      handleNextPage();
      return;
    }

    // Final validation for all pages
    let hasErrors = false;
    schema.pages.forEach(page => {
      const requiredElements = page.elements.filter(el => el.required);
      const pageErrors: string[] = [];
      
      requiredElements.forEach(element => {
        const value = formData[element.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          pageErrors.push(`${element.label} is required`);
          hasErrors = true;
        }
      });
      
      if (pageErrors.length > 0) {
        setPageErrors(prev => ({
          ...prev,
          [page.id]: pageErrors
        }));
      }
    });

    if (hasErrors) {
      return;
    }

    await onSubmit(formData);
  }, [validateCurrentPage, allowMultiPage, isLastPage, handleNextPage, schema.pages, formData, onSubmit]);

  const renderElement = useCallback((element: FormElement) => {
    const { id, type, label, required, placeholder, options } = element;
    const value = formData[id] || '';

    return (
      <div key={id} className="mb-6">
        <Label htmlFor={id} className="font-semibold text-sm">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="mt-2">
          {type === 'text' && (
            <Input 
              id={id} 
              value={value}
              placeholder={placeholder} 
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          )}
          {type === 'email' && (
            <Input 
              type="email" 
              id={id} 
              value={value}
              placeholder={placeholder} 
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          )}
          {type === 'tel' && (
            <Input 
              type="tel" 
              id={id} 
              value={value}
              placeholder={placeholder} 
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          )}
          {type === 'number' && (
            <Input 
              type="number" 
              id={id} 
              value={value}
              placeholder={placeholder} 
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          )}
          {type === 'date' && (
            <Input 
              type="date" 
              id={id} 
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          )}
          {type === 'textarea' && (
            <Textarea 
              id={id} 
              value={value}
              placeholder={placeholder} 
              rows={3}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          )}
          {type === 'radio' && (
            <RadioGroup 
              value={value} 
              onValueChange={(newValue) => handleInputChange(id, newValue)}
            >
              {options?.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.id} />
                  <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {type === 'checkbox' && (
            <div className="space-y-3">
              {options?.map(option => {
                const isChecked = Array.isArray(value) ? value.includes(option.value) : false;
                return (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={option.id} 
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const currentArray = Array.isArray(value) ? value : [];
                        if (checked) {
                          handleInputChange(id, [...currentArray, option.value]);
                        } else {
                          handleInputChange(id, currentArray.filter(v => v !== option.value));
                        }
                      }}
                    />
                    <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                  </div>
                );
              })}
            </div>
          )}
          {type === 'select' && (
            <Select value={value} onValueChange={(newValue) => handleInputChange(id, newValue)}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {options?.map(option => (
                  <SelectItem key={option.id} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {type === 'weight' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Scale className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Input 
                      type="number" 
                      id={id} 
                      value={value}
                      placeholder="Enter weight" 
                      className="w-24"
                      step="0.1"
                      min="0"
                      max="1000"
                      onChange={(e) => handleInputChange(id, e.target.value)}
                    />
                    <span className="text-sm text-gray-600">lbs</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Track your weight progress</p>
                </div>
              </div>
            </div>
          )}
          {type === 'progress-rating' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Rate your progress (1-10)</span>
                </div>
                <div className="space-y-3">
                  <Slider
                    value={[parseInt(value) || 5]}
                    onValueChange={(newValue) => handleInputChange(id, newValue[0].toString())}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 - Poor</span>
                    <span className="font-medium text-green-600">
                      {value || '5'}/10
                    </span>
                    <span>10 - Excellent</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {type === 'progress-photo' && (
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Upload Progress Photo</span>
                </div>
                <div className="space-y-3">
                  <Input 
                    type="file" 
                    id={id}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleInputChange(id, file);
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="text-xs text-purple-600">
                    Upload a photo to track your visual progress
                  </p>
                  {value && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Photo uploaded: {(value as File)?.name || 'progress-photo.jpg'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          {type === 'lab-upload' && (
            <div className="space-y-3">
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Upload className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Upload Lab Results</span>
                </div>
                <div className="space-y-3">
                  <Input 
                    type="file" 
                    id={id}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleInputChange(id, file);
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  <p className="text-xs text-orange-600">
                    Upload PDF or image files. Text will be automatically extracted.
                  </p>
                  {value && (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        File uploaded: {(value as File)?.name || 'lab-results.pdf'}
                      </Badge>
                      <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                        <strong>OCR Processing:</strong> Text extraction will begin after form submission
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [formData, handleInputChange]);

  const currentPageErrors = currentPage ? (pageErrors[currentPage.id] || []) : [];

  if (!currentPage) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No form pages available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{schema.title}</CardTitle>
            {schema.description && <CardDescription className="mt-1">{schema.description}</CardDescription>}
          </div>
          {totalPages > 1 && allowMultiPage && (
            <div className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {totalPages}
            </div>
          )}
        </div>
        {totalPages > 1 && allowMultiPage && (
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            {allowMultiPage && totalPages > 1 && (
              <h3 className="text-lg font-semibold border-b pb-2 mb-6">{currentPage.title}</h3>
            )}
            
            {/* Show errors for current page */}
            {currentPageErrors.length > 0 && (
              <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-destructive mb-2">Please correct the following errors:</h4>
                <ul className="text-sm text-destructive list-disc list-inside space-y-1">
                  {currentPageErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Render current page elements */}
            {(allowMultiPage ? [currentPage] : schema.pages).filter(page => page != null).map(page => (
              <div key={page.id}>
                {!allowMultiPage && totalPages > 1 && (
                  <h3 className="text-lg font-semibold border-b pb-2 mb-6">{page.title}</h3>
                )}
                {page.elements.map(renderElement)}
              </div>
            ))}
          </div>

          {/* Form navigation/submit buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {allowMultiPage && !isFirstPage && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevPage}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : (
                  allowMultiPage && !isLastPage ? (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : submitButtonText
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
