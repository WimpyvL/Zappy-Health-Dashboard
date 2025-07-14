# Notes Flow Integration Plan

This document outlines how to integrate our new notes flow system with the existing InitialConsultationNotes implementation.

## Current Implementation Analysis

After reviewing the existing code, I've identified the following key components:

### 1. InitialConsultationNotes.jsx
- Modular structure with separate cards for different sections:
  - ConsultationHeader
  - PatientHistoryCard
  - AlertCenterCard
  - MedicationsCard
  - CommunicationCard
  - AssessmentPlanCard
  - AIPanel
  - ServicePanel
- Uses a custom hook (useConsultationState) for state management
- Supports AI-generated content for different sections
- Allows editing of different sections
- Supports service selection and medication management

### 2. useConsultationState.js
- Comprehensive state management using useReducer
- Manages UI state (panels, search, editing modes)
- Manages AI-generated content
- Manages content state (services, history, assessment, messages)
- Manages medication state (selected medications, dosages, approaches)
- Provides action creators for all state changes

### 3. Current Sections
- **Patient History**: Medical history and background
- **Medications**: Selected medications with dosages and instructions
- **Assessment & Plan**: Clinical assessment and treatment plan
- **Communication**: Patient messages and follow-up instructions
- **AI Panel**: AI-generated recommendations

## Integration Strategy

Our integration strategy will preserve the existing UI components while enhancing the data flow and standardizing the data structures.

### 1. Data Model Integration

We'll integrate our new data models with the existing state management:

```typescript
// In useConsultationState.js

// Import new type definitions
import { 
  ConsultationTemplate, 
  ConsultationTemplateSection,
  ProcessedConsultationTemplate,
  AIRecommendationPackage
} from '../types/notesFlow';

// Extend initial state
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

### 2. API Integration

We'll add new API calls to the InitialConsultationNotes component:

```jsx
// In InitialConsultationNotes.jsx

// Import new API hooks
import { 
  useNoteTemplates, 
  useProcessTemplate 
} from '../../apis/noteTemplates/hooks';
import { 
  useGenerateAIRecommendations 
} from '../../apis/ai/summaryHooks';

const InitialConsultationNotes = ({ /* props */ }) => {
  // Existing code...
  
  // Get templates
  const { templates, loading: templatesLoading } = useNoteTemplates();
  
  // Template processing mutation
  const processTemplate = useProcessTemplate();
  
  // AI recommendations mutation
  const generateRecommendations = useGenerateAIRecommendations();
  
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
      if (result.summary && result.summary.recommendations) {
        // Update medications based on recommendations
        result.summary.recommendations.forEach(rec => {
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
      
      if (result.assessment && result.assessment.assessment) {
        actions.setAiGeneratedAssessment(result.assessment.assessment);
      }
      
      if (result.plan && result.plan.plan) {
        // Append plan to assessment
        const fullAssessment = `${result.assessment.assessment || ''}\n\n${result.plan.plan || ''}`;
        actions.setAiGeneratedAssessment(fullAssessment);
      }
      
      return result;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      showToast('Failed to generate AI recommendations', 'error');
      return null;
    }
  }, [patient, consultationId, state.selectedServices, actions, generateRecommendations]);
  
  // Rest of component...
};
```

### 3. UI Enhancements

We'll enhance the UI to support template selection and visibility controls:

```jsx
// In InitialConsultationNotes.jsx

// Add template selection component
const TemplateSelector = ({ templates, onSelect, selectedId }) => (
  <div className="template-selector">
    <label htmlFor="template-select" className="block text-sm font-medium text-gray-700">
      Note Template
    </label>
    <select
      id="template-select"
      value={selectedId || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    >
      <option value="">Select a template...</option>
      {templates.map((template) => (
        <option key={template.id} value={template.id}>
          {template.name}
        </option>
      ))}
    </select>
  </div>
);

// Add visibility controls
const VisibilityControls = ({ sectionVisibility, onChangeVisibility }) => (
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

// Add to the ConsultationHeader component
<div className="flex items-center space-x-4 mb-4">
  <TemplateSelector
    templates={templates}
    onSelect={handleSelectTemplate}
    selectedId={state.selectedTemplate?.id}
  />
  <VisibilityControls
    sectionVisibility={state.sectionVisibility}
    onChangeVisibility={actions.setSectionVisibility}
  />
</div>
```

### 4. Patient View Generation

We'll add functionality to generate patient-friendly views:

```jsx
// In InitialConsultationNotes.jsx

// Add patient view generation
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
    const patientView = await generatePatientView({
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
}, [consultationId, patient, state.sectionVisibility]);

// Add button to footer
<button
  onClick={handleGeneratePatientView}
  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  Generate Patient View
</button>
```

## Implementation Steps

1. **Create Type Definitions**
   - Implement the TypeScript interfaces defined in notes-flow-types.md
   - Create validation functions for each type

2. **Implement API Endpoints**
   - Create the API endpoints defined in notes-flow-api-endpoints.md
   - Implement error handling and response formatting

3. **Implement Data Connectors**
   - Create the data transformation services defined in notes-flow-connectors.md
   - Implement event tracking for data flow

4. **Enhance State Management**
   - Extend useConsultationState with template and visibility support
   - Add new actions for template processing and AI recommendations

5. **Update UI Components**
   - Add template selection to ConsultationHeader
   - Add visibility controls for each section
   - Enhance AIPanel to use the new AI recommendation structure

6. **Implement Patient View Generation**
   - Create a service to generate patient-friendly views
   - Add patient view generation to the consultation workflow

## Migration Strategy

To ensure a smooth transition, we'll implement this in phases:

### Phase 1: Add New Types and APIs
- Implement type definitions
- Create API endpoints
- Add data connectors
- Keep existing UI unchanged

### Phase 2: Enhance State Management
- Extend useConsultationState
- Add template selection
- Add visibility controls
- Keep existing data flow

### Phase 3: Full Integration
- Connect new APIs to UI
- Implement patient view generation
- Migrate existing mock data to use new structures

## Testing Strategy

1. **Unit Tests**
   - Test type validation functions
   - Test data transformation functions
   - Test state management actions

2. **Integration Tests**
   - Test API endpoints with mock data
   - Test template processing with sample templates
   - Test AI recommendation generation

3. **UI Tests**
   - Test template selection
   - Test visibility controls
   - Test patient view generation

4. **End-to-End Tests**
   - Test complete flow from intake form to patient view
   - Test with different template types
   - Test with different service categories