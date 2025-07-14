# Simplified Intake Form Preview System

## Problem Statement
The current method for previewing intake forms is not working because it relies on database lookups with UUID parameters. We need a simple way to view the forms without database dependencies.

## Simplified Solution
Create a minimal set of direct routes to preview the intake forms with mock data, bypassing the database lookup requirements.

## Implementation Details

### 1. Create a Simple Form Preview Component

```jsx
// src/pages/preview/SimpleFormPreview.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import IntakeFormPage from '../intake/IntakeFormPage';
import ModernIntakeFormPage from '../intake/ModernIntakeFormPage';
import { Button, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const SimpleFormPreview = () => {
  const { formType } = useParams();
  const navigate = useNavigate();
  
  // Simple mock data for preview
  const mockData = {
    prescriptionItems: [
      {
        id: 'sample-item-1',
        name: 'Sample Medication',
        category: 'general',
        price: 49.99,
        dosage: '25mg',
        frequency: 'daily',
      }
    ],
    step: 'introduction',
    productCategory: 'general',
  };
  
  return (
    <div className="p-4">
      <div className="mb-4 flex items-center">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          Back
        </Button>
        <h1 className="text-xl font-bold m-0">
          {formType === 'standard' ? 'Standard Intake Form Preview' : 'Modern Intake Form Preview'}
        </h1>
      </div>
      
      <Alert
        message="Preview Mode"
        description="This is a preview of the form. No data will be saved or submitted."
        type="info"
        showIcon
        className="mb-4"
      />
      
      {formType === 'standard' ? (
        <IntakeFormPage location={{ state: mockData }} />
      ) : (
        <ModernIntakeFormPage location={{ state: { category: 'general', serviceType: 'preview' } }} />
      )}
    </div>
  );
};

export default SimpleFormPreview;
```

### 2. Add Simple Preview Routes to AppRoutes.jsx

```jsx
// Add these routes to src/constants/AppRoutes.jsx

// Import the SimpleFormPreview
const SimpleFormPreview = React.lazy(() => import('../pages/preview/SimpleFormPreview'));

// Add these routes inside the Routes component
<Route
  path="/preview/simple/:formType"
  element={
    <MainLayout>
      <Suspense fallback={<PageLoader message="Loading form preview..." />}>
        <SimpleFormPreview />
      </Suspense>
    </MainLayout>
  }
/>
```

### 3. Update the Preview Functions in IntakeFormSettings.jsx

```jsx
// Update these functions in src/pages/settings/pages/IntakeFormSettings.jsx

// Function to preview the standard intake form
const previewStandardIntake = () => {
  window.open('/preview/simple/standard', '_blank');
};

// Function to preview the modern intake form
const previewModernIntake = () => {
  window.open('/preview/simple/modern', '_blank');
};
```

### 4. Minimal Modifications to Intake Form Components

Add a simple check in both IntakeFormPage.jsx and ModernIntakeFormPage.jsx to prevent form submission in preview mode:

```jsx
// In both form components, add near the handleSubmit function:

// Check if we're in preview mode
const isPreviewMode = location.state?.serviceType === 'preview';

// Modify the handleSubmit function
const handleSubmit = async () => {
  // In preview mode, just show a message and don't submit
  if (isPreviewMode) {
    toast.info('This is a preview. Form submission is disabled.');
    return;
  }
  
  // Existing submission code...
};
```

## Benefits of This Simplified Approach

1. **Minimal Changes**: Only requires creating one new component and updating a few functions
2. **No Database Dependencies**: Uses mock data instead of database lookups
3. **Direct Access**: Provides direct routes to preview each form type
4. **Clear Preview Indication**: Shows an alert banner indicating preview mode
5. **Prevents Submission**: Disables form submission in preview mode

## Implementation Steps

1. Create the SimpleFormPreview component
2. Add the new routes to AppRoutes.jsx
3. Update the preview functions in IntakeFormSettings.jsx
4. Add minimal preview mode checks to the intake form components

This simplified approach focuses on the core need - viewing the forms without database dependencies - while minimizing code changes and complexity.