# Treatment Packages Migration Guide

## Overview

This document outlines the migration of the Treatment Packages functionality into the unified Products & Subscriptions management system. The goal is to simplify the admin interface by consolidating related features under one umbrella.

## Changes Made

1. **UI Changes**:
   - Removed Treatment Packages link from the sidebar
   - Redirected Treatment Packages routes to the unified Products & Subscriptions page

2. **Code Changes**:
   - Added Categories management to the Products & Subscriptions page
   - Created migration scripts to move data from treatment_package to subscription_plans
   - Deprecated the Treatment Packages components and routes

3. **Database Changes**:
   - Created a new categories table
   - Added migration script to convert treatment packages to subscription plans
   - Added comments to mark deprecated tables

## Migration Steps

### 1. Apply Database Migrations

Run the following migrations in order:

```bash
# First, create the categories table
supabase db push --db-url=YOUR_DB_URL --migration-file=20240501000000_create_categories_table.sql

# Then, migrate the treatment packages data
supabase db push --db-url=YOUR_DB_URL --migration-file=20240502000000_migrate_treatment_packages.sql
```

### 2. Verify Data Migration

After running the migrations, verify that:

- All treatment packages have been migrated to subscription plans
- Categories have been created for all treatment package conditions
- The features field in subscription_plans contains the services from package_service

### 3. Update Patient Subscriptions

The migration script includes a commented section for updating patient subscriptions. This needs to be done manually after verifying the data migration:

```sql
UPDATE patient_subscription ps
SET package_id = sp.id
FROM subscription_plans sp
WHERE ps.package_id IN (SELECT id FROM treatment_package)
AND sp.features->>'migrated_from' = 'treatment_package'
AND (sp.features->>'original_id')::uuid = ps.package_id;
```

### 4. Update Frontend Code

The following components have been deprecated and should be removed in a future update:

- `src/pages/admin/TreatmentPackagesPage.jsx`
- `src/pages/admin/TreatmentPackageForm.jsx`
- `src/components/subscriptions/TreatmentPackageSelection.jsx`
- `src/apis/treatmentPackages/hooks.js`

For now, they remain in the codebase but are no longer accessible through the UI.

### 5. Update Patient Subscription Page

The patient subscription page still uses the old treatment packages API. This should be updated to use the subscription plans API instead. This will require changes to:

- `src/pages/patients/PatientSubscriptionPage.jsx`
- `src/components/subscriptions/PatientSubscriptionDetails.jsx`

## Benefits of Consolidation

1. **Simplified Admin Interface**: Administrators now have a single place to manage all product and subscription-related entities.

2. **Consistent Data Model**: Using categories across products, subscription plans, bundles, and services provides a consistent way to organize and filter items.

3. **Reduced Code Duplication**: Eliminates duplicate functionality between Treatment Packages and Subscription Plans.

4. **Improved Maintainability**: Fewer components and APIs to maintain, with a more standardized approach.

## Future Considerations

1. **Complete Removal**: Once all systems are using the new unified approach, the deprecated components and tables can be fully removed.

2. **API Consolidation**: Consider consolidating the subscription-related APIs further to reduce duplication.

3. **UI Enhancements**: The unified Products & Subscriptions page could be enhanced with additional filtering and sorting options.

4. **Subscription Durations**: 
   - Subscription Durations have been enhanced to support 28-day billing periods (see SUBSCRIPTION_DURATION_CHANGES.md)
   - Consider integrating Subscription Durations into the unified management page as well
