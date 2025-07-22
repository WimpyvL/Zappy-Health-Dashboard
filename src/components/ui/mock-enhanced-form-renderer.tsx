"use client";

import React, { useState, useEffect } from 'react';
import { DynamicFormRenderer } from './dynamic-form-renderer';
import { MockRecommendationPanel } from '@/components/forms/MockRecommendationPanel';
import { FormRecommendation } from '@/services/formRecommendationService';

// Extended schema type for recommendations
interface ExtendedFormSchema {
  title: string;
  description?: string;
  pages: Array<{
    id: string;
    title: string;
    showRecommendations?: boolean;
    recommendationConfig?: any;
    elements: Array<{
      id: string;
      type: string;
      label: string;
      required?: boolean;
      placeholder?: string;
      options?: Array<{ id: string; value: string; label: string }>;
    }>;
  }>;
  globalRecommendationConfig?: any;
}

interface MockEnhancedFormRendererProps {
  schema: ExtendedFormSchema;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  showRecommendations?: boolean;
  onRecommendationSelect?: (recommendation: FormRecommendation) => void;
  onRecommendationDismiss?: (recommendationId: string) => void;
  className?: string;
}

export const MockEnhancedFormRenderer: React.FC<MockEnhancedFormRendererProps> = ({
  schema,
  onSubmit,
  isSubmitting = false,
  submitButtonText = "Submit",
  showRecommendations = true,
  onRecommendationSelect,
  onRecommendationDismiss,
  className = ""
}) => {
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentPage = schema.pages[currentPageIndex];
  const shouldShowRecommendations = showRecommendations && 
    currentPage?.showRecommendations && 
    Object.keys(currentFormData).length > 0;

  const handleFormDataChange = (data: Record<string, any>) => {
    setCurrentFormData(data);
  };

  const handlePageChange = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    const result = onSubmit(data);
    if (result instanceof Promise) {
      await result;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`grid gap-6 ${shouldShowRecommendations ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {/* Form Section */}
        <div className={shouldShowRecommendations ? 'lg:col-span-2' : 'lg:col-span-1'}>
          <DynamicFormRenderer
            schema={schema as any}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText={submitButtonText}
            onFormDataChange={handleFormDataChange}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Recommendations Section */}
        {shouldShowRecommendations && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <MockRecommendationPanel
                formData={currentFormData}
                config={currentPage.recommendationConfig || schema.globalRecommendationConfig}
                onRecommendationSelect={onRecommendationSelect}
                onRecommendationDismiss={onRecommendationDismiss}
                maxRecommendations={currentPage.recommendationConfig?.maxRecommendations || 3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockEnhancedFormRenderer;
