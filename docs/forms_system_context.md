# Forms System Context Document

This document provides a comprehensive overview of the forms system within the Zappy-Dashboard project, detailing its database schema, API layer, frontend component architecture, key workflows, and integration points.

## 1. Introduction

The forms system is a core component of the Zappy-Dashboard, enabling dynamic form creation, patient intake, data collection, and automated processing. It supports both administrative management of form templates and patient-facing submission workflows, with robust versioning and integration capabilities.

## 2. Database Schema

The forms system primarily relies on the following Supabase tables:

*   **`questionnaire`**:
    *   **Purpose**: Defines form templates and their structures. This is the unified source for all form definitions.
    *   **Key Fields**:
        *   `id` (UUID, PK)
        *   `title` (TEXT)
        *   `description` (TEXT)
        *   `form_data` (JSONB): Stores the dynamic structure of the form.
        *   `structure` (JSONB): Another JSONB column for form structure, potentially for different versions or specific rendering needs.
        *   `category_id` (UUID, FK to `categories.id`): Links forms to categories.
        *   `is_active` (BOOLEAN): Indicates if the form template is active.
        *   `slug` (TEXT, UNIQUE): A unique identifier for the form, often used in URLs.
        *   `created_at`, `updated_at` (TIMESTAMPTZ)
    *   **Relationships**: Referenced by `form_submissions` and `questionnaire_versions`.

*   **`form_submissions` (Unified as `form_requests`)**:
    *   **Purpose**: Stores submitted data for each form instance.
    *   **Key Fields**:
        *   `id` (UUID, PK)
        *   `patient_id` (UUID, FK to `patients.id`, ON DELETE SET NULL): Links submission to a specific patient.
        *   `questionnaire_id` (UUID, FK to `questionnaire.id`, ON DELETE SET NULL): Links submission to the form template.
        *   `template_id` (UUID, FK to `questionnaire.id`, ON DELETE SET NULL): Backward compatibility field, also referencing `questionnaire.id`.
        *   `form_data` (JSONB): Stores the actual submitted values.
        *   `template_version` (TEXT): Version of the template used for submission.
        *   `service_type` (TEXT, ENUM: 'free', 'paid'): Type of service associated with the form.
        *   `metadata` (JSONB): Additional metadata about the submission.
        *   `validation_summary` (JSONB): Summary of validation results.
        *   `instance_id` (UUID): Unique ID for a specific form instance (e.g., for save/resume).
        *   `status` (TEXT, ENUM: `form_request_status`): Current status of the submission (e.g., 'pending', 'completed').
        *   `submitted_at`, `completed_at`, `created_at`, `updated_at` (TIMESTAMPTZ)
    *   **Relationships**: References `patients` and `questionnaire`.

*   **`questionnaire_versions`**:
    *   **Purpose**: Provides version control for `questionnaire` templates.
    *   **Key Fields**:
        *   `id` (UUID, PK)
        *   `questionnaire_id` (UUID, FK to `questionnaire.id`, ON DELETE CASCADE): Links to the parent questionnaire.
        *   `version` (INTEGER): Version number.
        *   `schema` (JSONB): Stores the versioned form structure.
        *   `created_at` (TIMESTAMPTZ)
        *   `created_by` (UUID, FK to `auth.users.id`)
    *   **Relationships**: References `questionnaire`.

*   **`forms`**:
    *   **Purpose**: Appears to be a synchronized duplicate of the `questionnaire` table, maintained by a trigger (`sync_questionnaire_to_forms_trigger`). Its primary role is likely for legacy compatibility or specific reporting needs.

## 3. API Layer

The API layer for the forms system is primarily implemented using React Query hooks, interacting with Supabase.

### 3.1. Forms API (`src/apis/forms/hooks.js`)

This module provides hooks for managing form templates (`questionnaire` table).

*   **`useForms(params)`**: Fetches a list of active form templates, with optional filtering.
*   **`useFormTemplate(templateId)`**: Retrieves a single form template by ID.
*   **`useCreateFormTemplate()` / `useCreateForm()`**: Handles the creation of new form templates in the `questionnaire` table.
*   **`useUpdateFormTemplate()` / `useUpdateForm()`**: Manages updates to existing form templates.
*   **`useDeleteFormTemplate()` / `useDeleteForm()`**: Deletes form templates.
*   **`useSendFormReminder()`**: Triggers a Supabase Edge Function (`send-form-reminder`) to send reminders.
*   **`useResendForm()`**: Triggers a Supabase Edge Function (`resend-form`) to resend forms.
*   **`useSendFormToPatient()`**: Assigns a form to a patient by creating a `pending` entry in `form_requests` and sends a notification via an Edge Function (`send-form-notification`).

### 3.2. Form Submissions API (`src/apis/formSubmissions/hooks.js`)

This module handles form submissions and patient-specific submission data.

*   **`usePatientFormSubmissions(patientId)`**: Fetches all form submissions for a given patient.
*   **`useFormTemplates(categoryId)`**: Fetches active form templates, optionally filtered by category.
*   **`useSubmitForm()`**: **Critical endpoint** for submitting new forms. It inserts data into `form_submissions`, orchestrates patient account creation, updates patient records, and applies automatic tags.
*   **`useSaveFormProgress()`**: Saves partial form data to the `form_progress` table (upsert operation).
*   **`useFormProgress(patientId, formType)`**: Retrieves saved form progress.
*   **`useFormSubmissionsByTemplate(templateId)`**: Fetches all submissions for a specific template.
*   **`useUpdateFormRequest()`**: Updates an existing form request, typically setting its status to 'completed' and adding `response_data`.

### 3.3. Validation and Integration

*   **Validation**: Primarily enforced by Supabase database constraints (NOT NULL, UNIQUE, FOREIGN KEY, ENUM types). Application-level hooks include basic checks and robust error logging/toasting.
*   **Integration Points**:
    *   **Patients**: Direct linking via `patient_id` in `form_submissions`. `useSubmitForm` can create new patient accounts and update existing patient data.
    *   **Categories**: `category_id` in `questionnaire` and automatic patient tagging based on form category.
    *   **Tags**: Automated patient tagging based on `service_type` and `category_id` upon submission.
    *   **Notifications**: Integration with Supabase Edge Functions for sending form-related notifications (reminders, assignments, confirmations).

## 4. Frontend Component Architecture

The frontend forms system is built with React components, primarily located in `src/components/forms/` and `src/pages/forms/`.

### 4.1. Forms Components (`src/components/forms/`)

*   **Subdirectories**: `core/`, `fields/`, `hooks/`, `styles/`, `unified/`, `utils/`.
*   **Core Components**: `DynamicFormRenderer.jsx`, `UnifiedFormRenderer.jsx`, `FormProvider.jsx`, `FormSaveStatus.jsx`, `ValidationErrorDisplay.jsx`. These components handle the overall form rendering logic, context provision, and error display.
*   **Field Components (`src/components/forms/fields/`)**: Generic input components like `TextInput.jsx`, `SelectInput.jsx`, `CheckboxGroup.jsx`, `DateInput.jsx`, etc., providing a consistent interface for various input types.
*   **Unified Forms System (`src/components/forms/unified/`)**: Contains components like `UnifiedFormInput.jsx`, `UnifiedFormCheckbox.jsx`, which dynamically render form fields based on the `JSONB` schema from the `questionnaire` table. This is where the dynamic rendering logic is centralized.
*   **Utilities (`src/components/forms/utils/`)**: Includes `formValidation.js` for client-side validation logic.
*   **State Management**: Utilizes React Query for server state (data fetching/mutations), React `useState`/`useReducer` for local component state, React Context (`FormProvider.jsx`) for shared form state, and local storage for form progress persistence.

### 4.2. Form Pages (`src/pages/forms/`, `src/pages/admin/`, `src/pages/intake/`)

*   **Patient-Facing**:
    *   `PatientFormsPage.jsx`, `RefactoredPatientFormsPage.jsx`: General patient forms display.
    *   `IntakeFormPage.jsx`, `MobileIntakeFormPage.jsx`, `IntakeSuccessPage.jsx`: Dedicated pages for the patient intake flow.
*   **Admin-Facing**:
    *   `IntakeFormEditor.jsx`: Used by administrators to create, edit, and manage form templates (questionnaires).
    *   `AdminFormSubmissionsList.jsx`: Displays and manages submitted forms.
*   **Routing**: These pages are integrated into the application's routing system, providing distinct user experiences for form management and submission.

## 5. Workflows and Business Logic

### 5.1. Patient Intake Workflow

*   Patients access intake forms (e.g., "Patient Intake Form").
*   They fill out personal info, medical history, and service preferences.
*   Form progress can be saved and resumed.
*   Upon submission, the `useSubmitForm()` hook processes the data.

### 5.2. Form Creation and Deployment

*   Administrators use the `IntakeFormEditor.jsx` to define new forms or modify existing ones.
*   Form definitions are stored as JSONB schemas in the `questionnaire` table.
*   Forms are "deployed" by setting `is_active` to true, making them accessible via API hooks and frontend pages.

### 5.3. Form Submission Processing

*   Submitted form data is sent via `useSubmitForm()` and stored in the `form_requests` table.
*   **Automated Actions**:
    *   **Patient Account Creation/Update**: If a new patient, an account is created; otherwise, existing patient data is updated.
    *   **Automatic Tagging**: Patients are tagged based on `service_type` (e.g., 'paid_service') and `category_id` (e.g., 'category_intake').
    *   **Notifications**: CRM notifications are sent for new registrations/submissions.
    *   **Completion Actions**: Form definitions can specify actions like `create_appointment` and `send_confirmation` upon successful submission.

## 6. Form Templates and Schema

Form definitions are JSON objects stored in the `questionnaire.form_data` or `questionnaire.structure` columns.

*   **Root Level**: `flowConfig` (metadata like `title`, `description`, `version`, `completionMessage`) and `pages`.
*   **Pages**: An array of objects, each defining a form page with `id`, `title`, `description`, and an `elements` array.
*   **Elements (Fields)**: Each element defines a form field with:
    *   `id`, `type` (e.g., `textarea`, `select`, `number`, `radio`, `checkbox`, `text_input`, `email`, `tel`, `date`)
    *   `label`, `required`, `placeholder`, `options`, `helpText`
    *   `validation`: Object with rules like `min_length`, `max_length`, `min`, `max`, `email_format`, `phone_format`, `max_date`.
*   **Conditionals**: Rules to control field visibility or trigger messages based on other field values.
*   **Completion Actions**: Actions to execute upon form submission (e.g., `create_appointment`, `send_confirmation`).

## 7. External Integrations

*   **Supabase Edge Functions**: Used for sending form reminders, resending forms, and sending form assignment notifications (e.g., `send-form-reminder`, `resend-form`, `send-form-notification`). The `netlify/functions/generate-form.js` function uses AI to generate form schemas.
*   **Email Notifications**: Indicated by `send_confirmation` actions in form templates, suggesting integration with an email service.
*   **Appointment Scheduling**: `create_appointment` actions suggest integration with an appointment management system.

## 8. Testing and Quality Assurance

*   **Cypress E2E Tests**:
    *   `cypress/e2e/patient-journeys/complete-patient-flow.cy.js`: Covers patient registration and intake form completion, including medical history and insurance.
    *   `cypress/e2e/admin-journeys/provider-workflow.cy.js`: Tests the administrative review of patient intake forms and flagging for additional information.
*   **Validation**: Client-side validation is implemented via `formValidation.js` and `ValidationErrorDisplay.jsx`, with database-level constraints providing a final layer of integrity. E2E tests confirm successful submissions, implying validation is handled.

## 9. Conclusion

The forms system is a well-structured and integrated part of the Zappy-Dashboard, leveraging Supabase for its backend and React for its dynamic frontend. It provides a flexible framework for managing form templates, processing submissions, and automating patient-related workflows, with clear separation of concerns across its database, API, and component layers.