# Migration Troubleshooting Guide

This guide provides solutions for common issues when applying migrations to your Supabase project, especially for the service management feature.

## "Failed to Fetch" Error

If you encounter a "Failed to fetch" error when running the migrations, try the following steps:

### 1. Check Supabase Connection

First, ensure your connection to Supabase is active:

1. Go to the [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Try running a simple query like `SELECT NOW();` in the SQL Editor
4. If this fails, you may have connectivity issues or your session might be expired
   - Try refreshing the page or logging out and back in

### 2. Verify Table Dependencies

The migration script assumes certain tables already exist. Check for their presence:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('services', 'products', 'subscription_plans')
AND table_schema = 'public';
```

If any tables are missing, you'll need to create them first. Check the `combined_schema.sql` file for the complete schema.

### 3. Run the Migration in Smaller Parts

Instead of running the entire migration at once, try executing it in smaller chunks:

1. First create the junction tables without RLS policies:
```sql
-- Create service_products junction table
CREATE TABLE IF NOT EXISTS service_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, product_id)
);

-- Create service_plans junction table
CREATE TABLE IF NOT EXISTS service_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  duration TEXT,
  requires_subscription BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, plan_id)
);

-- Add requires_consultation column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_consultation BOOLEAN DEFAULT TRUE;
```

2. Then add the indexes:
```sql
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_products_service_id ON service_products(service_id);
CREATE INDEX IF NOT EXISTS idx_service_products_product_id ON service_products(product_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_service_id ON service_plans(service_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_plan_id ON service_plans(plan_id);
```

3. Finally add the RLS policies:
```sql
-- Enable RLS on tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can read services"
  ON services FOR SELECT
  USING (auth.role() = 'authenticated');
-- ... the rest of the policies
```

### 4. Check for the `is_admin` Column

The RLS policies use an `is_admin` column in the `auth.users` table. Verify this column exists:

```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name = 'users'
AND column_name = 'is_admin';
```

If it doesn't exist, you need to add it:

```sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### 5. Check for UUID Extension

The migration uses `uuid_generate_v4()` which requires the UUID extension:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 6. Verify Realtime Publication Exists

Before adding tables to the realtime publication, check if it exists:

```sql
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
```

If it doesn't exist, create it:

```sql
CREATE PUBLICATION supabase_realtime;
```

## Alternative Approach

If you continue to experience issues, here's an alternative approach:

1. **Use the Database Interface**: Instead of running SQL directly, use the Supabase Dashboard interface:
   - Go to the "Table Editor"
   - Click "Create a new table" for creating the junction tables
   - Use the interface to add columns, constraints, and foreign keys

2. **Apply RLS through the UI**: 
   - Go to "Authentication" > "Policies" 
   - Click on each table and add the policies through the interface

This approach may be more reliable as it uses Supabase's API rather than direct SQL execution.

## Contact Support

If all troubleshooting steps fail:

1. Check the Supabase status page: https://status.supabase.com/
2. Contact Supabase support with your error details
3. Consider posting on the Supabase GitHub issues or community forums

For project-specific help, contact the development team lead.