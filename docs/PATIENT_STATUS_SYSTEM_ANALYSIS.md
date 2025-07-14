# Patient Status System Analysis & Implementation Guide
**Date:** June 3, 2025  
**Context:** Patient Management System Review

## 🔍 **Current Patient Status System**

### **Available Statuses in Codebase:**
Based on the filter dropdown in `src/pages/patients/Patients.jsx`, the system currently supports:

1. ✅ **Active** - Patient is actively receiving care
2. ⚫ **Inactive** - Patient is not currently active (dormant account)
3. 🔴 **Suspended** - Patient account is temporarily suspended
4. 🚫 **Blacklisted** - Patient is permanently banned/blocked
5. 🟡 **Pending** - Patient registration/approval is pending

### **Current Implementation Status:**

#### **✅ What's Working:**
- **Status Filtering**: Users can filter patients by status in the UI
- **Status Options**: All 5 status types are defined in the filter dropdown
- **Bulk Actions**: UI shows "Suspend" and "Activate" buttons for bulk operations
- **Database Support**: Status filtering is implemented in the query hooks

#### **❌ What's Missing:**
- **Status Display**: No visual status indicators/badges in the patient list
- **Status Update Functions**: No working implementation for changing patient status
- **Database Field**: Need to verify if `status` field exists in patients table
- **Bulk Status Operations**: Suspend/Activate buttons are not functional

---

## 🗄️ **Database Schema Analysis**

### **Current Patient Fields:**
From the hooks and form fields, patients table includes:
```sql
- id (primary key)
- first_name
- last_name  
- email
- phone
- mobile_phone
- date_of_birth
- address, city, state, zip
- preferred_pharmacy
- insurance_provider
- policy_number
- group_number
- primary_insurance_holder
- insurance_effective_date
- insurance_copay
- created_at
- updated_at
```

### **Missing Status Field:**
The patient form fields and update functions **do not include a `status` field**, which means:
1. The status filtering may not be working properly
2. We need to add a `status` column to the patients table
3. We need to update the form and API to handle status changes

---

## 🛠️ **Implementation Plan**

### **Phase 1: Database Schema Update (30 minutes)**

#### **1. Add Status Column to Patients Table**
```sql
-- Migration: Add status column to patients table
ALTER TABLE patients 
ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted', 'pending'));

-- Add index for better query performance
CREATE INDEX idx_patients_status ON patients(status);

-- Update existing patients to have 'active' status
UPDATE patients SET status = 'active' WHERE status IS NULL;
```

#### **2. Update Patient Form Fields**
Add status field to `patientFormFields` array:
```javascript
{
  name: 'status',
  label: 'Patient Status',
  type: 'select',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'blacklisted', label: 'Blacklisted' },
    { value: 'pending', label: 'Pending' }
  ],
  gridCols: 1,
  required: 'Status is required'
}
```

### **Phase 2: Status Update Functions (45 minutes)**

#### **1. Add Status Update Hook**
```javascript
// In src/services/database/hooks.js
export const useUpdatePatientStatus = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, status, reason }) => {
      if (!patientId) throw new Error('Patient ID is required');
      if (!status) throw new Error('Status is required');
      
      const result = await db.patients.updateStatus(patientId, status, reason);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.details(variables.patientId),
      });
      
      auditLogService.log('Patient Status Updated', {
        patientId: variables.patientId,
        oldStatus: data.oldStatus,
        newStatus: variables.status,
        reason: variables.reason
      });
      
      toast.success(`Patient status updated to ${variables.status}`);
    },
    onError: (error) => {
      toast.error(`Error updating patient status: ${error.message}`);
    },
    ...options,
  });
};
```

#### **2. Add Bulk Status Update Hook**
```javascript
export const useBulkUpdatePatientStatus = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientIds, status, reason }) => {
      if (!patientIds?.length) throw new Error('Patient IDs are required');
      if (!status) throw new Error('Status is required');
      
      const result = await db.patients.bulkUpdateStatus(patientIds, status, reason);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all });
      
      auditLogService.log('Bulk Patient Status Update', {
        patientIds: variables.patientIds,
        status: variables.status,
        reason: variables.reason,
        count: variables.patientIds.length
      });
      
      toast.success(`Updated ${variables.patientIds.length} patients to ${variables.status}`);
    },
    onError: (error) => {
      toast.error(`Error updating patient statuses: ${error.message}`);
    },
    ...options,
  });
};
```

### **Phase 3: Status Indicators UI (30 minutes)**

#### **1. Create Status Badge Component**
```jsx
// src/components/ui/PatientStatusBadge.jsx
import React from 'react';

const PatientStatusBadge = ({ status }) => {
  const statusConfig = {
    active: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      label: 'Active',
      icon: '🟢'
    },
    inactive: { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      label: 'Inactive',
      icon: '⚫'
    },
    suspended: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      label: 'Suspended',
      icon: '🔴'
    },
    blacklisted: { 
      color: 'bg-red-200 text-red-900 border-red-300', 
      label: 'Blacklisted',
      icon: '🚫'
    },
    pending: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      label: 'Pending',
      icon: '🟡'
    }
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default PatientStatusBadge;
```

#### **2. Add Status Column to Patient Table**
```jsx
// In src/pages/patients/Patients.jsx - Add new table column
<th>Status</th>

// In table body
<td className="px-6 py-4 whitespace-nowrap">
  <PatientStatusBadge status={patient.status || 'active'} />
</td>
```

### **Phase 4: Functional Bulk Actions (45 minutes)**

#### **1. Implement Suspend/Activate Functions**
```jsx
// In src/pages/patients/Patients.jsx
const { mutate: bulkUpdateStatus } = useBulkUpdatePatientStatus();

const handleSuspendPatients = () => {
  if (selectedPatients.length === 0) return;
  
  if (confirm(`Are you sure you want to suspend ${selectedPatients.length} patients?`)) {
    bulkUpdateStatus({
      patientIds: selectedPatients,
      status: 'suspended',
      reason: 'Bulk suspension via admin panel'
    });
    setSelectedPatients([]);
  }
};

const handleActivatePatients = () => {
  if (selectedPatients.length === 0) return;
  
  if (confirm(`Are you sure you want to activate ${selectedPatients.length} patients?`)) {
    bulkUpdateStatus({
      patientIds: selectedPatients,
      status: 'active',
      reason: 'Bulk activation via admin panel'
    });
    setSelectedPatients([]);
  }
};

// Update the bulk action buttons
<button 
  onClick={handleSuspendPatients}
  className="text-red-600 hover:text-red-900 text-sm font-medium mx-2 flex items-center"
>
  <Ban className="h-4 w-4 mr-1" /> Suspend
</button>
<button 
  onClick={handleActivatePatients}
  className="text-green-600 hover:text-green-900 text-sm font-medium mx-2 flex items-center"
>
  <UserCheck className="h-4 w-4 mr-1" /> Activate
</button>
```

---

## 🎯 **How to Flag/Suspend a Patient**

### **Individual Patient:**
1. **Via Edit Modal**: Click edit button → Change status dropdown → Save
2. **Via Patient Detail Page**: Add status update section to patient detail view
3. **Quick Actions**: Add status change buttons to patient row actions

### **Bulk Operations:**
1. **Select Patients**: Use checkboxes to select multiple patients
2. **Choose Action**: Click "Suspend" or "Activate" in bulk actions bar
3. **Confirm**: System shows confirmation dialog with count
4. **Execute**: Status updates with audit logging

### **Status Change Workflow:**
```
1. User selects patient(s)
2. User clicks status action (Suspend/Activate/etc.)
3. System shows confirmation dialog
4. User confirms action
5. API updates patient status in database
6. Audit log records the change
7. UI refreshes to show new status
8. Toast notification confirms success
```

---

## 🔧 **Database Service Updates Needed**

### **Add to `src/services/database/index.js`:**
```javascript
// In patients service
updateStatus: async (id, status, reason = null) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
        status_update_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
},

bulkUpdateStatus: async (patientIds, status, reason = null) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
        status_update_reason: reason
      })
      .in('id', patientIds)
      .select();

    return { 
      data: { 
        successful: data?.length || 0, 
        total: patientIds.length,
        updated: data 
      }, 
      error 
    };
  } catch (error) {
    return { data: null, error };
  }
}
```

---

## 📊 **Expected Results**

### **After Implementation:**
- ✅ **Visual Status Indicators**: Color-coded badges for each patient
- ✅ **Functional Bulk Actions**: Working Suspend/Activate buttons
- ✅ **Individual Status Updates**: Edit patient status via form
- ✅ **Audit Logging**: All status changes are tracked
- ✅ **Proper Filtering**: Status filter works with database field
- ✅ **User Feedback**: Toast notifications for all actions

### **User Experience:**
- **Quick Identification**: Instantly see patient status with color-coded badges
- **Bulk Management**: Efficiently manage multiple patients at once
- **Audit Trail**: Complete history of status changes for compliance
- **Confirmation Dialogs**: Prevent accidental status changes

---

## 🚀 **Next Steps**

1. **Database Migration**: Add status column to patients table
2. **Update Form Fields**: Add status field to patient form
3. **Implement Hooks**: Add status update mutation hooks
4. **Create UI Components**: Build status badge component
5. **Update Patient List**: Add status column and functional bulk actions
6. **Test Functionality**: Verify all status operations work correctly

This implementation will provide a complete patient status management system with visual indicators, bulk operations, and proper audit logging.
