# 🚨 URGENT: Database Structure & RPC Functions Troubleshooting Guide

## Critical Production Issue Summary

**Current Issues**:
1. ✅ RPC functions now working (`health_check` is being called)
2. ❌ **NEW ISSUE**: 400 Bad Request errors on database queries
   - **Error**: `GET https://thchapjdflpjhtvlagke.supabase.co/rest/v1/discounts?select=*%2Cdiscount_subscription_plans%3Adiscount_subscription_plans%28subscription_plan_id%29&order=name.asc&status=eq.Active 400 (Bad Request)`

**Root Causes**:
- Missing or incorrectly structured `discounts` table
- Missing `discount_subscription_plans` relationship table
- Column name mismatches (`status` vs `is_active`)
- Incomplete database migration application

---

## 🔥 IMMEDIATE DIAGNOSTIC STEPS

### Step 0: Identify Error Type

**For 400 Bad Request Errors (Current Issue)**:
```
Error: GET .../discounts?select=*%2Cdiscount_subscription_plans... 400 (Bad Request)
```
- Skip to **Section: 400 Bad Request Troubleshooting** below
- These indicate missing tables or incorrect column names

**For 404 RPC Function Errors**:
- Continue with Steps 1-4 below

### Step 1: Verify Database Connection

```bash
# Test Supabase connection
supabase status

# If connection fails, check authentication
supabase login
```

### Step 2: Check Migration Status

```sql
-- Check if migration was applied
SELECT version FROM supabase_migrations.schema_migrations 
WHERE version = '20250531000000';

-- If no results, migration was NOT applied
```

### Step 3: Verify Function Existence

```sql
-- Check if functions exist in database
SELECT 
    routine_name,
    routine_type,
    data_type,
    argument_data_types
FROM information_schema.routines 
WHERE routine_name IN ('list_services_with_relationships', 'health_check')
AND routine_schema = 'public';

-- Expected: Should return 2 rows if functions exist
-- If 0 rows: Functions are missing (migration not applied)
-- If 1 row: Partial migration applied
```

### Step 4: Test Function Access

```sql
-- Test health_check function
SELECT health_check();
-- Expected: JSON response with status and database stats
-- Error 42883: Function does not exist

-- Test list_services_with_relationships function
SELECT list_services_with_relationships(1, 10, NULL, NULL);
-- Expected: JSON response with data array and meta object
-- Error 42883: Function does not exist
```

---

## 🛠️ IMMEDIATE FIXES

### Option A: Apply Missing Migration (RECOMMENDED)

```bash
# 1. Navigate to project root
cd /path/to/zappy-dashboard

# 2. Verify migration file exists
ls -la supabase/migrations/20250531_comprehensive_database_fix.sql

# 3. Apply the migration
supabase db push --include-schema public

# 4. Verify application
supabase migration list
```

### Option B: Manual Function Creation (EMERGENCY ONLY)

If migration fails, manually create the missing functions:

```sql
-- 1. Create health_check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_status text;
    current_time timestamp with time zone;
    connection_count integer;
BEGIN
    current_time := NOW();
    
    BEGIN
        SELECT count(*) INTO connection_count
        FROM pg_stat_activity 
        WHERE state = 'active';
        
        db_status := 'healthy';
    EXCEPTION
        WHEN OTHERS THEN
            db_status := 'error';
            connection_count := 0;
    END;
    
    RETURN jsonb_build_object(
        'status', CASE 
            WHEN db_status = 'healthy' THEN 'ok'
            ELSE 'error'
        END,
        'timestamp', current_time,
        'database', jsonb_build_object(
            'status', db_status,
            'connections', connection_count
        ),
        'schema_version', 'emergency_fix',
        'version', '1.1.0',
        'environment', 'production'
    );
END;
$$;

-- 2. Create list_services_with_relationships function
CREATE OR REPLACE FUNCTION list_services_with_relationships(
    page_number integer DEFAULT 1,
    page_size integer DEFAULT 10,
    search_term text DEFAULT NULL,
    is_active boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    services_data jsonb;
    services_count integer;
    result jsonb;
    offset_val integer;
BEGIN
    -- Input validation
    IF page_number < 1 THEN
        RETURN jsonb_build_object(
            'error', 'Invalid page_number: must be >= 1',
            'data', '[]'::jsonb,
            'meta', jsonb_build_object('total', 0, 'per_page', page_size, 'current_page', page_number, 'last_page', 0)
        );
    END IF;
    
    IF page_size < 1 OR page_size > 100 THEN
        RETURN jsonb_build_object(
            'error', 'Invalid page_size: must be between 1 and 100',
            'data', '[]'::jsonb,
            'meta', jsonb_build_object('total', 0, 'per_page', page_size, 'current_page', page_number, 'last_page', 0)
        );
    END IF;
    
    offset_val := (page_number - 1) * page_size;
    
    -- Get services with basic error handling
    BEGIN
        -- Count total matching records
        SELECT COUNT(*) INTO services_count
        FROM services s
        WHERE 
            (is_active IS NULL OR s.is_active = is_active)
            AND (
                search_term IS NULL 
                OR s.name ILIKE '%' || search_term || '%'
                OR s.description ILIKE '%' || search_term || '%'
            );
        
        -- Get basic service data with pagination
        SELECT jsonb_agg(to_jsonb(s)) INTO services_data
        FROM (
            SELECT s.*
            FROM services s
            WHERE 
                (is_active IS NULL OR s.is_active = is_active)
                AND (
                    search_term IS NULL 
                    OR s.name ILIKE '%' || search_term || '%'
                    OR s.description ILIKE '%' || search_term || '%'
                )
            ORDER BY s.name
            LIMIT page_size OFFSET offset_val
        ) s;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Return basic error response
            RETURN jsonb_build_object(
                'error', 'Database error: ' || SQLERRM,
                'data', '[]'::jsonb,
                'meta', jsonb_build_object('total', 0, 'per_page', page_size, 'current_page', page_number, 'last_page', 0)
            );
    END;
    
    -- Return result
    RETURN jsonb_build_object(
        'data', COALESCE(services_data, '[]'::jsonb),
        'meta', jsonb_build_object(
            'total', services_count,
            'per_page', page_size,
            'current_page', page_number,
            'last_page', CASE WHEN services_count = 0 THEN 0 ELSE CEIL(services_count::numeric / page_size) END
        )
    );
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION list_services_with_relationships(integer, integer, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION health_check() TO authenticated, anon;
```

---

## 🚨 400 BAD REQUEST TROUBLESHOOTING

### Issue: Missing Tables & Column Mismatches

**Common 400 Bad Request Errors**:
- `discounts` table missing or has wrong column names
- `discount_subscription_plans` relationship table missing
- Column name mismatches (`status` vs `is_active`)
- Missing foreign key relationships

### Step 1: Audit Database Structure

```sql
-- Run comprehensive database audit
\i database-structure-audit.sql

-- OR run this quick check:
SELECT
    table_name,
    CASE
        WHEN table_name = 'discounts' THEN 'CRITICAL - needed for discounts query'
        WHEN table_name = 'discount_subscription_plans' THEN 'CRITICAL - needed for relationships'
        ELSE 'Standard table'
    END as importance
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('discounts', 'discount_subscription_plans', 'subscription_plans', 'services')
ORDER BY table_name;
```

### Step 2: Check Discounts Table Structure

```sql
-- Check if discounts table exists and has correct columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'discounts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected critical columns:
-- - id (uuid)
-- - name (text)
-- - is_active (boolean) -- NOT 'status'!
-- - discount_type (text)
-- - discount_value (numeric)
```

### Step 3: Test the Failing Query

```sql
-- Test the exact query that's failing in frontend
SELECT
    discounts.*,
    discount_subscription_plans.subscription_plan_id
FROM discounts
LEFT JOIN discount_subscription_plans ON discounts.id = discount_subscription_plans.discount_id
WHERE discounts.is_active = true  -- NOT status = 'Active'
ORDER BY discounts.name ASC;

-- If this fails, note the error message for next steps
```

### Step 4: Apply Database Structure Fix

**Option A: Run Automated Fix (RECOMMENDED)**
```bash
# Apply the missing tables creation script
psql -f create-missing-tables.sql

# This script will:
# 1. Recreate discounts table with proper structure
# 2. Create discount_subscription_plans relationship table
# 3. Migrate existing data safely
# 4. Add proper indexes and constraints
```

**Option B: Manual Table Creation (if automated fix fails)**
```sql
-- 1. Backup existing discounts data if any
CREATE TEMP TABLE discounts_backup AS
SELECT * FROM discounts WHERE EXISTS (SELECT 1 FROM discounts LIMIT 1);

-- 2. Drop problematic table
DROP TABLE IF EXISTS discounts CASCADE;

-- 3. Create proper discounts table
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')) DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,  -- CRITICAL: is_active not status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create relationship table
CREATE TABLE discount_subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discount_id, subscription_plan_id)
);

-- 5. Add indexes
CREATE INDEX idx_discounts_is_active ON discounts(is_active);
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discount_subscription_plans_discount_id ON discount_subscription_plans(discount_id);

-- 6. Enable RLS and add policies
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on discounts" ON discounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on discount_subscription_plans" ON discount_subscription_plans FOR ALL USING (true) WITH CHECK (true);

-- 7. Add sample data
INSERT INTO discounts (name, code, description, discount_type, discount_value, is_active)
VALUES
    ('New Patient Discount', 'NEWPATIENT10', '10% off first order', 'percentage', 10.00, true),
    ('Loyalty Discount', 'LOYAL15', '15% off for returning patients', 'percentage', 15.00, true)
ON CONFLICT (code) DO NOTHING;
```

### Step 5: Verify Fix

```sql
-- Test the frontend query again
SELECT
    discounts.*,
    discount_subscription_plans.subscription_plan_id
FROM discounts
LEFT JOIN discount_subscription_plans ON discounts.id = discount_subscription_plans.discount_id
WHERE discounts.is_active = true
ORDER BY discounts.name ASC;

-- Should return results without errors

-- Test count
SELECT COUNT(*) as total_active_discounts FROM discounts WHERE is_active = true;
-- Should return > 0
```

### Step 6: Update Frontend Query (if needed)

If the frontend is still using wrong column names, update the query:

```javascript
// WRONG (old):
.eq('status', 'Active')

// CORRECT (new):
.eq('is_active', true)
```

---

##  POST-FIX VERIFICATION

### Verify Functions Work

```sql
-- Test 1: Health check
SELECT health_check();
-- ✅ Should return JSON with status='ok'

-- Test 2: Services function
SELECT list_services_with_relationships(1, 5, NULL, NULL);
-- ✅ Should return JSON with data array and meta object

-- Test 3: Error handling
SELECT list_services_with_relationships(0, 10, NULL, NULL);
-- ✅ Should return error response with proper JSON structure
```

### Test Frontend Integration

```bash
# Test the API endpoints directly
curl -X GET "https://your-supabase-url.supabase.co/rest/v1/rpc/health_check" \
  -H "apikey: YOUR_ANON_KEY"

curl -X POST "https://your-supabase-url.supabase.co/rest/v1/rpc/list_services_with_relationships" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page_number": 1, "page_size": 10}'
```

### Check Function Permissions

```sql
-- Verify function permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name IN ('list_services_with_relationships', 'health_check')
ORDER BY routine_name, grantee;

-- Expected results:
-- health_check: authenticated (EXECUTE), anon (EXECUTE)  
-- list_services_with_relationships: authenticated (EXECUTE)
```

---

## 🚨 ESCALATION STEPS

### If Migration Still Fails

1. **Check Database Locks**:
```sql
SELECT 
    pid,
    query,
    state,
    query_start
FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%';
```

2. **Force Terminate Blocking Queries** (Use with caution):
```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%CREATE%FUNCTION%';
```

3. **Contact Database Team**:
   - Provide migration file: `supabase/migrations/20250531_comprehensive_database_fix.sql`
   - Share error messages from `supabase db push`
   - Include results from diagnostic queries above

### If Manual Function Creation Fails

1. **Check Table Dependencies**:
```sql
-- Verify required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('services', 'providers', 'patients', 'subscription_durations');
```

2. **Create Missing Tables** (if needed):
```sql
-- Basic services table if missing
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📞 EMERGENCY CONTACTS

- **Database Issues**: Supabase Support (support@supabase.io)
- **Critical Business Impact**: Product Manager
- **Infrastructure Issues**: DevOps Team Lead
- **After Hours**: On-call engineer

---

## 🔄 ROLLBACK PLAN

If the fix causes additional issues:

1. **Drop the manually created functions**:
```sql
DROP FUNCTION IF EXISTS health_check();
DROP FUNCTION IF EXISTS list_services_with_relationships(integer, integer, text, boolean);
```

2. **Revert to previous migration**:
```bash
# Check migration history
supabase migration list

# Create rollback migration if needed
# (This should only be done if you have a backup of previous state)
```

3. **Restore from backup**:
```bash
# Only if you have a recent backup
supabase db reset --linked
# Then restore from backup file
```

---

## ⏱️ EXPECTED TIMELINE

- **Diagnostic Steps**: 5-10 minutes
- **Apply Migration**: 2-5 minutes  
- **Manual Function Creation**: 10-15 minutes
- **Verification**: 5 minutes
- **Total Recovery Time**: 15-30 minutes

---

**Created**: May 31, 2025 1:18 AM
**Priority**: P0 - Critical Production Issue
**Next Steps**: Run diagnostic queries immediately, then apply appropriate fix based on results