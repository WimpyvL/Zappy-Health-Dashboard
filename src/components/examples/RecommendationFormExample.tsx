"use client";

import React, { useState } from 'react';
import { EnhancedFormRenderer } from '@/components/ui/enhanced-form-renderer';
import { FormRecommendation } from '@/services/formRecommendationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

const healthIntakeSchema = {
  title: "Health Assessment & Recommendations",
  description: "Complete this assessment to receive personalized health recommendations",
  pages: [
    {
      id: "basic-info",
      title: "Basic Information",
      showRecommendations: false, // Don't show recommendations on first page
      elements: [
        {
          id: "firstName",
          type: "text",
          label: "First Name",
          required: true,
          placeholder: "Enter your first name"
        },
        {
          id: "lastName",
          type: "text",
          label: "Last Name",
          required: true,
          placeholder: "Enter your last name"
        },
        {
          id: "age",
          type: "number",
          label: "Age",
          required: true,
          placeholder: "Enter your age"
        },
        {
          id: "email",
          type: "email",
          label: "Email Address",
          required: true,
          placeholder: "Enter your email"
        }
      ]
    },
    {
      id: "health-metrics",
      title: "Health Metrics",
      showRecommendations: true,
      recommendationConfig: {
        triggers: [
          {
            field: "weight",
            operator: "greater_than" as const,
            value: 0
          }
        ],
        logic: "or" as const,
        maxRecommendations: 2,
        categories: ["treatment", "lifestyle"]
      },
      elements: [
        {
          id: "weight",
          type: "number",
          label: "Weight (lbs)",
          required: true,
          placeholder: "Enter your weight"
        },
        {
          id: "heightFeet",
          type: "number",
          label: "Height (feet)",
          required: true,
          placeholder: "5"
        },
        {
          id: "heightInches",
          type: "number",
          label: "Height (inches)",
          required: true,
          placeholder: "8"
        }
      ]
    },
    {
      id: "health-goals",
      title: "Health Goals & Conditions",
      showRecommendations: true,
      recommendationConfig: {
        maxRecommendations: 3,
        categories: ["treatment", "subscription", "supplement"]
      },
      elements: [
        {
          id: "goals",
          type: "checkbox",
          label: "Health Goals (select all that apply)",
          required: true,
          options: [
            { id: "weight-loss", value: "weight_loss", label: "Weight Loss" },
            { id: "muscle-gain", value: "muscle_gain", label: "Muscle Gain" },
            { id: "energy-boost", value: "energy_boost", label: "Increase Energy" },
            { id: "better-sleep", value: "better_sleep", label: "Better Sleep" },
            { id: "stress-management", value: "stress_management", label: "Stress Management" }
          ]
        },
        {
          id: "conditions",
          type: "checkbox",
          label: "Medical Conditions (select all that apply)",
          options: [
            { id: "diabetes", value: "diabetes", label: "Diabetes" },
            { id: "hypertension", value: "hypertension", label: "High Blood Pressure" },
            { id: "anxiety", value: "anxiety", label: "Anxiety" },
            { id: "depression", value: "depression", label: "Depression" },
            { id: "arthritis", value: "arthritis", label: "Arthritis" }
          ]
        },
        {
          id: "medications",
          type: "textarea",
          label: "Current Medications",
          placeholder: "List any medications you're currently taking..."
        }
      ]
    },
    {
      id: "preferences",
      title: "Treatment Preferences",
      showRecommendations: true,
      recommendationConfig: {
        maxRecommendations: 2,
        categories: ["subscription"]
      },
      elements: [
        {
          id: "consultationFrequency",
          type: "radio",
          label: "Preferred Consultation Frequency",
          required: true,
          options: [
            { id: "weekly", value: "weekly", label: "Weekly" },
            { id: "bi-weekly", value: "bi-weekly", label: "Bi-weekly" },
            { id: "monthly", value: "monthly", label: "Monthly" },
            { id: "as-needed", value: "as-needed", label: "As needed" }
          ]
        },
        {
          id: "urgency",
          type: "radio",
          label: "How urgent is your health concern?",
          required: true,
          options: [
            { id: "immediate", value: "immediate", label: "Immediate attention needed" },
            { id: "within-week", value: "within-week", label: "Within a week" },
            { id: "within-month", value: "within-month", label: "Within a month" },
            { id: "routine", value: "routine", label: "Routine/preventive care" }
          ]
        }
      ]
    }
  ],
  globalRecommendationConfig: {
    maxRecommendations: 3,
    categories: ["treatment", "subscription", "supplement", "lifestyle"]
  }
};

export const RecommendationFormExample: React.FC = () => {
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<FormRecommendation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSubmittedData(data);
    setIsSubmitting(false);
  };

  const handleRecommendationSelect = (recommendation: FormRecommendation) => {
    setSelectedRecommendations(prev => {
      const exists = prev.find(r => r.id === recommendation.id);
      if (exists) {
        return prev; // Already selected
      }
      return [...prev, recommendation];
    });
  };

  const handleRecommendationDismiss = (recommendationId: string) => {
    console.log('Dismissed recommendation:', recommendationId);
  };

  if (submittedData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Assessment Complete!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Your Information:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {submittedData.firstName} {submittedData.lastName}</div>
                <div><strong>Age:</strong> {submittedData.age}</div>
                <div><strong>Weight:</strong> {submittedData.weight} lbs</div>
                <div><strong>Height:</strong> {submittedData.heightFeet}'{submittedData.heightInches}"</div>
                <div><strong>Goals:</strong> {Array.isArray(submittedData.goals) ? submittedData.goals.join(', ') : 'None'}</div>
                <div><strong>Consultation Frequency:</strong> {submittedData.consultationFrequency}</div>
              </div>
            </div>
            
            {selectedRecommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Selected Recommendations:</h3>
                <div className="space-y-2">
                  {selectedRecommendations.map(rec => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        {rec.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <button 
                onClick={() => {
                  setSubmittedData(null);
                  setSelectedRecommendations([]);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start New Assessment
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Form-Integrated Recommendations Demo</h1>
        <p className="text-muted-foreground">
          Fill out the form and see personalized recommendations appear in real-time based on your responses.
        </p>
      </div>
      
      <EnhancedFormRenderer
        schema={healthIntakeSchema}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Complete Assessment"
        showRecommendations={true}
        onRecommendationSelect={handleRecommendationSelect}
        onRecommendationDismiss={handleRecommendationDismiss}
      />
      
      {selectedRecommendations.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Selected Recommendations ({selectedRecommendations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedRecommendations.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="font-medium">{rec.title}</span>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RecommendationFormExample;
