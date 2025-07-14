# Supabase Comprehensive Database Fix Deployment Guide

## Executive Summary

This deployment guide addresses **9 major categories** of critical production issues affecting the Zappy Dashboard application through a comprehensive database migration approach:

### 🔧 **Critical Issues Resolved:**

1. **RPC Function Signature Conflicts** - Missing and corrupted function definitions
2. **Schema Conflicts** - `subscription_durations` table inconsistencies (SERIAL vs UUID)
3. **Frontend TypeError Issues** - `subscriptions.forEach` and data structure errors
4. **Missing Junction Tables** - Incomplete relational table structures
5. **Missing Health Check Function** - Critical monitoring function absent
6. **Data Type Inconsistencies** - Mismatched column types across related tables
7. **Missing Foreign Key Relationships** - Broken referential integrity
8. **RLS Policy Gaps** - Incomplete row-level security implementations
9. **Performance Optimization Opportunities** - Missing indexes and constraints

### 🚀 **Comprehensive Migration Approach:**
- ✅ **Single Migration**: [`supabase/migrations/20250531_comprehensive_database_fix.sql`](supabase/migrations/20250531_comprehensive_database_fix.sql:1)
- ✅ **Frontend Fix**: [`src/pages/consultations/FollowUpConsultationNotes.jsx`](src/pages/consultations/FollowUpConsultationNotes.jsx:1)
- ✅ **Complete Schema Harmonization**: Resolves all structural inconsistencies
- ✅ **Enhanced Error Handling**: Comprehensive validation and rollback capabilities
- ✅ **Performance Optimizations**: Strategic indexing and constraint improvements

> **Note**: This comprehensive approach replaces the previous piecemeal fix strategy and ensures all identified issues are resolved in a single, atomic deployment.

---

## Pre-Deployment Validation

### ✅ Prerequisites Checklist

- [ ] **Database Access**: Confirm connection to production Supabase instance
- [ ] **Backup Created**: Full database backup completed within last 24 hours
- [ ] **Supabase CLI**: Version 1.100.0+ installed and authenticated
- [ ] **Frontend Build**: Ensure application builds successfully locally
- [ ] **Staging Environment**: All fixes tested in staging environment
- [ ] **Team Notification**: Development team notified of deployment window

### ✅ Pre-Deployment Commands

```bash
# 1. Verify Supabase CLI authentication
supabase status

# 2. Check current database connection
supabase db diff --schema public

# 3. Validate migration file syntax
supabase db diff --file supabase/migrations/20250531_comprehensive_database_fix.sql

# 4. Test frontend build
npm run build

# 5. Check for any uncommitted changes
git status
```

### ✅ Current State Verification

```sql
-- 1. Verify RPC function state (should return errors or incorrect results)
SELECT function_name, argument_data_types
FROM information_schema.routines
WHERE routine_name IN ('list_services_with_relationships', 'health_check')
AND routine_schema = 'public';

-- 2. Test health_check function (should fail)
SELECT health_check();

-- 3. Test list_services_with_relationships (should fail or return wrong format)
SELECT list_services_with_relationships(1, 10, NULL, NULL);

-- 4. Check subscription_durations schema conflicts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscription_durations'
ORDER BY ordinal_position;

-- 5. Verify missing junction tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('service_plans', 'service_products', 'service_categories');

-- 6. Check data type inconsistencies
SELECT t.table_name, c.column_name, c.data_type
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name IN ('id', 'service_id', 'plan_id', 'product_id')
AND t.table_name LIKE '%service%'
ORDER BY t.table_name, c.column_name;

-- 7. Verify foreign key relationships
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE '%service%';

-- 8. Check RLS policies coverage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE '%service%' OR tablename LIKE '%subscription%'
ORDER BY tablename;
```

---

## ⚠️ IMPORTANT: Comprehensive Database Migration

**The comprehensive migration `20250531_comprehensive_database_fix.sql` addresses ALL 9 categories of issues**

This migration replaces the previous piecemeal approach and resolves all identified critical issues in a single atomic operation:

### 🔧 **Complete Issue Resolution:**

1. **RPC Function Signature Conflicts**
   - Restores correct `list_services_with_relationships` function (4 parameters)
   - Recreates missing `health_check` function with enhanced monitoring
   - Fixes function signature mismatches and parameter validation

2. **Schema Conflicts Resolution**
   - Resolves `subscription_durations` table conflicts (SERIAL vs UUID PRIMARY KEY)
   - Harmonizes ID column types across all related tables
   - Ensures consistent UUID-based primary key strategy

3. **Frontend TypeError Fixes**
   - Addresses data structure inconsistencies causing `forEach` errors
   - Ensures API responses maintain consistent array/object structures
   - Implements proper null/undefined handling in database responses

4. **Missing Junction Tables Creation**
   - Creates `service_plans` junction table for service-plan relationships
   - Establishes `service_products` table for service-product associations
   - Implements `service_categories` for proper categorization

5. **Health Check Function Implementation**
   - Comprehensive system health monitoring function
   - Database connectivity and performance metrics
   - Schema version tracking and validation

6. **Data Type Consistency Enforcement**
   - Standardizes all ID fields to UUID type
   - Aligns timestamp fields across tables
   - Ensures proper numeric type consistency

7. **Foreign Key Relationships Restoration**
   - Establishes missing referential integrity constraints
   - Creates proper cascade behaviors for data consistency
   - Implements validation for orphaned records

8. **RLS Policy Gap Coverage**
   - Implements comprehensive Row-Level Security policies
   - Ensures proper access control for all service-related tables
   - Establishes role-based data access patterns

9. **Performance Optimization Implementation**
   - Strategic indexing for query performance
   - Optimized constraints for data integrity
   - Enhanced query execution paths

### 🚀 **Migration Strategy:**
- **Atomic Operation**: All changes applied in a single transaction
- **Data Preservation**: Existing data migrated safely with validation
- **Conflict Resolution**: Automatic detection and resolution of schema conflicts
- **Rollback Safety**: Complete rollback capabilities with data integrity checks
- **Comprehensive Validation**: Post-migration verification for all 9 issue categories

---

## Database Migration Deployment

### Step 1: Create Database Backup

```bash
# Create timestamped backup
BACKUP_NAME="pre_rpc_fix_$(date +%Y%m%d_%H%M%S)"
supabase db dump --file "./backups/${BACKUP_NAME}.sql"
echo "Backup created: ./backups/${BACKUP_NAME}.sql"
```

### Step 2: Deploy Migration

```bash
# 1. Navigate to project root
cd /path/to/zappy-dashboard

# 2. Deploy the specific migration
supabase db push --include-schema public

# Alternative: Apply specific migration file
# supabase migration up --include-all
```

### Step 3: Verify Migration Success

```sql
-- 1. Verify functions exist with correct signatures
SELECT 
    routine_name,
    routine_type,
    data_type,
    argument_data_types
FROM information_schema.routines 
WHERE routine_name IN ('list_services_with_relationships', 'health_check')
AND routine_schema = 'public';

-- 2. Test health_check function
SELECT health_check();
-- Expected: JSON response with status: 'ok' and database stats

-- 3. Test list_services_with_relationships function
SELECT list_services_with_relationships(1, 5, NULL, NULL);
-- Expected: JSON response with data array and meta object

-- 4. Verify permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name IN ('list_services_with_relationships', 'health_check');
```

### Step 4: Database Performance Check

```sql
-- Check for any long-running queries
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state = 'active';

-- Verify database connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

---

## Frontend Deployment

### Step 1: Code Validation

```bash
# 1. Lint the modified file
npm run lint src/pages/consultations/FollowUpConsultationNotes.jsx

# 2. Run type checking (if using TypeScript)
npm run type-check

# 3. Run relevant tests
npm test -- --testPathPattern=consultation
```

### Step 2: Build and Deploy

```bash
# 1. Create production build
npm run build

# 2. Test build locally (optional)
npm run serve

# 3. Deploy to production (adjust command based on hosting platform)
# For Netlify:
netlify deploy --prod --dir=build

# For Vercel:
vercel --prod

# For custom deployment:
# rsync -avz build/ user@server:/var/www/html/
```

### Step 3: Cache Invalidation

```bash
# If using CDN, invalidate cache for affected files
# For CloudFlare:
# curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache"

# For AWS CloudFront:
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## Post-Deployment Testing & Validation

### ✅ Database Function Testing

```sql
-- Test 1: Health Check Function
SELECT health_check();
-- ✅ Expected: JSON with status='ok', timestamp, database stats

-- Test 2: Services Function with Pagination
SELECT list_services_with_relationships(1, 10, NULL, NULL);
-- ✅ Expected: JSON with data array and pagination meta

-- Test 3: Services Function with Search
SELECT list_services_with_relationships(1, 5, 'weight', TRUE);
-- ✅ Expected: Filtered results based on search term

-- Test 4: Error Handling
SELECT list_services_with_relationships(0, 10, NULL, NULL);
-- ✅ Expected: Error response with proper JSON structure

-- Test 5: Permission Check (as authenticated user)
-- This should be tested through the application, not directly
```

### ✅ Frontend Functionality Testing

#### Critical User Flows:
1. **Follow-up Consultation Page Load**
   - [ ] Page loads without JavaScript errors
   - [ ] Patient subscriptions display correctly
   - [ ] No `subscriptions.forEach` errors in console

2. **Subscription Service Integration**
   - [ ] Patient subscriptions fetch successfully
   - [ ] Active services populate correctly
   - [ ] Service tags display with proper categories

3. **Medication Management**
   - [ ] Previous medications load correctly
   - [ ] Dosage options populate
   - [ ] Medication updates save successfully

#### Browser Testing Checklist:
- [ ] **Chrome**: All functionality works
- [ ] **Firefox**: All functionality works  
- [ ] **Safari**: All functionality works
- [ ] **Edge**: All functionality works
- [ ] **Mobile**: Responsive design intact

### ✅ Integration Testing

```bash
# Test API endpoints that use the fixed functions
curl -X GET "https://your-supabase-url.supabase.co/rest/v1/rpc/health_check" \
  -H "apikey: YOUR_ANON_KEY"

curl -X POST "https://your-supabase-url.supabase.co/rest/v1/rpc/list_services_with_relationships" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page_number": 1, "page_size": 10}'
```

### ✅ Performance Monitoring

```sql
-- Monitor query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%list_services_with_relationships%'
   OR query LIKE '%health_check%'
ORDER BY total_time DESC
LIMIT 10;

-- Check for any blocking queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## Rollback Procedures

### 🚨 Database Rollback

#### Option 1: Revert Migration (Recommended)

```bash
# 1. Create rollback migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_rpc_functions.sql << 'EOF'
-- Rollback RPC functions to previous state
DROP FUNCTION IF EXISTS health_check();
DROP FUNCTION IF EXISTS list_services_with_relationships(integer, integer, text, boolean);

-- Note: You would need to restore the previous function definitions here
-- This should be prepared beforehand based on your backup
EOF

# 2. Apply rollback
supabase db push

# 3. Verify rollback
supabase db diff
```

#### Option 2: Database Restore (Emergency Only)

```bash
# Restore from backup (DESTRUCTIVE - will lose recent data)
# 1. Stop application traffic
# 2. Restore database
supabase db reset --linked
supabase db push --include-seed

# 3. Verify restoration
supabase status
```

### 🚨 Frontend Rollback

#### Git-based Rollback

```bash
# 1. Identify commit hash before deployment
git log --oneline -10

# 2. Revert to previous commit
git revert <commit-hash>

# 3. Rebuild and redeploy
npm run build
# Deploy using your deployment method
```

#### Quick File Restoration

```bash
# If you have backup of the original file
cp backups/FollowUpConsultationNotes.jsx.backup src/pages/consultations/FollowUpConsultationNotes.jsx

# Rebuild and deploy
npm run build
# Deploy using your deployment method
```

---

## Monitoring & Prevention

### 📊 Monitoring Setup

#### Database Monitoring

```sql
-- Create monitoring view for RPC function health
CREATE OR REPLACE VIEW rpc_function_health AS
SELECT 
    'health_check' as function_name,
    CASE 
        WHEN (SELECT health_check()->>'status') = 'ok' THEN 'healthy'
        ELSE 'unhealthy'
    END as status,
    NOW() as last_checked;

-- Set up alerts for function failures (implement in your monitoring system)
```

#### Application Monitoring

```javascript
// Add error tracking for the fixed subscription issue
// In FollowUpConsultationNotes.jsx
useEffect(() => {
  if (patient?.id) {
    const fetchPatientSubscriptions = async () => {
      try {
        // ... existing code ...
      } catch (error) {
        // Enhanced error reporting
        console.error('Subscription fetch error:', {
          patientId: patient.id,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        // Report to monitoring service
        if (window.analytics) {
          window.analytics.track('Subscription Fetch Error', {
            patientId: patient.id,
            error: error.message
          });
        }
      }
    };
    fetchPatientSubscriptions();
  }
}, [patient]);
```

### 🔧 Prevention Measures

#### 1. Migration Review Process

```bash
# Add to CI/CD pipeline
# .github/workflows/migration-check.yml
name: Migration Safety Check
on:
  pull_request:
    paths:
      - 'supabase/migrations/*'

jobs:
  check-migration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check for function overwrites
        run: |
          # Check if migration drops or replaces existing functions
          grep -n "CREATE OR REPLACE FUNCTION" supabase/migrations/*.sql || true
          grep -n "DROP FUNCTION" supabase/migrations/*.sql || true
```

#### 2. Database Function Backup

```sql
-- Create automated backup of critical functions
CREATE OR REPLACE FUNCTION backup_critical_functions()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    function_def TEXT;
    backup_table_name TEXT;
BEGIN
    backup_table_name := 'function_backups_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
    
    EXECUTE format('CREATE TABLE %I (function_name TEXT, definition TEXT, created_at TIMESTAMP)', backup_table_name);
    
    -- Backup critical functions
    FOR function_def IN 
        SELECT pg_get_functiondef(oid) 
        FROM pg_proc 
        WHERE proname IN ('health_check', 'list_services_with_relationships')
    LOOP
        EXECUTE format('INSERT INTO %I VALUES ($1, $2, NOW())', backup_table_name) 
        USING regexp_replace(function_def, '^CREATE[^(]*\(', ''), function_def;
    END LOOP;
    
    RETURN 'Functions backed up to: ' || backup_table_name;
END;
$$;

-- Schedule regular backups (call this before each migration)
SELECT backup_critical_functions();
```

#### 3. Frontend Error Boundaries

```jsx
// Add error boundary around subscription loading
class SubscriptionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Subscription component error:', { error, errorInfo });
    // Report to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h3>Subscription loading failed</h3>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## Troubleshooting

### 🔍 Common Issues & Solutions

#### Issue 1: Migration Fails to Apply

**Symptoms**: `supabase db push` returns error
**Solution**:
```bash
# Check for syntax errors
supabase db diff --file supabase/migrations/20250530_fix_rpc_functions.sql

# Check database locks
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Force unlock if necessary (use with caution)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'active' AND query LIKE '%function%';
```

#### Issue 2: Functions Created but Not Accessible

**Symptoms**: Functions exist but return permission denied
**Solution**:
```sql
-- Re-grant permissions
GRANT EXECUTE ON FUNCTION list_services_with_relationships(integer, integer, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION health_check() TO authenticated, anon;

-- Verify grants
SELECT grantee, privilege_type FROM information_schema.routine_privileges 
WHERE routine_name IN ('health_check', 'list_services_with_relationships');
```

#### Issue 3: Frontend Still Shows Subscription Errors

**Symptoms**: `subscriptions.forEach` error persists after deployment
**Debugging Steps**:
```bash
# 1. Check browser cache
# Hard refresh: Ctrl+F5 or Cmd+Shift+R

# 2. Verify deployment
curl -I https://your-domain.com/static/js/main.[hash].js

# 3. Check service worker cache
# In browser dev tools: Application > Storage > Clear storage

# 4. Verify build includes fix
grep -n "response\.data\.forEach" build/static/js/*.js
```

#### Issue 4: Performance Degradation After Deployment

**Symptoms**: Slower response times for services endpoint
**Investigation**:
```sql
-- Check query execution times
EXPLAIN (ANALYZE, BUFFERS) 
SELECT list_services_with_relationships(1, 10, NULL, NULL);

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('services', 'service_products', 'service_plans');

-- Add indexes if necessary
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_products_service_id ON service_products(service_id);
```

### 📞 Emergency Contacts

- **Database Issues**: Database Team Lead
- **Frontend Issues**: Frontend Team Lead  
- **Infrastructure Issues**: DevOps Team Lead
- **Business Critical**: Product Manager

---

## Deployment Checklist Summary

### ✅ Pre-Deployment
- [ ] Database backup created
- [ ] Staging environment tested
- [ ] Build validation completed
- [ ] Team notifications sent

### ✅ Deployment
- [ ] Database migration applied successfully
- [ ] Frontend build deployed
- [ ] Cache invalidated

### ✅ Post-Deployment
- [ ] Database functions tested
- [ ] Frontend functionality verified
- [ ] API endpoints responding correctly
- [ ] Performance metrics normal
- [ ] Error rates within acceptable limits

### ✅ Monitoring
- [ ] Database function monitoring active
- [ ] Frontend error tracking configured
- [ ] Performance alerts configured
- [ ] Documentation updated

---

## Appendix

### A. Function Signatures Reference

```sql
-- health_check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS jsonb

-- list_services_with_relationships function  
CREATE OR REPLACE FUNCTION list_services_with_relationships(
    page_number integer DEFAULT 1,
    page_size integer DEFAULT 10,
    search_term text DEFAULT NULL,
    is_active boolean DEFAULT NULL
)
RETURNS jsonb
```

### B. Error Codes Reference

| Error Code | Description | Solution |
|------------|-------------|----------|
| 42883 | Function does not exist | Run migration |
| 42501 | Insufficient privileges | Grant permissions |
| 23505 | Duplicate key error | Check for existing functions |
| 08003 | Connection does not exist | Check database connection |

### C. Performance Benchmarks

| Function | Expected Response Time | Acceptable Load |
|----------|----------------------|-----------------|
| health_check() | < 50ms | 1000 req/min |
| list_services_with_relationships() | < 200ms | 500 req/min |

---

**Deployment Guide Version**: 2.0
**Last Updated**: May 31, 2025
**Next Review**: June 30, 2025

### Major Changes (v2.0):
- **COMPREHENSIVE APPROACH**: Replaced piecemeal fixes with single comprehensive migration
- **9 ISSUE CATEGORIES**: Addresses all identified database and frontend issues
- **Enhanced Migration**: `20250531_comprehensive_database_fix.sql` supersedes `20250530_fix_rpc_functions.sql`
- **Complete Testing Coverage**: Testing procedures for all 9 categories of fixes
- **Advanced Rollback**: Complex rollback procedures for comprehensive changes
- **Schema Harmonization**: Complete resolution of data type and structural inconsistencies
- **Performance Optimization**: Strategic indexing and constraint improvements
- **Security Enhancement**: Comprehensive RLS policy implementation
- **Junction Table Creation**: Missing relational structures established
- **Frontend Integration**: Complete TypeError resolution with data structure validation

### Issues Resolved:
1. ✅ RPC Function Signature Conflicts
2. ✅ Schema Conflicts (subscription_durations SERIAL vs UUID)
3. ✅ Frontend TypeError Issues (subscriptions.forEach)
4. ✅ Missing Junction Tables (service_plans, service_products, service_categories)
5. ✅ Missing Health Check Function
6. ✅ Data Type Inconsistencies
7. ✅ Missing Foreign Key Relationships
8. ✅ RLS Policy Gaps
9. ✅ Performance Optimization Opportunities

---

## 🚨 URGENT PRODUCTION TROUBLESHOOTING

### If RPC Functions Return 404 Errors

**Symptoms**:
- `health_check` function returns 404 Not Found
- `list_services_with_relationships` function returns 404 Not Found
- Error: "Could not find the function public.list_services_with_relationships(is_active, page_number, page_size, search_term) in the schema cache"

**Root Cause**: The comprehensive database migration [`20250531_comprehensive_database_fix.sql`](supabase/migrations/20250531_comprehensive_database_fix.sql:1) was not applied to production.

**Immediate Actions**:

1. **Run Migration Status Check**:
```bash
# Execute the verification script
psql -f verify-migration-status.sql
```

2. **Check If Migration Was Applied**:
```sql
-- Quick function existence check
SELECT COUNT(*) as function_count
FROM information_schema.routines
WHERE routine_name IN ('health_check', 'list_services_with_relationships')
AND routine_schema = 'public';
-- Expected: 2 (if both functions exist)
-- Actual: 0 (if migration not applied) ← This explains the 404 errors
```

3. **Emergency Migration Application**:
```bash
# If functions are missing, apply migration immediately
supabase db push --include-schema public
```

4. **Verify Fix**:
```bash
# Test the API endpoints
curl -X GET "https://your-supabase-url.supabase.co/rest/v1/rpc/health_check" \
  -H "apikey: YOUR_ANON_KEY"
# Expected: 200 status with JSON response (not 404)
```

**Emergency Resources**:
- [`URGENT_RPC_FUNCTIONS_TROUBLESHOOTING.md`](URGENT_RPC_FUNCTIONS_TROUBLESHOOTING.md:1) - Immediate troubleshooting steps
- [`verify-migration-status.sql`](verify-migration-status.sql:1) - Comprehensive database state verification
- [`emergency-migration-application.md`](emergency-migration-application.md:1) - Step-by-step emergency migration guide

### Migration Status Verification Steps

```sql
-- 1. Check migration record (if using Supabase migrations)
SELECT version FROM supabase_migrations.schema_migrations
WHERE version = '20250531000000';
-- No results = migration not applied

-- 2. Verify function signatures
SELECT
    routine_name,
    argument_data_types,
    CASE
        WHEN routine_name = 'health_check' AND argument_data_types = '' THEN 'CORRECT'
        WHEN routine_name = 'list_services_with_relationships' AND argument_data_types = 'integer, integer, text, boolean' THEN 'CORRECT'
        ELSE 'INCORRECT'
    END as signature_status
FROM information_schema.routines
WHERE routine_name IN ('health_check', 'list_services_with_relationships')
AND routine_schema = 'public';

-- 3. Test function execution
SELECT health_check();
SELECT list_services_with_relationships(1, 5, NULL, NULL);
```

### Additional Migration Verification Steps

Add these steps to the existing post-deployment validation:

```sql
-- Enhanced verification for production deployment
-- Run this after any migration to ensure complete success

-- 1. Comprehensive function check
WITH expected_functions AS (
    SELECT unnest(ARRAY['health_check', 'list_services_with_relationships']) AS func_name
),
actual_functions AS (
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('health_check', 'list_services_with_relationships')
)
SELECT
    ef.func_name,
    CASE WHEN af.routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM expected_functions ef
LEFT JOIN actual_functions af ON ef.func_name = af.routine_name
ORDER BY ef.func_name;

-- 2. Schema conflict verification
SELECT
    table_name,
    column_name,
    data_type,
    CASE
        WHEN table_name = 'subscription_durations' AND column_name = 'id' AND data_type = 'uuid' THEN 'CORRECT'
        WHEN table_name = 'subscription_durations' AND column_name = 'id' AND data_type = 'integer' THEN 'SCHEMA_CONFLICT'
        ELSE 'OTHER'
    END as schema_status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'subscription_durations'
AND column_name = 'id';

-- 3. Junction tables verification
SELECT
    'Junction Tables' as check_type,
    COUNT(*) as existing_count,
    CASE WHEN COUNT(*) = 2 THEN 'ALL_PRESENT' ELSE 'MISSING_TABLES' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('service_products', 'service_plans');
```