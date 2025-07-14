# Notes Flow Type Definitions

This document defines the TypeScript interfaces for the notes flow system. These interfaces standardize the data structures used throughout the system, from intake forms to AI recommendations to note templates.

## Intake Form Types

```typescript
/**
 * Basic patient information from intake form
 */
export interface PatientBasicInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  height?: string;
  weight?: string;
  hairLossPattern?: string;
  preferredTreatments?: string[];
}

/**
 * Patient health history from intake form
 */
export interface PatientHealthHistory {
  medicalConditions?: string[];
  previousTreatments?: string[];
  medicationsText?: string;
  allergiesText?: string;
  edDuration?: string;
  smokingStatus?: string;
  alcoholUse?: string;
  exerciseFrequency?: string;
}

/**
 * Patient treatment preferences from intake form
 */
export interface PatientTreatmentPreferences {
  preferredMedications?: string[];
  goalWeight?: string;
  timeframe?: string;
  previousAttempts?: string[];
  dietaryRestrictions?: string[];
}

/**
 * Complete intake form data
 */
export interface IntakeFormData {
  formId: string;
  patientId: string;
  categoryId: string; // e.g., 'weight_management', 'ed', 'hair_loss'
  submittedAt: string;
  basicInfo: PatientBasicInfo;
  healthHistory: PatientHealthHistory;
  treatmentPreferences: PatientTreatmentPreferences;
  additionalNotes?: string;
}
```

## AI Recommendation Types

```typescript
/**
 * Single AI recommendation with confidence score
 */
export interface AIRecommendation {
  text: string;
  confidence: number;
}

/**
 * Complete AI summary response
 */
export interface AISummary {
  recommendations: AIRecommendation[];
  reasoning: string;
  categoryId: string;
  promptId: string;
  promptType: 'initial' | 'followup';
  timestamp: string;
}

/**
 * AI assessment response
 */
export interface AIAssessment {
  assessment: string;
  categoryId: string;
  promptId: string;
  promptType: 'initial' | 'followup';
  timestamp: string;
}

/**
 * AI treatment plan response
 */
export interface AIPlan {
  plan: string;
  categoryId: string;
  promptId: string;
  promptType: 'initial' | 'followup';
  timestamp: string;
}

/**
 * Complete AI recommendation package
 */
export interface AIRecommendationPackage {
  summary: AISummary;
  assessment: AIAssessment;
  plan: AIPlan;
  patientId: string;
  consultationId: string;
  generatedAt: string;
}
```

## Note Template Types

```typescript
/**
 * Template placeholder definition
 */
export interface TemplatePlaceholder {
  name: string;
  description: string;
  defaultValue?: string;
  isRequired: boolean;
}

/**
 * Template block for block-based templates
 */
export interface TemplateBlock {
  id: string;
  blockType: string;
  content: string;
  visibilityRule: 'shared' | 'provider_only' | 'patient_only';
  patientFilterRules?: any;
  isActive: boolean;
}

/**
 * Note template definition
 */
export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  encounterType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version?: number;
  blocks?: TemplateBlock[];
}

/**
 * Processed note template with patient data
 */
export interface ProcessedTemplate {
  templateId: string;
  originalContent: string;
  processedContent: string;
  placeholdersUsed: string[];
  missingPlaceholders: string[];
  patientId: string;
  processedAt: string;
}
```

## Provider Note Types

```typescript
/**
 * Medication in provider note
 */
export interface NoteMedication {
  id: string;
  name: string;
  brandName?: string;
  dosage: string;
  frequency: string;
  instructions: string[];
  startDate: string;
  endDate?: string;
  isPatientPreference: boolean;
}

/**
 * Complete provider note
 */
export interface ProviderNote {
  id: string;
  patientId: string;
  providerId: string;
  consultationId: string;
  templateId?: string;
  title: string;
  content: string;
  medications: NoteMedication[];
  assessment?: string;
  plan?: string;
  followUpPeriod?: string;
  createdAt: string;
  updatedAt: string;
  isSharedWithPatient: boolean;
  aiRecommendationId?: string;
}
```

## Data Flow Connector Types

```typescript
/**
 * Data transformation between intake form and AI
 */
export interface IntakeToAITransformer {
  transformIntakeToAIInput: (formData: IntakeFormData) => any;
  parseAIOutput: (aiOutput: any) => AIRecommendationPackage;
}

/**
 * Data transformation between AI and note template
 */
export interface AIToTemplateTransformer {
  populateTemplate: (
    template: NoteTemplate,
    aiRecommendations: AIRecommendationPackage,
    patientData: any
  ) => ProcessedTemplate;
}

/**
 * Event for data flow tracking
 */
export interface NotesFlowEvent {
  eventType: 'intake_submitted' | 'ai_generated' | 'template_processed' | 'note_created' | 'note_shared';
  timestamp: string;
  patientId: string;
  consultationId: string;
  data: any;
}
```

## Implementation Notes

1. These interfaces should be implemented in TypeScript files in the `src/types` directory
2. Use these types consistently across all components in the notes flow
3. Add validation functions for each type to ensure data integrity
4. Consider adding JSON Schema definitions for runtime validation