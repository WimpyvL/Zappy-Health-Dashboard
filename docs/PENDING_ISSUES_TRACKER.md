# Pending Issues Tracker

This document tracks issues that need to be revisited and resolved in future development cycles.

## 🔴 High Priority Issues

### 1. Patient Form Submission Error Recovery
**Status**: Partially Fixed - Needs Complete Resolution  
**Location**: `src/components/common/CrudModal.jsx`  
**Issue**: Form submission blocked after API error due to React Hook Form validation state  

**Problem Description**:
- After a duplicate email error, the `apiError` remains in form state
- React Hook Form prevents submission until all validation errors are cleared
- Button clicks register but `handleSubmit` is blocked
- Current fix attempts to clear errors on field change, but may need more robust solution

**Current Workaround**: 
- Added `onChange` handler to clear `apiError` when user types
- Enhanced error messaging for user-friendly display

**Needs**:
- [ ] Complete testing of the onChange error clearing mechanism
- [ ] Verify form submission works after error recovery
- [ ] Consider alternative approaches if current fix is insufficient
- [ ] Add comprehensive error state management

**Files Modified**:
- `src/components/common/CrudModal.jsx` (error clearing logic)
- `src/utils/errorHandling.js` (user-friendly messages)
- `src/apis/patients/hooks.js` (error object preservation)

---

## 🟡 Medium Priority Issues

### 2. Form Validation State Management
**Status**: Needs Investigation  
**Location**: Form components across the application  
**Issue**: Potential broader issue with form error state persistence

**Description**:
- The patient form issue may indicate a systemic problem with form validation
- Other forms may have similar error recovery issues
- Need to audit all CrudModal usage across the application

**Action Items**:
- [ ] Audit all forms using CrudModal component
- [ ] Test error recovery on other entity creation forms
- [ ] Standardize error handling patterns
- [ ] Create form validation best practices guide

---

## 🟢 Low Priority Issues

### 3. Debug Console Cleanup
**Status**: Cleanup Required  
**Location**: `src/components/common/CrudModal.jsx`  
**Issue**: Debug console logs left in production code

**Description**:
- Added extensive console logging for debugging form submission issues
- These should be removed or made conditional for production

**Action Items**:
- [ ] Remove or conditionally enable debug logs
- [ ] Implement proper logging strategy
- [ ] Add development vs production log levels

---

## 📋 Completed Issues

### ✅ User-Friendly Error Messages
**Status**: Completed  
**Issue**: Technical database error messages shown to users  
**Solution**: Enhanced `getErrorMessage()` function to detect constraint violations and show user-friendly messages

### ✅ Error Object Preservation
**Status**: Completed  
**Issue**: Error codes lost during error handling chain  
**Solution**: Modified patient creation hook to preserve error properties (code, details, hint)

---

## 🔧 Technical Debt

### Form Error Handling Architecture
- Consider implementing a centralized form error management system
- Standardize error recovery patterns across all forms
- Create reusable error handling hooks
- Implement consistent validation state management

### Testing Coverage
- Add comprehensive tests for form error scenarios
- Test error recovery workflows
- Validate user experience during error states
- Ensure accessibility compliance for error messages

---

## 📝 Notes

**Last Updated**: December 3, 2025  
**Next Review**: When resuming patient form development  

**Priority Legend**:
- 🔴 High: Blocks user functionality, needs immediate attention
- 🟡 Medium: Affects user experience, should be addressed soon  
- 🟢 Low: Technical debt or minor improvements
