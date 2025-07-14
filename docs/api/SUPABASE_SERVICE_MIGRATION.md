# Supabase Service Management Migration Guide

This document provides step-by-step instructions for applying the service management database migration to your Supabase project.

## Background

The ServiceManagement.jsx component expects services to have relationships with products and subscription plans. The current database schema doesn't include these relationships, so we've created a migration script to add the necessary tables and fields.

## Prerequisites

- Access to your Supabase project dashboard
- Admin privileges to run SQL queries

## Steps to Apply the Migration

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Select your Zappy Dashboard project

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New query" to create a new SQL script

3. **Copy Migration Script**
   - Open `supabase/migrations/20250426000000_create_service_junction_tables.sql` from your project
   - Copy all contents of the file

4. **Paste and Run the Script**
   - Paste the copied SQL into the Supabase SQL Editor
   - Click "Run" to execute the script
   - Verify that the script executes without errors

5. **Verify Table Creation**
   - In the Supabase Dashboard, go to "Table Editor" 
   - Confirm that the following tables exist:
     - `service_products`
     - `service_plans`
   - Check that the `services` table now has a `requires_consultation` column

6. **Verify RLS Policies**
   - Go to "Authentication" > "Policies" in the Supabase Dashboard
   - Check that RLS is enabled for `services`, `service_products`, and `service_plans`
   - Verify that the appropriate policies exist for each table

## Troubleshooting

If you encounter any errors during migration:

1. **Duplicate table errors**: If tables already exist, you may need to drop them first with `DROP TABLE table_name CASCADE;`

2. **Permission errors**: Ensure you're logged in with admin privileges

3. **RLS policy errors**: If policies can't be created, check if the table exists and RLS is enabled

## Testing the Changes

After applying the migration:

1. Open the Zappy Dashboard application
2. Navigate to the Service Management page
3. Attempt to create a new service with associated products and subscription plans
4. Verify that the relationships are correctly saved and displayed

## Support

If you encounter any issues with this migration, please contact the development team for assistance.