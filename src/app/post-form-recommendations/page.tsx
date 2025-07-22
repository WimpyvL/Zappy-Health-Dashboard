"use client";

import React, { useState } from 'react';
import { PostFormRecommendationFlow } from '@/components/intake/PostFormRecommendationFlow';
import { DynamicFormRenderer } from '@/components/ui/dynamic-form-renderer';
import { FormRecommendation } from '@/services/formRecommendationService';

// Sample form data that would come from your intake form
const sampleFormData = {
  firstName: "John",
  lastName: "Smith",
  age: 35,
  email: "john.smith@example.com",
  weight: 180,
  heightFeet: 5,
  heightInches: 8,
  goals: ["weight_loss", "energy_boost"],
  conditions: ["anxiety"],
  medications: "None currently",
  primaryGoal: "weight-loss",
  duration: "moderate",
  consultationFrequency: "weekly"
};

const healthIntakeSchema = {
  title: "Health Assessment",
  description: "Complete this assessment to receive personalized recommendations",
  pages: [
    {
      id: "basic-info",
      title: "Basic Information",
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
      id: "health-goals",
      title: "Health Goals & Information",
      elements: [
        {
          id: "primaryGoal",
          type: "select",
          label: "What is your primary health goal?",
          required: true,
          placeholder: "Select your goal...",
          options: [
            { id: "weight-loss", value: "weight-loss", label: "Weight Management" },
            { id: "hair-loss", value: "hair-loss", label: "Hair Loss Treatment" },
            { id: "ed", value: "ed", label: "Erectile Dysfunction" },
            { id: "anxiety", value: "anxiety", label: "Anxiety Management" }
          ]
        },
        {
          id: "duration",
          type: "select",
          label: "How long have you been experiencing this concern?",
          required: true,
          placeholder: "Select duration...",
          options: [
            { id: "recent", value: "recent", label: "Less than 3 months" },
            { id: "moderate", value: "moderate", label: "3-12 months" },
            { id: "long", value: "long", label: "More than 1 year" }
          ]
        },
        {
          id: "weight",
          type: "number",
          label: "Weight (lbs)",
          placeholder: "Enter your weight"
        },
        {
          id: "heightFeet",
          type: "number",
          label: "Height (feet)",
          placeholder: "5"
        },
        {
          id: "heightInches",
          type: "number",
          label: "Height (inches)",
          placeholder: "8"
        }
      ]
    }
  ]
};

export default function PostFormRecommendationsDemo() {
  const [currentView, setCurrentView] = useState<'form' | 'recommendations'>('form');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedRecommendations, setSelectedRecommendations] = useState<FormRecommendation[]>([]);

  const handleFormSubmit = async (data: Record<string, any>) => {
    console.log('Form submitted:', data);
    setFormData(data);
    setCurrentView('recommendations');
  };

  const handleRecommendationsContinue = (recommendations: FormRecommendation[]) => {
    setSelectedRecommendations(recommendations);
    console.log('Selected recommendations:', recommendations);
    
    // Here you would integrate with your existing intakeToConsultationService
    // intakeToConsultationService.processRecommendations(formData, recommendations);
    
    alert(`Selected ${recommendations.length} recommendations! This would now integrate with your existing checkout flow.`);
  };

  const handleBackToForm = () => {
    setCurrentView('form');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post-Form Recommendation Flow Demo
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This demonstrates the Eden-style intake flow: Form → Plan Selection → Review Treatment → Confirmation → Checkout
          </p>
        </div>

        {/* Demo Controls */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>Demo Mode:</strong> Currently showing {currentView === 'form' ? 'intake form' : 'recommendation flow'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('form')}
                  className={`px-3 py-1 text-xs rounded ${
                    currentView === 'form' 
                      ? 'bg-yellow-200 text-yellow-800' 
                      : 'bg-white text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Show Form
                </button>
                <button
                  onClick={() => setCurrentView('recommendations')}
                  className={`px-3 py-1 text-xs rounded ${
                    currentView === 'recommendations' 
                      ? 'bg-yellow-200 text-yellow-800' 
                      : 'bg-white text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Show Recommendations
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {currentView === 'form' ? (
          <div className="max-w-3xl mx-auto">
            <DynamicFormRenderer
              schema={healthIntakeSchema}
              onSubmit={handleFormSubmit}
              submitButtonText="Complete Assessment"
            />
          </div>
        ) : (
          <PostFormRecommendationFlow
            formData={Object.keys(formData).length > 0 ? formData : sampleFormData}
            onBack={handleBackToForm}
            onContinue={handleRecommendationsContinue}
          />
        )}

        {/* Integration Notes */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-3">🔗 Integration with Your Existing Flow</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>Step 1:</strong> Replace your current form completion handler with PostFormRecommendationFlow</p>
              <p><strong>Step 2:</strong> The flow integrates with your existing intakeToConsultationService</p>
              <p><strong>Step 3:</strong> Selected recommendations flow into your checkout/payment system</p>
              <p><strong>Step 4:</strong> Provider review happens as normal with recommended plans pre-selected</p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">⚙️ Technical Implementation</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Component:</strong> <code>PostFormRecommendationFlow</code> - Drop-in replacement for post-form flow</p>
              <p><strong>Service:</strong> <code>mockRecommendationService</code> - Replace with real AI service</p>
              <p><strong>Integration:</strong> Callbacks for plan selection, back navigation, and checkout continuation</p>
              <p><strong>Styling:</strong> Matches your existing Eden-style design system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
