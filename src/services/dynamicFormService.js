/**
 * @fileoverview Service for dynamically selecting and managing intake forms
 * based on product selection and patient flow context.
 */
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

class DynamicFormService {
  constructor() {
    // Initialize the database reference when needed
  }

  getDatabase() {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  getResourcesCollection() {
    return collection(this.getDatabase(), 'resources');
  }

  /**
   * Get appropriate form template based on product and category
   * @param {string} productId - The selected product ID
   * @param {string} categoryId - The product category ID
   * @returns {Promise<{success: boolean, formSchema: object|null, error: Error|null}>}
   */
  async getFormTemplateForProduct(productId, categoryId) {
    try {
      const resourcesCollection = this.getResourcesCollection();
      
      // First, try to find product-specific form template
      let formQuery = query(
        resourcesCollection,
        where("contentType", "==", "form_template"),
        where("productId", "==", productId)
      );
      
      let querySnapshot = await getDocs(formQuery);
      
      // If no product-specific template, try category-specific
      if (querySnapshot.empty) {
        formQuery = query(
          resourcesCollection,
          where("contentType", "==", "form_template"),
          where("categoryId", "==", categoryId)
        );
        querySnapshot = await getDocs(formQuery);
      }
      
      // If no category-specific template, use default template
      if (querySnapshot.empty) {
        formQuery = query(
          resourcesCollection,
          where("contentType", "==", "form_template"),
          where("category", "==", "default_intake")
        );
        querySnapshot = await getDocs(formQuery);
      }
      
      // If still no template, return basic fallback
      if (querySnapshot.empty) {
        return {
          success: true,
          formSchema: this.getBasicFallbackForm(),
          error: null
        };
      }
      
      // Return the first matching template
      const templateDoc = querySnapshot.docs[0];
      const templateData = templateDoc.data();
      
      return {
        success: true,
        formSchema: templateData.contentBody || templateData.formSchema,
        templateId: templateDoc.id,
        error: null
      };
    } catch (error) {
      console.error('Error fetching form template:', error);
      return {
        success: false,
        formSchema: null,
        error
      };
    }
  }

  /**
   * Get form template by specific ID
   * @param {string} templateId - The template resource ID
   * @returns {Promise<{success: boolean, formSchema: object|null, error: Error|null}>}
   */
  async getFormTemplate(templateId) {
    try {
      const db = this.getDatabase();
      const templateRef = doc(db, 'resources', templateId);
      const templateSnap = await getDoc(templateRef);
      
      if (!templateSnap.exists()) {
        throw new Error('Form template not found');
      }
      
      const templateData = templateSnap.data();
      
      return {
        success: true,
        formSchema: templateData.contentBody || templateData.formSchema,
        error: null
      };
    } catch (error) {
      console.error('Error fetching specific form template:', error);
      return {
        success: false,
        formSchema: null,
        error
      };
    }
  }

  /**
   * Process dynamic form submission data using JSONB-style approach
   * This matches the previous repository's flexible JSON handling
   * @param {object} formSchema - The form schema used
   * @param {object} submissionData - Raw form submission data
   * @returns {object} JSONB-style processed form data matching previous repo structure
   */
  processFormSubmission(formSchema, submissionData) {
    // Create JSONB-style structure matching previous repo patterns
    const jsonbData = {
      // Basic info section (for BMI calculations, age, etc.)
      basicInfo: {},
      
      // Health history section (conditions, medications, allergies)
      healthHistory: {
        conditions: [],
        medicalConditions: [],
        medications: null,
        allergies: null
      },
      
      // Treatment preferences and goals
      treatmentPreferences: {
        goals: []
      },
      
      // Raw field data for dynamic processing (like previous repo)
      ...submissionData
    };

    // Process form data using JSONB-style field mapping
    formSchema.pages?.forEach(page => {
      page.elements?.forEach(element => {
        const value = submissionData[element.id];
        if (value !== undefined && value !== '') {
          
          // Map to basicInfo (demographics)
          if (element.id.includes('demo_') || element.id.includes('age') ||
              element.id.includes('height') || element.id.includes('weight')) {
            
            // Convert field names to match previous repo structure
            const fieldName = element.id.replace('demo_', '').replace('_', '');
            jsonbData.basicInfo[fieldName] = value;
            
            // Special handling for age
            if (element.id.includes('age')) {
              jsonbData.basicInfo.age = parseInt(value) || value;
            }
          }
          
          // Map to healthHistory
          else if (element.id.includes('medical_') || element.id.includes('history_') ||
                   element.id.includes('condition_') || element.id.includes('medication') ||
                   element.id.includes('allerg')) {
            
            if (element.id.includes('medication')) {
              jsonbData.healthHistory.medications = value;
              // Also set at root level for backward compatibility
              jsonbData.medications = value;
            }
            else if (element.id.includes('allerg')) {
              jsonbData.healthHistory.allergies = value;
              // Also set at root level for backward compatibility
              jsonbData.allergies = value;
            }
            else if (element.id.includes('condition')) {
              // Handle conditions as arrays for multiple selections
              if (Array.isArray(value)) {
                jsonbData.healthHistory.conditions.push(...value);
                jsonbData.healthHistory.medicalConditions.push(...value);
              } else {
                jsonbData.healthHistory.conditions.push(value);
                jsonbData.healthHistory.medicalConditions.push(value);
              }
            }
          }
          
          // Map to treatmentPreferences
          else if (element.id.includes('goal') || element.id.includes('preference') ||
                   element.id.includes('motivation')) {
            
            if (element.id.includes('goal') || element.id.includes('motivation')) {
              if (Array.isArray(value)) {
                jsonbData.treatmentPreferences.goals.push(...value);
              } else {
                jsonbData.treatmentPreferences.goals.push(value);
              }
              // Also set at root level
              jsonbData.goals = jsonbData.treatmentPreferences.goals;
            }
          }
          
          // Chief complaint (core field from previous repo)
          else if (element.id.includes('chief_complaint') || element.id.includes('primary_concern')) {
            jsonbData.chief_complaint = value;
          }
        }
      });
    });

    // Clean up empty arrays and null values to match previous repo structure
    if (jsonbData.healthHistory.conditions.length === 0) {
      delete jsonbData.healthHistory.conditions;
    }
    if (jsonbData.healthHistory.medicalConditions.length === 0) {
      delete jsonbData.healthHistory.medicalConditions;
    }
    if (jsonbData.treatmentPreferences.goals.length === 0) {
      delete jsonbData.treatmentPreferences.goals;
      delete jsonbData.goals;
    }

    return jsonbData;
  }

  /**
   * Fallback form schema for when no templates are found
   * @returns {object} Basic form schema
   */
  getBasicFallbackForm() {
    return {
      title: "Patient Intake Form",
      description: "Please provide your medical information for consultation.",
      pages: [
        {
          id: "page1",
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
              id: "allergies",
              type: "textarea",
              label: "Known Allergies",
              required: false,
              placeholder: "List any known allergies (medications, food, environmental)"
            },
            {
              id: "current_medications",
              type: "textarea", 
              label: "Current Medications",
              required: false,
              placeholder: "List all current medications, supplements, and dosages"
            },
            {
              id: "medical_history",
              type: "textarea",
              label: "Relevant Medical History",
              required: false,
              placeholder: "Any relevant medical conditions, surgeries, or treatments"
            }
          ]
        }
      ]
    };
  }

  /**
   * Create default specialty form templates
   * @returns {Array} Array of default form templates
   */
  getDefaultSpecialtyTemplates() {
    return [
      {
        category: "weight_management",
        title: "Weight Management Intake",
        description: "Comprehensive intake for weight management consultation",
        pages: [
          {
            id: "demographics",
            title: "Personal Information", 
            elements: [
              { id: "demo_age", type: "number", label: "Age", required: true },
              { id: "demo_height", type: "text", label: "Height", required: true, placeholder: "e.g., 5'8\"" },
              { id: "demo_weight", type: "number", label: "Current Weight (lbs)", required: true },
              { id: "demo_goal_weight", type: "number", label: "Goal Weight (lbs)", required: false }
            ]
          },
          {
            id: "medical_history",
            title: "Medical History",
            elements: [
              { id: "medical_diabetes", type: "radio", label: "Do you have diabetes?", required: true, 
                options: [
                  { id: "diabetes_yes", value: "yes", label: "Yes" },
                  { id: "diabetes_no", value: "no", label: "No" }
                ]
              },
              { id: "medical_thyroid", type: "radio", label: "Any thyroid conditions?", required: true,
                options: [
                  { id: "thyroid_yes", value: "yes", label: "Yes" },
                  { id: "thyroid_no", value: "no", label: "No" }
                ]
              },
              { id: "medical_eating_disorders", type: "radio", label: "History of eating disorders?", required: true,
                options: [
                  { id: "eating_yes", value: "yes", label: "Yes" },
                  { id: "eating_no", value: "no", label: "No" }
                ]
              }
            ]
          }
        ]
      },
      {
        category: "sexual_health", 
        title: "Sexual Health Consultation",
        description: "Confidential sexual health assessment",
        pages: [
          {
            id: "demographics",
            title: "Basic Information",
            elements: [
              { id: "demo_age", type: "number", label: "Age", required: true },
              { id: "demo_relationship_status", type: "select", label: "Relationship Status", required: true,
                options: [
                  { id: "single", value: "single", label: "Single" },
                  { id: "partnered", value: "partnered", label: "In a relationship" },
                  { id: "married", value: "married", label: "Married" }
                ]
              }
            ]
          },
          {
            id: "symptoms",
            title: "Symptoms & Concerns",
            elements: [
              { id: "symptom_primary_concern", type: "textarea", label: "Primary Concern", required: true,
                placeholder: "Please describe your main concern in detail" },
              { id: "symptom_duration", type: "select", label: "How long have you experienced this?", required: true,
                options: [
                  { id: "recent", value: "recent", label: "Less than 1 month" },
                  { id: "moderate", value: "moderate", label: "1-6 months" },
                  { id: "chronic", value: "chronic", label: "More than 6 months" }
                ]
              }
            ]
          }
        ]
      }
    ];
  }
}

export const dynamicFormService = new DynamicFormService();