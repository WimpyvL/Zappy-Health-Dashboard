-- supabase/migrations/20250717_separate_patient_statuses.sql

BEGIN;

-- Add new columns for separate status tracking
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
CHECK (account_status IN ('active', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(20) DEFAULT 'not_required'
CHECK (id_verification_status IN ('verified', 'pending', 'rejected', 'not_required'));

-- Add comments for clarity
COMMENT ON COLUMN public.patients.account_status IS 'Tracks the patient''s platform access status (active, suspended, banned).';
COMMENT ON COLUMN public.patients.id_verification_status IS 'Tracks the status of patient ID verification for prescription eligibility.';

-- Migrate data from old 'status' column to new columns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'patients'
        AND column_name = 'status'
    ) THEN
        -- Migrate data based on the old status values
        UPDATE public.patients
        SET
            account_status = CASE
                WHEN status = 'deactivated' THEN 'suspended'
                WHEN status = 'blacklisted' THEN 'banned'
                ELSE 'active'
            END,
            id_verification_status = CASE
                WHEN status = 'pending' THEN 'pending'
                ELSE 'not_required'
            END
        WHERE status IS NOT NULL;
    END IF;
END $$;

-- Set default for existing NULL rows
UPDATE public.patients SET account_status = 'active' WHERE account_status IS NULL;
UPDATE public.patients SET id_verification_status = 'not_required' WHERE id_verification_status IS NULL;


-- Drop the old 'status' column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'patients'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.patients DROP COLUMN status;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_account_status ON public.patients(account_status);
CREATE INDEX IF NOT EXISTS idx_patients_id_verification_status ON public.patients(id_verification_status);

COMMIT;
