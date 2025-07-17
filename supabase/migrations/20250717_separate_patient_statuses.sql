-- Migration to separate patient status into account_status and id_verification_status

BEGIN;

-- 1. Add new columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS id_verification_status VARCHAR(20) DEFAULT 'not_required';

-- 2. Add CHECK constraints for the new columns
ALTER TABLE public.patients ADD CONSTRAINT account_status_check CHECK (account_status IN ('active', 'suspended', 'banned'));
ALTER TABLE public.patients ADD CONSTRAINT id_verification_status_check CHECK (id_verification_status IN ('verified', 'pending', 'rejected', 'not_required'));

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_account_status ON public.patients(account_status);
CREATE INDEX IF NOT EXISTS idx_patients_id_verification_status ON public.patients(id_verification_status);

-- 4. Migrate data from old 'status' column to new columns
-- This part assumes the old 'status' column exists. If it has been removed, this will do nothing.
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='status') THEN
        -- Migrate 'active' status
        UPDATE public.patients SET account_status = 'active' WHERE status = 'active';
        
        -- Migrate 'deactivated' to 'suspended'
        UPDATE public.patients SET account_status = 'suspended' WHERE status = 'deactivated';

        -- Migrate 'blacklisted' to 'banned'
        UPDATE public.patients SET account_status = 'banned' WHERE status = 'blacklisted';

        -- Handle 'pending' status - this becomes 'pending' for ID verification
        UPDATE public.patients SET id_verification_status = 'pending' WHERE status = 'pending';
        
        -- Set a default account status for former 'pending' patients if they don't have one
        UPDATE public.patients SET account_status = 'active' WHERE status = 'pending' AND account_status IS NULL;
    END IF;
END $$;


-- 5. Drop the old 'status' column
-- We check for existence before dropping to make the script re-runnable
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='status') THEN
        ALTER TABLE public.patients DROP COLUMN status;
    END IF;
END $$;

COMMIT;

-- Add comments for clarity
COMMENT ON COLUMN public.patients.account_status IS 'The access status of the patient''s account on the platform.';
COMMENT ON COLUMN public.patients.id_verification_status IS 'The status of the patient''s identity verification, required for prescriptions.';
