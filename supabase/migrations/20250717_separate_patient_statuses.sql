
-- Migration to separate patient statuses into the tags system
-- This script moves data from old status columns to the tags system and removes the old columns.

BEGIN;

-- 1. Ensure required extensions and tables exist for safety
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, tag_id)
);

-- 2. Create the status tags if they don't exist
INSERT INTO tags (name, color, description)
VALUES
    ('Active', '#22C55E', 'Patient is currently active in a program.'),
    ('Inactive', '#6B7280', 'Patient is not currently active.'),
    ('Suspended', '#F59E0B', 'Patient account is temporarily suspended.'),
    ('Blacklisted', '#EF4444', 'Patient is permanently banned.'),
    ('ID Verified', '#3B82F6', 'Patient identity has been verified.'),
    ('ID Pending', '#A855F7', 'Patient identity verification is pending.'),
    ('ID Rejected', '#D946EF', 'Patient identity verification was rejected.')
ON CONFLICT (name) DO NOTHING;

-- 3. Migrate data from `account_status` to tags
DO $$
DECLARE
    patient_record RECORD;
    status_tag_id UUID;
BEGIN
    FOR patient_record IN SELECT id, account_status FROM patients WHERE account_status IS NOT NULL
    LOOP
        -- Find the corresponding tag ID
        SELECT id INTO status_tag_id FROM tags WHERE name = INITCAP(patient_record.account_status);

        IF status_tag_id IS NOT NULL THEN
            -- Insert into patient_tags, handling potential conflicts
            INSERT INTO patient_tags (patient_id, tag_id)
            VALUES (patient_record.id, status_tag_id)
            ON CONFLICT (patient_id, tag_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- 4. Migrate data from `id_verification_status` to tags
DO $$
DECLARE
    patient_record RECORD;
    id_status_tag_id UUID;
    tag_name TEXT;
BEGIN
    FOR patient_record IN SELECT id, id_verification_status FROM patients WHERE id_verification_status IS NOT NULL
    LOOP
        -- Map the verification status to a tag name
        tag_name := CASE patient_record.id_verification_status
            WHEN 'verified' THEN 'ID Verified'
            WHEN 'pending' THEN 'ID Pending'
            WHEN 'rejected' THEN 'ID Rejected'
            ELSE NULL
        END;

        IF tag_name IS NOT NULL THEN
            -- Find the corresponding tag ID
            SELECT id INTO id_status_tag_id FROM tags WHERE name = tag_name;

            IF id_status_tag_id IS NOT NULL THEN
                -- Insert into patient_tags, handling potential conflicts
                INSERT INTO patient_tags (patient_id, tag_id)
                VALUES (patient_record.id, id_status_tag_id)
                ON CONFLICT (patient_id, tag_id) DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Safely drop the old status columns from the patients table
ALTER TABLE patients
DROP COLUMN IF EXISTS account_status,
DROP COLUMN IF EXISTS id_verification_status;

COMMIT;
