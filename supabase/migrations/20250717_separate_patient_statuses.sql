-- This migration standardizes patient status into the tags system.

-- Step 1: Create status-related tags if they don't exist
INSERT INTO tags (name, type, color, description)
VALUES
    ('Status: Active', 'status', '#22C55E', 'Patient is actively receiving care.'),
    ('Status: Suspended', 'status', '#F97316', 'Patient account is temporarily suspended.'),
    ('Status: Banned', 'status', '#EF4444', 'Patient is permanently banned.'),
    ('Status: ID Verified', 'verification', '#10B981', 'Patient ID has been successfully verified.'),
    ('Status: ID Pending', 'verification', '#EAB308', 'Patient ID verification is pending.'),
    ('Status: ID Rejected', 'verification', '#DC2626', 'Patient ID verification was rejected.'),
    ('Status: Not Required', 'verification', '#A1A1AA', 'ID verification is not required for this patient.')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Function to migrate a single status to a tag for a patient
CREATE OR REPLACE FUNCTION migrate_status_to_tag(p_patient_id UUID, p_status_value TEXT, p_status_type TEXT)
RETURNS void AS $$
DECLARE
    v_tag_id UUID;
BEGIN
    -- Find the corresponding tag ID
    SELECT id INTO v_tag_id FROM tags WHERE name = p_status_value AND type = p_status_type LIMIT 1;

    -- If tag exists, create the patient-tag relationship
    IF v_tag_id IS NOT NULL THEN
        INSERT INTO patient_tags (patient_id, tag_id)
        VALUES (p_patient_id, v_tag_id)
        ON CONFLICT (patient_id, tag_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Migrate existing statuses to tags
DO $$
DECLARE
    patient_record RECORD;
BEGIN
    FOR patient_record IN SELECT id, account_status, id_verification_status FROM patients LOOP
        -- Migrate account_status
        IF patient_record.account_status IS NOT NULL THEN
            PERFORM migrate_status_to_tag(patient_record.id, 'Status: ' || INITCAP(patient_record.account_status), 'status');
        END IF;

        -- Migrate id_verification_status
        IF patient_record.id_verification_status IS NOT NULL THEN
            PERFORM migrate_status_to_tag(patient_record.id, 'Status: ID ' || INITCAP(patient_record.id_verification_status), 'verification');
        END IF;
    END LOOP;
END $$;

-- Step 4: Drop the old status columns
ALTER TABLE patients
DROP COLUMN IF EXISTS account_status,
DROP COLUMN IF EXISTS id_verification_status;

-- Step 5: Clean up the helper function
DROP FUNCTION IF EXISTS migrate_status_to_tag(UUID, TEXT, TEXT);

-- Add a comment to the patients table to document the change
COMMENT ON TABLE patients IS 'Patient status is now managed via the tags system. Old status columns (account_status, id_verification_status) were migrated and removed on 2025-07-17.';
