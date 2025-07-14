# Notes Flow Implementation Roadmap

This document outlines the specific implementation steps to integrate our new notes flow system with the existing InitialConsultationNotes implementation.

## Phase 1: Data Model Implementation

### 1.1 Create Type Definitions (Week 1)

Create TypeScript interfaces in `src/types/notesFlow.ts`:

```typescript
// Base types
export interface BaseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Template section types
export interface TemplateSection {
  id: string;
  sectionType: 'patient_info' | 'assessment' | 'plan' | 'medications' | 'communication' | 'custom';
  title: string;
  content: string;
  placeholders: string[];
  visibilityRule: 'provider_only' | 'patient_only' | 'shared';
  order: number;
  isRequired: boolean;
  patientFilterRules?: any;
}

// Consultation template
export interface ConsultationTemplate extends BaseTemplate {
  type: 'consultation';
  encounterType: 'initial' | 'follow_up';
  sections: TemplateSection[];
  aiPrompts?: {
    [sectionType: string]: string;
  };
}

// Service template
export interface ServiceTemplate extends BaseTemplate {
  type: 'service';
  serviceId: string;
  defaultContent: string;
  dataReferences: string[];
}

// Processed template
export interface ProcessedTemplateSection extends TemplateSection {
  processedContent: string;
  originalContent: string;
  aiRecommendations?: any;
}

export interface ProcessedConsultationTemplate {
  templateId: string;
  patientId: string;
  consultationId: string;
  sections: ProcessedTemplateSection[];
  timestamp: string;
}

// AI recommendation types
export interface AIRecommendation {
  text: string;
  confidence: number;
  reasoning?: string;
  source?: string;
}

export interface AIRecommendationSection {
  sectionType: string;
  recommendations: AIRecommendation[];
  summary?: string;
}

export interface AIRecommendationPackage {
  consultationId: string;
  patientId: string;
  categoryId: string;
  formId?: string;
  timestamp: string;
  sections: AIRecommendationSection[];
}

// Patient view types
export interface PatientViewConfig {
  includeProviderInfo: boolean;
  includeMedications: boolean;
  includeDosageDetails: boolean;
  includeAssessment: boolean;
  includePlan: boolean;
  includeFollowUp: boolean;
  formatOptions: {
    useSimpleLanguage: boolean;
    includeSectionHeaders: boolean;
    includeTimestamps: boolean;
  };
}

export interface PatientView {
  consultationId: string;
  patientId: string;
  providerName: string;
  consultationDate: string;
  sections: {
    sectionType: string;
    title: string;
    content: string;
    isVisible: boolean;
  }[];
  generatedAt: string;
}
```

### 1.2 Create Database Migrations (Week 1)

Create migration files for the new tables:

```sql
-- note_templates table
CREATE TABLE IF NOT EXISTS note_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'service')),
  encounter_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- template_sections table
CREATE TABLE IF NOT EXISTS template_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES note_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  placeholders JSONB,
  visibility_rule TEXT NOT NULL DEFAULT 'shared',
  order_index INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  patient_filter_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- processed_templates table
CREATE TABLE IF NOT EXISTS processed_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES note_templates(id),
  patient_id UUID NOT NULL,
  consultation_id UUID NOT NULL,
  sections JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  category_id TEXT NOT NULL,
  form_id UUID,
  sections JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- patient_views table
CREATE TABLE IF NOT EXISTS patient_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  sections JSONB NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Phase 2: API Implementation

### 2.1 Create Template API (Week 2)

Create `src/apis/noteTemplates/api.js`:

```javascript
import { supabase } from '../../lib/supabase';

// Get all templates
export const getAllTemplates = async () => {
  const { data, error } = await supabase
    .from('note_templates')
    .select(`
      *,
      template_sections(*)
    `)
    .order('name');

  if (error) throw error;
  return data;
};

// Get template by ID
export const getTemplateById = async (id) => {
  const { data, error } = await supabase
    .from('note_templates')
    .select(`
      *,
      template_sections(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// Create template
export const createTemplate = async (template) => {
  // First create the template
  const { data: templateData, error: templateError } = await supabase
    .from('note_templates')
    .insert({
      name: template.name,
      description: template.description,
      category: template.category,
      type: template.type,
      encounter_type: template.encounterType,
      is_active: true
    })
    .select()
    .single();

  if (templateError) throw templateError;

  // Then create the sections
  if (template.sections && template.sections.length > 0) {
    const sectionsToInsert = template.sections.map((section, index) => ({
      template_id: templateData.id,
      section_type: section.sectionType,
      title: section.title,
      content: section.content,
      placeholders: section.placeholders || [],
      visibility_rule: section.visibilityRule || 'shared',
      order_index: section.order || index,
      is_required: section.isRequired !== undefined ? section.isRequired : true,
      patient_filter_rules: section.patientFilterRules || null
    }));

    const { error: sectionsError } = await supabase
      .from('template_sections')
      .insert(sectionsToInsert);

    if (sectionsError) throw sectionsError;
  }

  // Return the created template with sections
  return getTemplateById(templateData.id);
};

// Process template
export const processTemplate = async (templateId, patientId, consultationId, additionalData = {}) => {
  // Get the template with sections
  const template = await getTemplateById(templateId);
  
  // Get patient data
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();
    
  if (patientError) throw patientError;
  
  // Get consultation data
  const { data: consultation, error: consultationError } = await supabase
    .from('consultations')
    .select('*')
    .eq('id', consultationId)
    .single();
    
  if (consultationError) throw consultationError;
  
  // Process each section
  const processedSections = template.template_sections.map(section => {
    let processedContent = section.content;
    
    // Replace placeholders
    const placeholders = {
      '[PATIENT_NAME]': patient.name,
      '[PROVIDER_NAME]': consultation.provider_name || 'Your Provider',
      '[CONSULTATION_DATE]': new Date(consultation.created_at).toLocaleDateString(),
      // Add more placeholders as needed
    };
    
    // Replace placeholders in content
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return {
      id: section.id,
      sectionType: section.section_type,
      title: section.title,
      originalContent: section.content,
      processedContent,
      visibilityRule: section.visibility_rule,
      order: section.order_index,
      isRequired: section.is_required
    };
  });
  
  // Save processed template
  const { data: processedTemplate, error } = await supabase
    .from('processed_templates')
    .insert({
      template_id: templateId,
      patient_id: patientId,
      consultation_id: consultationId,
      sections: processedSections
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return {
    templateId,
    patientId,
    consultationId,
    sections: processedSections,
    timestamp: new Date().toISOString()
  };
};

// Generate patient view
export const generatePatientView = async (consultationId, patientId, viewConfig, sectionVisibility) => {
  // Get the processed template for this consultation
  const { data: processedTemplate, error } = await supabase
    .from('processed_templates')
    .select('*')
    .eq('consultation_id', consultationId)
    .eq('patient_id', patientId)
    .single();
    
  if (error) throw error;
  
  // Filter sections based on visibility rules and config
  const visibleSections = processedTemplate.sections.filter(section => {
    // Check if section should be visible to patient
    const isVisible = section.visibilityRule === 'shared' || 
                      section.visibilityRule === 'patient_only';
                      
    // Apply additional filters from viewConfig
    if (section.sectionType === 'assessment' && !viewConfig.includeAssessment) {
      return false;
    }
    
    if (section.sectionType === 'medications' && !viewConfig.includeMedications) {
      return false;
    }
    
    return isVisible;
  });
  
  // Format content based on config
  const formattedSections = visibleSections.map(section => {
    let content = section.processedContent;
    
    // Apply simple language if requested
    if (viewConfig.formatOptions.useSimpleLanguage) {
      // This would be a more sophisticated transformation in production
      content = simplifyLanguage(content);
    }
    
    return {
      sectionType: section.sectionType,
      title: section.title,
      content,
      isVisible: true
    };
  });
  
  // Get provider info
  const { data: consultation } = await supabase
    .from('consultations')
    .select('provider_name, created_at')
    .eq('id', consultationId)
    .single();
  
  // Create patient view
  const patientView = {
    consultationId,
    patientId,
    providerName: consultation.provider_name,
    consultationDate: consultation.created_at,
    sections: formattedSections,
    generatedAt: new Date().toISOString()
  };
  
  // Save patient view
  await supabase
    .from('patient_views')
    .insert({
      consultation_id: consultationId,
      patient_id: patientId,
      provider_id: consultation.provider_id,
      sections: formattedSections,
      config: viewConfig
    });
  
  return patientView;
};

// Helper function to simplify medical language
function simplifyLanguage(text) {
  // This would be more sophisticated in production
  const replacements = {
    'hypertension': 'high blood pressure',
    'myocardial infarction': 'heart attack',
    'dyslipidemia': 'high cholesterol',
    'prn': 'as needed',
    'subcutaneous': 'under the skin',
    // Add more replacements as needed
  };
  
  let simplifiedText = text;
  Object.entries(replacements).forEach(([medical, simple]) => {
    simplifiedText = simplifiedText.replace(new RegExp(medical, 'gi'), simple);
  });
  
  return simplifiedText;
}
```

### 2.2 Enhance AI Service (Week 2)

Update `src/apis/ai/summaryService.js` to integrate with our new data model:

```javascript
// Add new function to generate AI recommendations
export const generateAIRecommendations = async (
  formId,
  patientId,
  consultationId,
  categoryId,
  promptType = 'initial'
) => {
  try {
    // Get form data
    const { data: formData, error: formError } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('id', formId)
      .single();
      
    if (formError) throw formError;
    
    // Generate recommendations for different sections
    const summary = await generateIntakeSummary(formData, categoryId, promptType);
    const assessment = await generateAssessment(formData, categoryId, promptType);
    const plan = await generatePlan(formData, categoryId, promptType);
    
    // Format as AIRecommendationPackage
    const recommendationPackage = {
      consultationId,
      patientId,
      categoryId,
      formId,
      timestamp: new Date().toISOString(),
      sections: [
        {
          sectionType: 'summary',
          recommendations: summary.recommendations,
          summary: summary.reasoning
        },
        {
          sectionType: 'assessment',
          recommendations: [],
          summary: assessment
        },
        {
          sectionType: 'plan',
          recommendations: [],
          summary: plan
        }
      ]
    };
    
    // Save recommendations
    const { data, error } = await supabase
      .from('ai_recommendations')
      .insert({
        consultation_id: consultationId,
        patient_id: patientId,
        category_id: categoryId,
        form_id: formId,
        sections: recommendationPackage.sections
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return recommendationPackage;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw error;
  }
};
```

### 2.3 Update Template Hooks (Week 2)

Update `src/apis/noteTemplates/hooks.js` to support our new template types:

```javascript
// Add new hook for template processing
export const useProcessTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const processTemplateMutation = async ({ templateId, patientId, consultationId, additionalData }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await processTemplate(templateId, patientId, consultationId, additionalData);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    mutateAsync: processTemplateMutation,
    isLoading,
    error
  };
};

// Add new hook for AI recommendations
export const useGenerateAIRecommendations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const generateRecommendationsMutation = async ({ formId, patientId, consultationId, categoryId, promptType }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateAIRecommendations(formId, patientId, consultationId, categoryId, promptType);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    mutateAsync: generateRecommendationsMutation,
    isLoading,
    error
  };
};

// Add new hook for patient view generation
export const useGeneratePatientView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const generatePatientViewMutation = async ({ consultationId, patientId, viewConfig, sectionVisibility }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generatePatientView(consultationId, patientId, viewConfig, sectionVisibility);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    mutateAsync: generatePatientViewMutation,
    isLoading,
    error
  };
};
```

## Phase 3: UI Integration

### 3.1 Enhance useConsultationState (Week 3)

Update `src/hooks/useConsultationState.js` to support templates and visibility:

```javascript
// Add to initialState
const initialState = {
  // Existing state...
  
  // New template-related state
  selectedTemplate: null,
  processedTemplate: null,
  aiRecommendations: null,
  
  // Section visibility configuration
  sectionVisibility: {
    patientHistory: 'shared',
    medications: 'shared',
    assessment: 'shared',
    communication: 'shared'
  }
};

// Add new action types
const ACTIONS = {
  // Existing actions...
  
  // Template actions
  SET_SELECTED_TEMPLATE: 'SET_SELECTED_TEMPLATE',
  SET_PROCESSED_TEMPLATE: 'SET_PROCESSED_TEMPLATE',
  SET_AI_RECOMMENDATIONS: 'SET_AI_RECOMMENDATIONS',
  SET_SECTION_VISIBILITY: 'SET_SECTION_VISIBILITY'
};

// Add new reducer cases
function consultationReducer(state, action) {
  switch (action.type) {
    // Existing cases...
    
    case ACTIONS.SET_SELECTED_TEMPLATE:
      return { ...state, selectedTemplate: action.payload };
    case ACTIONS.SET_PROCESSED_TEMPLATE:
      return { ...state, processedTemplate: action.payload };
    case ACTIONS.SET_AI_RECOMMENDATIONS:
      return { ...state, aiRecommendations: action.payload };
    case ACTIONS.SET_SECTION_VISIBILITY:
      return { 
        ...state, 
        sectionVisibility: {
          ...state.sectionVisibility,
          [action.payload.section]: action.payload.visibility
        }
      };
    
    default:
      return state;
  }
}

// Add new action creators
const actions = {
  // Existing actions...
  
  setSelectedTemplate: useCallback((template) => 
    dispatch({ type: ACTIONS.SET_SELECTED_TEMPLATE, payload: template }), []),
  setProcessedTemplate: useCallback((template) => 
    dispatch({ type: ACTIONS.SET_PROCESSED_TEMPLATE, payload: template }), []),
  setAIRecommendations: useCallback((recommendations) => 
    dispatch({ type: ACTIONS.SET_AI_RECOMMENDATIONS, payload: recommendations }), []),
  setSectionVisibility: useCallback((section, visibility) => 
    dispatch({ type: ACTIONS.SET_SECTION_VISIBILITY, payload: { section, visibility } }), [])
};
```

### 3.2 Add Template Selection UI (Week 3)

Create `src/pages/consultations/components/consultation-notes/TemplateSelector.jsx`:

```jsx
import React from 'react';

const TemplateSelector = ({ templates, selectedId, onSelect, isLoading }) => {
  return (
    <div className="template-selector">
      <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">
        Note Template
      </label>
      <div className="relative">
        <select
          id="template-select"
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
```

### 3.3 Add Visibility Controls UI (Week 3)

Create `src/pages/consultations/components/consultation-notes/VisibilityControls.jsx`:

```jsx
import React from 'react';

const VisibilityControls = ({ sectionVisibility, onChangeVisibility }) => {
  return (
    <div className="visibility-controls">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Section Visibility</h3>
      <div className="space-y-2">
        {Object.entries(sectionVisibility).map(([section, visibility]) => (
          <div key={section} className="flex items-center">
            <span className="text-sm text-gray-600 capitalize mr-2">
              {section.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <select
              value={visibility}
              onChange={(e) => onChangeVisibility(section, e.target.value)}
              className="block w-32 pl-2 pr-8 py-1 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="provider_only">Provider Only</option>
              <option value="patient_only">Patient Only</option>
              <option value="shared">Shared</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisibilityControls;
```

### 3.4 Update InitialConsultationNotes (Week 4)

Update `src/pages/consultations/InitialConsultationNotes.jsx` to integrate templates and visibility:

```jsx
// Import new components and hooks
import TemplateSelector from './components/consultation-notes/TemplateSelector';
import VisibilityControls from './components/consultation-notes/VisibilityControls';
import { useNoteTemplates, useProcessTemplate, useGenerateAIRecommendations, useGeneratePatientView } from '../../apis/noteTemplates/hooks';

const InitialConsultationNotes = ({ /* props */ }) => {
  // Existing code...
  
  // Get templates
  const { templates, loading: templatesLoading } = useNoteTemplates();
  
  // Template processing mutation
  const processTemplate = useProcessTemplate();
  
  // AI recommendations mutation
  const generateRecommendations = useGenerateAIRecommendations();
  
  // Patient view generation
  const generatePatientView = useGeneratePatientView();
  
  // Select template handler
  const handleSelectTemplate = useCallback(async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    actions.setSelectedTemplate(template);
    
    // Process template with patient data
    try {
      const result = await processTemplate.mutateAsync({
        templateId,
        patientId: patient.id,
        consultationId: consultationId,
        additionalData: {
          selectedServices: state.selectedServices
        }
      });
      
      actions.setProcessedTemplate(result);
      
      // Update UI sections from processed template
      if (result.sections) {
        const historySection = result.sections.find(s => s.sectionType === 'patient_info');
        if (historySection) {
          actions.setPatientHistory(historySection.processedContent);
        }
        
        const assessmentSection = result.sections.find(s => s.sectionType === 'assessment');
        if (assessmentSection) {
          actions.setAssessment(assessmentSection.processedContent);
        }
        
        const communicationSection = result.sections.find(s => s.sectionType === 'communication');
        if (communicationSection) {
          actions.setPatientMessage(communicationSection.processedContent);
        }
      }
    } catch (error) {
      console.error('Error processing template:', error);
      showToast('Failed to process template', 'error');
    }
  }, [templates, patient, consultationId, actions, processTemplate]);
  
  // Generate AI recommendations
  const handleGenerateAIRecommendations = useCallback(async () => {
    try {
      const result = await generateRecommendations.mutateAsync({
        formId: patient.formId,
        patientId: patient.id,
        consultationId: consultationId,
        categoryId: state.selectedServices[0] || 'general',
        promptType: 'initial'
      });
      
      actions.setAIRecommendations(result);
      
      // Update UI with AI recommendations
      if (result.sections) {
        const summarySection = result.sections.find(s => s.sectionType === 'summary');
        if (summarySection && summarySection.recommendations) {
          // Update medications based on recommendations
          summarySection.recommendations.forEach(rec => {
            // Logic to add recommended medications
            const medName = extractMedicationName(rec.text);
            if (medName && !state.medicationData[medName.toLowerCase()]) {
              actions.addMedication(
                medName.toLowerCase(),
                medName,
                state.selectedServices[0] || 'general'
              );
            }
          });
        }
        
        const assessmentSection = result.sections.find(s => s.sectionType === 'assessment');
        if (assessmentSection && assessmentSection.summary) {
          actions.setAiGeneratedAssessment(assessmentSection.summary);
        }
        
        const planSection = result.sections.find(s => s.sectionType === 'plan');
        if (planSection && planSection.summary) {
          // Append plan to assessment
          const fullAssessment = `${assessmentSection?.summary || ''}\n\n${planSection.summary}`;
          actions.setAiGeneratedAssessment(fullAssessment);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      showToast('Failed to generate AI recommendations', 'error');
      return null;
    }
  }, [patient, consultationId, state.selectedServices, actions, generateRecommendations]);
  
  // Generate patient view
  const handleGeneratePatientView = useCallback(async () => {
    try {
      // Create patient view configuration
      const viewConfig = {
        includeProviderInfo: true,
        includeMedications: true,
        includeDosageDetails: true,
        includeAssessment: state.sectionVisibility.assessment === 'shared',
        includePlan: true,
        includeFollowUp: true,
        formatOptions: {
          useSimpleLanguage: true,
          includeSectionHeaders: true,
          includeTimestamps: true,
        }
      };
      
      // Generate patient view
      const patientView = await generatePatientView.mutateAsync({
        consultationId,
        patientId: patient.id,
        viewConfig,
        sectionVisibility: state.sectionVisibility
      });
      
      // Show success message
      showToast('Patient view generated successfully', 'success');
      
      return patientView;
    } catch (error) {
      console.error('Error generating patient view:', error);
      showToast('Failed to generate patient view', 'error');
      return null;
    }
  }, [consultationId, patient, state.sectionVisibility, generatePatientView]);
  
  // Add to ConsultationHeader component
  return (
    <div className="consultation-notes-container">
      {/* Header */}
      <ConsultationHeader
        patient={patient}
        selectedServices={state.selectedServices}
        onRemoveService={actions.removeService}
        onToggleServicePanel={actions.toggleServicePanel}
        onToggleAIPanel={actions.toggleAIPanel}
        onClose={handleClose}
        serviceCategories={serviceCategories}
        showToast={showToast}
      >
        <div className="flex items-center space-x-4 mb-4">
          <TemplateSelector
            templates={templates}
            onSelect={handleSelectTemplate}
            selectedId={state.selectedTemplate?.id}
            isLoading={processTemplate.isLoading}
          />
          <VisibilityControls
            sectionVisibility={state.sectionVisibility}
            onChangeVisibility={actions.setSectionVisibility}
          />
        </div>
      </ConsultationHeader>
      
      {/* Rest of component... */}
      
      {/* Update PatientHistoryCard to use visibility */}
      <PatientHistoryCard
        patientHistory={state.patientHistory}
        isEditingHistory={state.isEditingHistory}
        showHistoryAI={state.showHistoryA