
-- Migration to separate patient status into the tags system
-- This ensures a single source of truth for patient categorization

-- Step 1: Ensure the standard status tags exist in the `tags` table
-- Using ON CONFLICT to avoid errors if they already exist
INSERT INTO tags (name, color, description)
VALUES 
  ('Active', '#22C55E', 'Patient is currently active.'),
  ('Deactivated', '#888888', 'Patient is temporarily deactivated.'),
  ('Blacklisted', '#EF4444', 'Patient is permanently blacklisted.')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create a temporary function to migrate statuses
DO $$
DECLARE
    patient_record RECORD;
    tag_id_active UUID;
    tag_id_deactivated UUID;
    tag_id_blacklisted UUID;
BEGIN
    -- Get the IDs of our status tags
    SELECT id INTO tag_id_active FROM tags WHERE name = 'Active';
    SELECT id INTO tag_id_deactivated FROM tags WHERE name = 'Deactivated';
    SELECT id INTO tag_id_blacklisted FROM tags WHERE name = 'Blacklisted';

    -- Loop through all patients that have a status column defined
    FOR patient_record IN
        SELECT id, status, account_status, id_verification_status FROM patients
    LOOP
        -- Handle the primary 'status' column
        IF patient_record.status IS NOT NULL THEN
            IF patient_record.status = 'active' AND tag_id_active IS NOT NULL THEN
                INSERT INTO patient_tags (patient_id, tag_id)
                VALUES (patient_record.id, tag_id_active)
                ON CONFLICT (patient_id, tag_id) DO NOTHING;
            ELSIF patient_record.status = 'deactivated' AND tag_id_deactivated IS NOT NULL THEN
                INSERT INTO patient_tags (patient_id, tag_id)
                VALUES (patient_record.id, tag_id_deactivated)
                ON CONFLICT (patient_id, tag_id) DO NOTHING;
            ELSIF patient_record.status = 'blacklisted' AND tag_id_blacklisted IS NOT NULL THEN
                INSERT INTO patient_tags (patient_id, tag_id)
                VALUES (patient_record.id, tag_id_blacklisted)
                ON CONFLICT (patient_id, tag_id) DO NOTHING;
            END IF;
        END IF;

        -- Handle the 'account_status' column if it exists
        IF patient_record.account_status IS NOT NULL THEN
             IF patient_record.account_status = 'active' AND tag_id_active IS NOT NULL THEN
                INSERT INTO patient_tags (patient_id, tag_id)
                VALUES (patient_record.id, tag_id_active)
                ON CONFLICT (patient_id, tag_id) DO NOTHING;
             END IF;
        END IF;
        
        -- You could add more logic for other legacy status columns if needed

    END LOOP;
END $$;


-- Step 3: Remove the old status columns from the `patients` table
-- Using IF EXISTS to prevent errors if the columns are already gone
ALTER TABLE patients
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS account_status,
  DROP COLUMN IF EXISTS id_verification_status;
  
-- Add a comment to the table to document this change
COMMENT ON TABLE patients IS 'The status, account_status, and id_verification_status columns were migrated to the tags system on 2025-07-17 and have been removed.';
