# Intake Form Preview System - Implementation Plan

## Problem Statement
The current method for previewing intake forms is not working. When attempting to access `http://localhost:3000/forms/modern-intake-form`, the system returns an error "Form Not Found" with the message "invalid input syntax for type uuid: 'modern-intake-form'". This occurs because the FormViewer component expects a valid UUID as the form ID parameter, but "modern-intake-form" is not a UUID.

## Solution Overview
Create a dedicated form preview system that will allow easy previewing of intake forms without requiring database entries. This will provide a consistent way to access form previews for both standard and modern intake forms.

## Implementation Details

### 1. Create a FormPreviewPage Component

```jsx
// src/pages/preview/FormPreviewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import IntakeFormPage from '../intake/IntakeFormPage';
import ModernIntakeFormPage from '../intake/ModernIntakeFormPage';
import { Card, Alert, Button, Select, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const FormPreviewPage = () => {
  const { formType, category } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(category || 'general');
  
  // Sample data for preview
  const sampleData = {
    prescriptionItems: [
      {
        id: 'sample-item-1',
        name: 'Sample Medication',
        category: selectedCategory,
        price: 49.99,
        dosage: '25mg',
        frequency: 'daily',
      }
    ],
    step: 'introduction',
    productCategory: selectedCategory,
  };
  
  // Render the appropriate form based on formType
  const renderForm = () => {
    switch (formType) {
      case 'standard':
        return <IntakeFormPage location={{ state: sampleData }} />;
      case 'modern':
        return <ModernIntakeFormPage location={{ state: { category: selectedCategory, serviceType: 'preview' } }} />;
      default:
        return (
          <Alert
            message="Unknown Form Type"
            description={`The form type "${formType}" is not recognized.`}
            type="error"
            showIcon
          />
        );
    }
  };
  
  // Update URL when category changes
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    navigate(`/preview/forms/${formType}/${value}`);
  };
  
  return (
    <div className="form-preview-container">
      <Card className="preview-header">
        <div className="preview-controls">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Form Preview: {formType === 'standard' ? 'Standard Intake Form' : 'Modern Intake Form'}
            </Title>
            <Text type="secondary">
              This is a preview mode. No data will be submitted.
            </Text>
          </div>
          <div>
            <Text>Category:</Text>
            <Select 
              value={selectedCategory} 
              onChange={handleCategoryChange}
              style={{ width: 180, marginLeft: 8 }}
            >
              <Option value="general">General</Option>
              <Option value="weight_management">Weight Management</Option>
              <Option value="ed">ED Treatment</Option>
              <Option value="hair_loss">Hair Loss</Option>
            </Select>
          </div>
        </div>
      </Card>
      
      <div className="preview-content">
        <Alert
          message="Preview Mode"
          description="This is a preview of the form. No data will be saved or submitted."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        {renderForm()}
      </div>
      
      <style jsx>{`
        .form-preview-container {
          padding: 20px;
        }
        .preview-header {
          margin-bottom: 20px;
        }
        .preview-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .preview-content {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default FormPreviewPage;
```

### 2. Add Preview Routes to AppRoutes.jsx

```jsx
// Add these routes to src/constants/AppRoutes.jsx

// Import the FormPreviewPage
const FormPreviewPage = React.lazy(() => import('../pages/preview/FormPreviewPage'));

// Add these routes inside the Routes component
<Route
  path="/preview/forms/:formType/:category?"
  element={
    <MainLayout>
      <Suspense fallback={<PageLoader message="Loading form preview..." />}>
        <FormPreviewPage />
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
  window.open('/preview/forms/standard', '_blank');
};

// Function to preview the modern intake form
const previewModernIntake = () => {
  window.open('/preview/forms/modern', '_blank');
};
```

### 4. Create a FormPreviewLink Component for Reuse

```jsx
// src/components/forms/FormPreviewLink.jsx
import React from 'react';
import { Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const FormPreviewLink = ({ formType, category = 'general', buttonText = 'Preview Form', buttonProps = {} }) => {
  const handleClick = () => {
    window.open(`/preview/forms/${formType}/${category}`, '_blank');
  };

  return (
    <Button
      icon={<EyeOutlined />}
      onClick={handleClick}
      {...buttonProps}
    >
      {buttonText}
    </Button>
  );
};

export default FormPreviewLink;
```

### 5. Add Preview Links to PatientFormsPage.jsx

```jsx
// Update src/pages/forms/PatientFormsPage.jsx to include preview links for administrators

// Import the FormPreviewLink component
import FormPreviewLink from '../../components/forms/FormPreviewLink';

// Add this inside the component, perhaps in a dropdown menu or admin section
{isAdmin && (
  <div className="admin-controls">
    <Divider>Administrator Controls</Divider>
    <Space>
      <FormPreviewLink 
        formType="standard" 
        buttonText="Preview Standard Form" 
      />
      <FormPreviewLink 
        formType="modern" 
        buttonText="Preview Modern Form" 
      />
    </Space>
  </div>
)}
```

## Modifications to Existing Components

### 1. Modify IntakeFormPage.jsx to Support Preview Mode

```jsx
// In src/pages/intake/IntakeFormPage.jsx

// Add this near the top of the component
const isPreviewMode = location.state?.serviceType === 'preview';

// Modify the handleSubmit function to prevent actual submission in preview mode
const handleSubmit = async () => {
  if (isPreviewMode) {
    // In preview mode, just show a message and don't submit
    toast.info('This is a preview. Form submission is disabled.');
    // Simulate moving to confirmation step without actual submission
    setOrderId('preview-order-id');
    setConsultationId('preview-consultation-id');
    handleNext();
    return;
  }
  
  // Existing submission code...
};

// Add a preview mode indicator if needed
{isPreviewMode && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
    <p className="text-yellow-700">
      <strong>Preview Mode:</strong> This is a preview of the intake form. No data will be submitted.
    </p>
  </div>
)}
```

### 2. Modify ModernIntakeFormPage.jsx to Support Preview Mode

```jsx
// In src/pages/intake/ModernIntakeFormPage.jsx

// Add this near the top of the component
const isPreviewMode = location.state?.serviceType === 'preview';

// Modify the handleSubmit function to prevent actual submission in preview mode
const handleSubmit = async () => {
  if (isPreviewMode) {
    // In preview mode, just show a message and don't submit
    toast.info('This is a preview. Form submission is disabled.');
    // Navigate to success page with preview flag
    navigate('/intake/success', {
      state: {
        formData,
        category,
        serviceType: 'preview',
      },
    });
    return;
  }
  
  // Existing submission code...
};

// Add a preview mode indicator if needed
{isPreviewMode && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
    <p className="text-yellow-700">
      <strong>Preview Mode:</strong> This is a preview of the intake form. No data will be submitted.
    </p>
  </div>
)}
```

## Benefits of This Approach

1. **Dedicated Preview System**: Creates a purpose-built system for previewing forms without database dependencies
2. **Flexible Categories**: Allows previewing forms with different categories (weight management, ED, etc.)
3. **Consistent Interface**: Provides a consistent way to access form previews
4. **Clear Preview Indication**: Clearly indicates when a form is in preview mode
5. **Reusable Components**: The FormPreviewLink component can be used throughout the application
6. **No Database Impact**: Doesn't require creating dummy entries in the database

## Implementation Steps

1. Create the FormPreviewPage component
2. Add the new routes to AppRoutes.jsx
3. Update the preview functions in IntakeFormSettings.jsx
4. Create the FormPreviewLink component
5. Modify the intake form components to support preview mode
6. Add preview links to relevant admin pages

## Testing Plan

1. Test the preview links from IntakeFormSettings.jsx
2. Test changing categories in the preview interface
3. Test that form submission is properly disabled in preview mode
4. Test the preview mode indicators are visible
5. Test navigation between different form types