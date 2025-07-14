# Testing Environment Setup Guide

## Overview

This comprehensive testing framework validates all 9 categories of critical fixes implemented in the Zappy Dashboard application before production deployment. The testing environment ensures safe validation of database migrations, frontend fixes, and complete system functionality.

## 🔧 **Issues Being Tested:**

1. **RPC Function Signature Conflicts** - [`list_services_with_relationships`](supabase/migrations/20250531_comprehensive_database_fix.sql:195) and [`health_check`](supabase/migrations/20250531_comprehensive_database_fix.sql:368) functions
2. **Schema Conflicts** - [`subscription_durations`](supabase/migrations/20250531_comprehensive_database_fix.sql:14) table SERIAL vs UUID resolution
3. **Frontend TypeError Issues** - [`subscriptions.forEach`](src/pages/consultations/FollowUpConsultationNotes.jsx:263) error fixes
4. **Missing Junction Tables** - [`service_plans`](supabase/migrations/20250531_comprehensive_database_fix.sql:154), [`service_products`](supabase/migrations/20250531_comprehensive_database_fix.sql:145), [`service_categories`](supabase/migrations/20250531_comprehensive_database_fix.sql:147)
5. **Missing Health Check Function** - Database monitoring and system health validation
6. **Data Type Inconsistencies** - UUID standardization across all tables
7. **Missing Foreign Key Relationships** - Referential integrity establishment
8. **RLS Policy Gaps** - Row-Level Security policy implementation
9. **Performance Optimization** - Strategic indexing and constraint improvements

---

## Prerequisites

### Required Software
- **Supabase CLI**: Version 1.100.0+
- **Node.js**: Version 16+ with npm
- **Git**: For version control
- **PostgreSQL Client**: For direct database testing (optional)

### Required Access
- Supabase project access (staging/test environment)
- Database admin privileges
- Application deployment access

### Environment Preparation

```bash
# 1. Install Supabase CLI
npm install -g @supabase/cli

# 2. Verify installation
supabase --version

# 3. Install project dependencies
npm install

# 4. Install testing dependencies
npm install --save-dev jest supertest
```

---

## Local Supabase Environment Setup

### Step 1: Initialize Local Supabase

```bash
# 1. Navigate to project root
cd /path/to/zappy-dashboard

# 2. Initialize Supabase (if not already done)
supabase init

# 3. Link to staging project for testing
supabase link --project-ref YOUR_STAGING_PROJECT_REF

# 4. Start local Supabase instance
supabase start
```

### Step 2: Configure Test Database

```bash
# 1. Reset local database to clean state
supabase db reset

# 2. Apply all existing migrations up to the fix
supabase db push

# 3. Verify database status
supabase status
```

### Step 3: Create Test Data

```bash
# Apply the test data creation script
supabase db reset --linked
```

---

## Testing Framework Structure

```
testing-framework/
├── TESTING_ENVIRONMENT_SETUP.md          # This guide
├── test-supabase-fixes.js                # Automated test suite
├── manual-test-procedures/
│   ├── rpc-function-tests.md             # RPC function validation
│   ├── schema-conflict-tests.md          # Schema validation
│   ├── frontend-integration-tests.md     # Frontend testing
│   └── performance-tests.md              # Performance validation
├── test-data/
│   ├── sample-patients.sql               # Test patient data
│   ├── sample-services.sql               # Test service data
│   └── sample-subscriptions.sql          # Test subscription data
└── validation-scripts/
    ├── pre-migration-state.sql           # Current state capture
    ├── post-migration-validation.sql     # Post-fix validation
    └── rollback-validation.sql           # Rollback verification
```

---

## Automated Testing Setup

### Environment Configuration

Create a `.env.test` file:

```env
# Test Environment Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_KEY=your_local_service_key
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Test Data Configuration
TEST_PATIENT_ID=test-patient-uuid
TEST_SERVICE_ID=test-service-uuid
TEST_PROVIDER_ID=test-provider-uuid
```

### Test Database Connection

```javascript
// test-config.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
```

---

## Pre-Migration State Capture

### Capture Current Database State

```bash
# 1. Create backup directory
mkdir -p ./testing-framework/backups

# 2. Capture current schema
supabase db dump --schema-only > ./testing-framework/backups/pre-migration-schema.sql

# 3. Capture current data
supabase db dump --data-only > ./testing-framework/backups/pre-migration-data.sql

# 4. Run pre-migration validation
psql $TEST_DATABASE_URL -f ./testing-framework/validation-scripts/pre-migration-state.sql
```

### Document Expected Failures

```sql
-- Expected failures before migration
-- These should be resolved after applying the comprehensive fix

-- 1. RPC Function Signature Conflicts
SELECT list_services_with_relationships(1, 10, NULL, NULL); -- Should fail

-- 2. Missing Health Check Function
SELECT health_check(); -- Should fail

-- 3. Schema Conflicts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_durations' 
AND column_name = 'id'; -- May show SERIAL instead of UUID

-- 4. Missing Junction Tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('service_plans', 'service_products'); -- May be empty
```

---

## Migration Application and Testing

### Step 1: Apply Comprehensive Migration

```bash
# 1. Apply the comprehensive database fix
supabase db push

# 2. Verify migration success
supabase db diff

# 3. Check migration history
supabase migration list
```

### Step 2: Run Automated Test Suite

```bash
# Run the comprehensive test suite
npm test -- test-supabase-fixes.js

# Run with verbose output
npm test -- test-supabase-fixes.js --verbose

# Run specific test categories
npm test -- test-supabase-fixes.js --testNamePattern="RPC Functions"
```

### Step 3: Manual Validation Procedures

Follow the detailed manual testing procedures:

1. **[RPC Function Tests](manual-test-procedures/rpc-function-tests.md)** - Function signature and response validation
2. **[Schema Conflict Tests](manual-test-procedures/schema-conflict-tests.md)** - Data type and structure validation  
3. **[Frontend Integration Tests](manual-test-procedures/frontend-integration-tests.md)** - UI functionality validation
4. **[Performance Tests](manual-test-procedures/performance-tests.md)** - Query performance validation

---

## Frontend Testing Environment

### Development Server Setup

```bash
# 1. Start local development server
npm run dev

# 2. Set environment variables for testing
export REACT_APP_SUPABASE_URL=http://localhost:54321
export REACT_APP_SUPABASE_ANON_KEY=your_local_anon_key

# 3. Access application
open http://localhost:3000
```

### Browser Testing Setup

```bash
# Install browser testing tools
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev puppeteer

# Run frontend tests
npm run test:frontend
```

---

## Validation Checklist

### ✅ Database Migration Validation

- [ ] **Migration Applied Successfully**
  ```bash
  supabase migration list | grep "20250531_comprehensive_database_fix"
  ```

- [ ] **All Required Tables Exist**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('subscription_durations', 'services', 'service_products', 'service_plans', 'providers', 'patients');
  ```

- [ ] **RPC Functions Restored**
  ```sql
  SELECT routine_name, argument_data_types 
  FROM information_schema.routines 
  WHERE routine_name IN ('list_services_with_relationships', 'health_check');
  ```

- [ ] **Schema Conflicts Resolved**
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'subscription_durations' 
  AND column_name = 'id';
  -- Should return: id | uuid
  ```

### ✅ Function Testing Validation

- [ ] **Health Check Function**
  ```sql
  SELECT health_check()->'status' as status;
  -- Should return: "ok"
  ```

- [ ] **Services Function with Pagination**
  ```sql
  SELECT list_services_with_relationships(1, 5, NULL, NULL);
  -- Should return valid JSON with data array and meta object
  ```

- [ ] **Services Function with Search**
  ```sql
  SELECT list_services_with_relationships(1, 5, 'weight', TRUE);
  -- Should return filtered results
  ```

- [ ] **Error Handling**
  ```sql
  SELECT list_services_with_relationships(0, 10, NULL, NULL);
  -- Should return error JSON with proper structure
  ```

### ✅ Frontend Integration Validation

- [ ] **Sessions Page Navigation**
  - Navigate to sessions page without JavaScript errors
  - Verify patient session list loads correctly
  - Click on follow-up consultation sessions

- [ ] **Follow-up Consultation Page**
  - Page loads without `subscriptions.forEach` errors
  - Patient subscriptions display correctly
  - Service tags populate properly
  - No console errors related to data structure

- [ ] **Subscription Service Integration**
  - Patient subscriptions fetch successfully
  - Active services populate in service tags
  - Service categories display with proper styling

### ✅ Performance Validation

- [ ] **Query Performance**
  ```sql
  EXPLAIN (ANALYZE, BUFFERS) 
  SELECT list_services_with_relationships(1, 10, NULL, NULL);
  -- Should complete in < 200ms
  ```

- [ ] **Index Utilization**
  ```sql
  SELECT schemaname, tablename, indexname, idx_scan 
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public';
  ```

- [ ] **Connection Health**
  ```sql
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE state = 'active';
  ```

---

## Rollback Testing Procedures

### Rollback Preparation

```bash
# 1. Create rollback migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_comprehensive_fix.sql << 'EOF'
-- Rollback comprehensive database fix
-- WARNING: This will restore previous state with known issues

BEGIN;

-- Drop fixed functions
DROP FUNCTION IF EXISTS health_check();
DROP FUNCTION IF EXISTS list_services_with_relationships(integer, integer, text, boolean);

-- Restore previous state (customize based on your backup)
-- Note: This is a template - actual rollback should restore exact previous state

COMMIT;
EOF

# 2. Test rollback application
supabase db push --dry-run

# 3. Apply rollback if needed
supabase db push
```

### Rollback Validation

```bash
# 1. Verify rollback state
npm test -- test-supabase-fixes.js --testNamePattern="rollback"

# 2. Confirm expected failures return
psql $TEST_DATABASE_URL -f ./testing-framework/validation-scripts/rollback-validation.sql

# 3. Re-apply fix after rollback testing
supabase db push
```

---

## Monitoring and Alerting Setup

### Test Environment Monitoring

```javascript
// monitoring-setup.js
const { supabaseAdmin } = require('./test-config');

async function setupTestMonitoring() {
  // Create monitoring view for function health
  await supabaseAdmin.rpc('sql', {
    query: `
      CREATE OR REPLACE VIEW test_function_health AS
      SELECT 
        'health_check' as function_name,
        CASE 
          WHEN (SELECT health_check()->>'status') = 'ok' THEN 'healthy'
          ELSE 'unhealthy'
        END as status,
        NOW() as last_checked;
    `
  });

  console.log('Test monitoring setup complete');
}
```

### Automated Health Checks

```bash
# Add to test suite - continuous monitoring
npm test -- test-supabase-fixes.js --watch

# Health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "Testing database health..."
psql $TEST_DATABASE_URL -c "SELECT health_check();"
echo "Testing services function..."
psql $TEST_DATABASE_URL -c "SELECT list_services_with_relationships(1, 5, NULL, NULL);"
EOF

chmod +x health-check.sh
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Migration Fails to Apply

**Symptoms**: Migration command returns error
**Diagnosis**:
```bash
# Check for syntax errors
supabase db diff --file supabase/migrations/20250531_comprehensive_database_fix.sql

# Check for conflicting migrations
supabase migration list
```

**Solution**:
```bash
# Reset to clean state
supabase db reset

# Apply migrations individually
supabase db push --include-all
```

#### Issue 2: Functions Not Accessible

**Symptoms**: Permission denied errors
**Diagnosis**:
```sql
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name IN ('health_check', 'list_services_with_relationships');
```

**Solution**:
```sql
-- Re-grant permissions
GRANT EXECUTE ON FUNCTION list_services_with_relationships(integer, integer, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION health_check() TO authenticated, anon;
```

#### Issue 3: Frontend Still Shows Errors

**Symptoms**: `subscriptions.forEach` error persists
**Diagnosis**:
```bash
# Check if fix is deployed
grep -n "response\.data && Array\.isArray" src/pages/consultations/FollowUpConsultationNotes.jsx

# Clear browser cache
# Hard refresh: Ctrl+F5 or Cmd+Shift+R
```

**Solution**:
```bash
# Rebuild application
npm run build

# Verify deployment
curl -I http://localhost:3000/static/js/main.[hash].js
```

---

## Test Execution Timeline

### Phase 1: Environment Setup (30 minutes)
1. Install prerequisites
2. Setup local Supabase
3. Configure test environment
4. Create test data

### Phase 2: Pre-Migration Testing (15 minutes)  
1. Capture current state
2. Document expected failures
3. Run baseline tests

### Phase 3: Migration Application (10 minutes)
1. Apply comprehensive migration
2. Verify migration success
3. Initial validation

### Phase 4: Comprehensive Testing (60 minutes)
1. Automated test suite execution
2. Manual validation procedures
3. Frontend integration testing
4. Performance validation

### Phase 5: Rollback Testing (30 minutes)
1. Test rollback procedures
2. Verify rollback state
3. Re-apply migration

### Phase 6: Final Validation (15 minutes)
1. Complete system test
2. Documentation update
3. Sign-off preparation

**Total Estimated Time: 2.5 hours**

---

## Success Criteria

### Database Migration Success
- ✅ All 9 categories of issues resolved
- ✅ No data loss during migration
- ✅ All functions respond correctly
- ✅ Schema conflicts eliminated
- ✅ Performance within acceptable limits

### Frontend Integration Success  
- ✅ No JavaScript errors in console
- ✅ Follow-up consultation page loads correctly
- ✅ Subscription data displays properly
- ✅ Service tags function as expected

### System Health Success
- ✅ Health check function returns "ok" status
- ✅ All API endpoints responding
- ✅ Database connections stable
- ✅ Query performance optimal

---

## Next Steps

1. **Execute Testing Framework**: Run complete test suite
2. **Document Results**: Record all test outcomes
3. **Address Issues**: Fix any discovered problems
4. **Production Preparation**: Prepare deployment plan
5. **Team Review**: Conduct final review with development team

---

**Testing Framework Version**: 1.0  
**Last Updated**: May 31, 2025  
**Next Review**: After production deployment  

For issues or questions, refer to the [Troubleshooting Guide](#troubleshooting-guide) or contact the development team.
    ├── post-migration-validation.sql     # Post-fix validation
    └── rollback-validation.sql           # Rollback verification
```

---

## Automated Testing Setup

### Environment Configuration

Create a `.env.test` file:

```env
# Test Environment Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_KEY=your_local_service_key
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Test Data Configuration
TEST_PATIENT_ID=test-patient-uuid
TEST_SERVICE_ID=test-service-uuid
TEST_PROVIDER_ID=test-provider-uuid
```

### Test Database Connection

```javascript
// test-config.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
```

---

## Pre-Migration State Capture

### Capture Current Database State

```bash
# 1. Create backup directory
mkdir -p ./testing-framework/backups

# 2. Capture current schema
supabase db dump --schema-only > ./testing-framework/backups/pre-migration-schema.sql

# 3. Capture current data
supabase db dump --data-only > ./testing-framework/backups/pre-migration-data.sql

# 4. Run pre-migration validation
psql $TEST_DATABASE_URL -f ./testing-framework/validation-scripts/pre-migration-state.sql
```

### Document Expected Failures

```sql
-- Expected failures before migration
-- These should be resolved after applying the comprehensive fix

-- 1. RPC Function Signature Conflicts
SELECT list_services_with_relationships(1, 10, NULL, NULL); -- Should fail

-- 2. Missing Health Check Function
SELECT health_check(); -- Should fail

-- 3. Schema Conflicts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_durations' 
AND column_name = 'id'; -- May show SERIAL instead of UUID

-- 4. Missing Junction Tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('service_plans', 'service_products'); -- May be empty
```

---

## Migration Application and Testing

### Step 1: Apply Comprehensive Migration

```bash
# 1. Apply the comprehensive database fix
supabase db push

# 2. Verify migration success
supabase db diff

# 3. Check migration history
supabase migration list
```

### Step 2: Run Automated Test Suite

```bash
# Run the comprehensive test suite
npm test -- test-supabase-fixes.js

# Run with verbose output
npm test -- test-supabase-fixes.js --verbose

# Run specific test categories
npm test -- test-supabase-fixes.js --testNamePattern="RPC Functions"
```

### Step 3: Manual Validation Procedures

Follow the detailed manual testing procedures:

1. **[RPC Function Tests](manual-test-procedures/rpc-function-tests.md)** - Function signature and response validation
2. **[Schema Conflict Tests](manual-test-procedures/schema-conflict-tests.md)** - Data type and structure validation  
3. **[Frontend Integration Tests](manual-test-procedures/frontend-integration-tests.md)** - UI functionality validation
4. **[Performance Tests](manual-test-procedures/performance-tests.md)** - Query performance validation

---

## Frontend Testing Environment

### Development Server Setup

```bash
# 1. Start local development server
npm run dev

# 2. Set environment variables for testing
export REACT_APP_SUPABASE_URL=http://localhost:54321
export REACT_APP_SUPABASE_ANON_KEY=your_local_anon_key

# 3. Access application
open http://localhost:3000
```

### Browser Testing Setup

```bash
# Install browser testing tools
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev puppeteer

# Run frontend tests
npm run test:frontend
```

---

## Validation Checklist

### ✅ Database Migration Validation

- [ ] **Migration Applied Successfully**
  ```bash
  supabase migration list | grep "20250531_comprehensive_database_fix"
  ```

- [ ] **All Required Tables Exist**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('subscription_durations', 'services', 'service_products', 'service_plans', 'providers', 'patients');
  ```

- [ ] **RPC Functions Restored**
  ```sql
  SELECT routine_name, argument_data_types 
  FROM information_schema.routines 
  WHERE routine_name IN ('list_services_with_relationships', 'health_check');
  ```

- [ ] **Schema Conflicts Resolved**
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'subscription_durations' 
  AND column_name = 'id';
  -- Should return: id | uuid
  ```

### ✅ Function Testing Validation

- [ ] **Health Check Function**
  ```sql
  SELECT health_check()->'status' as status;
  -- Should return: "ok"
  ```

- [ ] **Services Function with Pagination**
  ```sql
  SELECT list_services_with_relationships(1, 5, NULL, NULL);
  -- Should return valid JSON with data array and meta object
  ```

- [ ] **Services Function with Search**
  ```sql
  SELECT list_services_with_relationships(1, 5, 'weight', TRUE);
  -- Should return filtered results
  ```

- [ ] **Error Handling**
  ```sql
  SELECT list_services_with_relationships(0, 10, NULL, NULL);
  -- Should return error JSON with proper structure
  ```

### ✅ Frontend Integration Validation

- [ ] **Sessions Page Navigation**
  - Navigate to sessions page without JavaScript errors
  - Verify patient session list loads correctly
  - Click on follow-up consultation sessions

- [ ] **Follow-up Consultation Page**
  - Page loads without `subscriptions.forEach` errors
  - Patient subscriptions display correctly
  - Service tags populate properly
  - No console errors related to data structure

- [ ] **Subscription Service Integration**
  - Patient subscriptions fetch successfully
  - Active services populate in service tags
  - Service categories display with proper styling

### ✅ Performance Validation

- [ ] **Query Performance**
  ```sql
  EXPLAIN (ANALYZE, BUFFERS) 
  SELECT list_services_with_relationships(1, 10, NULL, NULL);
  -- Should complete in < 200ms
  ```

- [ ] **Index Utilization**
  ```sql
  SELECT schemaname, tablename, indexname, idx_scan 
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public';
  ```

- [ ] **Connection Health**
  ```sql
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE state = 'active';
  ```

---

## Rollback Testing Procedures

### Rollback Preparation

```bash
# 1. Create rollback migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_comprehensive_fix.sql << 'EOF'
-- Rollback comprehensive database fix
-- WARNING: This will restore previous state with known issues

BEGIN;

-- Drop fixed functions
DROP FUNCTION IF EXISTS health_check();
DROP FUNCTION IF EXISTS list_services_with_relationships(integer, integer, text, boolean);

-- Restore previous state (customize based on your backup)
-- Note: This is a template - actual rollback should restore exact previous state

COMMIT;
EOF

# 2. Test rollback application
supabase db push --dry-run

# 3. Apply rollback if needed
supabase db push
```

### Rollback Validation

```bash
# 1. Verify rollback state
npm test -- test-supabase-fixes.js --testNamePattern="rollback"

# 2. Confirm expected failures return
psql $TEST_DATABASE_URL -f ./testing-framework/validation-scripts/rollback-validation.sql

# 3. Re-apply fix after rollback testing
supabase db push
```

---

## Monitoring and Alerting Setup

### Test Environment Monitoring

```javascript
// monitoring-setup.js
const { supabaseAdmin } = require('./test-config');

async function setupTestMonitoring() {
  // Create monitoring view for function health
  await supabaseAdmin.rpc('sql', {
    query: `
      CREATE OR REPLACE VIEW test_function_health AS
      SELECT 
        'health_check' as function_name,
        CASE 
          WHEN (SELECT health_check()->>'status') = 'ok' THEN 'healthy'
          ELSE 'unhealthy'
        END as status,
        NOW() as last_checked;
    `
  });

  console.log('Test monitoring setup complete');
}
```

### Automated Health Checks

```bash
# Add to test suite - continuous monitoring
npm test -- test-supabase-fixes.js --watch

# Health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "Testing database health..."
psql $TEST_DATABASE_URL -c "SELECT health_check();"
echo "Testing services function..."
psql $TEST_DATABASE_URL -c "SELECT list_services_with_relationships(1, 5, NULL, NULL);"
EOF

chmod +x health-check.sh
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Migration Fails to Apply

**Symptoms**: Migration command returns error
**Diagnosis**:
```bash
# Check for syntax errors
supabase db diff --file supabase/migrations/20250531_comprehensive_database_fix.sql

# Check for conflicting migrations
supabase migration list
```

**Solution**:
```bash
# Reset to clean state
supabase db reset

# Apply migrations individually
supabase db push --include-all
```

#### Issue 2: Functions Not Accessible

**Symptoms**: Permission denied errors
**Diagnosis**:
```sql
SELECT grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name IN ('health_check', 'list_services_with_relationships');
```

**Solution**:
```sql
-- Re-grant permissions
GRANT EXECUTE ON FUNCTION list_services_with_relationships(integer, integer, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION health_check() TO authenticated, anon;
```

#### Issue 3: Frontend Still Shows Errors

**Symptoms**: `subscriptions.forEach` error persists
**Diagnosis**:
```bash
# Check if fix is deployed
grep -n "response\.data && Array\.isArray" src/pages/consultations/FollowUpConsultationNotes.jsx

# Clear browser cache
# Hard refresh: Ctrl+F5 or Cmd+Shift+R
```

**Solution**:
```bash
# Rebuild application
npm run build

# Verify deployment
curl -I http://localhost:3000/static/js/main.[hash].js
```

---

## Test Execution Timeline

### Phase 1: Environment Setup (30 minutes)
1. Install prerequisites
2. Setup local Supabase
3. Configure test environment
4. Create test data

### Phase 2: Pre-Migration Testing (15 minutes)  
1. Capture current state
2. Document expected failures
3. Run baseline tests

### Phase 3: Migration Application (10 minutes)
1. Apply comprehensive migration
2. Verify migration success
3. Initial validation

### Phase 4: Comprehensive Testing (60 minutes)
1. Automated test suite execution
2. Manual validation procedures
3. Frontend integration testing
4. Performance validation

### Phase 5: Rollback Testing (30 minutes)
1. Test rollback procedures
2. Verify rollback state
3. Re-apply migration

### Phase 6: Final Validation (15 minutes)
1. Complete system test
2. Documentation update
3. Sign-off preparation

**Total Estimated Time: 2.5 hours**

---

## Success Criteria

### Database Migration Success
- ✅ All 9 categories of issues resolved
- ✅ No data loss during migration
- ✅ All functions respond correctly
- ✅ Schema conflicts eliminated
- ✅ Performance within acceptable limits

### Frontend Integration Success  
- ✅ No JavaScript errors in console
- ✅ Follow-up consultation page loads correctly
- ✅ Subscription data displays properly
- ✅ Service tags function as expected

### System Health Success
- ✅ Health check function returns "ok" status
- ✅ All API endpoints responding
- ✅ Database connections stable
- ✅ Query performance optimal

---

## Next Steps

1. **Execute Testing Framework**: Run complete test suite
2. **Document Results**: Record all test outcomes
3. **Address Issues**: Fix any discovered problems
4. **Production Preparation**: Prepare deployment plan
5. **Team Review**: Conduct final review with development team

---

**Testing Framework Version**: 1.0  
**Last Updated**: May 31, 2025  
**Next Review**: After production deployment  

For issues or questions, refer to the [Troubleshooting Guide](#troubleshooting-guide) or contact the development team.