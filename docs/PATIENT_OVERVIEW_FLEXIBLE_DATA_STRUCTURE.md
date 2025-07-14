# Patient Overview - Flexible Data Structure

## Overview
The PatientOverview component has been completely refactored to be program-agnostic and data-driven. All hardcoded values have been removed and replaced with flexible data structures that can accommodate any type of healthcare program or service.

## Expected Patient Data Structure

```javascript
const patient = {
  // Basic Patient Information
  id: "patient-123",
  first_name: "John",
  last_name: "Doe", 
  email: "john@example.com",
  
  // Financial Information
  outstandingBalance: 127.50, // Optional - only shows payment section if > 0
  paymentStatus: "Overdue 5 days", // Optional description
  
  // Priority Alerts (Optional Array)
  priorityAlerts: [
    {
      title: "Recent Labs: Cholesterol elevated",
      description: "LDL 142 mg/dL - review recommended",
      severity: "warning", // "warning", "danger", "info", "success"
      icon: "⚠️", // Optional custom icon
      actionButton: {
        label: "Review",
        action: "lab-results", // Tab to navigate to
        onClick: () => {} // Optional custom function
      }
    }
  ],
  
  // Active Issue (Optional Object)
  activeIssue: {
    title: "Active Issue: Headache with dizziness",
    description: "Prescribed Ibuprofen 600mg • Dr. Sarah Chen • 2 hours ago",
    severity: "info", // "warning", "danger", "info", "success"
    actionButton: {
      label: "Message",
      action: "messages",
      onClick: () => {} // Optional custom function
    }
  },
  
  // Care Timeline (Optional Object)
  careTimeline: {
    timeframe: "Last 48 hours", // Optional description
    events: [
      {
        time: "2h ago",
        title: "Patient Message - Symptom Update",
        description: "\"Headache worsening with new dizziness. Ibuprofen helping but concerned about symptoms.\""
      },
      {
        time: "5h ago", 
        title: "Prescription Sent",
        description: "Ibuprofen 600mg PRN → CVS Main Street. Patient pickup confirmed."
      },
      {
        time: "Yesterday",
        title: "Lab Results Available", 
        description: "Wellness panel completed. Total cholesterol 210, LDL 142 (elevated). Patient notified."
      }
    ]
  },
  
  // Active Program (Optional Object)
  activeProgram: {
    name: "Weight Management Program", // Can be any program name
    planType: "Premium Plan",
    progress: "Week 8 of 12",
    nextAppointment: "Tomorrow 2:00 PM",
    currentStatus: "168 lbs → 152 lbs target",
    details: "Semaglutide 0.5mg weekly • 97% adherence",
    outstandingBalance: 127.50, // Optional - only shows payment if > 0
    progressMetric: { // Optional progress display
      value: "-12 lbs",
      description: "43% to goal"
    }
  }
};
```

## Component Features

### 1. **Dynamic Priority Alerts**
- Supports multiple alerts with different severity levels
- Custom icons and action buttons
- Flexible styling based on severity (warning, danger, info, success)

### 2. **Conditional Active Issue**
- Only displays if `patient.activeIssue` exists
- Supports custom severity levels and action buttons
- Flexible content structure

### 3. **Dynamic Care Timeline**
- Only displays if `patient.careTimeline.events` exists and has items
- Supports unlimited timeline events
- Custom timeframe descriptions

### 4. **Program-Agnostic Active Program**
- Works with any healthcare program type
- Optional progress metrics and payment integration
- Conditional rendering based on data availability

### 5. **Smart Payment Integration**
- **Process Button**: Opens payment modal with actual patient data
- **Remind Button**: Sends payment reminder notifications
- Only shows payment options when balances exist
- Supports multiple payment contexts (program payments, outstanding balances)

## Usage Examples

### Weight Loss Program
```javascript
const weightLossPatient = {
  activeProgram: {
    name: "Weight Management Program",
    planType: "Premium Plan",
    progress: "Week 8 of 12",
    progressMetric: {
      value: "-12 lbs",
      description: "43% to goal"
    }
  }
};
```

### Mental Health Program
```javascript
const mentalHealthPatient = {
  activeProgram: {
    name: "Anxiety Management Program",
    planType: "Therapy Plus",
    progress: "Session 6 of 10",
    progressMetric: {
      value: "GAD-7: 8",
      description: "Mild anxiety"
    }
  }
};
```

### Diabetes Management
```javascript
const diabetesPatient = {
  activeProgram: {
    name: "Diabetes Care Program",
    planType: "Comprehensive",
    progress: "Month 3 of 6",
    progressMetric: {
      value: "A1C: 7.2%",
      description: "Improving"
    }
  }
};
```

## Benefits

1. **Universal Compatibility**: Works with any healthcare program type
2. **Conditional Rendering**: Only shows sections when data exists
3. **Flexible Payment Processing**: Handles multiple payment scenarios
4. **Scalable Architecture**: Easy to extend for new program types
5. **Data-Driven UI**: No hardcoded values, all content from patient data
6. **Enhanced User Experience**: Smart payment buttons with dual actions

## Migration Notes

- All hardcoded "Weight Loss Program" references removed
- Payment processing now uses actual patient data
- Timeline events are completely dynamic
- Priority alerts support unlimited items
- Insurance and administrative sections remain functional
- All existing payment modal integration preserved

The component is now truly agnostic to the specific healthcare program and will adapt to whatever patient data structure is provided while maintaining all enhanced payment processing functionality.
