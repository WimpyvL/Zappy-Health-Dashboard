# Phase 2B: Critical Fixes Implementation Plan

## Summary
Continuing with the critical fixes identified in user feedback. Phase 2A completed pharmacy management and discount validation fixes. Phase 2B will address the remaining high-priority issues.

## Issues Fixed in Phase 2A ✅
1. ✅ Pharmacy Management - Database schema mismatch (contact_email → email)
2. ✅ Discount Management - Form validation (required fields, value validation)
3. ✅ Task Management - "Add Task" button (Lucide React dependency issue)

## Remaining Critical Issues to Fix

### 1. 🔧 Provider Management - "Add Provider" Button
**Issue**: "Providers – 'Add Provider' button does not function"
**Priority**: High
**Files to Check**: 
- `src/pages/providers/ProviderManagement.jsx`
- `src/apis/providers/hooks.js`

### 2. 🔧 Orders - "Create Order" Medication/Product Loading
**Issue**: "Orders – 'Create Order' - medication/product not loading"
**Priority**: High
**Files to Check**:
- `src/pages/orders/Orders.jsx`
- `src/apis/orders/hooks.js`
- `src/apis/products/hooks.js`

### 3. 🔧 Sessions - Search and Filter Errors
**Issue**: "Sessions – 'search by patient name' getting red error message Error loading data"
**Issue**: "Sessions – using dropdown menu for Statuses to sort - getting red error message Error loading data"
**Priority**: High
**Files to Check**:
- `src/pages/sessions/Sessions.jsx`
- `src/apis/sessions/hooks.js`

### 4. 🔧 Patient Messaging - Direct Messages
**Issue**: "Cannot send direct message to patient with 'Message' button on patient profile"
**Priority**: High
**Files to Check**:
- Patient profile components
- Messaging system integration

### 5. 🔧 Patient Profile - Missing Functionality
**Issue**: "Patient profile – under notes – no option/function to add notes"
**Issue**: "Patient profile – 'Patient Info' - section is blank - no option to add patient information"
**Priority**: High
**Files to Check**:
- Patient detail components
- Patient notes functionality

### 6. 🔧 Tags Management - Delete Functionality
**Issue**: "Tags - No option to delete tag"
**Priority**: Medium
**Files to Check**:
- `src/pages/tags/TagManagement.jsx`

### 7. 🔧 Products & Subscriptions - Form Issues
**Issue**: "Products & Subscriptions – Bundles – Add New Bundle – cannot type anything in boxes"
**Issue**: "Products & Subscriptions - Add New Service - can't type/add any services"
**Priority**: Medium
**Files to Check**:
- Product management components
- Bundle management forms

### 8. 🔧 Insurance - Document Upload
**Issue**: "Insurance - 'Upload Document' does not work"
**Priority**: Medium
**Files to Check**:
- Insurance upload components

### 9. 🔧 Educational Resources - Routing Issues
**Issue**: "Educational Resources - Production information - actions - view - goes to patient dashboard - not routing properly"
**Priority**: Medium

### 10. 🔧 Form System - Dynamic Templates
**Issue**: "Form flow is not working, Form must have its dynamic prompt templates"
**Priority**: High
**Files to Check**:
- Form submission system
- Dynamic template engine

## Implementation Strategy

### Phase 2B-1: Provider Management Fix
1. Check ProviderManagement component for button functionality
2. Verify provider API hooks
3. Fix any dependency or validation issues

### Phase 2B-2: Orders System Fix
1. Investigate medication/product loading in create order flow
2. Check API integration between orders and products
3. Fix data loading issues

### Phase 2B-3: Sessions Error Handling
1. Add proper error handling to sessions search
2. Fix status dropdown filtering
3. Improve error messaging

### Phase 2B-4: Patient Profile Enhancements
1. Add patient notes functionality
2. Enable patient info editing
3. Fix messaging integration

### Phase 2B-5: Remaining UI Fixes
1. Tags delete functionality
2. Products & subscriptions form issues
3. Insurance upload
4. Educational resources routing

## Expected Outcomes
- All critical "Add" buttons will function properly
- Search and filtering will work without errors
- Patient profile will have full CRUD functionality
- Form systems will support dynamic templates
- Error handling will be improved across all sections

## Next Steps
1. Start with Provider Management (highest impact)
2. Move to Orders system (affects revenue)
3. Fix Sessions errors (affects daily workflow)
4. Complete patient profile functionality
5. Address remaining UI issues

## Success Metrics
- All reported button functionality issues resolved
- Error messages eliminated from search/filter operations
- Patient management workflow fully functional
- Form submission system working with dynamic templates
