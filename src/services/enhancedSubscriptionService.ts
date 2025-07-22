/**
 * Enhanced Subscription Service
 * 
 * Advanced subscription lifecycle management with prorated billing,
 * plan upgrades/downgrades, and comprehensive analytics.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// Enhanced subscription interfaces
export interface EnhancedSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing' | 'paused';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  trialStart?: Timestamp;
  trialEnd?: Timestamp;
  cancelledAt?: Timestamp;
  cancelAtPeriodEnd: boolean;
  billing: SubscriptionBilling;
  usage: SubscriptionUsage;
  modifications: SubscriptionModification[];
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubscriptionBilling {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  interval: 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  nextBillingDate: Timestamp;
  lastBillingDate?: Timestamp;
  prorationAmount?: number;
  discounts: SubscriptionDiscount[];
  paymentMethod: string;
  billingHistory: BillingEvent[];
}

export interface SubscriptionDiscount {
  id: string;
  type: 'percentage' | 'fixed_amount' | 'free_trial';
  value: number;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  validUntil?: Timestamp;
  appliedAt: Timestamp;
}

export interface BillingEvent {
  id: string;
  type: 'charge' | 'refund' | 'proration' | 'discount' | 'tax';
  amount: number;
  description: string;
  timestamp: Timestamp;
  status: 'succeeded' | 'failed' | 'pending';
  invoiceId?: string;
}

export interface SubscriptionUsage {
  currentUsage: Record<string, number>;
  limits: Record<string, number>;
  resetDate: Timestamp;
  overage: Record<string, number>;
  usageHistory: UsageEvent[];
}

export interface UsageEvent {
  id: string;
  feature: string;
  amount: number;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export interface SubscriptionModification {
  id: string;
  type: 'upgrade' | 'downgrade' | 'pause' | 'resume' | 'cancel' | 'reactivate';
  fromPlanId?: string;
  toPlanId?: string;
  effectiveDate: Timestamp;
  prorationAmount?: number;
  reason?: string;
  appliedBy: string;
  timestamp: Timestamp;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  pricing: PlanPricing;
  features: PlanFeature[];
  limits: PlanLimits;
  trial: TrialSettings;
  status: 'active' | 'inactive' | 'archived';
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlanPricing {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  interval: 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  setupFee?: number;
  cancellationFee?: number;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
  unlimited?: boolean;
}

export interface PlanLimits {
  consultations?: number;
  prescriptions?: number;
  labTests?: number;
  storage?: number; // in GB
  users?: number;
  apiCalls?: number;
}

export interface TrialSettings {
  enabled: boolean;
  duration: number; // in days
  requiresPaymentMethod: boolean;
  autoConvert: boolean;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  conversionRate: number;
  upgradeRate: number;
  downgradeRate: number;
  planDistribution: Record<string, number>;
  revenueByPlan: Record<string, number>;
}

export interface ProrationCalculation {
  currentPlanAmount: number;
  newPlanAmount: number;
  daysRemaining: number;
  totalDaysInPeriod: number;
  prorationAmount: number;
  creditAmount: number;
  chargeAmount: number;
  effectiveDate: Timestamp;
}

/**
 * Enhanced Subscription Service Class
 */
export class EnhancedSubscriptionService {
  private db = getFirebaseFirestore();

  /**
   * Create a new subscription
   */
  async createSubscription(
    customerId: string,
    planId: string,
    options?: {
      trialDays?: number;
      paymentMethod?: string;
      discounts?: SubscriptionDiscount[];
      metadata?: Record<string, any>;
    }
  ): Promise<EnhancedSubscription | null> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Get plan details
      const plan = await this.getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Timestamp.now();
      
      // Calculate trial and billing dates
      const trialDays = options?.trialDays || (plan.trial.enabled ? plan.trial.duration : 0);
      const trialStart = trialDays > 0 ? now : undefined;
      const trialEnd = trialDays > 0 ? 
        Timestamp.fromDate(new Date(now.toDate().getTime() + trialDays * 24 * 60 * 60 * 1000)) : 
        undefined;

      const periodStart = trialEnd || now;
      const periodEnd = this.calculateNextBillingDate(periodStart.toDate(), plan.pricing.interval, plan.pricing.intervalCount);

      const subscription: EnhancedSubscription = {
        id: subscriptionId,
        customerId,
        planId,
        status: trialDays > 0 ? 'trialing' : 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: Timestamp.fromDate(periodEnd),
        trialStart,
        trialEnd,
        cancelAtPeriodEnd: false,
        billing: {
          amount: plan.pricing.amount,
          currency: plan.pricing.currency,
          interval: plan.pricing.interval,
          intervalCount: plan.pricing.intervalCount,
          nextBillingDate: Timestamp.fromDate(periodEnd),
          discounts: options?.discounts || [],
          paymentMethod: options?.paymentMethod || 'stripe',
          billingHistory: []
        },
        usage: {
          currentUsage: {},
          limits: this.convertPlanLimitsToUsageLimits(plan.limits),
          resetDate: Timestamp.fromDate(periodEnd),
          overage: {},
          usageHistory: []
        },
        modifications: [],
        metadata: options?.metadata,
        createdAt: now,
        updatedAt: now
      };

      // Save subscription
      await setDoc(doc(this.db, 'subscriptions', subscriptionId), subscription);

      console.log(`Created subscription: ${subscriptionId} for customer: ${customerId}`);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
  }

  /**
   * Upgrade or downgrade subscription
   */
  async modifySubscription(
    subscriptionId: string,
    newPlanId: string,
    options?: {
      effectiveDate?: Date;
      prorate?: boolean;
      reason?: string;
      appliedBy?: string;
    }
  ): Promise<{ success: boolean; prorationAmount?: number; error?: string }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Get current subscription
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      // Get new plan
      const newPlan = await this.getSubscriptionPlan(newPlanId);
      if (!newPlan) {
        return { success: false, error: 'New plan not found' };
      }

      // Get current plan
      const currentPlan = await this.getSubscriptionPlan(subscription.planId);
      if (!currentPlan) {
        return { success: false, error: 'Current plan not found' };
      }

      // Calculate proration if needed
      let prorationAmount = 0;
      if (options?.prorate !== false) {
        const proration = this.calculateProration(
          subscription,
          currentPlan,
          newPlan,
          options?.effectiveDate || new Date()
        );
        prorationAmount = proration.prorationAmount;
      }

      // Determine modification type
      const modificationType = newPlan.pricing.amount > currentPlan.pricing.amount ? 'upgrade' : 'downgrade';

      // Create modification record
      const modification: SubscriptionModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: modificationType,
        fromPlanId: subscription.planId,
        toPlanId: newPlanId,
        effectiveDate: Timestamp.fromDate(options?.effectiveDate || new Date()),
        prorationAmount,
        reason: options?.reason,
        appliedBy: options?.appliedBy || 'system',
        timestamp: Timestamp.now()
      };

      // Update subscription
      const updatedSubscription: Partial<EnhancedSubscription> = {
        planId: newPlanId,
        billing: {
          ...subscription.billing,
          amount: newPlan.pricing.amount,
          interval: newPlan.pricing.interval,
          intervalCount: newPlan.pricing.intervalCount,
          prorationAmount
        },
        usage: {
          ...subscription.usage,
          limits: this.convertPlanLimitsToUsageLimits(newPlan.limits)
        },
        modifications: [...subscription.modifications, modification],
        updatedAt: Timestamp.now()
      };

      // Save updated subscription
      await updateDoc(doc(this.db, 'subscriptions', subscriptionId), updatedSubscription);

      // Record billing event if there's a proration
      if (prorationAmount !== 0) {
        await this.recordBillingEvent(subscriptionId, {
          type: 'proration',
          amount: prorationAmount,
          description: `Plan ${modificationType} proration`,
          status: 'succeeded'
        });
      }

      console.log(`Modified subscription: ${subscriptionId} to plan: ${newPlanId}`);
      return { success: true, prorationAmount };
    } catch (error) {
      console.error('Error modifying subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    options?: {
      cancelAtPeriodEnd?: boolean;
      reason?: string;
      appliedBy?: string;
      refundAmount?: number;
    }
  ): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        return false;
      }

      const now = Timestamp.now();
      const cancelAtPeriodEnd = options?.cancelAtPeriodEnd !== false;

      // Create cancellation modification
      const modification: SubscriptionModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'cancel',
        effectiveDate: cancelAtPeriodEnd ? subscription.currentPeriodEnd : now,
        reason: options?.reason,
        appliedBy: options?.appliedBy || 'system',
        timestamp: now
      };

      // Update subscription
      const updates: Partial<EnhancedSubscription> = {
        status: cancelAtPeriodEnd ? subscription.status : 'cancelled',
        cancelledAt: now,
        cancelAtPeriodEnd,
        modifications: [...subscription.modifications, modification],
        updatedAt: now
      };

      await updateDoc(doc(this.db, 'subscriptions', subscriptionId), updates);

      // Record refund if applicable
      if (options?.refundAmount && options.refundAmount > 0) {
        await this.recordBillingEvent(subscriptionId, {
          type: 'refund',
          amount: -options.refundAmount,
          description: 'Subscription cancellation refund',
          status: 'succeeded'
        });
      }

      console.log(`Cancelled subscription: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(
    subscriptionId: string,
    options?: {
      resumeDate?: Date;
      reason?: string;
      appliedBy?: string;
    }
  ): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        return false;
      }

      const now = Timestamp.now();

      // Create pause modification
      const modification: SubscriptionModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'pause',
        effectiveDate: now,
        reason: options?.reason,
        appliedBy: options?.appliedBy || 'system',
        timestamp: now
      };

      // Update subscription
      const updates: Partial<EnhancedSubscription> = {
        status: 'paused',
        modifications: [...subscription.modifications, modification],
        updatedAt: now,
        metadata: {
          ...subscription.metadata,
          pausedAt: now.toMillis(),
          resumeDate: options?.resumeDate?.getTime()
        }
      };

      await updateDoc(doc(this.db, 'subscriptions', subscriptionId), updates);

      console.log(`Paused subscription: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      return false;
    }
  }

  /**
   * Resume paused subscription
   */
  async resumeSubscription(
    subscriptionId: string,
    options?: {
      reason?: string;
      appliedBy?: string;
    }
  ): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription || subscription.status !== 'paused') {
        return false;
      }

      const now = Timestamp.now();

      // Create resume modification
      const modification: SubscriptionModification = {
        id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'resume',
        effectiveDate: now,
        reason: options?.reason,
        appliedBy: options?.appliedBy || 'system',
        timestamp: now
      };

      // Calculate new billing dates
      const plan = await this.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return false;
      }

      const newPeriodEnd = this.calculateNextBillingDate(now.toDate(), plan.pricing.interval, plan.pricing.intervalCount);

      // Update subscription
      const updates: Partial<EnhancedSubscription> = {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: Timestamp.fromDate(newPeriodEnd),
        billing: {
          ...subscription.billing,
          nextBillingDate: Timestamp.fromDate(newPeriodEnd)
        },
        modifications: [...subscription.modifications, modification],
        updatedAt: now
      };

      await updateDoc(doc(this.db, 'subscriptions', subscriptionId), updates);

      console.log(`Resumed subscription: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return false;
    }
  }

  /**
   * Track usage for a subscription
   */
  async trackUsage(
    subscriptionId: string,
    feature: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        return false;
      }

      // Create usage event
      const usageEvent: UsageEvent = {
        id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        feature,
        amount,
        timestamp: Timestamp.now(),
        metadata
      };

      // Update current usage
      const currentUsage = { ...subscription.usage.currentUsage };
      currentUsage[feature] = (currentUsage[feature] || 0) + amount;

      // Check for overage
      const overage = { ...subscription.usage.overage };
      const limit = subscription.usage.limits[feature];
      if (limit && currentUsage[feature] > limit) {
        overage[feature] = currentUsage[feature] - limit;
      }

      // Update subscription usage
      const updatedUsage: SubscriptionUsage = {
        ...subscription.usage,
        currentUsage,
        overage,
        usageHistory: [...subscription.usage.usageHistory, usageEvent]
      };

      await updateDoc(doc(this.db, 'subscriptions', subscriptionId), {
        usage: updatedUsage,
        updatedAt: Timestamp.now()
      });

      console.log(`Tracked usage: ${feature} +${amount} for subscription: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error('Error tracking usage:', error);
      return false;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<EnhancedSubscription | null> {
    try {
      if (!this.db) return null;

      const subscriptionDoc = await getDoc(doc(this.db, 'subscriptions', subscriptionId));
      
      if (!subscriptionDoc.exists()) {
        return null;
      }

      return { id: subscriptionDoc.id, ...subscriptionDoc.data() } as EnhancedSubscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Get subscription plan by ID
   */
  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      if (!this.db) return null;

      const planDoc = await getDoc(doc(this.db, 'subscription_plans', planId));
      
      if (!planDoc.exists()) {
        return null;
      }

      return { id: planDoc.id, ...planDoc.data() } as SubscriptionPlan;
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      return null;
    }
  }

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<EnhancedSubscription[]> {
    try {
      if (!this.db) return [];

      const subscriptionsQuery = query(
        collection(this.db, 'subscriptions'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );

      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      return subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnhancedSubscription));
    } catch (error) {
      console.error('Error getting customer subscriptions:', error);
      return [];
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(timeRange = 30): Promise<SubscriptionAnalytics> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - timeRange);

      // Get all subscriptions
      const subscriptionsQuery = query(
        collection(this.db, 'subscriptions'),
        orderBy('createdAt', 'desc')
      );

      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      const subscriptions = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnhancedSubscription));

      // Calculate analytics
      const totalSubscriptions = subscriptions.length;
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
      
      // Calculate MRR
      const monthlyRecurringRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
          const monthlyAmount = this.convertToMonthlyAmount(s.billing.amount, s.billing.interval, s.billing.intervalCount);
          return sum + monthlyAmount;
        }, 0);

      // Calculate ARPU
      const averageRevenuePerUser = activeSubscriptions > 0 ? monthlyRecurringRevenue / activeSubscriptions : 0;

      // Calculate churn rate (simplified)
      const cancelledThisMonth = subscriptions.filter(s => 
        s.cancelledAt && s.cancelledAt.toDate() >= thirtyDaysAgo
      ).length;
      const churnRate = totalSubscriptions > 0 ? (cancelledThisMonth / totalSubscriptions) * 100 : 0;

      // Plan distribution
      const planDistribution: Record<string, number> = {};
      const revenueByPlan: Record<string, number> = {};

      subscriptions.forEach(subscription => {
        const planId = subscription.planId;
        planDistribution[planId] = (planDistribution[planId] || 0) + 1;
        
        if (subscription.status === 'active') {
          const monthlyAmount = this.convertToMonthlyAmount(
            subscription.billing.amount,
            subscription.billing.interval,
            subscription.billing.intervalCount
          );
          revenueByPlan[planId] = (revenueByPlan[planId] || 0) + monthlyAmount;
        }
      });

      // Calculate upgrade/downgrade rates
      const modifications = subscriptions.flatMap(s => s.modifications);
      const upgrades = modifications.filter(m => m.type === 'upgrade').length;
      const downgrades = modifications.filter(m => m.type === 'downgrade').length;
      
      const upgradeRate = totalSubscriptions > 0 ? (upgrades / totalSubscriptions) * 100 : 0;
      const downgradeRate = totalSubscriptions > 0 ? (downgrades / totalSubscriptions) * 100 : 0;

      return {
        totalSubscriptions,
        activeSubscriptions,
        churnRate,
        monthlyRecurringRevenue,
        averageRevenuePerUser,
        lifetimeValue: averageRevenuePerUser * 12, // Simplified LTV calculation
        conversionRate: 85, // Mock data - would calculate from trial conversions
        upgradeRate,
        downgradeRate,
        planDistribution,
        revenueByPlan
      };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private calculateProration(
    subscription: EnhancedSubscription,
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    effectiveDate: Date
  ): ProrationCalculation {
    const periodStart = subscription.currentPeriodStart.toDate();
    const periodEnd = subscription.currentPeriodEnd.toDate();
    const totalDaysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((periodEnd.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate daily rates
    const currentDailyRate = currentPlan.pricing.amount / totalDaysInPeriod;
    const newDailyRate = newPlan.pricing.amount / totalDaysInPeriod;

    // Calculate proration amounts
    const creditAmount = currentDailyRate * daysRemaining;
    const chargeAmount = newDailyRate * daysRemaining;
    const prorationAmount = chargeAmount - creditAmount;

    return {
      currentPlanAmount: currentPlan.pricing.amount,
      newPlanAmount: newPlan.pricing.amount,
      daysRemaining,
      totalDaysInPeriod,
      prorationAmount,
      creditAmount,
      chargeAmount,
      effectiveDate: Timestamp.fromDate(effectiveDate)
    };
  }

  private calculateNextBillingDate(startDate: Date, interval: string, intervalCount: number): Date {
    const nextDate = new Date(startDate);
    
    switch (interval) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + intervalCount);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + (3 * intervalCount));
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
        break;
    }

    return nextDate;
  }

  private convertPlanLimitsToUsageLimits(limits: PlanLimits): Record<string, number> {
    const usageLimits: Record<string, number> = {};
    
    if (limits.consultations) usageLimits.consultations = limits.consultations;
    if (limits.prescriptions) usageLimits.prescriptions = limits.prescriptions;
    if (limits.labTests) usageLimits.labTests = limits.labTests;
    if (limits.storage) usageLimits.storage = limits.storage;
    if (limits.users) usageLimits.users = limits.users;
    if (limits.apiCalls) usageLimits.apiCalls = limits.apiCalls;

    return usageLimits;
  }

  private convertToMonthlyAmount(amount: number, interval: string, intervalCount: number): number {
    switch (interval) {
      case 'monthly':
        return amount / intervalCount;
      case 'quarterly':
        return amount / (3 * intervalCount);
      case 'yearly':
        return amount / (12 * intervalCount);
      default:
        return amount;
    }
  }

  private async recordBillingEvent(
    subscriptionId: string,
    event: Omit<BillingEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) return;

      const billingEvent: BillingEvent = {
        id: `billing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event,
        timestamp: Timestamp.now()
      };

      const updatedBillingHistory = [...subscription.billing.billingHistory, billingEvent];

      await updateDoc(doc(this.db!, 'subscriptions', subscriptionId), {
        'billing.billingHistory': updatedBillingHistory,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error recording billing event:', error);
    }
  }
}

// Export singleton instance
export const enhancedSubscriptionService = new EnhancedSubscriptionService();
export default enhancedSubscriptionService;
