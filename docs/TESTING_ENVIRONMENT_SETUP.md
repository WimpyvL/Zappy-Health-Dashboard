# Testing Environment Setup Guide

## Overview

This comprehensive testing framework validates all 9 categories of critical fixes implemented in the Zappy Dashboard application before production deployment. The testing environment ensures safe validation of database migrations, frontend fixes, and complete system functionality.

## 🔧 **Issues Being Tested:**

1. **Cloud Function Signature Conflicts** - `listServicesWithRelationships` and `healthCheck` functions
2. **Firestore Schema Conflicts** - `subscription_durations` collection inconsistencies
3. **Frontend TypeError Issues** - `subscriptions.forEach` error fixes
4. **Missing Data Relationships** - Simulating joins for `service_plans`, `service_products`, `service_categories`
5. **Missing Health Check Function** - Database monitoring and system health validation
6. **Data Type Inconsistencies** - String ID standardization across all collections
7. **Missing Data Links** - Referential integrity checks
8. **Firestore Security Rule Gaps** - Security rule implementation
9. **Performance Optimization** - Strategic indexing and query improvements

---

## Prerequisites

### Required Software
- **Firebase CLI**: Latest version
- **Node.js**: Version 18+ with npm
- **Git**: For version control
- **Java JDK**: Required for Firebase Emulators

### Required Access
- Firebase project access (staging/test environment)
- Admin privileges for the Firebase project

### Environment Preparation

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Verify installation
firebase --version

# 3. Install project dependencies
npm install

# 4. Install testing dependencies
npm install --save-dev jest supertest @firebase/testing
```

---

## Local Firebase Emulator Setup

### Step 1: Initialize Firebase Emulators

```bash
# 1. Navigate to project root
cd /path/to/zappy-dashboard

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase project (if not already done)
firebase init

# 4. Setup Emulators
firebase init emulators
# Select: Authentication, Firestore, Functions, Storage

# 5. Start local Firebase Emulator Suite
firebase emulators:start
```

### Step 2: Configure Test Database

```bash
# The emulators start with a clean state.
# You can import data for testing if needed.
firebase emulators:start --import=./firebase-test-data
```

### Step 3: Create Test Data
Your application can have scripts to seed the emulator with necessary test data upon startup when in a development environment.

---

## Testing Framework Structure

```
testing-framework/
├── TESTING_ENVIRONMENT_SETUP.md          # This guide
├── test-firebase-fixes.js                # Automated test suite
├── manual-test-procedures/
│   ├── cloud-function-tests.md           # Cloud Function validation
│   ├── firestore-schema-tests.md         # Schema validation
│   ├── frontend-integration-tests.md     # Frontend testing
│   └── performance-tests.md              # Performance validation
├── test-data/
│   ├── sample-patients.json              # Test patient data
│   ├── sample-services.json              # Test service data
│   └── sample-subscriptions.json         # Test subscription data
└── validation-scripts/
    ├── pre-fix-validation.js             # Current state capture
    ├── post-fix-validation.js            # Post-fix validation
    └── rollback-validation.js            # Rollback verification
```

---

## Automated Testing Setup

### Environment Configuration

Create a `.env.test` file:
```env
# Test Environment Configuration
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_API_KEY=your-dev-key
# ... other dev config
```

Your Firebase initialization code should conditionally connect to the emulators:

```javascript
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// ... firebaseConfig

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  console.log("Connecting to Firebase Emulators");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

---

## Migration Application and Testing

### Step 1: Apply Firestore Schema & Rules

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### Step 2: Run Automated Test Suite
```bash
# Run the comprehensive test suite
npm test -- test-firebase-fixes.js

# Run with verbose output
npm test -- test-firebase-fixes.js --verbose

# Run specific test categories
npm test -- test-firebase-fixes.js --testNamePattern="Cloud Functions"
```

### Step 3: Manual Validation Procedures
Follow the detailed manual testing procedures in the `manual-test-procedures/` directory.

---

## Frontend Testing Environment

### Development Server Setup
```bash
# 1. Set environment variables for emulator use
export NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# 2. Start local development server
npm run dev

# 3. Access application
open http://localhost:3000
```

---

## Validation Checklist

### ✅ Firestore Schema Validation
- [ ] **Firestore Rules Deployed**: Rules are active and enforce security.
- [ ] **Firestore Indexes Deployed**: Indexes are created for performance.
- [ ] **All Required Collections Exist**: `patients`, `consultations`, `orders`, etc. are present.
- [ ] **Data Structures Correct**: Documents in collections match the intended schema.

### ✅ Function Testing Validation
- [ ] **Health Check Function**: Returns "ok" status.
- [ ] **Services Function**: Returns valid JSON with data and meta objects.
- **Error Handling**: Invalid parameters return proper error responses.

### ✅ Frontend Integration Validation
- [ ] **Follow-up Consultation Page**: Loads without `subscriptions.forEach` errors.
- **Subscription Service Integration**: Patient subscriptions fetch successfully.

### ✅ Performance Validation
- [ ] **Query Performance**: Queries complete in < 200ms on average.
- **Index Utilization**: Firestore console shows indexes are being used.

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Emulator Connection Fails
**Symptoms**: Application cannot connect to emulators.
**Solution**:
- Ensure emulators are running with `firebase emulators:start`.
- Verify the `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` env var is set to `true`.
- Check ports are not blocked (Firestore: 8080, Auth: 9099).

#### Issue 2: Permission Denied Errors
**Symptoms**: Firestore queries fail with permission errors.
**Solution**:
- Check the deployed `firestore.rules`.
- Ensure the test user has the correct role or custom claims.
- Use the Emulator UI's "Requests" tab to debug rule evaluations.

---

This setup provides a complete, isolated environment for thoroughly testing all critical application fixes before deploying to production.
