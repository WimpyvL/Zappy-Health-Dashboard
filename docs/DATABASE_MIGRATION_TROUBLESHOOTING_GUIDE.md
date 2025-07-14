# Database Migration Troubleshooting Guide

## Issue Identified
The error `Failed to load resource: the server responded with a status of 404` for `/rest/v1/note_templates` indicates that the database migrations have not been applied yet.

## Root Cause
The `note_templates` table and related tables don't exist in the Supabase database because the migrations haven't been run.

## 🚨 Critical Fix Required

### Step 1: Apply Missing Migrations
The following migrations need to be applied in order:

```bash
# 1. Apply the original note templates migration
./apply-note-templates-migration.sh

# 2. Apply the new block-based templates migration
./apply-block-based-templates-migration.sh
```

### Step 2: Verify Database Schema
After applying migrations, verify the tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'note_templates',
    'template_placeholders', 
    'consultation_notes',
    'template_blocks',
    'template_compositions',
    'patient_note_views'
);
```

### Step 3: Manual Migration Application (If Scripts Fail)

If the shell scripts don't work, apply the migrations manually:

#### 3.1 Apply Original Note Templates Migration
```sql
-- Run the contents of: supabase/migrations/20250521_add_note_templates.sql
-- This creates the base note_templates, template_placeholders, and consultation_notes tables
```

#### 3.2 Apply Block-Based Templates Migration
```sql
-- Run the contents of: supabase/migrations/20250608_add_block_based_templates.sql
-- This adds the new block-based functionality
```

## 🔧 Alternative Solutions

### Option 1: Use Supabase CLI
```bash
# Navigate to project root
cd /path/to/your/project

# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase migration up --target 20250608_add_block_based_templates
```

### Option 2: Use Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL files
4. Execute them in order

### Option 3: Create Tables Manually
If migrations continue to fail, create the essential tables manually:

```sql
-- Essential table creation (simplified version)
CREATE TABLE IF NOT EXISTS note_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    encounter_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert basic templates to get started
INSERT INTO note_templates (name, content, category, encounter_type) VALUES
('Basic Template', 'Dear [PATIENT_NAME], Thank you for your consultation. [MEDICATIONS_LIST] Best regards, [PROVIDER_NAME]', 'general', 'initial_consultation');
```

## 🚀 Quick Fix for Immediate Testing

### Temporary Mock Data Solution
If you need to test the UI immediately while fixing the database:

```javascript
// In src/pages/admin/NoteTemplatesPage.jsx
// Replace the fetchTemplates function temporarily:

const fetchTemplates = async () => {
  setLoading(true);
  try {
    // Temporary mock data for testing
    const mockTemplates = [
      {
        id: '1',
        name: 'Weight Management Initial',
        content: 'Dear [PATIENT_NAME], Thank you for your consultation...',
        category: 'weight_management',
        encounter_type: 'initial_consultation',
        created_at: new Date().toISOString()
      }
    ];
    
    setTemplates(mockTemplates);
    setError(null);
  } catch (err) {
    console.error('Error with mock templates:', err);
    setError('Failed to load templates');
  } finally {
    setLoading(false);
  }
};
```

## 📋 Migration Verification Checklist

After applying migrations, verify:

- [ ] `note_templates` table exists
- [ ] `template_placeholders` table exists  
- [ ] `consultation_notes` table exists
- [ ] `template_blocks` table exists
- [ ] `template_compositions` table exists
- [ ] `patient_note_views` table exists
- [ ] Default templates are inserted
- [ ] Default placeholders are inserted
- [ ] Default template blocks are inserted
- [ ] RLS policies are enabled
- [ ] Database functions are created

## 🔍 Debugging Commands

### Check Migration Status
```bash
supabase migration list
```

### Check Database Connection
```bash
supabase db ping
```

### View Current Schema
```sql
\dt public.*
```

### Check for Errors in Logs
```bash
supabase logs
```

## 📞 Next Steps

1. **Immediate**: Apply the missing migrations using one of the methods above
2. **Verify**: Check that all tables exist and contain default data
3. **Test**: Reload the Note Templates page to confirm it works
4. **Monitor**: Watch for any additional migration-related errors

## 🚨 Emergency Fallback

If all migration attempts fail, you can temporarily disable the note templates functionality:

```javascript
// In src/pages/admin/NoteTemplatesPage.jsx
// Add this at the top of the component:

if (true) { // Set to false once migrations are fixed
  return (
    <div className="container mx-auto p-6">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <strong>Database Migration Required:</strong> Please apply the note templates migrations before using this feature.
        <br />
        <code>./apply-note-templates-migration.sh && ./apply-block-based-templates-migration.sh</code>
      </div>
    </div>
  );
}
```

This will prevent the 404 errors while you fix the database schema.
