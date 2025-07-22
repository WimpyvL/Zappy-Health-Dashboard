"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

const defaultTemplates = [
  { 
    title: "Weight Management Intake", 
    category: "weight_management",
    description: "Comprehensive assessment for weight management consultation",
    fields: 12 
  },
  { 
    title: "Sexual Health Consultation", 
    category: "sexual_health",
    description: "Confidential assessment for sexual health concerns",
    fields: 8 
  },
  { 
    title: "Hair Loss Treatment Assessment", 
    category: "hair_loss",
    description: "Comprehensive evaluation for hair loss treatment options",
    fields: 10 
  },
  { 
    title: "General Medical Consultation", 
    category: "default_intake",
    description: "Standard intake form for general medical consultations",
    fields: 6 
  }
];

export const DefaultFormSetup: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkExistingTemplates = async () => {
    setIsChecking(true);
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const templateQuery = query(
        collection(db, 'resources'),
        where('contentType', '==', 'form_template'),
        where('author', '==', 'system')
      );
      
      const querySnapshot = await getDocs(templateQuery);
      const existingCategories = querySnapshot.docs.map(doc => doc.data().category);
      setExistingTemplates(existingCategories);
    } catch (error) {
      console.error('Error checking templates:', error);
      toast({
        variant: "destructive",
        title: "Check Failed",
        description: "Could not check existing templates."
      });
    } finally {
      setIsChecking(false);
    }
  };

  const createDefaultTemplates = async () => {
    setIsCreating(true);
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Create templates with full schema
      const templateData = [
        {
          title: "Weight Management Intake Form",
          description: "Comprehensive assessment for weight management consultation",
          contentType: "form_template",
          category: "weight_management",
          categoryId: "weight_management",
          status: "Published",
          author: "system",
          contentBody: {
            title: "Weight Management Consultation",
            description: "Help us understand your weight management goals and medical history",
            pages: [
              {
                id: "demographics",
                title: "Personal Information",
                elements: [
                  { id: "age", type: "number", label: "Age", required: true, placeholder: "Enter your age" },
                  { id: "height_feet", type: "number", label: "Height (feet)", required: true, placeholder: "5" },
                  { id: "height_inches", type: "number", label: "Height (inches)", required: true, placeholder: "8" },
                  { id: "current_weight", type: "number", label: "Current Weight (lbs)", required: true },
                  { id: "goal_weight", type: "number", label: "Goal Weight (lbs)", required: false },
                  { id: "gender", type: "select", label: "Gender", required: true,
                    options: [
                      { id: "male", value: "male", label: "Male" },
                      { id: "female", value: "female", label: "Female" },
                      { id: "other", value: "other", label: "Other" }
                    ]
                  }
                ]
              },
              {
                id: "medical_history",
                title: "Medical History",
                elements: [
                  { id: "condition_diabetes", type: "radio", label: "Do you have diabetes?", required: true,
                    options: [
                      { id: "diabetes_yes", value: "diabetes", label: "Yes" },
                      { id: "diabetes_no", value: "none", label: "No" }
                    ]
                  },
                  { id: "medications", type: "textarea", label: "Current Medications", required: false,
                    placeholder: "List all current medications" },
                  { id: "allergies", type: "textarea", label: "Known Allergies", required: false,
                    placeholder: "List any known allergies" },
                  { id: "goals", type: "textarea", label: "Weight Management Goals", required: true,
                    placeholder: "Describe your weight management goals and motivation" }
                ]
              }
            ]
          }
        },
        {
          title: "General Medical Consultation",
          description: "Standard intake form for general medical consultations", 
          contentType: "form_template",
          category: "default_intake",
          status: "Published",
          author: "system",
          contentBody: {
            title: "General Medical Consultation",
            description: "Please provide your medical information for consultation",
            pages: [
              {
                id: "basic_info",
                title: "Basic Information",
                elements: [
                  { id: "age", type: "number", label: "Age", required: true, placeholder: "Enter your age" },
                  { id: "gender", type: "select", label: "Gender", required: true,
                    options: [
                      { id: "male", value: "male", label: "Male" },
                      { id: "female", value: "female", label: "Female" },
                      { id: "other", value: "other", label: "Other" }
                    ]
                  }
                ]
              },
              {
                id: "medical_info",
                title: "Medical Information",
                elements: [
                  { id: "chief_complaint", type: "textarea", label: "Chief Complaint", required: true,
                    placeholder: "Please describe your main concern or reason for consultation" },
                  { id: "medications", type: "textarea", label: "Current Medications", required: false,
                    placeholder: "List all current medications and supplements" },
                  { id: "allergies", type: "textarea", label: "Known Allergies", required: false,
                    placeholder: "List any known drug, food, or environmental allergies" },
                  { id: "medical_history", type: "textarea", label: "Relevant Medical History", required: false,
                    placeholder: "Any relevant medical conditions, surgeries, or treatments" }
                ]
              }
            ]
          }
        }
      ];

      for (const template of templateData) {
        await addDoc(collection(db, "resources"), {
          ...template,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      
      toast({
        title: "Templates Created Successfully",
        description: `${templateData.length} default form templates have been created.`
      });
      
      // Refresh the check
      await checkExistingTemplates();
    } catch (error) {
      console.error('Error creating templates:', error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not create default templates."
      });
    } finally {
      setIsCreating(false);
    }
  };

  React.useEffect(() => {
    checkExistingTemplates();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Dynamic Form Templates Setup
        </CardTitle>
        <CardDescription>
          Initialize default form templates for specialty consultations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultTemplates.map((template) => {
            const exists = existingTemplates.includes(template.category);
            return (
              <div key={template.category} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{template.title}</h4>
                  <p className="text-xs text-muted-foreground">{template.fields} form fields</p>
                </div>
                <div className="flex items-center gap-2">
                  {exists ? (
                    <Badge variant="secondary" className="text-green-700 bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exists
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Missing
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {existingTemplates.length} of {defaultTemplates.length} templates available
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkExistingTemplates}
              disabled={isChecking}
            >
              {isChecking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh
            </Button>
            <Button 
              onClick={createDefaultTemplates}
              disabled={isCreating}
              size="sm"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Templates
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Dynamic Form Integration Complete</p>
              <p>Form templates will be automatically selected based on product/category during patient intake. The enhanced intake system now supports:</p>
              <ul className="mt-1 space-y-0.5 ml-2">
                <li>• Multi-page forms with progress tracking</li>
                <li>• Specialty-specific intake forms</li>
                <li>• Structured data processing for AI review</li>
                <li>• Form validation and error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};