# Pharmacy System Focused Cleanup Plan

## Executive Summary

Based on your feedback, here's a focused cleanup plan for the pharmacy system that addresses only the necessary improvements for your two pharmacy types (Compounding and Retail) and prepares for external pharmacy system integrations.

## Current State Analysis

### Pharmacy Types
- **Current Need**: Only Compounding and Retail pharmacies
- **Current Issue**: Multiple constant files with different type definitions
- **Solution**: Standardize to use only these two types

### Key Issues to Address

## Phase 1: High Priority Fixes

### 1. Standardize Pharmacy Type Constants

**Current Problem**: 
- `src/pages/pharmacy/components/pharmacyConstants.js` has: Compounding, Retail, Specialty
- `src/constants/pharmacy.js` has: 13 different types including Chain, Independent, Hospital, etc.
- Form modal uses the limited set while main constants has comprehensive list

**Solution**:
```javascript
// Standardize to only these two types across all files:
export const PHARMACY_TYPES = [
  { value: 'Compounding', label: 'Compounding Pharmacy' },
  { value: 'Retail', label: 'Retail Pharmacy' }
];
```

**Files to Update**:
- Remove extra types from `src/constants/pharmacy.js`
- Update `src/pages/pharmacy/components/pharmacyConstants.js` to match
- Ensure form modal uses consistent types

### 2. Fix Database Schema Inconsistencies

**Current Problems**:
- Multiple migrations added `contact_email` column repeatedly
- Field mapping confusion: `pharmacy_type` vs `type`, `is_active` vs `active`
- API hooks have complex mapping logic to handle inconsistencies

**Specific Issues**:
```javascript
// In API hooks, this mapping exists due to schema inconsistencies:
active: pharmacy.is_active,  // Should be standardized
served_state_codes: pharmacy.supported_states,  // Field name mismatch
```

**Solution**:
- Create single migration to standardize all pharmacy table columns
- Ensure consistent field names across database and API
- Remove redundant mapping logic in API hooks

### 3. Improve UI Consistency

**Current Problems**:
- Unicode emoji icons (🔍, ➕, ✏️, 🗑️) instead of proper icon library
- Inline CSS styles instead of theme system
- Hardcoded color values and spacing

**Solution**:
- Replace Unicode emojis with Lucide React icons (already used elsewhere in codebase)
- Use existing theme variables instead of hardcoded CSS
- Implement responsive design patterns used in other admin pages

**Example Changes**:
```javascript
// Replace this:
const Search = ({ size = 16 }) => <span style={{ fontSize: `${size}px` }}>🔍</span>;

// With this:
import { Search } from 'lucide-react';
<Search size={16} />
```

### 4. Add Proper Form and Data Validation

**Current Issues**:
- Basic client-side validation only
- No server-side validation
- No data integrity checks

**Solution**:
- Add comprehensive form validation (required fields, email format, phone format)
- Implement server-side validation in API hooks
- Add database constraints for data integrity
- Validate state codes against supported states list

## Phase 2: Medium Priority Enhancements

### 1. Enhance Pharmacy Data Model with Service Types

**Current Limitation**: No way to track what services each pharmacy offers

**Solution**: Add service types to track pharmacy capabilities:
```javascript
// Add to pharmacy model:
service_types: ['prescription_filling', 'compounding', 'delivery', 'consultation']
```

**Use Cases**:
- Filter pharmacies by services offered
- Validate pharmacy capabilities when creating orders
- Display pharmacy capabilities to users

### 2. Improve Integration with Order Flows and Patient Preferences

**Current Issues**:

**Order Flow Problems**:
- No validation if selected pharmacy serves patient's state
- No filtering by pharmacy type or services
- No indication of pharmacy status (active/inactive)

**Patient Preference Problems**:
- `preferred_pharmacy` is free text field instead of structured selection
- No validation against active pharmacies
- No automatic use in order creation

**Solutions**:

**For Order Flow**:
- Add geographic validation (check if pharmacy serves patient's state)
- Filter pharmacy dropdown by active status
- Show pharmacy type and services in selection
- Validate pharmacy capabilities for order type

**For Patient Preferences**:
- Change `preferred_pharmacy` from text to pharmacy ID reference
- Add dropdown to select from active pharmacies
- Auto-populate pharmacy selection in orders based on patient preference
- Validate preferred pharmacy is still active

## Phase 3: Prepare for External Integrations

### 1. Add Integration Status Tracking

**Purpose**: Track which pharmacies have external system integrations

**Implementation**:
```javascript
// Add to pharmacy model:
integration_status: 'connected' | 'pending' | 'disconnected' | 'not_configured'
external_system_id: string // ID in external pharmacy system
last_sync_at: timestamp
```

### 2. API Preparation for External Systems

**Purpose**: Structure API to support external pharmacy system calls

**Implementation**:
- Add integration status fields to pharmacy records
- Create hooks for external system communication
- Add error handling for integration failures
- Implement sync status tracking

## Specific Code Changes Needed

### 1. Constants Cleanup
```javascript
// File: src/constants/pharmacy.js
// Remove all extra types, keep only:
export const PHARMACY_TYPES = [
  { value: 'Compounding', label: 'Compounding Pharmacy' },
  { value: 'Retail', label: 'Retail Pharmacy' }
];
```

### 2. Database Migration
```sql
-- Create comprehensive pharmacy schema fix
ALTER TABLE pharmacies 
  -- Standardize field names
  RENAME COLUMN is_active TO active,
  RENAME COLUMN supported_states TO served_state_codes,
  -- Add service types
  ADD COLUMN service_types TEXT[],
  -- Add integration fields
  ADD COLUMN integration_status TEXT DEFAULT 'not_configured',
  ADD COLUMN external_system_id TEXT,
  ADD COLUMN last_sync_at TIMESTAMP;
```

### 3. API Hooks Simplification
```javascript
// Remove complex mapping logic, use direct field names
const mappedData = (data || []).map((pharmacy) => ({
  ...pharmacy,
  // Remove these mappings after schema fix:
  // active: pharmacy.is_active,
  // served_state_codes: pharmacy.supported_states,
}));
```

### 4. UI Component Updates
```javascript
// Replace Unicode icons with Lucide React
import { Search, Plus, Edit, Trash2, Building } from 'lucide-react';

// Use theme variables instead of hardcoded colors
const cssVariables = {
  '--primary': 'var(--color-primary)',
  '--success': 'var(--color-success)',
  // etc.
};
```

## Implementation Priority

### Week 1: Critical Fixes
1. Standardize pharmacy type constants
2. Create database schema migration
3. Update API hooks to remove mapping complexity

### Week 2: UI Improvements
1. Replace Unicode icons with Lucide React
2. Implement theme-based styling
3. Add proper form validation

### Week 3: Integration Preparation
1. Add service types to pharmacy model
2. Implement integration status tracking
3. Prepare API structure for external systems

### Week 4: Order Flow Integration
1. Add geographic validation to order creation
2. Improve patient pharmacy preference handling
3. Implement smart pharmacy selection

## Success Metrics

1. **Code Quality**: Reduced complexity in API hooks, consistent styling
2. **Data Integrity**: Proper validation, consistent field names
3. **User Experience**: Better pharmacy selection, proper validation feedback
4. **Integration Readiness**: Clean API structure for external system integration

## Files That Need Changes

### High Priority:
- `src/constants/pharmacy.js` - Standardize types
- `src/pages/pharmacy/components/pharmacyConstants.js` - Remove redundancy
- `src/apis/pharmacies/hooks.js` - Simplify mapping logic
- `src/pages/pharmacy/PharmacyManagement.jsx` - UI improvements
- `src/pages/pharmacy/components/PharmacyFormModal.jsx` - Better validation
- Database migration file - Schema standardization

### Medium Priority:
- `src/components/orders/CreateOrderModal.jsx` - Add validation
- `src/pages/patients/Patients.jsx` - Update pharmacy preference field
- Order creation flows - Geographic validation

This focused plan addresses your specific needs while preparing for the external pharmacy system integration you mentioned as the next priority.
