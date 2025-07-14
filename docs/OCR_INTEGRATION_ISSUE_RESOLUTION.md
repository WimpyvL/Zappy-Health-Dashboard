# OCR Integration Issue Resolution

## 🚨 **Current Issues Identified**

### 1. **Multiple Supabase Client Instances**
- `src/lib/supabase.js` creates one client
- `src/services/database/index.js` creates another client
- This causes conflicts and "Multiple GoTrueClient instances" warnings

### 2. **Authentication Session Missing**
- Console shows: "AuthSessionMissingError: Auth session missing!"
- User is not properly authenticated
- Database operations fail due to missing auth

### 3. **Missing Database Table**
- `patient_documents` table likely doesn't exist
- Lab results hooks fail when trying to query non-existent table

### 4. **Deprecated Hook Usage**
- Console warning: "Patient hooks from src/apis/patients/hooks.js are deprecated"
- Should use `src/services/database/hooks.js` instead

## 🔧 **Solution Plan**

### **Step 1: Fix Supabase Client Conflicts**
- Remove duplicate client creation
- Use single client instance from database service
- Update lab results hooks to use unified client

### **Step 2: Create Missing Database Table**
- Create `patient_documents` table migration
- Add proper columns for lab results storage
- Include file storage path support

### **Step 3: Fix Authentication Issues**
- Ensure proper auth context setup
- Add fallback for unauthenticated users
- Graceful error handling

### **Step 4: Update Hook Dependencies**
- Fix lab results hooks to use proper client
- Add error boundaries for missing tables
- Implement graceful degradation

## 🎯 **Implementation Steps**

### **Immediate Fixes**
1. Update lab results hooks to use database service client
2. Add table existence checks
3. Implement authentication fallbacks
4. Create database migration for patient_documents table

### **Testing Strategy**
1. Test with authenticated user
2. Test with unauthenticated user
3. Test with missing database table
4. Test OCR upload workflow end-to-end

## 📋 **Files to Modify**
- `src/apis/labResults/hooks.js` - Fix client usage
- `src/pages/patients/components/PatientLabResults.jsx` - Add error handling
- Create new migration for `patient_documents` table
- Update authentication context if needed

## 🚀 **Expected Outcome**
- Upload lab CTA button works properly
- OCR integration functions without errors
- Graceful handling of missing authentication
- No more console errors or warnings
- Smooth user experience for lab results upload
