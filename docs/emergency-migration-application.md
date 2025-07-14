# 🚨 Emergency Migration Application Guide

## Critical Situation Overview

**Problem**: Production database is missing critical RPC functions causing 404 errors
**Solution**: Apply the comprehensive database migration `20250531_comprehensive_database_fix.sql`
**Impact**: Restores `health_check` and `list_services_with_relationships` functions

---

## ⚡ PRE-MIGRATION EMERGENCY CHECKLIST

### 🔴 CRITICAL: Create Backup First

```bash
# 1. Create emergency backup with timestamp
BACKUP_NAME="emergency_pre_migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p ./backups

# 2. Create database dump
supabase db dump --file "./backups/${BACKUP_NAME}.sql"

# 3. Verify backup was created
ls -la "./backups/${BACKUP_NAME}.sql"
echo "✅ Backup created: ./backups/${BACKUP_NAME}.sql"
```

### 🔴 Verify Current State

```bash
# 1. Run the verification script first
psql -f verify-migration-status.sql

# 2. Check Supabase connection
supabase status

# 3. Verify migration file exists
ls -la supabase/migrations/20250531_comprehensive_database_fix.sql
```

### 🔴 Emergency Contacts Notification

**Before proceeding, notify:**
- [ ] Database Team Lead
- [ ] DevOps Team Lead  
- [ ] Product Manager (for business impact)
- [ ] Development Team (for testing support)

---

## 🚀 EMERGENCY MIGRATION PROCEDURES

### Method 1: Standard Supabase CLI (RECOMMENDED)

```bash
# 1. Navigate to project root
cd /path/to/zappy-dashboard

# 2. Verify CLI authentication
supabase status
# If not authenticated:
# supabase login

# 3. Apply the migration
supabase db push --include-schema public

# 4. Monitor for errors
# If successful, should see: "Finished supabase db push."
```

### Method 2: Direct SQL Application (IF CLI FAILS)

```bash
# 1. Connect directly to database
supabase db shell

# 2. Apply migration file content
\i supabase/migrations/20250531_comprehensive_database_fix.sql

# 3. Check for errors in output
# Look for "COMMIT" at the end - indicates success
```

### Method 3: Manual SQL Execution (LAST RESORT)

```sql
-- Copy and paste the ENTIRE content of 20250531_comprehensive_database_fix.sql
-- into your database client (pgAdmin, DataGrip, etc.)
-- ⚠️ Make sure to run it as a single transaction
```

---

## 📊 REAL-TIME MIGRATION MONITORING

### During Migration Execution

```bash
# In a separate terminal, monitor database activity
watch -n 2 "supabase db shell -c \"
SELECT 
    pid,
    state,
    query_start,
    substring(query, 1, 50) as query_snippet
FROM pg_stat_activity 
WHERE state = 'active' 
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;
\""
```

### Monitor Migration Progress

```sql
-- Run this in a separate connection to track progress
SELECT 
    'Migration Progress' as status,
    NOW() as timestamp,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_name IN ('health_check', 'list_services_with_relationships')
     AND routine_schema = 'public') as functions_created,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('services', 'subscription_durations', 'service_products', 'service_plans')) as tables_ready;
```

---

## ✅ IMMEDIATE POST-MIGRATION VERIFICATION

### Step 1: Function Existence Check

```sql
-- Quick verification that functions exist
SELECT 
    routine_name,
    argument_data_types,
    'EXISTS' as status
FROM information_schema.routines 
WHERE routine_name IN ('health_check', 'list_services_with_relationships')
AND routine_schema = 'public'
ORDER BY routine_name;

-- Expected: 2 rows returned
```

### Step 2: Function Functionality Test

```sql
-- Test health_check function
SELECT health_check() as health_result;
-- Expected: JSON with status='ok'

-- Test list_services_with_relationships function
SELECT list_services_with_relationships(1, 5, NULL, NULL) as services_result;
-- Expected: JSON with data array and meta object
```

### Step 3: Permission Verification

```sql
-- Check function permissions
SELECT 
    grantee,
    privilege_type,
    routine_name
FROM information_schema.routine_privileges 
WHERE routine_name IN ('health_check', 'list_services_with_relationships')
ORDER BY routine_name, grantee;

-- Expected:
-- health_check: authenticated, anon
-- list_services_with_relationships: authenticated
```

### Step 4: API Endpoint Test

```bash
# Test health_check endpoint
curl -X GET "https://your-supabase-url.supabase.co/rest/v1/rpc/health_check" \
  -H "apikey: YOUR_ANON_KEY" \
  -w "\n%{http_code}\n"

# Expected: 200 status code with JSON response

# Test list_services_with_relationships endpoint
curl -X POST "https://your-supabase-url.supabase.co/rest/v1/rpc/list_services_with_relationships" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page_number": 1, "page_size": 5}' \
  -w "\n%{http_code}\n"

# Expected: 200 status code with JSON response
```

---

## 🔥 CRITICAL ERROR HANDLING

### If Migration Fails Mid-Execution

```sql
-- Check current transaction state
SELECT 
    pid,
    state,
    query_start,
    query
FROM pg_stat_activity 
WHERE state IN ('active', 'idle in transaction')
AND query LIKE '%CREATE%' OR query LIKE '%DROP%';

-- If stuck in transaction, may need to:
-- 1. Wait for completion
-- 2. Cancel specific queries (use pg_cancel_backend)
-- 3. Terminate connections (use pg_terminate_backend) - LAST RESORT
```

### If Functions Exist But Don't Work

```sql
-- Check for function definition issues
SELECT 
    routine_name,
    external_language,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('health_check', 'list_services_with_relationships')
AND routine_schema = 'public';

-- Look for any incomplete or malformed function definitions
```

### If Tables Are Missing

```sql
-- Check which required tables exist
SELECT 
    'Required Table Status' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (VALUES 
    ('services'),
    ('providers'), 
    ('patients'),
    ('subscription_durations'),
    ('service_products'),
    ('service_plans')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = required_tables.table_name 
    AND t.table_schema = 'public'
ORDER BY required_tables.table_name;
```

---

## 🔄 ROLLBACK PROCEDURES (IF MIGRATION FAILS)

### Emergency Rollback Option 1: Quick Function Drop

```sql
-- Only if migration failed and left system in broken state
BEGIN;

-- Drop any partially created functions
DROP FUNCTION IF EXISTS health_check();
DROP FUNCTION IF EXISTS list_services_with_relationships(integer, integer, text, boolean);
DROP FUNCTION IF EXISTS list_services_with_relationships(boolean);

-- Note: This will return to broken state but cleanly
COMMIT;
```

### Emergency Rollback Option 2: Database Restore

```bash
# Only if migration caused major issues
# This will lose any data created since backup

# 1. Stop application traffic first
# 2. Restore from backup
supabase db reset --linked

# 3. If you have the backup file:
psql < "./backups/${BACKUP_NAME}.sql"

# 4. Verify restoration
supabase status
```

---

## 📋 POST-MIGRATION VALIDATION CHECKLIST

### ✅ Database Level
- [ ] **Functions exist**: Both `health_check` and `list_services_with_relationships`
- [ ] **Functions work**: Can execute without errors
- [ ] **Permissions set**: Proper grants to authenticated/anon roles
- [ ] **Tables present**: All 6 required tables exist
- [ ] **Schema resolved**: `subscription_durations` uses UUID primary key
- [ ] **Indexes created**: Performance indexes in place

### ✅ API Level
- [ ] **Health endpoint**: `GET /rest/v1/rpc/health_check` returns 200
- [ ] **Services endpoint**: `POST /rest/v1/rpc/list_services_with_relationships` returns 200
- [ ] **Error handling**: Invalid parameters return proper error responses
- [ ] **Authentication**: Endpoints respect authentication requirements

### ✅ Application Level
- [ ] **Frontend loads**: Application loads without JavaScript errors
- [ ] **Consultations page**: Follow-up consultation notes page works
- [ ] **Subscriptions**: Patient subscriptions display correctly
- [ ] **No forEach errors**: Console shows no `subscriptions.forEach` errors

---

## 🚨 ESCALATION TRIGGERS

### Escalate to Senior Database Administrator if:

1. **Migration hangs for > 10 minutes**
2. **Database locks preventing migration**
3. **Data corruption detected**
4. **Multiple rollback attempts fail**
5. **Production data loss suspected**

### Escalate to Business Leadership if:

1. **Downtime exceeds 30 minutes**
2. **Customer-facing services affected**
3. **Data integrity compromised**
4. **Revenue-impacting functionality broken**

---

## 📞 EMERGENCY CONTACT PROTOCOL

### Immediate Escalation (< 5 minutes)
- **Database Team Lead**: [Contact Info]
- **DevOps Lead**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

### Business Escalation (< 15 minutes)
- **Engineering Manager**: [Contact Info]
- **Product Manager**: [Contact Info]
- **CTO**: [Contact Info]

### External Support
- **Supabase Support**: support@supabase.io
- **Database Consultant**: [Contact Info if available]

---

## 📈 SUCCESS METRICS

### Migration Considered Successful When:

1. **✅ Both RPC functions return 200 status codes**
2. **✅ Frontend application loads without errors**
3. **✅ Consultation notes page works correctly**
4. **✅ Database performance within normal parameters**
5. **✅ No data loss detected**
6. **✅ All automated tests pass**

### Performance Benchmarks:
- **health_check()**: < 50ms response time
- **list_services_with_relationships()**: < 200ms response time
- **Frontend page load**: < 3 seconds
- **API error rate**: < 0.1%

---

## 📝 POST-MIGRATION DOCUMENTATION

### Required Documentation Updates:

1. **Update deployment logs** with migration timestamp and results
2. **Record any issues encountered** and their resolutions
3. **Update monitoring dashboards** with new baselines
4. **Create incident report** if downtime occurred
5. **Update runbooks** with lessons learned

### Follow-up Actions:

1. **Schedule post-mortem** if issues occurred
2. **Review migration process** for improvements
3. **Update backup procedures** based on experience
4. **Test rollback procedures** in staging environment
5. **Update emergency contact information** if needed

---

**Created**: May 31, 2025 1:20 AM
**Priority**: P0 - Critical Production Emergency
**Estimated Recovery Time**: 15-30 minutes
**Business Impact**: High - Core functionality restoration
**Risk Level**: Medium (with proper backup procedures)

---

## Quick Reference Commands

```bash
# Verify migration status
psql -f verify-migration-status.sql

# Apply migration
supabase db push --include-schema public

# Test functions
curl -X GET "https://your-supabase-url.supabase.co/rest/v1/rpc/health_check" -H "apikey: YOUR_ANON_KEY"

# Emergency rollback
supabase db reset --linked