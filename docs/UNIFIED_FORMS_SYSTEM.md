# Unified Forms System Documentation

## Overview

The forms system has been unified to use consistent tables and eliminate legacy code. This document describes the new, simplified architecture.

## Architecture

### Core Tables

1. **`questionnaire`** - Unified form templates/definitions
2. **`form_requests`** - Unified form submissions/responses  
3. **`form_progress`** - Form save/resume functionality (unchanged)

### Removed Legacy Tables

- ❌ `form_templates` (replaced by `questionnaire`)
- ❌ `form_template_versions` (versioning now in `questionnaire`)
- ❌ `form_submissions` (replaced by `form_requests`)

## Database Schema

### questionnaire Table

```sql
CREATE TABLE questionnaire (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  service_type TEXT DEFAULT 'paid' CHECK (service_type IN ('free', 'paid')),
  schema JSONB, -- Form structure and fields
  slug TEXT UNIQUE,
  form_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### form_requests Table

```sql
CREATE TABLE form_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES questionnaire(id) ON DELETE CASCADE,
  status form_request_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  response_data JSONB, -- Submitted form answers
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Code Changes

### Admin Interface Updates

The admin form editor (`src/pages/admin/IntakeFormEditor.jsx`) now:
- ✅ Uses `questionnaire` table instead of `form_templates`
- ✅ Simplified versioning (no separate versions table)
- ✅ Consistent field mapping

### API Hooks Updates

The form submission hooks (`src/apis/formSubmissions/hooks.js`) now:
- ✅ `usePatientFormSubmissions()` - Reads from `form_requests` 
- ✅ `useFormTemplates()` - Reads from `questionnaire`
- ✅ `useFormTemplate()` - Reads from `questionnaire`
- ✅ `useSubmitForm()` - Writes to `form_requests`
- ✅ Form progress hooks unchanged (still use `form_progress`)

### Data Mapping

For backward compatibility, the hooks provide consistent interfaces:

```javascript
// form_requests → legacy interface
{
  id: request.id,
  form_data: request.response_data,
  template_id: request.questionnaire_id,
  submitted_at: request.completed_at
}

// questionnaire → legacy interface  
{
  title: questionnaire.name,
  status: questionnaire.is_active ? 'active' : 'inactive'
}
```

## Migration Process

### 1. Apply Unification Migration

```bash
# Apply the main migration
supabase db migrate up 20250612000000_unify_forms_system.sql
```

This migration:
- Adds missing columns to `questionnaire` table
- Migrates data from `form_templates` to `questionnaire`
- Migrates data from `form_submissions` to `form_requests`
- Creates helper functions for backward compatibility

### 2. Test the System

Verify all functionality works:
- ✅ Admin can create/edit forms
- ✅ Users can submit forms
- ✅ Form progress save/resume works
- ✅ Form data appears correctly

### 3. Drop Legacy Tables

```bash
# Only after confirming everything works
supabase db migrate up 20250612000001_drop_legacy_form_tables.sql
```

This migration:
- Creates backup views for safety
- Updates triggers to work with new tables
- Drops legacy tables: `form_templates`, `form_template_versions`, `form_submissions`

## Features

### ✅ Unified Form Management
- Single source of truth for form templates
- Simplified admin interface
- Consistent API across the application

### ✅ Improved Data Flow
- Clear separation: templates vs submissions
- Proper foreign key relationships
- Better data integrity

### ✅ Form Progress (Unchanged)
- Save/resume functionality preserved
- Works with any form type
- Automatic cleanup of old progress

### ✅ Automatic Tagging
- Patients automatically tagged based on:
  - Service type (free_service/paid_service)
  - Form category (category_*)
  - Status (lead/active)

## API Reference

### Form Templates

```javascript
// Get all active templates
const { data: templates } = useFormTemplates();

// Get specific template
const { data: template } = useFormTemplate(templateId);

// Get templates by category
const { data: templates } = useFormTemplates('weight_management');
```

### Form Submissions

```javascript
// Submit a form
const submitForm = useSubmitForm();
await submitForm.mutateAsync({
  patientId: 'uuid',
  templateId: 'uuid', 
  categoryId: 'intake',
  formData: { /* form answers */ },
  serviceType: 'paid'
});

// Get patient submissions
const { data: submissions } = usePatientFormSubmissions(patientId);
```

### Form Progress

```javascript
// Save progress
const saveProgress = useSaveFormProgress();
await saveProgress.mutateAsync({
  patientId: 'uuid',
  formType: 'intake',
  currentStep: 2,
  stepData: { /* partial form data */ }
});

// Get saved progress
const { data: progress } = useFormProgress(patientId, 'intake');
```

## Verification Queries

After migration, run these to verify data integrity:

```sql
-- 1. Check questionnaire table has expected data
SELECT COUNT(*) as questionnaire_count FROM questionnaire;

-- 2. Check form_requests table has expected data  
SELECT COUNT(*) as form_requests_count FROM form_requests;

-- 3. Check form_progress table is still intact
SELECT COUNT(*) as form_progress_count FROM form_progress;

-- 4. Verify no references to dropped tables exist
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%form_template%' OR column_name LIKE '%form_submission%';
```

## Troubleshooting

### Common Issues

1. **Foreign key errors**: Ensure all `questionnaire_id` references are valid
2. **Data mapping issues**: Check that response_data structure matches expected form_data
3. **Permission errors**: Verify RLS policies are correctly applied

### Rollback Strategy

If issues occur:
1. The migration creates backup views for data recovery
2. Legacy data is preserved during the unification step
3. Full rollback requires restoring from database backup

## Benefits

- 📈 **Simplified Architecture**: Single flow for all forms
- 🔧 **Easier Maintenance**: Less code duplication
- 🚀 **Better Performance**: Optimized queries and indexes
- 🛡️ **Data Integrity**: Proper foreign key relationships
- 📊 **Consistent Analytics**: Unified data structure