# 🔧 Database Structure Fix - Complete Solution

## Overview

This package provides comprehensive tools to diagnose and fix the 400 Bad Request errors occurring after the RPC functions were restored. The primary issue is missing or incorrectly structured database tables, specifically the `discounts` table and related components.

## Issue Summary

**Current Status**: 
- ✅ RPC functions (`health_check`, `list_services_with_relationships`) are now working
- ❌ 400 Bad Request errors on frontend queries, specifically:
  ```
  GET /rest/v1/discounts?select=*%2Cdiscount_subscription_plans%3Adiscount_subscription_plans%28subscription_plan_id%29&order=name.asc&status=eq.Active
  ```

**Root Causes**:
1. Missing `discounts` table or incorrect structure
2. Missing `discount_subscription_plans` relationship table
3. Column name mismatches (`status` vs `is_active`)
4. Missing foreign key relationships
5. Incomplete database migration application

## 📁 Files Included

### 1. [`database-structure-audit.sql`](./database-structure-audit.sql)
**Purpose**: Comprehensive audit of entire database structure
- ✅ Checks all expected tables exist
- ✅ Validates column structures and types
- ✅ Verifies foreign key relationships
- ✅ Audits RLS policies and indexes
- ✅ Tests RPC function signatures
- ✅ Provides detailed diagnostic output

**Usage**:
```bash
psql -f database-structure-audit.sql
```

### 2. [`create-missing-tables.sql`](./create-missing-tables.sql)
**Purpose**: Creates and fixes missing database components
- ✅ Creates/fixes `discounts` table with proper structure
- ✅ Creates `discount_subscription_plans` relationship table
- ✅ Migrates existing data safely
- ✅ Adds proper indexes and constraints
- ✅ Enables RLS and adds policies
- ✅ Includes sample data for testing

**Usage**:
```bash
psql -f create-missing-tables.sql
```

### 3. [`progressive-validation.sql`](./progressive-validation.sql)
**Purpose**: Incremental testing with specific remediation steps
- ✅ Tests each component individually
- ✅ Tests the exact failing frontend query
- ✅ Provides specific remediation for each failure
- ✅ Shows pass/fail statistics
- ✅ Includes diagnostic queries for manual inspection

**Usage**:
```bash
psql -f progressive-validation.sql
```

### 4. [`URGENT_RPC_FUNCTIONS_TROUBLESHOOTING.md`](./URGENT_RPC_FUNCTIONS_TROUBLESHOOTING.md)
**Purpose**: Updated troubleshooting guide
- ✅ Covers both RPC function issues and 400 Bad Request errors
- ✅ Step-by-step diagnostic procedures
- ✅ Manual fix procedures if automated scripts fail
- ✅ Frontend code fix suggestions

## 🚀 Quick Fix Guide

### Step 1: Diagnose the Issue
```bash
# Run the audit to see what's missing
psql -f database-structure-audit.sql
```

### Step 2: Apply the Fix
```bash
# Create missing tables and fix structure
psql -f create-missing-tables.sql
```

### Step 3: Validate the Fix
```bash
# Test each component incrementally
psql -f progressive-validation.sql
```

### Step 4: Test Frontend
Test the failing URL in your browser or API client:
```
GET https://your-supabase-url.supabase.co/rest/v1/discounts?select=*%2Cdiscount_subscription_plans%3Adiscount_subscription_plans%28subscription_plan_id%29&order=name.asc&is_active=eq.true
```

## 🎯 Expected Outcomes

After running the fix scripts:

1. **Discounts table** will exist with proper structure:
   - `is_active` column (not `status`)
   - Proper UUID primary keys
   - All required discount fields

2. **Relationship tables** will be created:
   - `discount_subscription_plans` 
   - Proper foreign key constraints

3. **RLS policies** will be enabled and configured

4. **Sample data** will be available for testing

5. **Frontend query** will work without 400 errors

## 🔍 Detailed Problem Analysis

### The Discounts Query Issue

The frontend is making this query:
```sql
SELECT 
    discounts.*,
    discount_subscription_plans.subscription_plan_id
FROM discounts 
LEFT JOIN discount_subscription_plans ON discounts.id = discount_subscription_plans.discount_id
WHERE discounts.status = 'Active'  -- ❌ WRONG: should be is_active = true
ORDER BY discounts.name ASC;
```

**Problems**:
1. `discounts` table may not exist
2. `discount_subscription_plans` table may not exist  
3. Column name is `status` but should be `is_active`
4. Value is `'Active'` but should be `true`

### The Correct Query Structure

After fixes, the query should be:
```sql
SELECT 
    discounts.*,
    discount_subscription_plans.subscription_plan_id
FROM discounts 
LEFT JOIN discount_subscription_plans ON discounts.id = discount_subscription_plans.discount_id
WHERE discounts.is_active = true  -- ✅ CORRECT
ORDER BY discounts.name ASC;
```

## 🛠️ Manual Fixes (If Scripts Fail)

### Create Discounts Table Manually
```sql
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
```

### Create Relationship Table Manually
```sql
CREATE TABLE discount_subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discount_id, subscription_plan_id)
);
```

## 📋 Frontend Code Updates

If the database structure is correct but queries still fail, update the frontend:

```javascript
// BEFORE (causing 400 error):
.eq('status', 'Active')

// AFTER (correct):
.eq('is_active', true)
```

## 🚨 Troubleshooting

### If Scripts Fail to Run
1. Check database permissions
2. Ensure you're connected to the correct database
3. Check for conflicting transactions
4. Review error messages in script output

### If 400 Errors Persist
1. Check frontend code for column name mismatches
2. Verify the exact query being sent (check browser dev tools)
3. Test queries manually in Supabase dashboard
4. Check RLS policies aren't blocking access

### If Data is Missing
1. Run the audit script to see what's missing
2. Check if sample data was created
3. Manually insert test data if needed
4. Verify foreign key relationships

## 📊 Validation Checklist

- [ ] `discounts` table exists with `is_active` column
- [ ] `discount_subscription_plans` table exists  
- [ ] Foreign key relationships are properly established
- [ ] RLS policies are enabled and configured
- [ ] Sample data exists for testing
- [ ] Frontend query executes without 400 errors
- [ ] RPC functions still work (`health_check`, `list_services_with_relationships`)

## 🆘 Emergency Contacts

If these fixes don't resolve the issue:
- **Database Issues**: Supabase Support
- **Critical Business Impact**: Product Manager  
- **Infrastructure Issues**: DevOps Team Lead

## 📝 Migration History

This fix addresses issues from multiple previous migrations:
- `20250507000100_add_subscription_plan_id_to_discounts.sql`
- `20250528120000_fix_all_missing_tables.sql` 
- `20250530_fix_rpc_functions.sql`
- `20250531_comprehensive_database_fix.sql`

The scripts in this package provide a comprehensive solution that should resolve all outstanding database structure issues.

---

**Created**: May 31, 2025  
**Priority**: P0 - Critical Production Issue  
**Status**: Ready for deployment  
**Estimated Fix Time**: 10-15 minutes