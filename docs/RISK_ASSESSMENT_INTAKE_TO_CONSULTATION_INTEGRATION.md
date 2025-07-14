# Risk Assessment Integration: Intake Forms to Consultation Notes

## Overview
This document details how the smart risk assessment system integrates with the existing intake form workflow and consultation notes documentation, ensuring seamless data flow from patient input to provider documentation.

---

## Integration Flow

### 1. Intake Form Integration

#### 1.1 Enhanced Intake Form Submission
**File**: `src/pages/intake/steps/HealthHistoryStepEnhanced.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { useRiskAssessment } from '../../../hooks/useRiskAssessment';
import { RiskIndicator } from '../../../components/consultations/RiskIndicator';

export const HealthHistoryStepEnhanced = ({ formData, onUpdate, patientData }) => {
  const { assessPatientRisk, assessment, isAssessing } = useRiskAssessment();
  const [showRiskAlert, setShowRiskAlert] = useState(false);

  // Trigger risk assessment when form data changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.responses && Object.keys(formData.responses).length > 3) {
        performRiskAssessment();
      }
    }, 2000); // Debounce to avoid excessive API calls

    return () => clearTimeout(debounceTimer);
  }, [formData.responses]);

  const performRiskAssessment = async () => {
    try {
      const riskResult = await assessPatientRisk(patientData, formData);
      
      // Show alert if high risk detected
      if (riskResult.urgentFlags.length > 0 || riskResult.riskCategory === 'high') {
        setShowRiskAlert(true);
      }

      // Update form data with risk assessment
      onUpdate({
        ...formData,
        riskAssessment: riskResult
      });
    } catch (error) {
      console.error('Risk assessment failed:', error);
    }
  };

  return (
    <div className="health-history-step">
      <h2 className="text-xl font-semibold mb-6">Health History & Symptoms</h2>
      
      {/* Existing form fields */}
      <div className="space-y-6">
        {/* Mental Health Questions with Risk Detection */}
        <div className="form-section">
          <h3 className="text-lg font-medium mb-4">Mental Health Assessment</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                How would you rate your current mood? (1-10 scale)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.responses?.mood_rating || 5}
                onChange={(e) => onUpdate({
                  ...formData,
                  responses: {
                    ...formData.responses,
                    mood_rating: parseInt(e.target.value)
                  }
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Please describe your current symptoms in detail:
              </label>
              <textarea
                value={formData.responses?.symptom_description || ''}
                onChange={(e) => onUpdate({
                  ...formData,
                  responses: {
                    ...formData.responses,
                    symptom_description: e.target.value
                  }
                })}
                placeholder="Describe your symptoms, how they affect your daily life, and any concerns you have..."
                className="w-full p-3 border rounded-md"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Have you had thoughts of self-harm or suicide?
              </label>
              <select
                value={formData.responses?.self_harm_thoughts || ''}
                onChange={(e) => onUpdate({
                  ...formData,
                  responses: {
                    ...formData.responses,
                    self_harm_thoughts: e.target.value
                  }
                })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Please select...</option>
                <option value="no">No, never</option>
                <option value="rarely">Rarely, but not recently</option>
                <option value="sometimes">Sometimes</option>
                <option value="frequently">Frequently</option>
                <option value="currently">Yes, I'm having these thoughts now</option>
              </select>
            </div>
          </div>
        </div>

        {/* Risk Assessment Display */}
        {assessment && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="font-medium mb-2">Risk Assessment</h4>
            <RiskIndicator assessment={assessment} showDetails={false} />
          </div>
        )}

        {/* Urgent Risk Alert */}
        {showRiskAlert && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-medium text-red-800">Immediate Support Available</h4>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Based on your responses, we want to ensure you get the support you need right away.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Crisis Resources:</p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• National Suicide Prevention Lifeline: 988</li>
                <li>• Crisis Text Line: Text HOME to 741741</li>
                <li>• Emergency Services: 911</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 1.2 Form Submission with Risk Data
**File**: `src/pages/intake/IntakeFormPageEnhanced.jsx`
```jsx
import React, { useState } from 'react';
import { useRiskAssessment } from '../../hooks/useRiskAssessment';

export const IntakeFormPageEnhanced = () => {
  const [formData, setFormData] = useState({});
  const { assessPatientRisk } = useRiskAssessment();

  const handleFormSubmission = async (finalFormData) => {
    try {
      // Perform final risk assessment
      const finalRiskAssessment = await assessPatientRisk(
        patientData, 
        finalFormData
      );

      // Submit form with risk assessment data
      const submissionData = {
        ...finalFormData,
        riskAssessment: finalRiskAssessment,
        submissionTimestamp: new Date().toISOString(),
        requiresUrgentReview: finalRiskAssessment.urgentFlags.length > 0
      };

      // Save to database
      await submitIntakeForm(submissionData);

      // If urgent, trigger immediate provider notification
      if (finalRiskAssessment.urgentFlags.length > 0) {
        await triggerUrgentProviderNotification(patientData.id, finalRiskAssessment);
      }

      // Redirect to appropriate next step
      if (finalRiskAssessment.recommendations.urgency === 'immediate') {
        // Redirect to crisis support page
        navigate('/crisis-support');
      } else {
        // Normal flow to consultation scheduling
        navigate('/consultation-scheduling');
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <div className="intake-form-enhanced">
      {/* Form steps with risk assessment integration */}
    </div>
  );
};
```

### 2. Consultation Notes Integration

#### 2.1 Risk Assessment Display in Consultation
**File**: `src/pages/consultations/components/consultation-notes/RiskAssessmentCard.jsx`
```jsx
import React, { useState } from 'react';
import { Card } from '../../../ui/Card';
import { RiskIndicator } from '../../RiskIndicator';
import { Button } from '../../../ui/Button';

export const RiskAssessmentCard = ({ patientId, initialAssessment }) => {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRiskAssessment = async (newFactors) => {
    setIsUpdating(true);
    try {
      // Update risk assessment based on consultation findings
      const updatedAssessment = {
        ...assessment,
        riskFactors: [...assessment.riskFactors, ...newFactors],
        lastUpdated: new Date().toISOString(),
        updatedBy: 'provider_consultation'
      };

      // Save updated assessment
      await fetch('/api/risk-assessments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          assessment: updatedAssessment
        })
      });

      setAssessment(updatedAssessment);
    } catch (error) {
      console.error('Failed to update risk assessment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Risk Assessment</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsUpdating(true)}
          disabled={isUpdating}
        >
          Update Assessment
        </Button>
      </div>

      <RiskIndicator assessment={assessment} showDetails={true} />

      {/* Intake Form Responses Summary */}
      <div className="mt-4 border-t pt-4">
        <h4 className="font-medium mb-2">Key Intake Responses:</h4>
        <div className="space-y-2 text-sm">
          {assessment.sourceData?.mood_rating && (
            <div>
              <span className="font-medium">Mood Rating:</span> 
              {assessment.sourceData.mood_rating}/10
            </div>
          )}
          {assessment.sourceData?.symptom_description && (
            <div>
              <span className="font-medium">Symptoms:</span>
              <p className="text-gray-600 mt-1">
                {assessment.sourceData.symptom_description}
              </p>
            </div>
          )}
          {assessment.sourceData?.self_harm_thoughts && (
            <div>
              <span className="font-medium">Self-harm thoughts:</span> 
              {assessment.sourceData.self_harm_thoughts}
            </div>
          )}
        </div>
      </div>

      {/* Provider Notes on Risk */}
      <div className="mt-4 border-t pt-4">
        <h4 className="font-medium mb-2">Provider Risk Notes:</h4>
        <textarea
          placeholder="Add notes about risk factors observed during consultation..."
          className="w-full p-2 border rounded-md text-sm"
          rows={3}
        />
      </div>
    </Card>
  );
};
```

#### 2.2 Enhanced Consultation Notes with Risk Context
**File**: `src/pages/consultations/InitialConsultationNotesEnhanced.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { RiskAssessmentCard } from './components/consultation-notes/RiskAssessmentCard';
import { AssessmentPlanCard } from './components/consultation-notes/AssessmentPlanCard';

export const InitialConsultationNotesEnhanced = ({ patientId, consultationId }) => {
  const [patientData, setPatientData] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    riskConsiderations: ''
  });

  useEffect(() => {
    loadPatientDataAndRisk();
  }, [patientId]);

  const loadPatientDataAndRisk = async () => {
    try {
      // Load patient data
      const patientResponse = await fetch(`/api/patients/${patientId}`);
      const patient = await patientResponse.json();
      setPatientData(patient);

      // Load latest risk assessment
      const riskResponse = await fetch(`/api/risk-assessments/patient/${patientId}`);
      const riskData = await riskResponse.json();
      if (riskData.length > 0) {
        setRiskAssessment(riskData[0]); // Most recent assessment
      }
    } catch (error) {
      console.error('Failed to load patient data:', error);
    }
  };

  const generateRiskAwareAssessment = () => {
    if (!riskAssessment) return '';

    let assessmentText = '';
    
    // Include risk category in assessment
    assessmentText += `Risk Level: ${riskAssessment.riskCategory.toUpperCase()}\n`;
    
    // Include key risk factors
    if (riskAssessment.riskFactors.length > 0) {
      assessmentText += '\nRisk Factors Identified:\n';
      riskAssessment.riskFactors.forEach(factor => {
        assessmentText += `- ${factor.description}\n`;
      });
    }

    // Include urgent flags if present
    if (riskAssessment.urgentFlags.length > 0) {
      assessmentText += '\n⚠️ URGENT CONCERNS:\n';
      riskAssessment.urgentFlags.forEach(flag => {
        assessmentText += `- ${flag.type}: ${flag.keywords?.join(', ')}\n`;
      });
    }

    return assessmentText;
  };

  const generateRiskAwarePlan = () => {
    if (!riskAssessment) return '';

    let planText = '';
    
    // Include recommendations based on risk level
    const recommendations = riskAssessment.recommendations;
    
    planText += `Follow-up Urgency: ${recommendations.urgency}\n`;
    planText += `Recommended Provider Type: ${recommendations.providerType}\n`;
    
    if (recommendations.followUpRequired) {
      planText += '\nFollow-up Required: Yes\n';
    }

    if (recommendations.additionalMonitoring.length > 0) {
      planText += '\nAdditional Monitoring:\n';
      recommendations.additionalMonitoring.forEach(monitoring => {
        planText += `- ${monitoring}\n`;
      });
    }

    // Add safety planning if high risk
    if (riskAssessment.riskCategory === 'high') {
      planText += '\nSafety Planning:\n';
      planText += '- Crisis contact information provided\n';
      planText += '- Safety plan discussed and documented\n';
      planText += '- Emergency protocols reviewed\n';
    }

    return planText;
  };

  return (
    <div className="consultation-notes-enhanced">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Notes Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* SOAP Notes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Consultation Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Subjective</label>
                <textarea
                  value={consultationNotes.subjective}
                  onChange={(e) => setConsultationNotes({
                    ...consultationNotes,
                    subjective: e.target.value
                  })}
                  placeholder="Patient's reported symptoms, concerns, and history..."
                  className="w-full p-3 border rounded-md"
                  rows={4}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Objective</label>
                <textarea
                  value={consultationNotes.objective}
                  onChange={(e) => setConsultationNotes({
                    ...consultationNotes,
                    objective: e.target.value
                  })}
                  placeholder="Observable findings, mental status exam, etc..."
                  className="w-full p-3 border rounded-md"
                  rows={4}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Assessment
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => setConsultationNotes({
                      ...consultationNotes,
                      assessment: consultationNotes.assessment + '\n' + generateRiskAwareAssessment()
                    })}
                  >
                    Include Risk Assessment
                  </Button>
                </label>
                <textarea
                  value={consultationNotes.assessment}
                  onChange={(e) => setConsultationNotes({
                    ...consultationNotes,
                    assessment: e.target.value
                  })}
                  placeholder="Clinical assessment, diagnosis, risk evaluation..."
                  className="w-full p-3 border rounded-md"
                  rows={4}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Plan
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => setConsultationNotes({
                      ...consultationNotes,
                      plan: consultationNotes.plan + '\n' + generateRiskAwarePlan()
                    })}
                  >
                    Include Risk-Based Plan
                  </Button>
                </label>
                <textarea
                  value={consultationNotes.plan}
                  onChange={(e) => setConsultationNotes({
                    ...consultationNotes,
                    plan: e.target.value
                  })}
                  placeholder="Treatment plan, medications, follow-up, safety planning..."
                  className="w-full p-3 border rounded-md"
                  rows={4}
                />
              </div>

              {/* Risk-Specific Documentation */}
              {riskAssessment && riskAssessment.riskCategory !== 'low' && (
                <div>
                  <label className="block font-medium mb-2">Risk Considerations & Safety Planning</label>
                  <textarea
                    value={consultationNotes.riskConsiderations}
                    onChange={(e) => setConsultationNotes({
                      ...consultationNotes,
                      riskConsiderations: e.target.value
                    })}
                    placeholder="Document risk factors discussed, safety planning, crisis resources provided..."
                    className="w-full p-3 border rounded-md border-yellow-300 bg-yellow-50"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Risk Assessment Sidebar */}
        <div className="space-y-6">
          {riskAssessment && (
            <RiskAssessmentCard 
              patientId={patientId}
              initialAssessment={riskAssessment}
            />
          )}

          {/* Quick Actions for High Risk */}
          {riskAssessment && riskAssessment.riskCategory === 'high' && (
            <Card className="p-4 border-red-200 bg-red-50">
              <h4 className="font-medium text-red-800 mb-3">High Risk Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Generate Safety Plan
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Schedule Urgent Follow-up
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Emergency Contact
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3. Data Flow Integration

#### 3.1 Risk Assessment Data Structure
```javascript
// Complete risk assessment data structure
const riskAssessmentData = {
  id: 'uuid',
  patientId: 'uuid',
  riskScore: 7.2,
  riskCategory: 'medium_high',
  
  // Source data from intake form
  sourceData: {
    formId: 'intake_form_uuid',
    mood_rating: 3,
    symptom_description: 'Feeling hopeless and overwhelmed...',
    self_harm_thoughts: 'sometimes',
    sleep_issues: 'severe',
    appetite_changes: 'significant_decrease'
  },
  
  // Calculated risk factors
  riskFactors: [
    {
      factor: 'severe_symptoms',
      weight: 4.0,
      description: 'Patient reported severe symptoms',
      source: 'intake_form'
    },
    {
      factor: 'self_harm_ideation',
      weight: 3.2,
      description: 'Patient indicated sometimes having self-harm thoughts',
      source: 'intake_form'
    }
  ],
  
  // Urgent flags
  urgentFlags: [],
  
  // Provider recommendations
  recommendations: {
    urgency: 'within_24h',
    providerType: 'specialist_preferred',
    followUpRequired: true,
    additionalMonitoring: ['symptom_tracking', 'mood_monitoring']
  },
  
  // Consultation updates
  consultationUpdates: [
    {
      consultationId: 'uuid',
      providerId: 'uuid',
      updatedRiskScore: 6.8,
      providerNotes: 'Patient appears more stable during consultation...',
      updatedAt: '2025-06-15T21:00:00Z'
    }
  ],
  
  assessmentDate: '2025-06-15T20:30:00Z',
  lastUpdated: '2025-06-15T21:00:00Z'
};
```

#### 3.2 Integration Points Summary

1. **Intake Form → Risk Assessment**
   - Real-time risk scoring as patient completes form
   - Immediate alerts for crisis keywords
   - Form submission includes risk data

2. **Risk Assessment → Provider Dashboard**
   - High-risk patients flagged in provider queue
   - Risk indicators visible in patient list
   - Urgent cases prioritized

3. **Risk Assessment → Consultation Notes**
   - Risk data displayed prominently during consultation
   - Pre-populated assessment and plan templates
   - Risk-aware documentation tools

4. **Consultation → Updated Risk Assessment**
   - Provider can update risk assessment during consultation
   - Notes include risk considerations
   - Follow-up plans based on risk level

---

## Implementation Checklist

### Phase 2A Integration Tasks
- [ ] Enhance intake form components with risk assessment triggers
- [ ] Create risk assessment card for consultation notes
- [ ] Implement real-time risk scoring during form completion
- [ ] Add risk-aware SOAP note templates
- [ ] Create urgent alert system for high-risk patients
- [ ] Integrate risk data with provider dashboard
- [ ] Add safety planning tools for high-risk cases
- [ ] Implement risk assessment updates during consultations

This integration ensures that the smart risk assessment system is not just a standalone feature, but a core part of the patient care workflow from initial intake through consultation documentation.
