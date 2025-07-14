# Notes Flow Data Connectors

This document defines the data flow connectors needed to transform data between components in the notes flow system. These connectors ensure that data flows smoothly from intake forms to AI recommendations to note templates.

## Overview of Data Flow

The notes flow system involves several data transformations:

1. **Intake Form → AI Input**: Transform intake form data into a format suitable for AI processing
2. **AI Output → Structured Recommendations**: Parse AI output into structured recommendations
3. **AI Recommendations + Patient Data → Template**: Populate note templates with AI recommendations and patient data
4. **Template → Provider Note**: Transform processed templates into provider notes
5. **Provider Note → Patient View**: Transform provider notes into patient-friendly views

## 1. Intake Form to AI Input Connector

### Purpose
Transform intake form data into a format suitable for AI processing.

### Input
- Intake form data (as defined in `IntakeFormData` interface)
- Category ID (e.g., 'weight_management', 'ed', 'hair_loss')
- Prompt type ('initial' or 'followup')

### Output
- Structured input for AI service

### Transformation Logic

```typescript
function transformIntakeToAIInput(formData: IntakeFormData, promptType: string): AIInputData {
  // Extract relevant data based on category
  const { basicInfo, healthHistory, treatmentPreferences } = formData;
  
  // Create a structured object for AI processing
  const aiInput = {
    patientInfo: {
      age: calculateAge(basicInfo.dateOfBirth),
      gender: basicInfo.gender,
      height: basicInfo.height,
      weight: basicInfo.weight,
      bmi: calculateBMI(basicInfo.height, basicInfo.weight),
    },
    medicalHistory: {
      conditions: healthHistory.medicalConditions || [],
      medications: parseMedications(healthHistory.medicationsText),
      allergies: parseAllergies(healthHistory.allergiesText),
      previousTreatments: healthHistory.previousTreatments || [],
    },
    preferences: {
      preferredMedications: treatmentPreferences.preferredMedications || [],
      goals: extractGoals(treatmentPreferences),
      constraints: extractConstraints(treatmentPreferences),
    },
    consultationType: promptType,
    categoryId: formData.categoryId,
  };
  
  return aiInput;
}
```

### Helper Functions

- `calculateAge`: Calculate age from date of birth
- `calculateBMI`: Calculate BMI from height and weight
- `parseMedications`: Parse medications from free text
- `parseAllergies`: Parse allergies from free text
- `extractGoals`: Extract treatment goals from preferences
- `extractConstraints`: Extract treatment constraints from preferences

## 2. AI Output to Structured Recommendations Connector

### Purpose
Parse AI output into structured recommendations.

### Input
- Raw AI output (format depends on AI service)

### Output
- Structured AI recommendations (as defined in `AIRecommendationPackage` interface)

### Transformation Logic

```typescript
function parseAIOutput(aiOutput: any): AIRecommendationPackage {
  // Parse summary recommendations
  const recommendations = aiOutput.recommendations.map(rec => ({
    text: rec.text,
    confidence: rec.confidence || 90, // Default confidence if not provided
  }));
  
  // Create structured summary
  const summary: AISummary = {
    recommendations,
    reasoning: aiOutput.reasoning || '',
    categoryId: aiOutput.categoryId,
    promptId: aiOutput.promptId,
    promptType: aiOutput.promptType,
    timestamp: aiOutput.timestamp || new Date().toISOString(),
  };
  
  // Create structured assessment
  const assessment: AIAssessment = {
    assessment: aiOutput.assessment || '',
    categoryId: aiOutput.categoryId,
    promptId: aiOutput.promptId,
    promptType: aiOutput.promptType,
    timestamp: aiOutput.timestamp || new Date().toISOString(),
  };
  
  // Create structured plan
  const plan: AIPlan = {
    plan: aiOutput.plan || '',
    categoryId: aiOutput.categoryId,
    promptId: aiOutput.promptId,
    promptType: aiOutput.promptType,
    timestamp: aiOutput.timestamp || new Date().toISOString(),
  };
  
  // Combine into complete package
  return {
    summary,
    assessment,
    plan,
    patientId: aiOutput.patientId,
    consultationId: aiOutput.consultationId,
    generatedAt: aiOutput.timestamp || new Date().toISOString(),
  };
}
```

## 3. AI Recommendations + Patient Data to Template Connector

### Purpose
Populate note templates with AI recommendations and patient data.

### Input
- Note template (as defined in `NoteTemplate` interface)
- AI recommendations (as defined in `AIRecommendationPackage` interface)
- Patient data

### Output
- Processed template (as defined in `ProcessedTemplate` interface)

### Transformation Logic

```typescript
function populateTemplate(
  template: NoteTemplate,
  aiRecommendations: AIRecommendationPackage,
  patientData: any
): ProcessedTemplate {
  let processedContent = template.content;
  const placeholdersUsed = [];
  const missingPlaceholders = [];
  
  // Define placeholder replacements
  const replacements = {
    '[PATIENT_NAME]': `${patientData.firstName} ${patientData.lastName}`,
    '[PROVIDER_NAME]': patientData.providerName || 'Your Provider',
    '[MEDICATIONS_LIST]': formatMedicationsList(aiRecommendations.summary.recommendations),
    '[ASSESSMENT]': aiRecommendations.assessment.assessment,
    '[PLAN]': aiRecommendations.plan.plan,
    '[FOLLOW_UP_PERIOD]': determineFollowUpPeriod(aiRecommendations),
    '[CONSULTATION_DATE]': formatDate(new Date()),
    // Add more placeholders as needed
  };
  
  // Replace placeholders in template
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (processedContent.includes(placeholder)) {
      processedContent = processedContent.replace(
        new RegExp(placeholder, 'g'),
        value || `[Missing: ${placeholder.slice(1, -1)}]`
      );
      
      if (value) {
        placeholdersUsed.push(placeholder);
      } else {
        missingPlaceholders.push(placeholder);
      }
    }
  }
  
  return {
    templateId: template.id,
    originalContent: template.content,
    processedContent,
    placeholdersUsed,
    missingPlaceholders,
    patientId: patientData.id,
    processedAt: new Date().toISOString(),
  };
}
```

### Helper Functions

- `formatMedicationsList`: Format list of medications from recommendations
- `determineFollowUpPeriod`: Determine follow-up period based on recommendations
- `formatDate`: Format date in a human-readable format

## 4. Template to Provider Note Connector

### Purpose
Transform processed templates into provider notes.

### Input
- Processed template (as defined in `ProcessedTemplate` interface)
- AI recommendations (as defined in `AIRecommendationPackage` interface)
- Consultation data

### Output
- Provider note (as defined in `ProviderNote` interface)

### Transformation Logic

```typescript
function createProviderNote(
  processedTemplate: ProcessedTemplate,
  aiRecommendations: AIRecommendationPackage,
  consultationData: any
): ProviderNote {
  // Extract medications from AI recommendations
  const medications = extractMedicationsFromRecommendations(
    aiRecommendations.summary.recommendations
  );
  
  // Create provider note
  const providerNote: ProviderNote = {
    id: generateId(),
    patientId: processedTemplate.patientId,
    providerId: consultationData.providerId,
    consultationId: consultationData.consultationId,
    templateId: processedTemplate.templateId,
    title: determineNoteTitle(aiRecommendations, consultationData),
    content: processedTemplate.processedContent,
    medications,
    assessment: aiRecommendations.assessment.assessment,
    plan: aiRecommendations.plan.plan,
    followUpPeriod: extractFollowUpPeriod(aiRecommendations),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSharedWithPatient: false,
    aiRecommendationId: aiRecommendations.summary.promptId,
  };
  
  return providerNote;
}
```

### Helper Functions

- `extractMedicationsFromRecommendations`: Extract structured medications from recommendations
- `determineNoteTitle`: Determine an appropriate title for the note
- `extractFollowUpPeriod`: Extract follow-up period from recommendations
- `generateId`: Generate a unique ID for the note

## 5. Provider Note to Patient View Connector

### Purpose
Transform provider notes into patient-friendly views.

### Input
- Provider note (as defined in `ProviderNote` interface)

### Output
- Patient-friendly note view

### Transformation Logic

```typescript
function createPatientView(providerNote: ProviderNote): PatientNoteView {
  // Filter out provider-only content
  const filteredContent = filterProviderOnlyContent(providerNote.content);
  
  // Format medications in a patient-friendly way
  const formattedMedications = formatMedicationsForPatient(providerNote.medications);
  
  // Create patient view
  const patientView = {
    noteId: providerNote.id,
    title: providerNote.title,
    content: filteredContent,
    medications: formattedMedications,
    treatmentPlan: simplifyPlan(providerNote.plan),
    followUpInstructions: createFollowUpInstructions(providerNote.followUpPeriod),
    createdAt: providerNote.createdAt,
    providerName: getProviderName(providerNote.providerId),
  };
  
  return patientView;
}
```

### Helper Functions

- `filterProviderOnlyContent`: Remove content marked as provider-only
- `formatMedicationsForPatient`: Format medications in a patient-friendly way
- `simplifyPlan`: Simplify the treatment plan for patient understanding
- `createFollowUpInstructions`: Create clear follow-up instructions
- `getProviderName`: Get the provider's name from their ID

## Event Tracking for Data Flow

To monitor the flow of data through the system, we'll implement event tracking:

```typescript
function trackNotesFlowEvent(
  eventType: 'intake_submitted' | 'ai_generated' | 'template_processed' | 'note_created' | 'note_shared',
  patientId: string,
  consultationId: string,
  data: any
): void {
  const event: NotesFlowEvent = {
    eventType,
    timestamp: new Date().toISOString(),
    patientId,
    consultationId,
    data,
  };
  
  // Log event to database
  logEventToDatabase(event);
  
  // Emit event for real-time updates
  emitEvent(event);
}
```

## Implementation Plan

1. Create a `DataConnectors` directory in the `src/services` folder
2. Implement each connector as a separate service
3. Create unit tests for each transformation function
4. Add logging and error handling to each connector
5. Implement event tracking for data flow monitoring
6. Create a facade service that orchestrates the entire flow

## Error Handling

Each connector should implement robust error handling:

```typescript
function safeTransform<T, U>(
  transformer: (input: T) => U,
  input: T,
  defaultValue: U
): U {
  try {
    return transformer(input);
  } catch (error) {
    console.error('Transformation error:', error);
    logTransformationError(error, input);
    return defaultValue;
  }
}
```

## Validation

Each connector should validate its inputs and outputs:

```typescript
function validateIntakeFormData(formData: IntakeFormData): boolean {
  // Check required fields
  if (!formData.patientId || !formData.categoryId) {
    return false;
  }
  
  // Check basic info
  if (!formData.basicInfo.firstName || !formData.basicInfo.lastName) {
    return false;
  }
  
  // More validation as needed
  
  return true;
}