# Phase 1 & 2A Implementation Guide

## Overview
This document provides a detailed implementation guide for Phase 1 (Stripe Payment Integration) and Phase 2A (Essential Risk Assessment) of the telehealth platform enhancement.

---

## Phase 1: Stripe Payment Integration (2-3 weeks)

### Prerequisites
- Stripe account setup (test and production)
- Environment variables configured
- Existing Stripe database foundation (already implemented)

### Week 1: Core Stripe Integration

#### 1.1 Stripe Service Layer
**File**: `src/services/stripeService.js`
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export class StripeService {
  constructor() {
    this.stripe = null;
    this.init();
  }

  async init() {
    this.stripe = await stripePromise;
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, metadata })
    });
    return response.json();
  }

  // Create subscription
  async createSubscription(customerId, priceId, metadata = {}) {
    const response = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, priceId, metadata })
    });
    return response.json();
  }

  // Confirm payment
  async confirmPayment(clientSecret, paymentMethod) {
    return await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });
  }

  // Create customer
  async createCustomer(email, name, metadata = {}) {
    const response = await fetch('/api/stripe/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, metadata })
    });
    return response.json();
  }
}

export const stripeService = new StripeService();
```

#### 1.2 Stripe Payment Form Component
**File**: `src/components/payment/StripePaymentForm.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripeService } from '../../services/stripeService';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146'
    }
  }
};

export const StripePaymentForm = ({ 
  amount, 
  onSuccess, 
  onError, 
  patientId,
  orderType = 'one-time' 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const { client_secret } = await stripeService.createPaymentIntent(
          amount,
          'usd',
          { patientId, orderType }
        );
        setClientSecret(client_secret);
      } catch (error) {
        onError('Failed to initialize payment');
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, patientId, orderType, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const card = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: card,
            billing_details: {
              name: 'Patient', // You can get this from patient data
            },
          }
        }
      );

      if (error) {
        onError(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (error) {
      onError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border rounded-md p-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" />
            Processing...
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  );
};
```

#### 1.3 Stripe Hooks
**File**: `src/hooks/useStripePayment.js`
```javascript
import { useState, useCallback } from 'react';
import { stripeService } from '../services/stripeService';

export const useStripePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const processPayment = useCallback(async (paymentData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeService.createPaymentIntent(
        paymentData.amount,
        paymentData.currency,
        paymentData.metadata
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (subscriptionData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeService.createSubscription(
        subscriptionData.customerId,
        subscriptionData.priceId,
        subscriptionData.metadata
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    processPayment,
    createSubscription,
    isLoading,
    error
  };
};
```

### Week 2: Subscription Management

#### 2.1 Subscription Manager Component
**File**: `src/components/payment/SubscriptionManager.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { useStripePayment } from '../../hooks/useStripePayment';

export const SubscriptionManager = ({ patientId }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { createSubscription, isLoading } = useStripePayment();

  useEffect(() => {
    fetchSubscriptions();
  }, [patientId]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`/api/subscriptions/patient/${patientId}`);
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    try {
      await fetch(`/api/stripe/cancel-subscription/${subscriptionId}`, {
        method: 'POST'
      });
      fetchSubscriptions(); // Refresh the list
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'canceled': return 'red';
      case 'past_due': return 'yellow';
      default: return 'gray';
    }
  };

  if (loading) {
    return <div>Loading subscriptions...</div>;
  }

  return (
    <div className="subscription-manager">
      <h3 className="text-lg font-semibold mb-4">Subscription Management</h3>
      
      {subscriptions.length === 0 ? (
        <Card className="p-4">
          <p className="text-gray-500">No active subscriptions</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{subscription.plan_name}</h4>
                  <p className="text-sm text-gray-600">
                    ${subscription.amount / 100}/month
                  </p>
                  <p className="text-sm text-gray-500">
                    Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge 
                    status={subscription.status}
                    color={getStatusColor(subscription.status)}
                  />
                  {subscription.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelSubscription(subscription.stripe_subscription_id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Week 3: Integration & Testing

#### 3.1 Order-to-Payment Integration
**File**: `src/pages/intake/steps/CheckoutStepEnhanced.jsx`
```jsx
import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentForm } from '../../../components/payment/StripePaymentForm';
import { Card } from '../../../components/ui/Card';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const CheckoutStepEnhanced = ({ orderData, onPaymentSuccess }) => {
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentStatus('succeeded');
    onPaymentSuccess({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    });
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('failed');
    console.error('Payment failed:', error);
  };

  return (
    <div className="checkout-step">
      <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
      
      <Card className="p-6 mb-6">
        <h3 className="font-medium mb-4">Order Summary</h3>
        <div className="space-y-2">
          {orderData.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.name}</span>
              <span>${(item.price / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 font-semibold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>${(orderData.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Elements stripe={stripePromise}>
          <StripePaymentForm
            amount={orderData.total}
            patientId={orderData.patientId}
            orderType="consultation"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      </Card>
    </div>
  );
};
```

---

## Phase 2A: Essential Risk Assessment (2-3 weeks)

### Week 1: Basic Risk Assessment Service

#### 1.1 Risk Assessment Service
**File**: `src/services/basicRiskAssessment.js`
```javascript
export class BasicRiskAssessment {
  // Risk scoring weights
  static RISK_WEIGHTS = {
    // Symptom severity
    severe_symptoms: 4.0,
    moderate_symptoms: 2.0,
    mild_symptoms: 1.0,
    
    // Urgent keywords
    suicidal_ideation: 10.0,
    self_harm: 8.0,
    crisis_keywords: 6.0,
    
    // Medical history
    multiple_medications: 2.0,
    chronic_conditions: 1.5,
    recent_hospitalization: 3.0,
    
    // Behavioral factors
    missed_appointments: 1.0,
    medication_non_adherence: 1.5,
    substance_use: 2.5
  };

  // Urgent keywords that trigger immediate flags
  static URGENT_KEYWORDS = [
    'suicide', 'suicidal', 'kill myself', 'end my life',
    'self harm', 'cutting', 'overdose',
    'crisis', 'emergency', 'urgent help',
    'can\'t go on', 'hopeless', 'worthless'
  ];

  static assessRisk(patientData, formData) {
    let riskScore = 0;
    const riskFactors = [];
    const urgentFlags = [];

    // Check for urgent keywords in form responses
    const textResponses = this.extractTextResponses(formData);
    const urgentKeywordFound = this.checkUrgentKeywords(textResponses);
    
    if (urgentKeywordFound.length > 0) {
      urgentFlags.push({
        type: 'urgent_keywords',
        keywords: urgentKeywordFound,
        action: 'immediate_attention'
      });
      riskScore += this.RISK_WEIGHTS.crisis_keywords;
    }

    // Assess symptom severity
    const symptomSeverity = this.assessSymptomSeverity(formData);
    riskScore += this.getSymptomRiskScore(symptomSeverity);
    
    if (symptomSeverity !== 'mild') {
      riskFactors.push({
        factor: `${symptomSeverity}_symptoms`,
        weight: this.getSymptomRiskScore(symptomSeverity),
        description: `Patient reported ${symptomSeverity} symptoms`
      });
    }

    // Check medical history factors
    const medicalRisk = this.assessMedicalHistory(patientData);
    riskScore += medicalRisk.score;
    riskFactors.push(...medicalRisk.factors);

    // Check behavioral factors
    const behavioralRisk = this.assessBehavioralFactors(patientData);
    riskScore += behavioralRisk.score;
    riskFactors.push(...behavioralRisk.factors);

    return {
      riskScore: Math.min(riskScore, 10), // Cap at 10
      riskCategory: this.categorizeRisk(riskScore),
      riskFactors,
      urgentFlags,
      recommendations: this.generateRecommendations(riskScore, urgentFlags),
      assessmentDate: new Date().toISOString()
    };
  }

  static extractTextResponses(formData) {
    const textResponses = [];
    
    // Extract text from form responses
    if (formData.responses) {
      Object.values(formData.responses).forEach(response => {
        if (typeof response === 'string') {
          textResponses.push(response.toLowerCase());
        } else if (response && response.text) {
          textResponses.push(response.text.toLowerCase());
        }
      });
    }

    return textResponses.join(' ');
  }

  static checkUrgentKeywords(text) {
    const foundKeywords = [];
    
    this.URGENT_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });

    return foundKeywords;
  }

  static assessSymptomSeverity(formData) {
    // Look for severity indicators in form responses
    const responses = formData.responses || {};
    
    // Check for severity scale responses (1-10)
    const severityScales = Object.values(responses).filter(
      response => typeof response === 'number' && response >= 1 && response <= 10
    );

    if (severityScales.length > 0) {
      const avgSeverity = severityScales.reduce((a, b) => a + b, 0) / severityScales.length;
      
      if (avgSeverity >= 8) return 'severe';
      if (avgSeverity >= 5) return 'moderate';
      return 'mild';
    }

    // Check for text-based severity indicators
    const textResponses = this.extractTextResponses(formData);
    
    if (textResponses.includes('severe') || textResponses.includes('unbearable')) {
      return 'severe';
    }
    if (textResponses.includes('moderate') || textResponses.includes('significant')) {
      return 'moderate';
    }
    
    return 'mild';
  }

  static getSymptomRiskScore(severity) {
    switch (severity) {
      case 'severe': return this.RISK_WEIGHTS.severe_symptoms;
      case 'moderate': return this.RISK_WEIGHTS.moderate_symptoms;
      case 'mild': return this.RISK_WEIGHTS.mild_symptoms;
      default: return 0;
    }
  }

  static assessMedicalHistory(patientData) {
    let score = 0;
    const factors = [];

    // Check medication count
    const medicationCount = patientData.medications?.length || 0;
    if (medicationCount >= 4) {
      score += this.RISK_WEIGHTS.multiple_medications;
      factors.push({
        factor: 'multiple_medications',
        weight: this.RISK_WEIGHTS.multiple_medications,
        description: `Patient on ${medicationCount} medications`
      });
    }

    // Check for chronic conditions
    const conditionCount = patientData.conditions?.length || 0;
    if (conditionCount >= 2) {
      score += this.RISK_WEIGHTS.chronic_conditions;
      factors.push({
        factor: 'chronic_conditions',
        weight: this.RISK_WEIGHTS.chronic_conditions,
        description: `Patient has ${conditionCount} chronic conditions`
      });
    }

    return { score, factors };
  }

  static assessBehavioralFactors(patientData) {
    let score = 0;
    const factors = [];

    // Check appointment history
    const missedAppointments = patientData.missedAppointments || 0;
    if (missedAppointments >= 2) {
      score += this.RISK_WEIGHTS.missed_appointments;
      factors.push({
        factor: 'missed_appointments',
        weight: this.RISK_WEIGHTS.missed_appointments,
        description: `${missedAppointments} missed appointments in last 3 months`
      });
    }

    return { score, factors };
  }

  static categorizeRisk(score) {
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  static generateRecommendations(riskScore, urgentFlags) {
    const recommendations = {
      urgency: 'routine',
      providerType: 'general',
      followUpRequired: false,
      additionalMonitoring: []
    };

    if (urgentFlags.length > 0) {
      recommendations.urgency = 'immediate';
      recommendations.providerType = 'crisis_specialist';
      recommendations.followUpRequired = true;
      recommendations.additionalMonitoring.push('crisis_monitoring');
    } else if (riskScore >= 8) {
      recommendations.urgency = 'within_24h';
      recommendations.providerType = 'specialist_preferred';
      recommendations.followUpRequired = true;
      recommendations.additionalMonitoring.push('symptom_tracking');
    } else if (riskScore >= 4) {
      recommendations.urgency = 'within_week';
      recommendations.providerType = 'general';
      recommendations.followUpRequired = true;
    }

    return recommendations;
  }
}
```

#### 1.2 Risk Assessment Hook
**File**: `src/hooks/useRiskAssessment.js`
```javascript
import { useState, useCallback } from 'react';
import { BasicRiskAssessment } from '../services/basicRiskAssessment';

export const useRiskAssessment = () => {
  const [assessment, setAssessment] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const assessPatientRisk = useCallback(async (patientData, formData) => {
    setIsAssessing(true);
    
    try {
      // Perform risk assessment
      const riskAssessment = BasicRiskAssessment.assessRisk(patientData, formData);
      
      // Save assessment to database
      const response = await fetch('/api/risk-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientData.id,
          assessment: riskAssessment
        })
      });

      if (response.ok) {
        setAssessment(riskAssessment);
        
        // Trigger alerts if urgent
        if (riskAssessment.urgentFlags.length > 0) {
          await triggerUrgentAlert(patientData.id, riskAssessment);
        }
      }

      return riskAssessment;
    } catch (error) {
      console.error('Risk assessment failed:', error);
      throw error;
    } finally {
      setIsAssessing(false);
    }
  }, []);

  const triggerUrgentAlert = async (patientId, assessment) => {
    try {
      await fetch('/api/urgent-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          alertType: 'high_risk_patient',
          assessment,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to trigger urgent alert:', error);
    }
  };

  return {
    assessment,
    assessPatientRisk,
    isAssessing
  };
};
```

### Week 2: Risk Indicator Components

#### 2.1 Risk Indicator Component
**File**: `src/components/consultations/RiskIndicator.jsx`
```jsx
import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export const RiskIndicator = ({ assessment, showDetails = false }) => {
  if (!assessment) return null;

  const getRiskIcon = (category) => {
    switch (category) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-green-500" />;
    }
  };

  const getRiskColor = (category) => {
    switch (category) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      default: return 'green';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'immediate': return 'Immediate Attention Required';
      case 'within_24h': return 'Schedule within 24 hours';
      case 'within_week': return 'Schedule within 1 week';
      default: return 'Routine scheduling';
    }
  };

  return (
    <div className="risk-indicator">
      <div className="flex items-center space-x-2 mb-2">
        {getRiskIcon(assessment.riskCategory)}
        <StatusBadge 
          status={assessment.riskCategory}
          color={getRiskColor(assessment.riskCategory)}
        />
        <span className="text-sm font-medium">
          Risk Score: {assessment.riskScore.toFixed(1)}/10
        </span>
      </div>

      {assessment.urgentFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-800">
              Urgent Attention Required
            </span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Crisis keywords detected in patient responses
          </p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        {getUrgencyText(assessment.recommendations.urgency)}
      </div>

      {showDetails && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Risk Factors:</h4>
          {assessment.riskFactors.map((factor, index) => (
            <div key={index} className="text-sm text-gray-600">
              • {factor.description} (Weight: {factor.weight})
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Week 3: Provider Matching & Integration

#### 3.1 Provider Matching Service
**File**: `src/services/providerMatching.js`
```javascript
export class ProviderMatching {
  static async findOptimalProvider(patientData, riskAssessment) {
    try {
      const response = await fetch('/api/providers/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientConditions: patientData.conditions,
          riskLevel: riskAssessment.riskCategory,
          urgency: riskAssessment.recommendations.urgency,
          preferredProviderType: riskAssessment.recommendations.providerType
        })
      });

      const availableProviders = await response.json();
      
      return this.scoreProviders(availableProviders, patientData, riskAssessment);
    } catch (error) {
      console.error('Provider matching failed:', error);
      return [];
    }
  }

  static scoreProviders(providers, patientData, riskAssessment) {
    return providers.map(provider => {
      let score = 0;
      const reasons = [];

      // Specialization match
      if (this.hasMatchingSpecialization(provider, patientData.conditions)) {
        score += 0.4;
        reasons.push('specializes_in_patient_conditions');
      }

      // Availability urgency match
      if (this.meetsUrgencyRequirement(provider, riskAssessment.recommendations.urgency)) {
        score += 0.3;
        reasons.push('available_within_required_timeframe');
      }

      // Experience with risk level
      if (this.hasRiskLevelExperience(provider, riskAssessment.riskCategory)) {
        score += 0.2;
        reasons.push('experienced_with_risk_level');
      }

      // Patient satisfaction
      if (provider.satisfaction_rating >= 4.5) {
        score += 0.1;
        reasons.push('high_patient_satisfaction');
      }

      return {
        ...provider,
        matchScore: score,
        reasons,
        estimatedWaitTime: this.calculateWaitTime(provider),
        nextAvailability: this.getNextAvailability(provider)
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  static hasMatchingSpecialization(provider, conditions) {
    if (!provider.specializations || !conditions) return false;
    
    return conditions.some(condition => 
      provider.specializations.some(spec => 
        spec.toLowerCase().includes(condition.toLowerCase()) ||
        condition.toLowerCase().includes(spec.toLowerCase())
      )
    );
  }

  static meetsUrgencyRequirement(provider, urgency) {
    const availability = provider.next_available_slot;
    if (!availability) return false;

    const availableDate = new Date(availability);
    const now = new Date();
    const hoursUntilAvailable = (availableDate - now) / (1000 * 60 * 60);

    switch (urgency) {
      case 'immediate': return hoursUntilAvailable <= 2;
      case 'within_24h': return hoursUntilAvailable <= 24;
      case 'within_week': return hoursUntilAvailable <= 168;
      default: return true;
    }
  }

  static hasRiskLevelExperience(provider, riskLevel) {
    // Check if provider has experience with this risk level
    return provider.risk_level_experience?.includes(riskLevel) || 
           riskLevel === 'low'; // All providers can handle low risk
  }

  static calculateWaitTime(provider) {
    // Simple wait time calculation based on current queue
    const queueLength = provider.current_queue_length || 0;
    return Math.max(5, queueLength * 15); // 15 minutes per patient, minimum 5 minutes
  }

  static getNextAvailability(provider) {
    return provider.next_available_slot || 'Not available';
  }
}
```

---

## Database Migrations

### Phase 2A: Risk Assessment Tables
**File**: `supabase/migrations/20250616_add_risk_assessment_system.sql`
```sql
-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  risk_score DECIMAL(3,1) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 10),
  risk_category TEXT NOT NULL CHECK (risk_category IN ('low', 'medium', 'high')),
  risk_factors JSONB DEFAULT '[]',
  urgent_flags JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '{}',
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider specializations table
CREATE TABLE IF NOT EXISTS provider_specializations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  certification_level TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider availability table
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  available_from TIMESTAMPTZ NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  max_patients INTEGER DEFAULT 10,
  current_queue_length INTEGER DEFAULT 0,
  risk_level_experience TEXT[] DEFAULT ARRAY['low'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Urgent alerts table
CREATE TABLE IF NOT EXISTS urgent_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  assessment_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  assigned_provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_assessments_patient_id ON risk_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_date ON risk_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_category ON risk_assessments(risk_category);
CREATE INDEX IF NOT EXISTS idx_provider_specializations_provider_id ON provider_specializations(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_id ON provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_urgent_alerts_patient_id ON urgent_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_urgent_alerts_status ON urgent_alerts(status);

-- RLS policies
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE urgent_alerts ENABLE ROW LEVEL SECURITY;

-- Patients can view their own risk assessments
CREATE POLICY "Patients can view own risk assessments" ON risk_assessments
  FOR SELECT USING (auth.uid()::text = patient_id::text);

-- Providers can view all risk assessments
CREATE POLICY "Providers can view risk assessments" ON risk_assessments
  FOR ALL USING (auth.jwt() ->> 'role' = 'provider');

-- Service role has full access
CREATE POLICY "Service role full access risk assessments" ON risk_assessments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Similar policies for other tables
CREATE POLICY "Providers can manage specializations" ON provider_specializations
  FOR ALL USING (auth.jwt() ->> 'role' = 'provider');

CREATE POLICY "Providers can manage availability" ON provider_availability
  FOR ALL USING (auth.jwt() ->> 'role' = 'provider');

CREATE POLICY "Providers can view urgent alerts" ON urgent_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'provider');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_risk_assessments_updated_at 
  BEFORE UPDATE ON risk_assessments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_availability_updated_at 
  BEFORE UPDATE ON provider_availability 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Migration Script**: `apply-risk-assessment-system-migration.sh`
```bash
#!/bin/bash

echo "Applying Risk Assessment System migration..."

# Apply the migration
npx supabase db push --file supabase/migrations/20250616_add_risk_assessment_system.sql

if [ $? -eq 0 ]; then
    echo "✅ Risk Assessment System migration applied successfully"
    
    # Insert sample provider specializations
    echo "Adding sample provider specializations..."
    npx supabase db push --file - <<EOF
INSERT INTO provider_specializations (provider_id, specialization, experience_years, certification_level)
SELECT 
    id,
    'General Practice',
    5,
    'certified'
FROM providers 
WHERE role = 'provider'
ON CONFLICT DO NOTHING;

INSERT INTO provider_availability (provider_id, available_from, available_until, risk_level_experience)
SELECT 
    id,
    NOW(),
    NOW() + INTERVAL '8 hours',
    ARRAY['low', 'medium']
FROM providers 
WHERE role = 'provider'
ON CONFLICT DO NOTHING;
EOF
    
    echo "✅ Sample data inserted successfully"
else
    echo "❌ Migration failed"
    exit 1
fi
```

---

## Backend API Endpoints

### Phase 1: Stripe API Endpoints
**File**: `src/server/routes/stripe.js`
```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create customer
router.post('/create-customer', async (req, res) => {
  try {
    const { email, name, metadata = {} } = req.body;

    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });

    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create subscription
router.post('/create-subscription', async (req, res) => {
  try {
    const { customerId, priceId, metadata = {} } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscription_id: subscription.id,
      client_secret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    res.json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Phase 2A: Risk Assessment API Endpoints
**File**: `src/server/routes/riskAssessment.js`
```javascript
const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Create risk assessment
router.post('/risk-assessments', async (req, res) => {
  try {
    const { patientId, assessment } = req.body;

    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({
        patient_id: patientId,
        risk_score: assessment.riskScore,
        risk_category: assessment.riskCategory,
        risk_factors: assessment.riskFactors,
        urgent_flags: assessment.urgentFlags,
        recommendations: assessment.recommendations
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get patient risk assessments
router.get('/risk-assessments/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessment_date', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create urgent alert
router.post('/urgent-alerts', async (req, res) => {
  try {
    const { patientId, alertType, assessment } = req.body;

    const { data, error } = await supabase
      .from('urgent_alerts')
      .insert({
        patient_id: patientId,
        alert_type: alertType,
        assessment_data: assessment
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send real-time notification to providers
    // await notificationService.sendUrgentAlert(data);

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available providers
router.post('/providers/available', async (req, res) => {
  try {
    const { patientConditions, riskLevel, urgency } = req.body;

    const { data, error } = await supabase
      .from('providers')
      .select(`
        *,
        provider_specializations(*),
        provider_availability(*)
      `)
      .eq('status', 'active');

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

---

## Testing Strategy

### Phase 1: Stripe Integration Testing
1. **Unit Tests**
   - Test payment intent creation
   - Test subscription management
   - Test error handling

2. **Integration Tests**
   - End-to-end payment flow
   - Webhook handling
   - Database synchronization

3. **Manual Testing**
   - Test with Stripe test cards
   - Verify payment success/failure flows
   - Test subscription lifecycle

### Phase 2A: Risk Assessment Testing
1. **Unit Tests**
   - Test risk scoring algorithms
   - Test keyword detection
   - Test provider matching logic

2. **Integration Tests**
   - Test form submission to risk assessment
   - Test urgent alert triggering
   - Test provider recommendation API

3. **Manual Testing**
   - Test with various form responses
   - Verify urgent keyword detection
   - Test provider matching accuracy

---

## Deployment Checklist

### Phase 1: Stripe Integration
- [ ] Stripe account configured (test and production)
- [ ] Environment variables set
- [ ] Webhook endpoints configured
- [ ] Payment form tested with test cards
- [ ] Subscription management tested
- [ ] Error handling verified

### Phase 2A: Risk Assessment
- [ ] Database migration applied
- [ ] Risk assessment service tested
- [ ] Provider matching algorithm verified
- [ ] Urgent alert system tested
- [ ] Risk indicator UI components working
- [ ] Integration with existing forms tested

---

## Success Metrics

### Phase 1: Payment Integration
- Payment success rate > 99%
- Average payment processing time < 3 seconds
- Subscription churn rate < 5%
- Zero payment security incidents

### Phase 2A: Risk Assessment
- Risk assessment completion rate > 95%
- Urgent case detection accuracy > 90%
- Provider matching satisfaction > 80%
- Average time to urgent case response < 30 minutes

---

## Next Steps After Implementation

1. **Monitor Performance**
   - Track payment success rates
   - Monitor risk assessment accuracy
   - Analyze provider matching effectiveness

2. **Gather Feedback**
   - Provider feedback on risk indicators
   - Patient feedback on payment experience
   - Administrative feedback on urgent alerts

3. **Iterate and Improve**
   - Refine risk scoring algorithms
   - Optimize provider matching
   - Enhance payment user experience

4. **Prepare for Phase 3**
   - Mobile optimization planning
   - Real-time features design
   - Advanced analytics preparation

This implementation guide provides a comprehensive roadmap for successfully implementing Phase 1 (Stripe Payment Integration) and Phase 2A (Essential Risk Assessment) within the 4-6 week timeline.
