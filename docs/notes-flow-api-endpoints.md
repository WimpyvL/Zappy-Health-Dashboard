# Notes Flow API Endpoints

This document defines the API endpoints needed for data transfer between components in the notes flow system. These endpoints will ensure consistent data flow between intake forms, AI recommendations, and note templates.

## Intake Form API Endpoints

### 1. Submit Intake Form

**Endpoint:** `POST /api/intake-forms`

**Description:** Submit a new intake form for a patient

**Request Body:**
```json
{
  "patientId": "string",
  "categoryId": "string",
  "formData": {
    "basicInfo": {
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "string",
      "email": "string",
      "phone": "string",
      "height": "string",
      "weight": "string"
    },
    "healthHistory": {
      "medicalConditions": ["string"],
      "previousTreatments": ["string"],
      "medicationsText": "string",
      "allergiesText": "string"
    },
    "treatmentPreferences": {
      "preferredMedications": ["string"],
      "goalWeight": "string",
      "timeframe": "string"
    },
    "additionalNotes": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "formId": "string",
  "submittedAt": "string",
  "consultationId": "string"
}
```

### 2. Get Intake Form

**Endpoint:** `GET /api/intake-forms/{formId}`

**Description:** Retrieve an intake form by ID

**Response:**
```json
{
  "formId": "string",
  "patientId": "string",
  "categoryId": "string",
  "submittedAt": "string",
  "formData": {
    // Form data as in submit endpoint
  }
}
```

### 3. List Patient Intake Forms

**Endpoint:** `GET /api/patients/{patientId}/intake-forms`

**Description:** List all intake forms for a patient

**Response:**
```json
{
  "forms": [
    {
      "formId": "string",
      "categoryId": "string",
      "submittedAt": "string",
      "status": "string"
    }
  ]
}
```

## AI Recommendation API Endpoints

### 1. Generate AI Recommendations

**Endpoint:** `POST /api/ai/recommendations`

**Description:** Generate AI recommendations based on intake form data

**Request Body:**
```json
{
  "formId": "string",
  "patientId": "string",
  "consultationId": "string",
  "categoryId": "string",
  "promptType": "initial | followup"
}
```

**Response:**
```json
{
  "recommendationId": "string",
  "summary": {
    "recommendations": [
      {
        "text": "string",
        "confidence": 95
      }
    ],
    "reasoning": "string",
    "categoryId": "string",
    "promptId": "string",
    "promptType": "string",
    "timestamp": "string"
  },
  "assessment": {
    "assessment": "string",
    "categoryId": "string",
    "promptId": "string",
    "promptType": "string",
    "timestamp": "string"
  },
  "plan": {
    "plan": "string",
    "categoryId": "string",
    "promptId": "string",
    "promptType": "string",
    "timestamp": "string"
  }
}
```

### 2. Get AI Recommendations

**Endpoint:** `GET /api/ai/recommendations/{recommendationId}`

**Description:** Retrieve AI recommendations by ID

**Response:**
```json
{
  // Same as generate response
}
```

### 3. Provide Feedback on AI Recommendations

**Endpoint:** `POST /api/ai/recommendations/{recommendationId}/feedback`

**Description:** Provide feedback on AI recommendations to improve future results

**Request Body:**
```json
{
  "providerId": "string",
  "rating": 1-5,
  "comments": "string",
  "usedInNote": true
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "string"
}
```

## Note Template API Endpoints

### 1. List Note Templates

**Endpoint:** `GET /api/note-templates`

**Description:** List all note templates

**Query Parameters:**
- `category` (optional): Filter by category
- `encounterType` (optional): Filter by encounter type

**Response:**
```json
{
  "templates": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "encounterType": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

### 2. Get Note Template

**Endpoint:** `GET /api/note-templates/{templateId}`

**Description:** Retrieve a note template by ID

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "content": "string",
  "category": "string",
  "encounterType": "string",
  "isActive": true,
  "createdAt": "string",
  "updatedAt": "string",
  "version": 1,
  "blocks": [
    {
      "id": "string",
      "blockType": "string",
      "content": "string",
      "visibilityRule": "string"
    }
  ]
}
```

### 3. Process Template with Data

**Endpoint:** `POST /api/note-templates/{templateId}/process`

**Description:** Process a template with patient data and AI recommendations

**Request Body:**
```json
{
  "patientId": "string",
  "consultationId": "string",
  "recommendationId": "string",
  "additionalData": {
    // Any additional data for template processing
  }
}
```

**Response:**
```json
{
  "templateId": "string",
  "originalContent": "string",
  "processedContent": "string",
  "placeholdersUsed": ["string"],
  "missingPlaceholders": ["string"],
  "patientId": "string",
  "processedAt": "string"
}
```

## Provider Note API Endpoints

### 1. Create Provider Note

**Endpoint:** `POST /api/provider-notes`

**Description:** Create a new provider note

**Request Body:**
```json
{
  "patientId": "string",
  "providerId": "string",
  "consultationId": "string",
  "templateId": "string",
  "title": "string",
  "content": "string",
  "medications": [
    {
      "name": "string",
      "brandName": "string",
      "dosage": "string",
      "frequency": "string",
      "instructions": ["string"],
      "startDate": "string",
      "isPatientPreference": false
    }
  ],
  "assessment": "string",
  "plan": "string",
  "followUpPeriod": "string",
  "isSharedWithPatient": false,
  "aiRecommendationId": "string"
}
```

**Response:**
```json
{
  "noteId": "string",
  "createdAt": "string"
}
```

### 2. Get Provider Note

**Endpoint:** `GET /api/provider-notes/{noteId}`

**Description:** Retrieve a provider note by ID

**Response:**
```json
{
  "id": "string",
  "patientId": "string",
  "providerId": "string",
  "consultationId": "string",
  "templateId": "string",
  "title": "string",
  "content": "string",
  "medications": [
    // Medications as in create endpoint
  ],
  "assessment": "string",
  "plan": "string",
  "followUpPeriod": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "isSharedWithPatient": false,
  "aiRecommendationId": "string"
}
```

### 3. Share Note with Patient

**Endpoint:** `POST /api/provider-notes/{noteId}/share`

**Description:** Share a provider note with the patient

**Response:**
```json
{
  "success": true,
  "sharedAt": "string"
}
```

## Data Flow Connector Endpoints

### 1. Track Notes Flow Event

**Endpoint:** `POST /api/notes-flow/events`

**Description:** Track an event in the notes flow process

**Request Body:**
```json
{
  "eventType": "intake_submitted | ai_generated | template_processed | note_created | note_shared",
  "patientId": "string",
  "consultationId": "string",
  "data": {
    // Event-specific data
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "string",
  "timestamp": "string"
}
```

### 2. Get Notes Flow Status

**Endpoint:** `GET /api/notes-flow/status/{consultationId}`

**Description:** Get the current status of the notes flow for a consultation

**Response:**
```json
{
  "consultationId": "string",
  "patientId": "string",
  "currentStatus": "intake_submitted | ai_generated | template_processed | note_created | note_shared",
  "events": [
    {
      "eventType": "string",
      "timestamp": "string",
      "data": {}
    }
  ],
  "formId": "string",
  "recommendationId": "string",
  "noteId": "string"
}
```

## Implementation Notes

1. All endpoints should return appropriate HTTP status codes
2. Error responses should follow a consistent format:
   ```json
   {
     "success": false,
     "error": {
       "code": "string",
       "message": "string"
     }
   }
   ```
3. Authentication and authorization should be implemented for all endpoints
4. Rate limiting should be applied to AI recommendation endpoints
5. Consider implementing webhooks for asynchronous processes