"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Play, CheckCircle, ArrowRight } from "lucide-react";
import { dynamicFormService } from '@/services/dynamicFormService';

const sampleFormSchema = {
  title: "Weight Management Consultation",
  pages: [
    {
      id: "demographics",
      title: "Personal Information",
      elements: [
        { id: "age", type: "number", label: "Age" },
        { id: "current_weight", type: "number", label: "Current Weight (lbs)" },
        { id: "goal_weight", type: "number", label: "Goal Weight (lbs)" },
        { id: "gender", type: "select", label: "Gender" }
      ]
    },
    {
      id: "medical",
      title: "Medical History", 
      elements: [
        { id: "chief_complaint", type: "textarea", label: "Chief Complaint" },
        { id: "medications", type: "textarea", label: "Current Medications" },
        { id: "allergies", type: "textarea", label: "Known Allergies" },
        { id: "condition_diabetes", type: "radio", label: "Do you have diabetes?" },
        { id: "goals", type: "textarea", label: "Weight Management Goals" }
      ]
    }
  ]
};

const sampleSubmissionData = {
  age: 35,
  current_weight: 180,
  goal_weight: 160,
  gender: "female",
  chief_complaint: "Interested in weight management options to improve health and confidence",
  medications: "Lisinopril 10mg daily, Vitamin D 2000IU",
  allergies: "Penicillin - rash",
  condition_diabetes: "none",
  goals: "Lose 20 pounds in 6 months for better energy and health"
};

export const JsonBFormDemo: React.FC = () => {
  const [isProcessed, setIsProcessed] = useState(false);
  const [processedData, setProcessedData] = useState<any>(null);

  const processFormData = () => {
    const result = dynamicFormService.processFormSubmission(sampleFormSchema, sampleSubmissionData);
    setProcessedData(result);
    setIsProcessed(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          JSONB Form Processing Demo
        </CardTitle>
        <CardDescription>
          See how form submissions are transformed to match the previous repository's JSONB structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Data */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">Input</Badge>
              Raw Form Submission Data
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 border">
              <pre className="text-xs text-slate-700 overflow-x-auto">
{JSON.stringify(sampleSubmissionData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Process Arrow */}
          <div className="lg:hidden flex justify-center">
            <Button 
              onClick={processFormData}
              disabled={isProcessed}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Process to JSONB Structure
            </Button>
          </div>
          
          <div className="hidden lg:flex flex-col items-center justify-center">
            <Button 
              onClick={processFormData}
              disabled={isProcessed}
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Process
            </Button>
            <ArrowRight className="h-6 w-6 text-muted-foreground mt-2" />
          </div>

          {/* Output Data */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Badge variant={isProcessed ? "default" : "secondary"}>Output</Badge>
              JSONB Structure (Previous Repo Style)
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 border min-h-[300px]">
              {isProcessed && processedData ? (
                <pre className="text-xs text-slate-700 overflow-x-auto">
{JSON.stringify(processedData, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Click "Process" to see JSONB output
                </div>
              )}
            </div>
          </div>
        </div>

        {isProcessed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800 mb-2">JSONB Processing Complete!</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>✅ Backward Compatibility:</strong> Data structure matches your previous repository</p>
                  <p><strong>✅ AI Integration Ready:</strong> Compatible with existing <code>aiRecommendationService.js</code></p>
                  <p><strong>✅ Dynamic Processing:</strong> Works with <code>intakeIntegrationService.js</code> patterns</p>
                  <p><strong>✅ Nested JSON Support:</strong> <code>basicInfo</code>, <code>healthHistory</code>, <code>treatmentPreferences</code></p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Key JSONB Features from Previous Repo:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <code>formData.basicInfo.age</code> - For BMI calculations and age-based logic</p>
            <p>• <code>formData.healthHistory.conditions</code> - Medical conditions array</p>
            <p>• <code>formData.treatmentPreferences.goals</code> - Treatment goals array</p>
            <p>• <code>formData.medications</code> - Root level for backward compatibility</p>
            <p>• <code>formData.chief_complaint</code> - Primary concern field</p>
            <p>• Dynamic field processing using <code>Object.keys(formData)</code> patterns</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};