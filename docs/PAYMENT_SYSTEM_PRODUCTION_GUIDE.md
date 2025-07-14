# Payment System Production Deployment Guide

## Overview

This guide outlines the steps to deploy the payment system from development (sandbox) mode to production with real Stripe integration.

## Critical Changes Made

### 1. Enhanced Payment Service Architecture

**File**: [`src/services/paymentService.js`](src/services/paymentService.js)

**Changes**:
- ✅ **Replaced hardcoded mock responses** with real Stripe API integration
- ✅ **Added environment-based service selection** (sandbox vs production)
- ✅ **Implemented proper error handling** and validation
- ✅ **Added configuration validation** for production deployment
- ✅ **Created dynamic service loading** to avoid loading sandbox in production

**Key Features**:
- Automatic detection of production vs development mode
- Real Stripe API integration for production
- Sandbox mode only when explicitly configured or in development without Stripe keys
- Comprehensive error handling and logging
- Support for subscriptions, one-time payments, and payment recovery

### 2. Fixed Webhook Provider Assignment

**File**: [`src/server/webhooks/formSubmissionWebhook.js`](src/server/webhooks/formSubmissionWebhook.js)

**Changes**:
- ✅ **Removed hardcoded mock providers array** (lines 12-31)
- ✅ **Implemented database-driven provider lookup** with proper filtering
- ✅ **Added state-based provider licensing checks**
- ✅ **Enhanced specialty matching** with fallback logic
- ✅ **Improved load balancing** based on pending consultations
- ✅ **Added comprehensive error handling** and logging

**Critical Fix**:
```javascript
// BEFORE (CRITICAL ISSUE):
const mockProviders = [
  { id: 'prov1', name: 'Dr. Smith', states: ['CA', 'NY', 'TX'] },
  // ... hardcoded providers
];

// AFTER (PRODUCTION READY):
const { data: providers, error } = await supabase
  .from('providers')
  .select('id, name, states, specialties, active')
  .eq('active', true)
  .contains('states', [patientState]);
```

### 3. Environment Configuration

**Files**: 
- [`/env.example`](.env.example) - Template for all environments
- [`/.env.development`](.env.development) - Development configuration

**Added Configuration**:
- Payment mode detection (`REACT_APP_PAYMENT_MODE`)
- Stripe publishable and secret key configuration
- Webhook secret configuration
- Environment-specific API URLs
- Proper security documentation

## Deployment Steps

### Phase 1: Pre-Deployment Setup

#### 1.1 Stripe Account Configuration

1. **Create Stripe Account** (if not already done)
   - Go to https://dashboard.stripe.com
   - Complete account verification for production use

2. **Configure Stripe Products and Prices**
   - Create products for all services/medications
   - Generate price IDs for both one-time and subscription items
   - Update database with real Stripe price IDs

3. **Set Up Webhook Endpoints**
   - Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Subscribe to events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Note the webhook secret for configuration

#### 1.2 Environment Variables Setup

**Production Environment** (`.env.production`):
```bash
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
REACT_APP_PAYMENT_MODE=production

# Stripe Live Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Production API
REACT_APP_API_BASE_URL=https://api.yourdomain.com
```

**Staging Environment** (`.env.staging`):
```bash
NODE_ENV=production
REACT_APP_ENVIRONMENT=staging
REACT_APP_PAYMENT_MODE=development

# Stripe Test Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# Staging API
REACT_APP_API_BASE_URL=https://staging-api.yourdomain.com
```

### Phase 2: Backend API Implementation

#### 2.1 Required API Endpoints

The frontend now expects these backend endpoints to exist:

```
POST /api/payments/create-checkout-session
POST /api/payments/process-payment
GET  /api/payments/verify-status/:sessionId
POST /api/payments/handle-failure
POST /api/payments/validate-discount
GET  /api/payments/payment-methods
POST /api/payments/create-subscription
POST /api/payments/cancel-subscription
```

#### 2.2 Example Backend Implementation (Node.js/Express)

```javascript
// payments/routes.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create checkout session
app.post('/api/payments/create-checkout-session', async (req, res) => {
  try {
    const { cartItems, customerInfo, options } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: cartItems.map(item => ({
        price: item.stripePriceId,
        quantity: item.quantity,
      })),
      customer_email: customerInfo.email,
      success_url: options.success_url,
      cancel_url: options.cancel_url,
      metadata: {
        patientId: customerInfo.patientId,
        orderId: options.orderId,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url,
      status: session.status,
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Additional endpoints implementation...
```

### Phase 3: Testing Strategy

#### 3.1 Pre-Production Testing

1. **Staging Environment Testing**
   - Deploy to staging with test Stripe keys
   - Test complete payment flows
   - Verify webhook handling
   - Test error scenarios

2. **Payment Flow Tests**
   - Successful payments
   - Failed payments (declined cards)
   - Subscription creation and management
   - Discount code application
   - Webhook processing

#### 3.2 Production Deployment Checklist

- [ ] Stripe live keys configured
- [ ] Webhook endpoints verified
- [ ] Database contains real provider data
- [ ] All price IDs updated in database
- [ ] Payment API endpoints implemented
- [ ] SSL certificates configured
- [ ] Error monitoring set up
- [ ] Payment logging configured

### Phase 4: Monitoring and Maintenance

#### 4.1 Required Monitoring

1. **Payment Metrics**
   - Payment success/failure rates
   - Average payment processing time
   - Subscription churn rates
   - Dispute and chargeback rates

2. **Error Monitoring**
   - Payment API errors
   - Webhook delivery failures
   - Provider assignment failures
   - Database connection issues

#### 4.2 Operational Procedures

1. **Daily Checks**
   - Review payment failure logs
   - Monitor webhook delivery success
   - Check provider assignment distribution

2. **Weekly Reviews**
   - Payment success rate analysis
   - Provider workload balance review
   - Revenue reconciliation with Stripe

## Security Considerations

### 1. API Key Management
- Never commit live Stripe keys to version control
- Use environment variables for all sensitive configuration
- Rotate webhook secrets regularly
- Implement proper key rotation procedures

### 2. Payment Data Handling
- Never store credit card information locally
- Log payment events but not sensitive data
- Implement proper PCI DSS compliance procedures
- Use Stripe's secure payment methods exclusively

### 3. Webhook Security
- Verify webhook signatures using Stripe's verification
- Implement idempotency for webhook processing
- Use HTTPS for all webhook endpoints
- Monitor for webhook replay attacks

## Rollback Plan

If issues arise in production:

1. **Immediate Rollback**
   ```bash
   # Emergency: Switch to sandbox mode
   REACT_APP_PAYMENT_MODE=sandbox
   ```

2. **Partial Rollback**
   - Keep provider assignment fixes
   - Rollback only payment processing
   - Use feature flags to control payment flows

3. **Full Rollback**
   - Revert to previous application version
   - Restore previous database state
   - Notify customers of temporary payment issues

## Success Metrics

### Critical Success Factors
- [ ] No hardcoded mock data in production
- [ ] Provider assignment uses real database queries
- [ ] Payment processing uses real Stripe integration
- [ ] Webhook handlers process real provider data
- [ ] All payments are tracked and logged properly

### Performance Targets
- Payment processing: < 2s (excluding Stripe API time)
- Provider assignment: < 100ms
- Webhook processing: < 500ms
- Payment success rate: > 95%

## Support and Troubleshooting

### Common Issues

1. **Payment Failures**
   - Check Stripe dashboard for detailed error information
   - Verify API keys are correct and active
   - Ensure webhook endpoints are reachable

2. **Provider Assignment Issues**
   - Verify providers exist in database with correct states
   - Check specialty mappings are correct
   - Ensure provider active status is properly set

3. **Environment Configuration**
   - Verify all required environment variables are set
   - Check API endpoints are accessible
   - Validate Stripe webhook signatures

### Contact Information
- **Development Team**: [Add team contact]
- **Stripe Support**: https://support.stripe.com
- **Emergency Escalation**: [Add escalation procedure]

---

**Document Version**: 1.0  
**Last Updated**: May 31, 2025  
**Next Review**: June 7, 2025