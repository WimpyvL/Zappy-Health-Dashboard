# Fixing Subscription Tables in Supabase

The issue with subscription-related features is that the tables exist in your database schema (defined in Prisma) but aren't properly exposed through the Supabase REST API. Here's how to fix it:

## Step 1: Run the SQL Script to Create Tables

1. Log in to your Supabase Dashboard: https://app.supabase.com/
2. Select your project (the one with hostname `thchapjdflpjhtvlagke.supabase.co`)
3. Navigate to the "SQL Editor" section from the left sidebar
4. Create a new query and paste the content from the `create_subscription_tables.sql` file:

```sql
-- Create missing subscription-related tables

-- Create subscription_duration table
CREATE TABLE IF NOT EXISTS subscription_duration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create treatment_package table
CREATE TABLE IF NOT EXISTS treatment_package (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  condition TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create package_service junction table
CREATE TABLE IF NOT EXISTS package_service (
  package_id UUID NOT NULL REFERENCES treatment_package(id) ON DELETE CASCADE,
  service_id UUID NOT NULL,
  PRIMARY KEY (package_id, service_id)
);

-- Create patient_subscription table
CREATE TABLE IF NOT EXISTS patient_subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES treatment_package(id) ON DELETE RESTRICT,
  duration_id UUID NOT NULL REFERENCES subscription_duration(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_subscription_duration_name ON subscription_duration(name);
CREATE INDEX idx_treatment_package_name ON treatment_package(name);
CREATE INDEX idx_treatment_package_condition ON treatment_package(condition);
CREATE INDEX idx_treatment_package_is_active ON treatment_package(is_active);
CREATE INDEX idx_patient_subscription_patient_id ON patient_subscription(patient_id);
CREATE INDEX idx_patient_subscription_status ON patient_subscription(status);
```

5. Execute the query by clicking the "Run" button

## Step 2: Enable REST API Access for the Tables

For each of the new tables (`subscription_duration`, `treatment_package`, `package_service`, `patient_subscription`), you need to enable API access:

1. Navigate to "Table Editor" in the left sidebar
2. You should now see the newly created tables in the list
3. For each table:
   - Click on the table name
   - Go to the "Authentication" tab (or "Policies" tab in newer versions)
   - Enable Row Level Security (RLS) by toggling it ON
   - Click "Add Policy" to create a new policy:
     - Policy name: "Enable read access for all authenticated users"
     - Policy definition: `true` (to allow any authenticated user to read)
     - Click "Save Policy"
   - Add another policy:
     - Policy name: "Enable write access for all authenticated users"
     - Policy definition: `true` (to allow any authenticated user to write)
     - Click "Save Policy"

## Step 3: Verify API Access

1. Navigate to "API" in the left sidebar
2. Select "Tables" to verify that your subscription tables are listed
3. If listed, they should now be accessible via the REST API

## Step 4: Initialize Default Subscription Durations

After enabling API access, go back to your application and add some default subscription durations:

- Monthly (1 month, 0% discount)
- Quarterly (3 months, 5% discount)
- Semi-Annual (6 months, 10% discount)
- Annual (12 months, 15% discount)

You can either create these through the application UI or directly insert them using the SQL Editor:

```sql
INSERT INTO subscription_duration (name, duration_months, discount_percent, created_at, updated_at)
VALUES
('Monthly', 1, 0, NOW(), NOW()),
('Quarterly', 3, 5, NOW(), NOW()),
('Semi-Annual', 6, 10, NOW(), NOW()),
('Annual', 12, 15, NOW(), NOW());
```

## Troubleshooting

If you're still getting "404 Not Found" errors when trying to access these tables:

1. Make sure your Supabase project URL matches the one used in your application.
2. Check that the tables were actually created by viewing them in the "Table Editor".
3. Verify that Row Level Security (RLS) is properly configured with policies that allow access.
4. Try clearing your browser cache or using incognito mode to test.
5. Check that your application is properly authenticated with Supabase.
