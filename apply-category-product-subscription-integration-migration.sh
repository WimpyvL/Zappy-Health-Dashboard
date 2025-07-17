#!/bin/bash

# This script applies the category, product, and subscription integration migration
# to your Supabase database using the Supabase CLI.

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI could not be found. Please install it first."
    echo "You can find installation instructions at: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "Applying category, product, and subscription integration migration..."

# Push the specific migration file
supabase db push --file supabase/migrations/20250615_add_category_product_subscription_integration.sql

# Check the exit code of the last command
if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully."
    echo "The database schema has been updated with the new telehealth flow tables."
    echo "Next steps:"
    echo "1. Integrate the useTelehealthFlow hook into your frontend components."
    echo "2. Test the end-to-end telehealth flow."
else
    echo "❌ Migration failed."
    echo "Please check the error messages above and your Supabase project status."
fi
