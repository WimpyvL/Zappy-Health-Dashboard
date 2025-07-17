-- supabase/migrations/20250717_separate_patient_statuses.sql

BEGIN;

-- 1. Add new columns for separated statuses
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' 
CHECK (account_status IN ('active', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(20) DEFAULT 'not_required'
CHECK (id_verification_status IN ('verified', 'pending', 'rejected', 'not_required'));

-- 2. Create a temporary mapping from old status to new statuses
-- This step is done in a transaction, so we can use a temporary table if needed,
-- but a CASE statement is simpler for this logic.
-- We update the new columns based on the values in the old 'status' column.
UPDATE public.patients
SET
  account_status = CASE
    WHEN status = 'active' THEN 'active'
    WHEN status = 'deactivated' THEN 'suspended'
    WHEN status = 'blacklisted' THEN 'banned'
    ELSE 'active' -- Default for any other or NULL values
  END,
  id_verification_status = CASE
    WHEN status = 'pending' THEN 'pending'
    ELSE 'not_required'
  END
WHERE
  column_exists('public', 'patients', 'status'); -- Only run if the old column exists

-- 3. Add indexes for performance on the new columns
CREATE INDEX IF NOT EXISTS idx_patients_account_status ON public.patients(account_status);
CREATE INDEX IF NOT EXISTS idx_patients_id_verification ON public.patients(id_verification_status);

-- 4. Safely drop the old 'status' column
-- The `column_exists` function is a helper to make this script runnable
-- even if parts of it have been applied before.
DO $$
BEGIN
   IF column_exists('public', 'patients', 'status') THEN
      ALTER TABLE public.patients DROP COLUMN status;
   END IF;
END;
$$;

-- Helper function to check for column existence before altering
CREATE OR REPLACE FUNCTION column_exists(schema_name text, table_name text, column_name text)
RETURNS boolean AS
$$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = schema_name
    AND table_name = table_name
    AND column_name = column_name
  );
END;
$$
LANGUAGE plpgsql;


COMMIT;
