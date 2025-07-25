/**
 * @fileoverview Script to create default form templates for different medical specialties
 * Run this to populate the database with comprehensive intake forms
 */

import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Type definitions for form elements and templates
interface FormOption {
  id: string;
  value: string;
  label: string;
}

interface FormElement {
  id: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: FormOption[];
}

interface FormPage {
  id: string;
  title: string;
  elements: FormElement[];
}

interface FormContentBody {
  title: string;
  description: string;
  pages: FormPage[];
}

interface FormTemplate {
  title: string;
  description: string;
  contentType: 'form_template';
  category: string;
  categoryId: string;
  status: 'Published' | 'Draft' | 'Archived';
  author: string;
  contentBody: FormContentBody;
}

interface CreateTemplateResult {
  success: boolean;
  error?: any;
  createdCount?: number;
}

// Default form templates with comprehensive medical intake forms
const defaultTemplates: FormTemplate[] = [
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
            { 
              id: "demo_age", 
              type: "number", 
              label: "Age", 
              required: true, 
              placeholder: "Enter your age" 
            },
            { 
              id: "demo_height_feet", 
              type: "number", 
              label: "Height (feet)", 
              required: true, 
              placeholder: "5" 
            },
            { 
              id: "demo_height_inches", 
              type: "number", 
              label: "Height (inches)", 
              required: true, 
              placeholder: "8" 
            },
            { 
              id: "demo_current_weight", 
              type: "number", 
              label: "Current Weight (lbs)", 
              required: true 
            },
            { 
              id: "demo_goal_weight", 
              type: "number", 
              label: "Goal Weight (lbs)", 
              required: false 
            },
            { 
              id: "demo_gender", 
              type: "select", 
              label: "Gender", 
              required: true,
              options: [
                { id: "male", value: "male", label: "Male" },
                { id: "female", value: "female", label: "Female" },
                { id: "other", value: "other", label: "Other" },
                { id: "prefer_not_to_say", value: "prefer_not_to_say", label: "Prefer not to say" }
              ]
            }
          ]
        },
        {
          id: "medical_history",
          title: "Medical History",
          elements: [
            { 
              id: "medical_diabetes", 
              type: "radio", 
              label: "Do you have diabetes or pre-diabetes?", 
              required: true,
              options: [
                { id: "diabetes_type1", value: "type1", label: "Type 1 Diabetes" },
                { id: "diabetes_type2", value: "type2", label: "Type 2 Diabetes" },
                { id: "diabetes_pre", value: "prediabetes", label: "Pre-diabetes" },
                { id: "diabetes_no", value: "no", label: "No" }
              ]
            },
            { 
              id: "medical_thyroid", 
              type: "radio", 
              label: "Do you have any thyroid conditions?", 
              required: true,
              options: [
                { id: "thyroid_hyper", value: "hyperthyroid", label: "Hyperthyroidism" },
                { id: "thyroid_hypo", value: "hypothyroid", label: "Hypothyroidism" },
                { id: "thyroid_no", value: "no", label: "No" }
              ]
            },
            { 
              id: "medical_heart", 
              type: "radio", 
              label: "Do you have any heart conditions?", 
              required: true,
              options: [
                { id: "heart_yes", value: "yes", label: "Yes" },
                { id: "heart_no", value: "no", label: "No" }
              ]
            },
            { 
              id: "medical_eating_disorders", 
              type: "radio", 
              label: "Have you ever been diagnosed with an eating disorder?", 
              required: true,
              options: [
                { id: "eating_yes", value: "yes", label: "Yes" },
                { id: "eating_no", value: "no", label: "No" }
              ]
            },
            { 
              id: "medical_medications", 
              type: "textarea", 
              label: "Current Medications", 
              required: false, 
              placeholder: "List all current medications, including dosages" 
            },
            { 
              id: "medical_allergies", 
              type: "textarea", 
              label: "Known Allergies", 
              required: false,
              placeholder: "List any known drug, food, or environmental allergies" 
            }
          ]
        },
        {
          id: "weight_history",
          title: "Weight History & Goals",
          elements: [
            { 
              id: "weight_highest", 
              type: "number", 
              label: "Highest Adult Weight (lbs)", 
              required: false 
            },
            { 
              id: "weight_lowest", 
              type: "number", 
              label: "Lowest Adult Weight (lbs)", 
              required: false 
            },
            { 
              id: "weight_attempts", 
              type: "textarea", 
              label: "Previous Weight Loss Attempts", 
              required: false,
              placeholder: "Describe any diets, programs, or methods you've tried" 
            },
            { 
              id: "weight_timeline", 
              type: "select", 
              label: "When would you like to reach your goal weight?", 
              required: true,
              options: [
                { id: "3months", value: "3_months", label: "3 months" },
                { id: "6months", value: "6_months", label: "6 months" },
                { id: "1year", value: "1_year", label: "1 year" },
                { id: "longer", value: "longer", label: "More than 1 year" }
              ]
            },
            { 
              id: "weight_motivation", 
              type: "textarea", 
              label: "What motivates you to lose weight?", 
              required: true,
              placeholder: "Health reasons, confidence, specific events, etc." 
            }
          ]
        }
      ]
    }
  },
  {
    title: "Sexual Health Consultation Form",
    description: "Confidential assessment for sexual health concerns",
    contentType: "form_template", 
    category: "sexual_health",
    categoryId: "sexual_health",
    status: "Published",
    author: "system",
    contentBody: {
      title: "Sexual Health Consultation",
      description: "This information is strictly confidential and will help us provide the best care",
      pages: [
        {
          id: "demographics",
          title: "Basic Information",
          elements: [
            { 
              id: "demo_age", 
              type: "number", 
              label: "Age", 
              required: true 
            },
            { 
              id: "demo_gender", 
              type: "select", 
              label: "Gender Identity", 
              required: true,
              options: [
                { id: "male", value: "male", label: "Male" },
                { id: "female", value: "female", label: "Female" },
                { id: "non_binary", value: "non_binary", label: "Non-binary" },
                { id: "other", value: "other", label: "Other" }
              ]
            },
            { 
              id: "demo_relationship", 
              type: "select", 
              label: "Relationship Status", 
              required: true,
              options: [
                { id: "single", value: "single", label: "Single" },
                { id: "partnered", value: "partnered", label: "In a relationship" },
                { id: "married", value: "married", label: "Married" },
                { id: "divorced", value: "divorced", label: "Divorced" },
                { id: "widowed", value: "widowed", label: "Widowed" }
              ]
            }
          ]
        },
        {
          id: "symptoms",
          title: "Symptoms & Concerns",
          elements: [
            { 
              id: "symptom_primary", 
              type: "textarea", 
              label: "Primary Concern", 
              required: true,
              placeholder: "Please describe your main concern in detail" 
            },
            { 
              id: "symptom_duration", 
              type: "select", 
              label: "How long have you experienced this concern?", 
              required: true,
              options: [
                { id: "recent", value: "less_1_month", label: "Less than 1 month" },
                { id: "moderate", value: "1_6_months", label: "1-6 months" },
                { id: "chronic", value: "6_months_plus", label: "More than 6 months" },
                { id: "years", value: "years", label: "Several years" }
              ]
            },
            { 
              id: "symptom_severity", 
              type: "radio", 
              label: "How would you rate the severity of your concern?", 
              required: true,
              options: [
                { id: "mild", value: "mild", label: "Mild" },
                { id: "moderate", value: "moderate", label: "Moderate" },
                { id: "severe", value: "severe", label: "Severe" }
              ]
            }
          ]
        },
        {
          id: "medical_history",
          title: "Medical History",
          elements: [
            { 
              id: "medical_conditions", 
              type: "checkbox", 
              label: "Do you have any of these conditions?", 
              required: false,
              options: [
                { id: "diabetes", value: "diabetes", label: "Diabetes" },
                { id: "heart_disease", value: "heart_disease", label: "Heart disease" },
                { id: "high_blood_pressure", value: "high_bp", label: "High blood pressure" },
                { id: "depression", value: "depression", label: "Depression/Anxiety" },
                { id: "none", value: "none", label: "None of the above" }
              ]
            },
            { 
              id: "medical_medications", 
              type: "textarea", 
              label: "Current Medications", 
              required: false,
              placeholder: "List all medications, including over-the-counter and supplements" 
            },
            { 
              id: "medical_allergies", 
              type: "textarea", 
              label: "Drug Allergies", 
              required: false,
              placeholder: "List any known drug allergies and reactions" 
            }
          ]
        }
      ]
    }
  },
  {
    title: "Hair Loss Treatment Assessment",
    description: "Comprehensive evaluation for hair loss treatment options",
    contentType: "form_template",
    category: "hair_loss",
    categoryId: "hair_loss", 
    status: "Published",
    author: "system",
    contentBody: {
      title: "Hair Loss Treatment Assessment",
      description: "Help us understand your hair loss pattern and treatment goals",
      pages: [
        {
          id: "demographics",
          title: "Personal Information",
          elements: [
            { 
              id: "demo_age", 
              type: "number", 
              label: "Age", 
              required: true 
            },
            { 
              id: "demo_gender", 
              type: "select", 
              label: "Gender", 
              required: true,
              options: [
                { id: "male", value: "male", label: "Male" },
                { id: "female", value: "female", label: "Female" },
                { id: "other", value: "other", label: "Other" }
              ]
            }
          ]
        },
        {
          id: "hair_loss_pattern",
          title: "Hair Loss Assessment",
          elements: [
            { 
              id: "hair_loss_age", 
              type: "number", 
              label: "At what age did you first notice hair loss?", 
              required: true 
            },
            { 
              id: "hair_loss_pattern", 
              type: "radio", 
              label: "Where is your hair loss most noticeable?", 
              required: true,
              options: [
                { id: "crown", value: "crown", label: "Crown/top of head" },
                { id: "temples", value: "temples", label: "Temples/receding hairline" },
                { id: "overall", value: "overall_thinning", label: "Overall thinning" },
                { id: "patches", value: "patches", label: "Patches/spots" }
              ]
            },
            { 
              id: "hair_loss_rate", 
              type: "radio", 
              label: "How would you describe the rate of your hair loss?", 
              required: true,
              options: [
                { id: "slow", value: "slow", label: "Slow and gradual" },
                { id: "moderate", value: "moderate", label: "Moderate" },
                { id: "rapid", value: "rapid", label: "Rapid" }
              ]
            },
            { 
              id: "family_history", 
              type: "radio", 
              label: "Do you have a family history of hair loss?", 
              required: true,
              options: [
                { id: "yes_father", value: "father", label: "Yes, on father's side" },
                { id: "yes_mother", value: "mother", label: "Yes, on mother's side" },
                { id: "yes_both", value: "both_sides", label: "Yes, on both sides" },
                { id: "no", value: "no", label: "No" },
                { id: "unknown", value: "unknown", label: "Unknown" }
              ]
            }
          ]
        },
        {
          id: "treatment_history",
          title: "Treatment History & Goals",
          elements: [
            { 
              id: "previous_treatments", 
              type: "checkbox", 
              label: "Have you tried any of these treatments?", 
              required: false,
              options: [
                { id: "minoxidil", value: "minoxidil", label: "Minoxidil (Rogaine)" },
                { id: "finasteride", value: "finasteride", label: "Finasteride (Propecia)" },
                { id: "supplements", value: "supplements", label: "Hair growth supplements" },
                { id: "transplant", value: "hair_transplant", label: "Hair transplant" },
                { id: "none", value: "none", label: "None" }
              ]
            },
            { 
              id: "treatment_goals", 
              type: "textarea", 
              label: "What are your hair loss treatment goals?", 
              required: true,
              placeholder: "e.g., Stop further loss, regrow hair, improve confidence" 
            },
            { 
              id: "medical_conditions", 
              type: "textarea", 
              label: "Relevant Medical Conditions", 
              required: false,
              placeholder: "Any conditions that might affect hair growth or treatment options" 
            },
            { 
              id: "current_medications", 
              type: "textarea", 
              label: "Current Medications", 
              required: false,
              placeholder: "List all current medications and supplements" 
            }
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
    categoryId: "default_intake",
    status: "Published", 
    author: "system",
    contentBody: {
      title: "General Medical Consultation",
      description: "Please provide your medical information for consultation",
      pages: [
        {
          id: "demographics",
          title: "Personal Information",
          elements: [
            { 
              id: "demo_age", 
              type: "number", 
              label: "Age", 
              required: true 
            },
            { 
              id: "demo_gender", 
              type: "select", 
              label: "Gender", 
              required: true,
              options: [
                { id: "male", value: "male", label: "Male" },
                { id: "female", value: "female", label: "Female" },
                { id: "other", value: "other", label: "Other" },
                { id: "prefer_not_to_say", value: "prefer_not_to_say", label: "Prefer not to say" }
              ]
            }
          ]
        },
        {
          id: "medical_info",
          title: "Medical Information",
          elements: [
            { 
              id: "chief_complaint", 
              type: "textarea", 
              label: "Chief Complaint", 
              required: true,
              placeholder: "Please describe your main concern or reason for consultation" 
            },
            { 
              id: "symptoms", 
              type: "textarea", 
              label: "Symptoms", 
              required: false,
              placeholder: "Describe any symptoms you're experiencing" 
            },
            { 
              id: "medical_history", 
              type: "textarea", 
              label: "Relevant Medical History", 
              required: false,
              placeholder: "Any relevant medical conditions, surgeries, or treatments" 
            },
            { 
              id: "current_medications", 
              type: "textarea", 
              label: "Current Medications", 
              required: false,
              placeholder: "List all current medications, supplements, and dosages" 
            },
            { 
              id: "allergies", 
              type: "textarea", 
              label: "Known Allergies", 
              required: false,
              placeholder: "List any known allergies (medications, food, environmental)" 
            }
          ]
        }
      ]
    }
  }
];

/**
 * Creates default form templates in the database
 * @returns Promise with success status and optional error information
 */
export const createDefaultFormTemplates = async (): Promise<CreateTemplateResult> => {
  try {
    console.log('🚀 Creating default form templates...');
    
    // Check if database is initialized
    if (!db) {
      throw new Error('Firebase database not initialized');
    }
    
    let createdCount = 0;
    
    for (const template of defaultTemplates) {
      try {
        const docRef = await addDoc(collection(db, "resources"), {
          ...template,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        console.log(`✅ Created template: ${template.title} with ID: ${docRef.id}`);
        createdCount++;
      } catch (templateError) {
        console.error(`❌ Error creating template "${template.title}":`, templateError);
        // Continue with other templates even if one fails
      }
    }
    
    console.log(`🎉 Successfully created ${createdCount}/${defaultTemplates.length} form templates!`);
    
    return { 
      success: createdCount > 0, 
      createdCount 
    };
  } catch (error) {
    console.error('❌ Error creating default templates:', error);
    return { 
      success: false, 
      error,
      createdCount: 0
    };
  }
};

/**
 * Validates a form template structure
 * @param template - The template to validate
 * @returns boolean indicating if the template is valid
 */
export const validateFormTemplate = (template: FormTemplate): boolean => {
  try {
    // Check required fields
    if (!template.title || !template.description || !template.contentBody) {
      return false;
    }
    
    // Check content body structure
    const { contentBody } = template;
    if (!contentBody.title || !contentBody.pages || !Array.isArray(contentBody.pages)) {
      return false;
    }
    
    // Check each page
    for (const page of contentBody.pages) {
      if (!page.id || !page.title || !page.elements || !Array.isArray(page.elements)) {
        return false;
      }
      
      // Check each element
      for (const element of page.elements) {
        if (!element.id || !element.type || !element.label) {
          return false;
        }
        
        // Check options for select/radio/checkbox elements
        if (['select', 'radio', 'checkbox'].includes(element.type)) {
          if (!element.options || !Array.isArray(element.options) || element.options.length === 0) {
            return false;
          }
          
          // Check each option
          for (const option of element.options) {
            if (!option.id || !option.value || !option.label) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating template:', error);
    return false;
  }
};

/**
 * Gets the count of templates by category
 * @returns Object with category counts
 */
export const getTemplateCategoryCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  for (const template of defaultTemplates) {
    const category = template.category;
    counts[category] = (counts[category] || 0) + 1;
  }
  
  return counts;
};

// Export types for use in other parts of the application
export type {
  FormOption,
  FormElement,
  FormPage,
  FormContentBody,
  FormTemplate,
  CreateTemplateResult,
};

// If running this script directly (Node.js environment)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Check if this is the main module being executed
  const isMainModule = process.argv[1] && process.argv[1].includes('createDefaultFormTemplates');
  
  if (isMainModule) {
    createDefaultFormTemplates().then((result) => {
      if (result.success) {
        console.log(`✅ Script completed successfully! Created ${result.createdCount} templates.`);
        process.exit(0);
      } else {
        console.error('❌ Script failed:', result.error);
        process.exit(1);
      }
    }).catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
  }
}
