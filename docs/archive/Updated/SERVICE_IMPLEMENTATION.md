# Service Management Implementation Guide

This document outlines the changes made to the Services feature of the Zappy Dashboard to accommodate product relationships and subscription plan integrations.

## Database Schema Changes

We've created a migration script to address the data structure needs of the ServiceManagement component. The key changes are:

1. **Added a column to the services table**
   - `requires_consultation` (BOOLEAN) - Indicates if a service requires a consultation

2. **Created junction tables for relationships**
   - `service_products` - Links services to products
   - `service_plans` - Links services to subscription plans with configuration data

3. **Implemented Row Level Security (RLS) policies**
   - Only authenticated users can view services and related tables
   - Only admin users can modify services and related tables

## Implementation Steps

### 1. Apply the Migration in Supabase

Run the migration script in your Supabase SQL Editor:

1. Navigate to the Supabase Dashboard
2. Select your project
3. Go to the SQL Editor tab
4. Open and run the script from `supabase/migrations/20250426000000_create_service_junction_tables.sql`

### 2. Configure Row Level Security (RLS)

Verify RLS is configured correctly:

1. In the Supabase Dashboard, go to Authentication > Policies
2. Confirm that policies exist for the services, service_products, and service_plans tables
3. If policies are missing, re-run the migration script

### 3. Test API Access

Test the API access to make sure the React Query hooks can properly interact with the data:

1. Create a new service through the UI
2. Add products and subscription plans to the service
3. Verify the relationships are correctly stored in the database

## Data Model

The new relations between services, products, and subscription plans can be visualized as follows:

```
┌────────────┐       ┌───────────────────┐       ┌────────────┐
│            │       │                   │       │            │
│  services  │──────»│  service_products │«─────»│  products  │
│            │       │                   │       │            │
└────────────┘       └───────────────────┘       └────────────┘
      │
      │               ┌───────────────────┐       ┌──────────────────┐
      └──────────────»│  service_plans    │«─────»│ subscription_plans│
                      │                   │       │                  │
                      └───────────────────┘       └──────────────────┘
```

## React Query Hook Implementation

We've updated the React Query hooks to support these database changes:

1. **useServices**
   - Now fetches related products and subscription plans for each service

2. **useServiceById**
   - Fetches a single service with its associated products and plans

3. **useCreateService**
   - Creates a new service and establishes relationships with products and plans

4. **useUpdateService**
   - Updates a service and its relationships with products and plans

5. **useDeleteService**
   - Deletes a service and related records (via CASCADE)

## Maintaining the Code

When making changes to the services feature, be aware of these considerations:

1. The `associatedProducts` and `availablePlans` fields are loaded separately and joined in the React Query hooks
2. The component assumes these fields exist and have the correct structure
3. Always handle loading and error states to ensure a good user experience