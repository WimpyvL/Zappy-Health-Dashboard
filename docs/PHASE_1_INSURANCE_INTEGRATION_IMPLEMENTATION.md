# Phase 1: Insurance Integration Implementation Plan

## Overview

This phase focuses on integrating insurance collection into intake forms for **insurance-specific products only** (products labeled as "something-insurance"). Not all forms will collect insurance - only those where the product/service requires insurance coverage.

## 1. PRODUCT-BASED INSURANCE DETECTION

### 1.1 Insurance Product Identification
```javascript
// Utility to detect if a product requires insurance
const isInsuranceProduct = (productName, productCategory) => {
  // Check if product name contains "insurance"
  const nameContainsInsurance = productName?.toLowerCase().includes('insurance');
  
  // Check if category is insurance-related
  const insuranceCategories = [
    'insurance',
    'covered-services',
    'insurance-covered',
    'medical-insurance'
  ];
  
  const categoryRequiresInsurance = insuranceCategories.includes(
    productCategory?.toLowerCase()
  );
  
  return nameContainsInsurance || categoryRequiresInsurance;
};

// Example usage in intake flow
const shouldCollectInsurance = isInsuranceProduct(
  formData.selectedProduct?.name,
  formData.selectedProduct?.category
);
```

### 1.2 Dynamic Form Flow
```javascript
// Enhanced intake flow with conditional insurance step
const getIntakeSteps = (productInfo) => {
  const baseSteps = [
    'introduction',
    'basic-info',
    'health-history',
    'treatment-preferences',
    'review'
  ];
  
  // Insert insurance step if product requires it
  if (isInsuranceProduct(productInfo?.name, productInfo?.category)) {
    const insertIndex = baseSteps.indexOf('health-history');
    baseSteps.splice(insertIndex, 0, 'insurance-info');
  }
  
  return baseSteps;
};
```

## 2. INSURANCE INFO STEP COMPONENT

### 2.1 Create InsuranceInfoStep.jsx
```javascript
// src/pages/intake/steps/InsuranceInfoStep.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import FormInput from '../../../components/common/FormInput';
import FormError from '../../../components/common/FormError';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import useFormValidation from '../../../hooks/useFormValidation';
import useTelehealthFlowTracking from '../../../hooks/useTelehealthFlowTracking';
import { useCreateInsuranceRecord, useUploadInsuranceDocument } from '../../../apis/insurances/hooks';
import { FLOW_STAGES } from '../../../utils/telehealthFlowTracker';
import { FORM_VALIDATION } from '../../../utils/formValidation';

const InsuranceInfoStep = ({
  formData,
  updateFormData,
  productCategory,
  onNext,
  onPrevious,
}) => {
  const { insuranceInfo = {} } = formData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  // Insurance validation rules
  const validationRules = {
    hasInsurance: [
      {
        required: true,
        message: 'Please indicate if you have insurance coverage',
      },
    ],
    // Primary insurance fields (conditional)
    primaryProviderName: [
      {
        required: (values) => values.hasInsurance === 'yes',
        message: 'Insurance provider name is required',
      },
    ],
    primaryPolicyNumber: [
      {
        required: (values) => values.hasInsurance === 'yes',
        message: 'Policy number is required',
      },
    ],
    primarySubscriberName: [
      {
        required: (values) => values.hasInsurance === 'yes',
        message: 'Subscriber name is required',
      },
    ],
    relationshipToSubscriber: [
      {
        required: (values) => values.hasInsurance === 'yes',
        message: 'Relationship to subscriber is required',
      },
    ],
  };

  // Form validation hook
  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useFormValidation(insuranceInfo, validationRules, async (values) => {
    setIsSubmitting(true);
    
    try {
      // If user has insurance, create insurance record
      if (values.hasInsurance === 'yes') {
        const insuranceData = {
          provider_name: values.primaryProviderName,
          policy_number: values.primaryPolicyNumber,
          group_number: values.primaryGroupNumber || '',
          subscriber_name: values.primarySubscriberName,
          subscriber_dob: values.primarySubscriberDob,
          relationship_to_subscriber: values.relationshipToSubscriber,
          status: 'pending', // Will be verified later
          notes: values.notes || '',
          coverage_type: 'primary',
        };

        // Create insurance record (will be linked to patient after account creation)
        const insuranceRecord = await createInsuranceRecord.mutateAsync(insuranceData);
        
        // Upload documents if any
        for (const doc of uploadedDocuments) {
          await uploadDocument.mutateAsync({
            recordId: insuranceRecord.id,
            file: doc.file
          });
        }

        // Store insurance info in form data
        updateFormData('insuranceInfo', {
          ...values,
          insuranceRecordId: insuranceRecord.id,
          documentsUploaded: uploadedDocuments.length > 0
        });
      } else {
        // No insurance - just store the response
        updateFormData('insuranceInfo', {
          hasInsurance: 'no',
          noInsuranceReason: values.noInsuranceReason
        });
      }

      // Record completion in flow tracking
      recordStage(FLOW_STAGES.INTAKE_FORM_INSURANCE_INFO, {
        hasInsurance: values.hasInsurance,
        documentsUploaded: uploadedDocuments.length,
        completed: true
      });

      onNext();
    } catch (error) {
      console.error('Error processing insurance information:', error);
      recordError(error, { step: 'insurance_info' });
    } finally {
      setIsSubmitting(false);
    }
  });

  // API hooks
  const createInsuranceRecord = useCreateInsuranceRecord();
  const uploadDocument = useUploadInsuranceDocument();

  // Flow tracking
  const { recordStage, recordError } = useTelehealthFlowTracking();

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    handleChange(name, value);
    updateFormData('insuranceInfo', { [name]: value });
  }, [handleChange, updateFormData]);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      file,
      type: 'insurance_card',
      name: file.name,
      size: file.size
    }));
    
    setUploadedDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  // Remove uploaded document
  const removeDocument = useCallback((index) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <ErrorBoundary>
      <div>
        <h2 className="text-xl font-semibold mb-4">Insurance Information</h2>
        <p className="text-gray-600 mb-6">
          This service may be covered by insurance. Please provide your insurance 
          information to help us verify coverage and reduce your out-of-pocket costs.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Insurance Status */}
          <div className="mb-6">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Do you have health insurance?
                <span className="text-red-500 ml-1">*</span>
              </legend>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasInsurance"
                    value="yes"
                    checked={values.hasInsurance === 'yes'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <span>Yes, I have health insurance</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasInsurance"
                    value="no"
                    checked={values.hasInsurance === 'no'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <span>No, I don't have health insurance</span>
                </label>
              </div>
              
              {errors.hasInsurance && (
                <FormError message={errors.hasInsurance} className="mt-2" />
              )}
            </fieldset>
          </div>

          {/* No Insurance Reason */}
          {values.hasInsurance === 'no' && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-md">
              <h3 className="font-medium text-yellow-800 mb-2">
                No Insurance Coverage
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                You'll be responsible for the full cost of services. We offer 
                competitive self-pay rates and payment plans.
              </p>
              
              <FormInput
                name="noInsuranceReason"
                label="Reason (optional)"
                value={values.noInsuranceReason || ''}
                onChange={handleInputChange}
                placeholder="e.g., Between jobs, High deductible, etc."
                helpText="This helps us provide better payment options"
              />
            </div>
          )}

          {/* Primary Insurance Details */}
          {values.hasInsurance === 'yes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Primary Insurance Details
              </h3>

              {/* Insurance Provider */}
              <FormInput
                name="primaryProviderName"
                label="Insurance Provider"
                value={values.primaryProviderName || ''}
                onChange={handleInputChange}
                onBlur={() => handleBlur('primaryProviderName')}
                placeholder="e.g., Blue Cross Blue Shield, Aetna, UnitedHealth"
                error={errors.primaryProviderName}
                required
              />

              {/* Policy Number */}
              <FormInput
                name="primaryPolicyNumber"
                label="Policy/Member ID Number"
                value={values.primaryPolicyNumber || ''}
                onChange={handleInputChange}
                onBlur={() => handleBlur('primaryPolicyNumber')}
                placeholder="Policy or member ID number"
                error={errors.primaryPolicyNumber}
                required
              />

              {/* Group Number */}
              <FormInput
                name="primaryGroupNumber"
                label="Group Number (if applicable)"
                value={values.primaryGroupNumber || ''}
                onChange={handleInputChange}
                placeholder="Group number from insurance card"
                helpText="Usually found on your insurance card"
              />

              {/* Subscriber Name */}
              <FormInput
                name="primarySubscriberName"
                label="Primary Subscriber Name"
                value={values.primarySubscriberName || ''}
                onChange={handleInputChange}
                onBlur={() => handleBlur('primarySubscriberName')}
                placeholder="Name of the primary policyholder"
                error={errors.primarySubscriberName}
                required
              />

              {/* Subscriber DOB */}
              <FormInput
                name="primarySubscriberDob"
                label="Subscriber Date of Birth"
                type="date"
                value={values.primarySubscriberDob || ''}
                onChange={handleInputChange}
                helpText="Date of birth of the primary policyholder"
              />

              {/* Relationship to Subscriber */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship to Subscriber
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="relationshipToSubscriber"
                  value={values.relationshipToSubscriber || ''}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('relationshipToSubscriber')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select relationship</option>
                  <option value="self">Self</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="dependent">Other Dependent</option>
                </select>
                {errors.relationshipToSubscriber && (
                  <FormError message={errors.relationshipToSubscriber} />
                )}
              </div>

              {/* Insurance Card Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Card Photos (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload photos of the front and back of your insurance card to 
                  help us verify your coverage faster.
                </p>
                
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                
                {/* Uploaded Documents List */}
                {uploadedDocuments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={values.notes || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Any additional information about your insurance coverage"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onPrevious}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Back
            </button>
            
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
};

InsuranceInfoStep.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
  productCategory: PropTypes.string,
  onNext: PropTypes.func.isRequired,
  onPrevious: PropTypes.func.isRequired,
};

export default InsuranceInfoStep;
```

## 3. INTEGRATION WITH EXISTING INTAKE FLOW

### 3.1 Update IntakeFormPage.jsx
```javascript
// Add insurance step to the intake flow
import InsuranceInfoStep from './steps/InsuranceInfoStep';

// Update step configuration
const getStepConfiguration = (productInfo) => {
  const baseSteps = [
    { key: 'introduction', component: IntroductionStep, title: 'Welcome' },
    { key: 'basic-info', component: BasicInfoStep, title: 'Basic Information' },
    { key: 'health-history', component: HealthHistoryStep, title: 'Health History' },
    { key: 'treatment-preferences', component: TreatmentPreferencesStep, title: 'Preferences' },
    { key: 'review', component: ReviewStep, title: 'Review & Submit' }
  ];

  // Insert insurance step if product requires it
  if (isInsuranceProduct(productInfo?.name, productInfo?.category)) {
    const insertIndex = baseSteps.findIndex(step => step.key === 'health-history');
    baseSteps.splice(insertIndex, 0, {
      key: 'insurance-info',
      component: InsuranceInfoStep,
      title: 'Insurance Information'
    });
  }

  return baseSteps;
};
```

### 3.2 Update Form Data Structure
```javascript
// Enhanced form data structure
const initialFormData = {
  // ... existing fields
  insuranceInfo: {
    hasInsurance: null,
    // Primary insurance
    primaryProviderName: '',
    primaryPolicyNumber: '',
    primaryGroupNumber: '',
    primarySubscriberName: '',
    primarySubscriberDob: '',
    relationshipToSubscriber: '',
    // No insurance
    noInsuranceReason: '',
    // Additional
    notes: '',
    // System fields
    insuranceRecordId: null,
    documentsUploaded: false,
    verificationStatus: 'pending'
  }
};
```

## 4. CONSULTATION INTEGRATION

### 4.1 Insurance Display in Consultations
```javascript
// src/pages/consultations/components/InsuranceStatusPanel.jsx
import React from 'react';
import { useInsuranceRecords } from '../../../apis/insurances/hooks';

const InsuranceStatusPanel = ({ patientId }) => {
  const { data: insuranceRecords, isLoading } = useInsuranceRecords({ patientId });

  if (isLoading) return <div>Loading insurance information...</div>;

  const primaryInsurance = insuranceRecords?.find(record => 
    record.coverage_type === 'primary' && record.status === 'active'
  );

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <h3 className="font-medium text-gray-900 mb-3">Insurance Coverage</h3>
      
      {primaryInsurance ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Provider:</span>
            <span className="text-sm font-medium">{primaryInsurance.provider_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Policy Number:</span>
            <span className="text-sm font-medium">{primaryInsurance.policy_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`text-sm px-2 py-1 rounded ${
              primaryInsurance.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {primaryInsurance.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          No active insurance coverage on file
        </div>
      )}
    </div>
  );
};

export default InsuranceStatusPanel;
```

### 4.2 Update PatientInfoSection
```javascript
// Add insurance panel to consultation interface
import InsuranceStatusPanel from './InsuranceStatusPanel';

const PatientInfoSection = ({ patient }) => {
  return (
    <div className="space-y-4">
      {/* Existing patient info */}
      <PatientBasicInfo patient={patient} />
      
      {/* Insurance information */}
      <InsuranceStatusPanel patientId={patient.id} />
      
      {/* Other sections */}
    </div>
  );
};
```

## 5. FORM VALIDATION ENHANCEMENTS

### 5.1 Insurance-Specific Validation Rules
```javascript
// src/utils/formValidation.js - Add insurance validation
export const FORM_VALIDATION = {
  // ... existing validations
  
  INSURANCE: {
    providerName: [
      {
        required: true,
        message: 'Insurance provider name is required'
      },
      {
        minLength: 2,
        message: 'Provider name must be at least 2 characters'
      }
    ],
    policyNumber: [
      {
        required: true,
        message: 'Policy number is required'
      },
      {
        pattern: /^[A-Za-z0-9\-]+$/,
        message: 'Policy number can only contain letters, numbers, and hyphens'
      }
    ],
    subscriberName: [
      {
        required: true,
        message: 'Subscriber name is required'
      },
      {
        pattern: /^[A-Za-z\s\-']+$/,
        message: 'Subscriber name can only contain letters, spaces, hyphens, and apostrophes'
      }
    ]
  }
};
```

## 6. PHASE 2 PREPARATION (Manual Verification)

### 6.1 Insurance Verification Workflow
```javascript
// src/services/insuranceVerificationService.js
export class InsuranceVerificationService {
  // Manual verification workflow for Phase 2
  static async initiateManualVerification(insuranceRecordId) {
    // Create verification task for staff
    const verificationTask = {
      type: 'insurance_verification',
      insurance_record_id: insuranceRecordId,
      status: 'pending',
      assigned_to: null, // Will be assigned to verification team
      priority: 'normal',
      created_at: new Date().toISOString(),
      notes: 'Manual insurance verification required'
    };

    // This would create a task in your task management system
    return await createVerificationTask(verificationTask);
  }

  static async updateVerificationStatus(recordId, status, notes) {
    // Update insurance record with verification results
    return await updateInsuranceRecord(recordId, {
      verification_status: status,
      verification_date: new Date().toISOString(),
      verification_notes: notes
    });
  }
}
```

### 6.2 Admin Interface for Verification
```javascript
// src/pages/admin/InsuranceVerificationQueue.jsx
const InsuranceVerificationQueue = () => {
  const { data: pendingVerifications } = usePendingInsuranceVerifications();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Insurance Verification Queue</h2>
      
      {pendingVerifications?.map(record => (
        <InsuranceVerificationCard 
          key={record.id} 
          record={record}
          onVerify={handleVerification}
        />
      ))}
    </div>
  );
};
```

## 7. IMPLEMENTATION CHECKLIST

### Week 1: Core Components
- [ ] Create `InsuranceInfoStep.jsx` component
- [ ] Add insurance product detection utility
- [ ] Update intake form flow logic
- [ ] Enhance form data structure
- [ ] Add insurance validation rules

### Week 2: Integration & Testing
- [ ] Integrate with existing intake flow
- [ ] Add insurance display to consultations
- [ ] Create admin verification interface
- [ ] Test complete flow end-to-end
- [ ] Update documentation

### Testing Scenarios
1. **Insurance Product Flow**: Test with product labeled "telehealth-insurance"
2. **Non-Insurance Product Flow**: Verify insurance step is skipped
3. **Insurance Data Collection**: Test all form fields and validation
4. **Document Upload**: Test insurance card photo upload
5. **Consultation Display**: Verify insurance info shows in consultations

## 8. PHASE 2 PREPARATION NOTES

For Phase 2, the team can implement:

1. **Manual Verification Workflow**
   - Staff dashboard for insurance verification
   - Phone verification process
   - Status tracking and updates

2. **Basic Coverage Checking**
   - Simple database of common coverage rules
   - Manual coverage determination
   - Prior authorization tracking

3. **Billing Integration**
   - Link insurance to billing records
   - Generate insurance claims manually
   - Track claim status

This Phase 1 implementation provides the foundation for collecting insurance information in a user-friendly way, with the infrastructure ready for Phase 2 enhancements.
