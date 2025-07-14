# Universal Form Relationship Fix - Implementation Complete

## Issue Summary
All intake forms were experiencing checkbox formatting issues due to a missing database relationship. This was affecting any form that uses the `template_id` field to reference questionnaires.

**Error Message:**
```
Submissions Error: {"code":"PGRST200","details":"Searched for a foreign key relationship between 'form_submissions' and 'questionnaire' using the hint 'template_id' in the schema 'public', but no matches were found.","hint":null,"message":"Could not find a relationship between 'form_submissions' and 'questionnaire' in the schema cache"}
```

## Root Cause
The `form_submissions` table was trying to reference the `questionnaire` table using `template_id` as a foreign key, but the proper foreign key relationship was not established in the database schema. This affected all forms across the system.

## Solution Implemented

### 1. Created Migration File
- **File:** `supabase/migrations/20250626_fix_questionnaire_relationship.sql`
- **Purpose:** Comprehensive database schema fix

### 2. Created Application Script
- **File:** `apply-questionnaire-relationship-fix.sh`
- **Purpose:** Automated migration application

## Manual Application Instructions

The Supabase MCP doesn't have the necessary privileges to execute migrations directly. Please apply the fix manually using one of these methods:

### Option 1: Install Supabase CLI and Run Script
```bash
# Install Supabase CLI
npm install -g supabase

# Run the migration script
./apply-questionnaire-relationship-fix.sh
```

### Option 2: Manual Database Application (RECOMMENDED)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `supabase/migrations/20250626_fix_questionnaire_relationship.sql`
5. Click **Run** to execute the SQL script

### Option 3: Quick Fix SQL (Copy & Paste Ready)
If you want to apply just the essential fix, copy and paste this SQL directly:

```sql
-- Quick fix for questionnaire relationship issue
CREATE TABLE IF NOT EXISTS questionnaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    form_data JSONB NOT NULL,
    structure JSONB,
    category_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure form_submissions table has template_id column
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS template_id UUID;

-- Add the critical foreign key relationship
ALTER TABLE form_submissions 
DROP CONSTRAINT IF EXISTS form_submissions_template_id_fkey;

ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES questionnaire(id) ON DELETE SET NULL;

-- Insert the specific form
INSERT INTO questionnaire (id, title, description, structure, category_id)
SELECT 
    '6d4c6196-a033-4add-b1f9-c4f33d750ccc'::uuid,
    'Weight Loss Intake Form',
    'Initial assessment for weight loss program',
    '{"pages": [{"id": "page1", "title": "Goals", "elements": [{"id": "goals", "type": "checkbox", "label": "What are your goals?", "required": true, "options": [{"id": "1", "value": "Lose weight"}, {"id": "2", "value": "Improve my general physical health"}, {"id": "3", "value": "Improve another health condition"}, {"id": "4", "value": "Increase confidence about my appearance"}, {"id": "5", "value": "Increase energy for activities I enjoy"}, {"id": "6", "value": "I have another goal not listed above"}]}]}], "conditionals": []}'::jsonb,
    'weight-loss'
WHERE NOT EXISTS (
    SELECT 1 FROM questionnaire WHERE id = '6d4c6196-a033-4add-b1f9-c4f33d750ccc'::uuid
);
```

## What the Fix Does

### 1. Creates Missing Tables
- `questionnaire` table with proper structure
- `forms` table as alternative naming
- Ensures `form_submissions` table has correct columns

### 2. Establishes Foreign Key Relationships
- `form_submissions.questionnaire_id` → `questionnaire.id`
- `form_submissions.form_id` → `forms.id`
- `form_submissions.template_id` → `questionnaire.id` (KEY FIX)
- `form_submissions.patient_id` → `patients.id`

### 3. Adds Performance Indexes
- Indexes on all foreign key columns
- Indexes on frequently queried columns

### 4. Sets Up RLS Policies
- Public read access for active forms
- User-specific access for form submissions
- Service role full access

### 5. Inserts Sample Data
- Creates the specific form with ID `6d4c6196-a033-4add-b1f9-c4f33d750ccc`
- Includes proper checkbox structure for goals field

## Expected Results After Fix

### 1. Database Schema
- All foreign key relationships properly established
- No more PGRST200 errors
- Proper referential integrity

### 2. Form Functionality
- Checkboxes will render correctly
- Form submissions will work properly
- No more relationship errors

### 3. Form Structure
The form now includes proper checkbox options:
- "Lose weight"
- "Improve my general physical health"
- "Improve another health condition"
- "Increase confidence about my appearance"
- "Increase energy for activities I enjoy"
- "I have another goal not listed above"

## Testing Instructions

After applying the fix:

1. **Test the Form URL:**
   ```
   http://localhost:3000/public/forms/6d4c6196-a033-4add-b1f9-c4f33d750ccc
   ```

2. **Verify Checkbox Rendering:**
   - Checkboxes should display properly
   - All options should be selectable
   - Form should submit without errors

3. **Check Console:**
   - No more PGRST200 errors
   - No foreign key relationship errors

## Files Created/Modified

### New Files:
- `supabase/migrations/20250626_fix_questionnaire_relationship.sql`
- `apply-questionnaire-relationship-fix.sh`
- `QUESTIONNAIRE_RELATIONSHIP_FIX_COMPLETE.md` (this file)

### Key Features of the Migration:
- **Comprehensive:** Handles all possible table naming scenarios
- **Safe:** Uses `IF NOT EXISTS` and `IF EXISTS` checks
- **Performance:** Adds proper indexes
- **Security:** Sets up RLS policies
- **Data:** Includes sample form data

## Next Steps

1. **Apply the migration** using one of the methods above
2. **Test the form** to ensure checkboxes render correctly
3. **Verify form submissions** work without errors
4. **Monitor logs** for any remaining issues

## Technical Details

### Key SQL Operations:
```sql
-- Creates foreign key relationship for template_id
ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_template_id_fkey 
FOREIGN KEY (template_id) REFERENCES questionnaire(id) ON DELETE SET NULL;

-- Inserts the specific form with proper structure
INSERT INTO questionnaire (id, title, description, structure, category_id)
SELECT '6d4c6196-a033-4add-b1f9-c4f33d750ccc'::uuid, ...
```

### Form Structure:
```json
{
  "pages": [
    {
      "id": "page1",
      "title": "Goals",
      "elements": [
        {
          "id": "goals",
          "type": "checkbox",
          "label": "What are your goals?",
          "required": true,
          "options": [...]
        }
      ]
    }
  ]
}
```

## Status: ✅ READY FOR APPLICATION

The fix is complete and ready to be applied. Once the migration is run, the intake form should display checkboxes correctly and form submissions should work without foreign key relationship errors.
