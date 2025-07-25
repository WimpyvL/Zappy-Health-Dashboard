/**
 * Category Plans Service
 * 
 * Manages treatment packages and category-based subscription plans.
 * Handles plan creation, modification, pricing, and patient assignments.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// Category Plans interfaces
export interface CategoryPlan {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  planType: 'treatment_package' | 'subscription' | 'consultation_bundle' | 'medication_plan';
  status: 'active' | 'inactive' | 'draft' | 'archived';
  pricing: PlanPricing;
  features: PlanFeature[];
  includedProducts: PlanProduct[];
  includedServices: PlanService[];
  eligibilityCriteria: EligibilityCriteria;
  duration?: PlanDuration;
  renewalOptions?: RenewalOptions;
  restrictions?: PlanRestrictions;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface PlanPricing {
  basePrice: number;
  currency: 'USD' | 'EUR' | 'GBP';
  billingInterval?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  discountPercentage?: number;
  promoPrice?: number;
  promoValidUntil?: Timestamp;
  stripePriceId?: string;
  taxIncluded: boolean;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  type: 'consultation' | 'product' | 'service' | 'benefit';
  included: boolean;
  limit?: number;
  unlimited?: boolean;
  metadata?: Record<string, any>;
}

export interface PlanProduct {
  productId: string;
  productName: string;
  quantity: number;
  includedInPrice: boolean;
  additionalCost?: number;
  refillsIncluded?: number;
  autoRefill?: boolean;
  metadata?: Record<string, any>;
}

export interface PlanService {
  serviceId: string;
  serviceName: string;
  serviceType: 'consultation' | 'lab_test' | 'monitoring' | 'support';
  included: boolean;
  limit?: number;
  unlimited?: boolean;
  additionalCost?: number;
  metadata?: Record<string, any>;
}

export interface EligibilityCriteria {
  ageRange?: { min?: number; max?: number };
  conditions?: string[];
  excludedConditions?: string[];
  requiredTests?: string[];
  geographicRestrictions?: string[];
  insuranceRequired?: boolean;
  priorAuthRequired?: boolean;
  metadata?: Record<string, any>;
}

export interface PlanDuration {
  length: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
  autoRenew: boolean;
  maxRenewals?: number;
}

export interface RenewalOptions {
  autoRenew: boolean;
  renewalPrice?: number;
  renewalDiscount?: number;
  notificationDays: number;
  gracePeriodDays: number;
}

export interface PlanRestrictions {
  maxActiveSubscriptions?: number;
  cooldownPeriod?: number;
  requiresProviderApproval?: boolean;
  ageRestrictions?: { min?: number; max?: number };
  stateRestrictions?: string[];
}

export interface PatientPlanAssignment {
  id: string;
  patientId: string;
  planId: string;
  status: 'active' | 'inactive' | 'pending' | 'cancelled' | 'completed';
  startDate: Timestamp;
  endDate?: Timestamp;
  renewalDate?: Timestamp;
  assignedBy: string;
  assignmentReason?: string;
  customizations?: PlanCustomization[];
  usageTracking?: PlanUsageTracking;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlanCustomization {
  featureId: string;
  customValue: any;
  reason?: string;
  approvedBy?: string;
}

export interface PlanUsageTracking {
  consultationsUsed: number;
  productsReceived: number;
  servicesUsed: number;
  lastActivity?: Timestamp;
  renewalCount: number;
}

export interface PlanRecommendation {
  planId: string;
  score: number;
  reasons: string[];
  matchingCriteria: string[];
  potentialBenefits: string[];
  estimatedSavings?: number;
}

/**
 * Category Plans Service Class
 */
export class CategoryPlansService {
  private db = getFirebaseFirestore();

  /**
   * Create a new category plan
   */
  async createCategoryPlan(planData: Omit<CategoryPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategoryPlan> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const plan: CategoryPlan = {
        id: planId,
        ...planData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(this.db, 'category_plans', planId), plan);

      console.log('Created category plan:', planId);
      return plan;
    } catch (error) {
      console.error('Error creating category plan:', error);
      throw new Error(`Failed to create category plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing category plan
   */
  async updateCategoryPlan(planId: string, updates: Partial<CategoryPlan>): Promise<CategoryPlan> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const planRef = doc(this.db, 'category_plans', planId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        throw new Error('Category plan not found');
      }

      const updatedPlan = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(planRef, updatedPlan);

      const updatedDoc = await getDoc(planRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as CategoryPlan;
    } catch (error) {
      console.error('Error updating category plan:', error);
      throw new Error(`Failed to update category plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get category plan by ID
   */
  async getCategoryPlan(planId: string): Promise<CategoryPlan | null> {
    try {
      if (!this.db) return null;

      const planDoc = await getDoc(doc(this.db, 'category_plans', planId));
      
      if (!planDoc.exists()) {
        return null;
      }

      return { id: planDoc.id, ...planDoc.data() } as CategoryPlan;
    } catch (error) {
      console.error('Error getting category plan:', error);
      return null;
    }
  }

  /**
   * Get all category plans with optional filtering
   */
  async getCategoryPlans(filters?: {
    categoryId?: string;
    planType?: string;
    status?: string;
    limit?: number;
  }): Promise<CategoryPlan[]> {
    try {
      if (!this.db) return [];

      let plansQuery = query(
        collection(this.db, 'category_plans'),
        orderBy('createdAt', 'desc')
      );

      if (filters?.categoryId) {
        plansQuery = query(
          collection(this.db, 'category_plans'),
          where('categoryId', '==', filters.categoryId),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.planType) {
        plansQuery = query(
          collection(this.db, 'category_plans'),
          where('planType', '==', filters.planType),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.status) {
        plansQuery = query(
          collection(this.db, 'category_plans'),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters?.limit) {
        plansQuery = query(plansQuery, limit(filters.limit));
      }

      const plansSnapshot = await getDocs(plansQuery);
      return plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryPlan));
    } catch (error) {
      console.error('Error getting category plans:', error);
      return [];
    }
  }

  /**
   * Delete a category plan
   */
  async deleteCategoryPlan(planId: string): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Check if plan has active assignments
      const activeAssignments = await this.getPatientPlanAssignments(undefined, planId, 'active');
      
      if (activeAssignments.length > 0) {
        throw new Error('Cannot delete plan with active patient assignments');
      }

      await deleteDoc(doc(this.db, 'category_plans', planId));
      console.log('Deleted category plan:', planId);
    } catch (error) {
      console.error('Error deleting category plan:', error);
      throw new Error(`Failed to delete category plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assign a plan to a patient
   */
  async assignPlanToPatient(
    patientId: string,
    planId: string,
    assignedBy: string,
    options?: {
      startDate?: Date;
      customizations?: PlanCustomization[];
      assignmentReason?: string;
    }
  ): Promise<PatientPlanAssignment> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Verify plan exists
      const plan = await this.getCategoryPlan(planId);
      if (!plan) {
        throw new Error('Category plan not found');
      }

      // Check eligibility
      const eligibilityCheck = await this.checkPatientEligibility(patientId, planId);
      if (!eligibilityCheck.eligible) {
        throw new Error(`Patient not eligible: ${eligibilityCheck.reasons.join(', ')}`);
      }

      const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startDate = options?.startDate || new Date();
      
      let endDate: Date | undefined;
      if (plan.duration) {
        endDate = new Date(startDate);
        switch (plan.duration.unit) {
          case 'days':
            endDate.setDate(endDate.getDate() + plan.duration.length);
            break;
          case 'weeks':
            endDate.setDate(endDate.getDate() + (plan.duration.length * 7));
            break;
          case 'months':
            endDate.setMonth(endDate.getMonth() + plan.duration.length);
            break;
          case 'years':
            endDate.setFullYear(endDate.getFullYear() + plan.duration.length);
            break;
        }
      }

      const assignment: PatientPlanAssignment = {
        id: assignmentId,
        patientId,
        planId,
        status: 'active',
        startDate: Timestamp.fromDate(startDate),
        endDate: endDate ? Timestamp.fromDate(endDate) : undefined,
        assignedBy,
        assignmentReason: options?.assignmentReason,
        customizations: options?.customizations || [],
        usageTracking: {
          consultationsUsed: 0,
          productsReceived: 0,
          servicesUsed: 0,
          renewalCount: 0,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(this.db, 'patient_plan_assignments', assignmentId), assignment);

      console.log('Assigned plan to patient:', { patientId, planId, assignmentId });
      return assignment;
    } catch (error) {
      console.error('Error assigning plan to patient:', error);
      throw new Error(`Failed to assign plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get patient plan assignments
   */
  async getPatientPlanAssignments(
    patientId?: string,
    planId?: string,
    status?: string
  ): Promise<PatientPlanAssignment[]> {
    try {
      if (!this.db) return [];

      let assignmentsQuery = query(
        collection(this.db, 'patient_plan_assignments'),
        orderBy('createdAt', 'desc')
      );

      if (patientId) {
        assignmentsQuery = query(
          collection(this.db, 'patient_plan_assignments'),
          where('patientId', '==', patientId),
          orderBy('createdAt', 'desc')
        );
      }

      if (planId) {
        assignmentsQuery = query(
          collection(this.db, 'patient_plan_assignments'),
          where('planId', '==', planId),
          orderBy('createdAt', 'desc')
        );
      }

      if (status) {
        assignmentsQuery = query(
          collection(this.db, 'patient_plan_assignments'),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      return assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientPlanAssignment));
    } catch (error) {
      console.error('Error getting patient plan assignments:', error);
      return [];
    }
  }

  /**
   * Update plan assignment status
   */
  async updatePlanAssignmentStatus(
    assignmentId: string,
    status: 'active' | 'inactive' | 'pending' | 'cancelled' | 'completed',
    reason?: string
  ): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const assignmentRef = doc(this.db, 'patient_plan_assignments', assignmentId);
      
      await updateDoc(assignmentRef, {
        status,
        ...(reason && { statusReason: reason }),
        updatedAt: Timestamp.now(),
      });

      console.log('Updated plan assignment status:', { assignmentId, status });
    } catch (error) {
      console.error('Error updating plan assignment status:', error);
      throw new Error(`Failed to update assignment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track plan usage
   */
  async trackPlanUsage(
    assignmentId: string,
    usageType: 'consultation' | 'product' | 'service',
    amount = 1
  ): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const assignmentRef = doc(this.db, 'patient_plan_assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);

      if (!assignmentDoc.exists()) {
        throw new Error('Plan assignment not found');
      }

      const assignment = assignmentDoc.data() as PatientPlanAssignment;
      const currentUsage = assignment.usageTracking || {
        consultationsUsed: 0,
        productsReceived: 0,
        servicesUsed: 0,
        renewalCount: 0,
      };

      const updatedUsage = { ...currentUsage };
      
      switch (usageType) {
        case 'consultation':
          updatedUsage.consultationsUsed += amount;
          break;
        case 'product':
          updatedUsage.productsReceived += amount;
          break;
        case 'service':
          updatedUsage.servicesUsed += amount;
          break;
      }

      updatedUsage.lastActivity = Timestamp.now();

      await updateDoc(assignmentRef, {
        usageTracking: updatedUsage,
        updatedAt: Timestamp.now(),
      });

      console.log('Tracked plan usage:', { assignmentId, usageType, amount });
    } catch (error) {
      console.error('Error tracking plan usage:', error);
      throw new Error(`Failed to track usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check patient eligibility for a plan
   */
  async checkPatientEligibility(patientId: string, planId: string): Promise<{
    eligible: boolean;
    reasons: string[];
    warnings: string[];
  }> {
    try {
      if (!this.db) {
        return { eligible: false, reasons: ['Database not initialized'], warnings: [] };
      }

      const plan = await this.getCategoryPlan(planId);
      if (!plan) {
        return { eligible: false, reasons: ['Plan not found'], warnings: [] };
      }

      // Get patient data
      const patientDoc = await getDoc(doc(this.db, 'patients', patientId));
      if (!patientDoc.exists()) {
        return { eligible: false, reasons: ['Patient not found'], warnings: [] };
      }

      const patient = patientDoc.data();
      const reasons: string[] = [];
      const warnings: string[] = [];

      // Check age restrictions
      if (plan.eligibilityCriteria.ageRange) {
        const patientAge = this.calculateAge(patient.dateOfBirth?.toDate());
        const { min, max } = plan.eligibilityCriteria.ageRange;
        
        if (min && patientAge < min) {
          reasons.push(`Patient too young (${patientAge} < ${min})`);
        }
        if (max && patientAge > max) {
          reasons.push(`Patient too old (${patientAge} > ${max})`);
        }
      }

      // Check geographic restrictions
      if (plan.eligibilityCriteria.geographicRestrictions) {
        const patientState = patient.address?.state;
        if (patientState && !plan.eligibilityCriteria.geographicRestrictions.includes(patientState)) {
          reasons.push(`Not available in ${patientState}`);
        }
      }

      // Check existing active plans
      const activeAssignments = await this.getPatientPlanAssignments(patientId, undefined, 'active');
      if (plan.restrictions?.maxActiveSubscriptions) {
        const activePlansCount = activeAssignments.length;
        if (activePlansCount >= plan.restrictions.maxActiveSubscriptions) {
          reasons.push(`Maximum active plans exceeded (${activePlansCount}/${plan.restrictions.maxActiveSubscriptions})`);
        }
      }

      // Check insurance requirements
      if (plan.eligibilityCriteria.insuranceRequired && !patient.insurance) {
        reasons.push('Insurance required but not provided');
      }

      return {
        eligible: reasons.length === 0,
        reasons,
        warnings,
      };
    } catch (error) {
      console.error('Error checking patient eligibility:', error);
      return { 
        eligible: false, 
        reasons: ['Error checking eligibility'], 
        warnings: [] 
      };
    }
  }

  /**
   * Get plan recommendations for a patient
   */
  async getPatientPlanRecommendations(patientId: string): Promise<PlanRecommendation[]> {
    try {
      if (!this.db) return [];

      // Get patient data
      const patientDoc = await getDoc(doc(this.db, 'patients', patientId));
      if (!patientDoc.exists()) {
        return [];
      }

      const patient = patientDoc.data();
      const activePlans = await this.getCategoryPlans({ status: 'active' });
      const recommendations: PlanRecommendation[] = [];

      for (const plan of activePlans) {
        const eligibility = await this.checkPatientEligibility(patientId, plan.id);
        
        if (eligibility.eligible) {
          const score = this.calculateRecommendationScore(patient, plan);
          const reasons = this.generateRecommendationReasons(patient, plan);
          
          recommendations.push({
            planId: plan.id,
            score,
            reasons,
            matchingCriteria: this.getMatchingCriteria(patient, plan),
            potentialBenefits: this.getPotentialBenefits(patient, plan),
            estimatedSavings: this.calculateEstimatedSavings(patient, plan),
          });
        }
      }

      // Sort by score descending
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting plan recommendations:', error);
      return [];
    }
  }

  /**
   * Get plan analytics
   */
  async getPlanAnalytics(planId?: string, timeRange = 30): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    cancelledAssignments: number;
    totalRevenue: number;
    averageUsage: {
      consultations: number;
      products: number;
      services: number;
    };
    renewalRate: number;
  }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - timeRange);

      let assignmentsQuery = query(
        collection(this.db, 'patient_plan_assignments'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('createdAt', 'desc')
      );

      if (planId) {
        assignmentsQuery = query(
          collection(this.db, 'patient_plan_assignments'),
          where('planId', '==', planId),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc')
        );
      }

      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = assignmentsSnapshot.docs.map(doc => doc.data() as PatientPlanAssignment);

      // Calculate analytics
      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter(a => a.status === 'active').length;
      const completedAssignments = assignments.filter(a => a.status === 'completed').length;
      const cancelledAssignments = assignments.filter(a => a.status === 'cancelled').length;

      // Calculate average usage
      const totalUsage = assignments.reduce((acc, assignment) => {
        const usage = assignment.usageTracking || { consultationsUsed: 0, productsReceived: 0, servicesUsed: 0, renewalCount: 0 };
        return {
          consultations: acc.consultations + usage.consultationsUsed,
          products: acc.products + usage.productsReceived,
          services: acc.services + usage.servicesUsed,
        };
      }, { consultations: 0, products: 0, services: 0 });

      const averageUsage = {
        consultations: totalAssignments > 0 ? totalUsage.consultations / totalAssignments : 0,
        products: totalAssignments > 0 ? totalUsage.products / totalAssignments : 0,
        services: totalAssignments > 0 ? totalUsage.services / totalAssignments : 0,
      };

      // Calculate renewal rate
      const renewedAssignments = assignments.filter(a => a.usageTracking && a.usageTracking.renewalCount > 0).length;
      const renewalRate = totalAssignments > 0 ? (renewedAssignments / totalAssignments) * 100 : 0;

      // Calculate revenue (simplified - would need plan pricing data)
      const totalRevenue = 0; // Would calculate based on plan pricing and assignments

      return {
        totalAssignments,
        activeAssignments,
        completedAssignments,
        cancelledAssignments,
        totalRevenue,
        averageUsage,
        renewalRate,
      };
    } catch (error) {
      console.error('Error getting plan analytics:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateRecommendationScore(patient: any, plan: CategoryPlan): number {
    let score = 50; // Base score

    // Add scoring logic based on patient data and plan features
    // This is a simplified example
    if (patient.conditions && plan.eligibilityCriteria.conditions) {
      const matchingConditions = patient.conditions.filter((c: string) => 
        plan.eligibilityCriteria.conditions!.includes(c)
      );
      score += matchingConditions.length * 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  private generateRecommendationReasons(patient: any, plan: CategoryPlan): string[] {
    const reasons: string[] = [];
    
    // Add logic to generate reasons based on patient data and plan features
    reasons.push(`Matches your ${plan.categoryName} needs`);
    
    if (plan.pricing.discountPercentage) {
      reasons.push(`${plan.pricing.discountPercentage}% discount available`);
    }

    return reasons;
  }

  private getMatchingCriteria(patient: any, plan: CategoryPlan): string[] {
    const criteria: string[] = [];
    
    // Add logic to identify matching criteria
    criteria.push('Age appropriate');
    criteria.push('Geographic availability');
    
    return criteria;
  }

  private getPotentialBenefits(patient: any, plan: CategoryPlan): string[] {
    const benefits: string[] = [];
    
    // Add logic to identify potential benefits
    plan.features.forEach(feature => {
      if (feature.included) {
        benefits.push(feature.name);
      }
    });
    
    return benefits;
  }

  private calculateEstimatedSavings(patient: any, plan: CategoryPlan): number {
    // Add logic to calculate estimated savings
    // This would compare plan cost vs individual service costs
    return 0;
  }
}

// Export singleton instance
export const categoryPlansService = new CategoryPlansService();
export default categoryPlansService;
