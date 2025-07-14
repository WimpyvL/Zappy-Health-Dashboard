# Patient Measurement Tracking System

This document provides an overview of the patient measurement tracking system implemented in the Telehealth application. The system allows for tracking various health metrics across different service types without requiring predefined database categories.

## Overview

The patient measurement tracking system uses a flexible approach based on service types rather than database categories. This allows for easy addition of new service types and measurement variables without requiring database schema changes.

Key components:
- Service type definitions with associated measurement types
- JSONB storage in the patient_service_enrollments table
- React components for data entry and visualization
- Hooks for data access and manipulation

## Service Types and Measurements

Service types and their associated measurements are defined in `src/constants/serviceTypes.js`. Each service type has:

- Required measurements
- Optional measurements
- Goals
- Metadata for each measurement type

Example:

```javascript
// Weight Management Service
[SERVICE_TYPES.WEIGHT_MANAGEMENT]: {
  required: ['weight', 'height'],
  optional: ['waistCircumference', 'activityLevel', 'dietAdherence'],
  goals: ['targetWeight'],
  metadata: {
    weight: {
      label: 'Weight',
      description: 'Current body weight',
      unit: 'lbs',
      type: 'timeseries',
      min: 50,
      max: 500,
      step: 0.1,
      icon: 'weight'
    },
    // ... other measurements
  }
}
```

## Data Storage

Measurement data is stored in the `settings` JSONB field of the `patient_service_enrollments` table. The structure is:

```json
{
  "measurements": {
    "weight": [
      {"date": "2025-05-01", "value": 85.5, "notes": "Morning measurement"},
      {"date": "2025-05-08", "value": 84.2, "notes": "After workout"}
    ],
    "height": 175,
    "waistCircumference": [
      {"date": "2025-05-01", "value": 92}
    ]
  },
  "goals": {
    "targetWeight": 75
  }
}
```

## Components

The system includes the following components:

1. **MeasurementEntryFactory**: Factory component that creates the appropriate measurement entry modal based on the measurement type.

2. **GenericMeasurementModal**: Reusable modal for entering various types of measurements.

3. **MeasurementProgress**: Component for displaying progress towards goals.

4. **MeasurementChart**: Component for visualizing measurement history over time.

5. **PatientMeasurementSection**: Main component that ties everything together and provides a complete interface for tracking and visualizing patient measurements.

## Usage

To use the measurement tracking system in a page:

```jsx
import PatientMeasurementSection from '../../components/patient/PatientMeasurementSection';

// In your component
<PatientMeasurementSection
  enrollmentId={enrollment.id}
  serviceType={enrollment.service?.service_type}
/>
```

See `src/pages/patients/PatientMeasurementsPage.jsx` for a complete example.

## Adding New Service Types

To add a new service type:

1. Add the service type to the `SERVICE_TYPES` object in `src/constants/serviceTypes.js`.

2. Define the required and optional measurements, goals, and metadata for the new service type.

3. No database schema changes are required since the data is stored in the JSONB field.

Example:

```javascript
// Add to SERVICE_TYPES
export const SERVICE_TYPES = {
  // ... existing service types
  DIABETES_MANAGEMENT: 'diabetes-management'
};

// Add service configuration
export const SERVICE_MEASUREMENTS = {
  // ... existing service configurations
  [SERVICE_TYPES.DIABETES_MANAGEMENT]: {
    required: ['bloodGlucose'],
    optional: ['hba1c', 'insulinDose'],
    goals: ['targetBloodGlucose', 'targetHba1c'],
    metadata: {
      bloodGlucose: {
        label: 'Blood Glucose',
        description: 'Blood glucose level',
        unit: 'mg/dL',
        type: 'timeseries',
        min: 40,
        max: 400,
        step: 1,
        icon: 'health'
      },
      // ... other measurements
    }
  }
};
```

## Hooks

The system provides the following hooks:

1. **useMeasurements**: Hook for working with patient measurements. Provides functions for fetching, adding, and analyzing measurements.

Example:

```jsx
const {
  data,
  loading,
  error,
  addMeasurement,
  setGoal,
  calculateProgress,
  getMeasurementTypes,
  getMetadata
} = useMeasurements(enrollmentId, serviceType);

// Add a new measurement
await addMeasurement('weight', 82.5, 'Morning measurement');

// Set a goal
await setGoal('targetWeight', 75);

// Calculate progress
const progress = await calculateProgress('targetWeight', 'weight');
```

## Best Practices

1. **Consistent Measurement Types**: Use consistent measurement types across service types to enable cross-service analysis.

2. **Appropriate Metadata**: Provide complete metadata for each measurement type to ensure proper rendering and validation.

3. **Goal Setting**: Encourage goal setting for measurable metrics to enable progress tracking.

4. **Regular Updates**: Regularly update the service type definitions as new measurement requirements emerge.

## Future Enhancements

Potential future enhancements to the system:

1. **Wearable Integration**: Integration with wearable devices for automatic data collection.

2. **Advanced Analytics**: More sophisticated analysis of measurement data to identify trends and patterns.

3. **Provider Alerts**: Automated alerts for providers when measurements fall outside expected ranges.

4. **Patient Reminders**: Scheduled reminders for patients to log measurements.

5. **Database Migration**: If needed, migrate from JSONB storage to dedicated tables for better querying performance.
