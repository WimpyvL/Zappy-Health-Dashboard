# Questionnaire Schema Migration Instructions

## Background
The questionnaire table is missing a `status` column that is required for the Modern Intake Form functionality.

## Migration SQL
The following SQL needs to be executed on your Supabase database:

```sql
-- Fix the questionnaire table schema
-- Add missing status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questionnaire'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE questionnaire ADD COLUMN status BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add comment explaining the purpose of this column
COMMENT ON COLUMN questionnaire.status IS 'Indicates whether the form is active (true) or inactive (false)';

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_questionnaire_status ON questionnaire(status);

-- Update any existing records to have status=true
UPDATE questionnaire SET status = true WHERE status IS NULL;
```

## How to Apply This Migration

### Option 1: Using the Supabase Dashboard
1. Log in to your Supabase dashboard at https://app.supabase.io
2. Select your project
3. Go to the SQL Editor
4. Paste the SQL above
5. Click "Run" to execute the SQL

### Option 2: Using the Supabase CLI (when installed)
1. Install the Supabase CLI by following the instructions at: https://supabase.com/docs/guides/cli
2. Run the following command:
   ```
   supabase db push --db-url postgresql://postgres:postgres@localhost:5432/postgres
   ```

### Option 3: Using the Supabase REST API
If you have admin privileges, you can create a custom function in Supabase that can execute SQL, and then call that function via the REST API.

## Verification
After applying the migration, you can verify it worked by:
1. Checking if the questionnaire table has a status column
2. Confirming all existing records have status=true
3. Testing the Modern Intake Form functionality

## Troubleshooting
If you encounter any issues:
1. Check the Supabase logs for error messages
2. Ensure you have the necessary permissions to alter tables
3. Contact support if you continue to experience problems
