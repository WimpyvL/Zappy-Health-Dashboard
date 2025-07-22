/**
 * @fileoverview Service for processing and structuring dynamic form data.
 */
import { FormSchema, FormPage, FormElement } from '@/types/formTypes';

class DynamicFormService {
  /**
   * Processes raw form submission data into a structured format.
   * This is designed to be backward-compatible with the previous repository's
   * nested JSONB structure (e.g., basicInfo, healthHistory).
   */
  processFormSubmission(
    schema: Partial<FormSchema>, // Schema is used for context, not strictly required for this mapping
    formData: Record<string, any>
  ): Record<string, any> {
    const processedData: Record<string, any> = {
      basicInfo: {},
      healthHistory: {},
      treatmentPreferences: {},
    };

    // Map specific fields to their legacy nested objects
    const fieldMapping: Record<string, string> = {
      // Basic Info
      age: 'basicInfo',
      height: 'basicInfo',
      heightFeet: 'basicInfo',
      heightInches: 'basicInfo',
      weight: 'basicInfo',
      current_weight: 'basicInfo',
      goal_weight: 'basicInfo',
      gender: 'basicInfo',

      // Health History
      conditions: 'healthHistory',
      medications: 'healthHistory',
      allergies: 'healthHistory',
      condition_diabetes: 'healthHistory',
      chief_complaint: 'healthHistory',

      // Treatment Preferences
      goals: 'treatmentPreferences',
      duration: 'treatmentPreferences',
      consultationFrequency: 'treatmentPreferences',
    };

    for (const key in formData) {
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        const targetObjectKey = fieldMapping[key];
        if (targetObjectKey && processedData[targetObjectKey]) {
          (processedData[targetObjectKey] as Record<string, any>)[key] = formData[key];
        } else {
          // Place unmapped fields at the root for backward compatibility
          processedData[key] = formData[key];
        }
      }
    }

    return processedData;
  }

  /**
   * Retrieves the appropriate form template for a given product or category.
   * Fallbacks to a default intake form if no specific template is found.
   * @param {string | null} productId
   * @param {string | null} categoryId
   * @returns {Promise<{success: boolean, formSchema: any | null, error?: string}>}
   */
  async getFormTemplateForProduct(productId: string | null, categoryId: string | null): Promise<{success: boolean, formSchema: any | null, error?: string}> {
    // In a real application, this would query the 'resources' collection
    // where contentType is 'form_template'.
    // For now, this is a placeholder.
    console.log(`Searching for form template with productId: ${productId}, categoryId: ${categoryId}`);
    
    // This logic should be replaced with actual Firestore queries.
    const mockWeightManagementForm = {
        title: "Weight Management Intake Form",
        description: "Comprehensive assessment for weight management consultation",
        pages: [{ id: 'demographics', title: 'Personal Information', elements: [{ id: 'age', type: 'number', label: 'Age', required: true }] }]
    };

    const mockDefaultForm = {
        title: "General Medical Consultation",
        description: "Standard intake form for general medical consultations",
        pages: [{ id: 'basic_info', title: 'Basic Information', elements: [{ id: 'chief_complaint', type: 'textarea', label: 'Chief Complaint', required: true }] }]
    };

    if (categoryId === 'weight_management' || productId?.includes('weight')) {
      return { success: true, formSchema: mockWeightManagementForm };
    }

    // Default fallback
    return { success: true, formSchema: mockDefaultForm };
  }
}

export const dynamicFormService = new DynamicFormService();
