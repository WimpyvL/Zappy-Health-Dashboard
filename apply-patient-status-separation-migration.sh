
#!/bin/bash
# This script applies the patient status separation migration to your Supabase database.

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI could not be found. Please install it first."
    echo "You can find installation instructions at: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "Applying patient status separation migration..."

# Push the specific migration file
supabase db push --file supabase/migrations/20250717_separate_patient_statuses.sql

# Check the exit code of the last command
if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully."
    echo "The 'patients' table has been updated. Old status columns have been migrated to the tags system and removed."
    echo "Next steps:"
    echo "1. Verify the changes in your Supabase dashboard by checking the 'tags' and 'patient_tags' tables."
    echo "2. Test patient list filtering to ensure tag-based status filtering works correctly."
else
    echo "❌ Migration failed."
    echo "Please check the error messages above and your Supabase project status."
fi
