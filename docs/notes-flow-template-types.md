# Notes Flow Template Types

This document expands on the template types to address the specific requirements for different template use cases in the notes flow system.

## Template Categories

There are two main categories of templates in the system:

1. **Consultation Templates**: Modular templates connected to initial consultations and follow-up notes
2. **Service Templates**: Simpler templates for customer service notes and other administrative purposes

## 1. Consultation Templates

### Characteristics
- Modular structure with separate sections
- Different visibility rules for different sections
- Integration with AI recommendations
- Connection to specific consultation types

### Structure

```typescript
/**
 * Consultation template section with visibility rules
 */
export interface ConsultationTemplateSection {
  id: string;
  sectionType: 'patient_info' | 'medications' | 'assessment' | 'plan' | 'follow_up' | 'communication' | 'custom';
  title: string;
  content: string;
  visibilityRule: 'provider_only' | 'patient_only' | 'shared';
  order: number;
  isRequired: boolean;
  aiIntegration?: {
    useAI: boolean;
    promptType: string;
    section: string;
  };
}

/**
 * Consultation template for initial or follow-up consultations
 */
export interface ConsultationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'weight_management' | 'ed' | 'hair_loss' | 'general' | string;
  consultationType: 'initial' | 'follow_up';
  sections: ConsultationTemplateSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: {
    recommendedFor?: string[];
    authorId?: string;
    tags?: string[];
  };
}

/**
 * Processed consultation template with patient data and AI recommendations
 */
export interface ProcessedConsultationTemplate {
  templateId: string;
  consultationId: string;
  patientId: string;
  sections: {
    id: string;
    sectionType: string;
    title: string;
    originalContent: string;
    processedContent: string;
    visibilityRule: string;
    placeholdersUsed: string[];
    missingPlaceholders: string[];
  }[];
  processedAt: string;
}
```

### Section Types

1. **Patient Info Section**: Basic patient information
   - Demographics
   - Vital signs
   - Chief complaint

2. **Medications Section**: Prescribed medications
   - Current medications
   - New prescriptions
   - Medication changes

3. **Assessment Section**: Clinical assessment
   - Findings
   - Diagnosis
   - Clinical reasoning

4. **Plan Section**: Treatment plan
   - Recommendations
   - Next steps
   - Goals

5. **Follow-up Section**: Follow-up instructions
   - Timing
   - Monitoring parameters
   - Conditions for earlier follow-up

6. **Communication Section**: Patient communication
   - Instructions
   - Education
   - Resources

7. **Custom Section**: User-defined section
   - Configurable content
   - Custom visibility rules

## 2. Service Templates

### Characteristics
- Simpler structure
- Quick references to patient data points
- Less integration with AI
- More focused on administrative tasks

### Structure

```typescript
/**
 * Data point reference for service templates
 */
export interface DataPointReference {
  id: string;
  name: string;
  path: string; // Path to data in patient record (e.g., 'profile.weight')
  defaultValue: string;
  description: string;
}

/**
 * Service template for customer service notes and administrative tasks
 */
export interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'customer_service' | 'billing' | 'administrative' | 'clinical' | string;
  content: string;
  dataPoints: DataPointReference[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata?: {
    departmentId?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
}

/**
 * Processed service template with patient data
 */
export interface ProcessedServiceTemplate {
  templateId: string;
  patientId: string;
  originalContent: string;
  processedContent: string;
  dataPointsUsed: {
    id: string;
    name: string;
    value: string;
  }[];
  missingDataPoints: string[];
  processedAt: string;
}
```

## Template Placeholders

### Standard Placeholders
These placeholders work in both consultation and service templates:

```typescript
export interface StandardPlaceholder {
  code: string; // e.g., '[PATIENT_NAME]'
  description: string;
  source: 'patient' | 'provider' | 'system';
  path: string; // Path to data in source object
  defaultValue: string;
}

export const STANDARD_PLACEHOLDERS: StandardPlaceholder[] = [
  {
    code: '[PATIENT_NAME]',
    description: "Patient's full name",
    source: 'patient',
    path: 'firstName + " " + lastName',
    defaultValue: 'the patient',
  },
  {
    code: '[PATIENT_AGE]',
    description: "Patient's age",
    source: 'patient',
    path: 'calculateAge(dateOfBirth)',
    defaultValue: '',
  },
  {
    code: '[PROVIDER_NAME]',
    description: "Provider's full name",
    source: 'provider',
    path: 'firstName + " " + lastName',
    defaultValue: 'your provider',
  },
  {
    code: '[TODAY_DATE]',
    description: "Today's date",
    source: 'system',
    path: 'formatDate(new Date())',
    defaultValue: 'today',
  },
  // Many more standard placeholders...
];
```

### Dynamic Data References
For service templates, dynamic data references allow access to specific patient data points:

```typescript
export interface DynamicDataReference {
  code: string; // e.g., '{{patient.weight}}'
  description: string;
  validPaths: string[]; // Valid data paths that can be used
  examples: string[];
}

export const DYNAMIC_DATA_SYNTAX: DynamicDataReference[] = [
  {
    code: '{{patient.profile.X}}',
    description: 'Access patient profile data',
    validPaths: ['height', 'weight', 'bmi', 'allergies', 'medications'],
    examples: ['{{patient.profile.weight}}', '{{patient.profile.allergies}}'],
  },
  {
    code: '{{consultation.X}}',
    description: 'Access current consultation data',
    validPaths: ['type', 'date', 'chiefComplaint', 'status'],
    examples: ['{{consultation.type}}', '{{consultation.chiefComplaint}}'],
  },
  // More dynamic data references...
];
```

## Template Visibility and Sharing

### Visibility Rules

```typescript
export type VisibilityRule = 'provider_only' | 'patient_only' | 'shared';

export interface VisibilityConfig {
  defaultRule: VisibilityRule;
  sectionRules: {
    [sectionType: string]: VisibilityRule;
  };
  overrideRules?: {
    [sectionId: string]: VisibilityRule;
  };
}
```

### Patient View Generation

```typescript
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

export interface PatientNoteView {
  noteId: string;
  title: string;
  sections: {
    title: string;
    content: string;
    type: string;
  }[];
  medications?: {
    name: string;
    instructions: string;
    important: boolean;
  }[];
  followUpInstructions?: string;
  createdAt: string;
  providerName: string;
}
```

## Template Management

### Template Versioning

```typescript
export interface TemplateVersion {
  templateId: string;
  version: number;
  content: string | ConsultationTemplateSection[];
  changedBy: string;
  changedAt: string;
  changeNotes?: string;
}

export interface TemplateVersionHistory {
  templateId: string;
  currentVersion: number;
  versions: TemplateVersion[];
}
```

### Template Sharing and Permissions

```typescript
export interface TemplatePermission {
  templateId: string;
  userId: string;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: string;
  grantedAt: string;
}

export interface TemplateShare {
  templateId: string;
  sharedWith: string[]; // User IDs
  sharedBy: string;
  sharedAt: string;
  expiresAt?: string;
  message?: string;
}
```

## Implementation Considerations

1. **Modular Sections**: Consultation templates should support adding, removing, and reordering sections

2. **Visibility Control**: Each section should have clear visibility rules that determine what patients can see

3. **Data Point References**: Service templates need an easy way to reference patient data points

4. **Template Versioning**: Both template types should support versioning to track changes

5. **AI Integration**: Consultation templates should have clear integration points with the AI recommendation engine

6. **Patient View Generation**: The system should generate patient-friendly views based on visibility rules

7. **Template Library**: Consider implementing a template library for sharing and reusing templates

8. **Template Categories**: Organize templates by category, consultation type, and purpose for easy discovery