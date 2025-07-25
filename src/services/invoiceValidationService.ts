/**
 * Invoice Validation Service
 * 
 * Service for validating invoice creation with smart business logic.
 * Prevents duplicate invoices and respects subscription rules.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// Invoice validation interfaces
export interface InvoiceValidationResult {
  shouldCreate: boolean;
  reason?: string;
  existingInvoiceId?: string;
  subscriptionId?: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  patientId: string;
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  planId: string;
  includesFollowups: boolean;
  includesConsultations: boolean;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Invoice {
  id: string;
  patientId: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled';
  type: 'consultation' | 'followup' | 'prescription' | 'product' | 'subscription';
  amount: number;
  items: InvoiceItem[];
  createdAt: Timestamp;
  dueDate?: Timestamp;
  paidAt?: Timestamp;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  type: 'consultation' | 'followup' | 'prescription' | 'product' | 'fee';
  metadata?: Record<string, any>;
}

export const invoiceValidationService = {
  /**
   * Check if an invoice should be created for a follow-up
   */
  async shouldCreateInvoice(
    patientId: string, 
    followUpPeriod: string,
    consultationType?: string
  ): Promise<InvoiceValidationResult> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Check if patient has active subscription
      const activeSubscription = await this.getActiveSubscription(patientId);
      
      if (activeSubscription && activeSubscription.includesFollowups) {
        return {
          shouldCreate: false,
          reason: 'Patient has active subscription that covers follow-ups',
          subscriptionId: activeSubscription.id,
          metadata: {
            subscriptionPlan: activeSubscription.planId,
            periodEnd: activeSubscription.currentPeriodEnd.toDate().toISOString()
          }
        };
      }

      // Check if patient has pending invoice for this type of follow-up
      const pendingInvoice = await this.getPendingFollowUpInvoice(patientId, followUpPeriod);
      
      if (pendingInvoice) {
        return {
          shouldCreate: false,
          reason: 'Patient already has pending invoice for this follow-up',
          existingInvoiceId: pendingInvoice.id,
          metadata: {
            existingAmount: pendingInvoice.amount,
            dueDate: pendingInvoice.dueDate?.toDate().toISOString()
          }
        };
      }

      // Check for recent paid invoices for the same follow-up period
      const recentPaidInvoice = await this.getRecentPaidFollowUpInvoice(patientId, followUpPeriod);
      
      if (recentPaidInvoice) {
        const daysSincePaid = Math.floor(
          (Date.now() - recentPaidInvoice.paidAt!.toMillis()) / (1000 * 60 * 60 * 24)
        );
        
        // Don't create another invoice for the same follow-up period within 30 days
        if (daysSincePaid < 30) {
          return {
            shouldCreate: false,
            reason: `Patient already paid for ${followUpPeriod} follow-up within the last 30 days`,
            existingInvoiceId: recentPaidInvoice.id,
            metadata: {
              paidDate: recentPaidInvoice.paidAt!.toDate().toISOString(),
              daysSincePaid
            }
          };
        }
      }

      return { 
        shouldCreate: true,
        metadata: {
          followUpPeriod,
          consultationType,
          validatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error validating invoice creation:', error);
      // Default to creating invoice if validation fails
      return { 
        shouldCreate: true,
        reason: 'Validation failed, defaulting to create invoice',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  },

  /**
   * Check if an invoice should be created for a consultation
   */
  async shouldCreateConsultationInvoice(
    patientId: string,
    consultationId: string,
    consultationType: string = 'general'
  ): Promise<InvoiceValidationResult> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Check if patient has active subscription that covers consultations
      const activeSubscription = await this.getActiveSubscription(patientId);
      
      if (activeSubscription && activeSubscription.includesConsultations) {
        return {
          shouldCreate: false,
          reason: 'Patient has active subscription that covers consultations',
          subscriptionId: activeSubscription.id,
          metadata: {
            subscriptionPlan: activeSubscription.planId,
            consultationType
          }
        };
      }

      // Check if there's already an invoice for this consultation
      const existingInvoice = await this.getConsultationInvoice(consultationId);
      
      if (existingInvoice) {
        return {
          shouldCreate: false,
          reason: 'Invoice already exists for this consultation',
          existingInvoiceId: existingInvoice.id,
          metadata: {
            existingStatus: existingInvoice.status,
            existingAmount: existingInvoice.amount
          }
        };
      }

      return { 
        shouldCreate: true,
        metadata: {
          consultationId,
          consultationType,
          validatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error validating consultation invoice creation:', error);
      return { 
        shouldCreate: true,
        reason: 'Validation failed, defaulting to create invoice',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  },

  /**
   * Check if an invoice should be created for a prescription
   */
  async shouldCreatePrescriptionInvoice(
    patientId: string,
    prescriptionId: string,
    medicationCost: number
  ): Promise<InvoiceValidationResult> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Check if there's already an invoice for this prescription
      const existingInvoice = await this.getPrescriptionInvoice(prescriptionId);
      
      if (existingInvoice) {
        return {
          shouldCreate: false,
          reason: 'Invoice already exists for this prescription',
          existingInvoiceId: existingInvoice.id,
          metadata: {
            existingStatus: existingInvoice.status,
            existingAmount: existingInvoice.amount
          }
        };
      }

      // Check if patient has insurance coverage that might affect billing
      const insuranceInfo = await this.getPatientInsurance(patientId);
      
      return { 
        shouldCreate: true,
        metadata: {
          prescriptionId,
          medicationCost,
          hasInsurance: !!insuranceInfo,
          insuranceProvider: insuranceInfo?.provider,
          validatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error validating prescription invoice creation:', error);
      return { 
        shouldCreate: true,
        reason: 'Validation failed, defaulting to create invoice',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  },

  /**
   * Get active subscription for a patient
   */
  async getActiveSubscription(patientId: string): Promise<Subscription | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return null;

      const subscriptionQuery = query(
        collection(db, 'subscriptions'),
        where('patientId', '==', patientId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const subscriptionSnapshot = await getDocs(subscriptionQuery);
      
      if (subscriptionSnapshot.empty) {
        return null;
      }

      const subscriptionData = subscriptionSnapshot.docs[0].data();
      
      // Check if subscription is still within the current period
      const now = new Date();
      const periodEnd = subscriptionData.currentPeriodEnd.toDate();
      
      if (now > periodEnd) {
        return null; // Subscription has expired
      }

      return {
        id: subscriptionSnapshot.docs[0].id,
        ...subscriptionData
      } as Subscription;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      return null;
    }
  },

  /**
   * Get pending follow-up invoice for a patient
   */
  async getPendingFollowUpInvoice(patientId: string, followUpPeriod: string): Promise<Invoice | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return null;

      const invoiceQuery = query(
        collection(db, 'invoices'),
        where('patientId', '==', patientId),
        where('status', '==', 'pending'),
        where('type', '==', 'followup'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const invoiceSnapshot = await getDocs(invoiceQuery);
      
      for (const doc of invoiceSnapshot.docs) {
        const invoice = { id: doc.id, ...doc.data() } as Invoice;
        
        // Check if any invoice item mentions this follow-up period
        const hasMatchingItem = invoice.items.some(item => 
          item.description.toLowerCase().includes(followUpPeriod.toLowerCase())
        );
        
        if (hasMatchingItem) {
          return invoice;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting pending follow-up invoice:', error);
      return null;
    }
  },

  /**
   * Get recent paid follow-up invoice for a patient
   */
  async getRecentPaidFollowUpInvoice(patientId: string, followUpPeriod: string): Promise<Invoice | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const invoiceQuery = query(
        collection(db, 'invoices'),
        where('patientId', '==', patientId),
        where('status', '==', 'paid'),
        where('type', '==', 'followup'),
        where('paidAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('paidAt', 'desc'),
        limit(5)
      );

      const invoiceSnapshot = await getDocs(invoiceQuery);
      
      for (const doc of invoiceSnapshot.docs) {
        const invoice = { id: doc.id, ...doc.data() } as Invoice;
        
        // Check if any invoice item mentions this follow-up period
        const hasMatchingItem = invoice.items.some(item => 
          item.description.toLowerCase().includes(followUpPeriod.toLowerCase())
        );
        
        if (hasMatchingItem) {
          return invoice;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting recent paid follow-up invoice:', error);
      return null;
    }
  },

  /**
   * Get invoice for a specific consultation
   */
  async getConsultationInvoice(consultationId: string): Promise<Invoice | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return null;

      const invoiceQuery = query(
        collection(db, 'invoices'),
        where('type', '==', 'consultation'),
        where('metadata.consultationId', '==', consultationId),
        limit(1)
      );

      const invoiceSnapshot = await getDocs(invoiceQuery);
      
      if (invoiceSnapshot.empty) {
        return null;
      }

      return {
        id: invoiceSnapshot.docs[0].id,
        ...invoiceSnapshot.docs[0].data()
      } as Invoice;
    } catch (error) {
      console.error('Error getting consultation invoice:', error);
      return null;
    }
  },

  /**
   * Get invoice for a specific prescription
   */
  async getPrescriptionInvoice(prescriptionId: string): Promise<Invoice | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return null;

      const invoiceQuery = query(
        collection(db, 'invoices'),
        where('type', '==', 'prescription'),
        where('metadata.prescriptionId', '==', prescriptionId),
        limit(1)
      );

      const invoiceSnapshot = await getDocs(invoiceQuery);
      
      if (invoiceSnapshot.empty) {
        return null;
      }

      return {
        id: invoiceSnapshot.docs[0].id,
        ...invoiceSnapshot.docs[0].data()
      } as Invoice;
    } catch (error) {
      console.error('Error getting prescription invoice:', error);
      return null;
    }
  },

  /**
   * Get patient insurance information
   */
  async getPatientInsurance(patientId: string): Promise<any | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return null;

      const patientDoc = await getDoc(doc(db, 'patients', patientId));
      
      if (!patientDoc.exists()) {
        return null;
      }

      const patientData = patientDoc.data();
      return patientData.insurance || null;
    } catch (error) {
      console.error('Error getting patient insurance:', error);
      return null;
    }
  },

  /**
   * Validate bulk invoice creation
   */
  async validateBulkInvoiceCreation(
    invoiceRequests: Array<{
      patientId: string;
      type: 'consultation' | 'followup' | 'prescription';
      referenceId: string;
      amount: number;
      metadata?: Record<string, any>;
    }>
  ): Promise<Array<InvoiceValidationResult & { requestIndex: number }>> {
    const results: Array<InvoiceValidationResult & { requestIndex: number }> = [];

    for (let i = 0; i < invoiceRequests.length; i++) {
      const request = invoiceRequests[i];
      let validationResult: InvoiceValidationResult;

      try {
        switch (request.type) {
          case 'consultation':
            validationResult = await this.shouldCreateConsultationInvoice(
              request.patientId,
              request.referenceId,
              request.metadata?.consultationType
            );
            break;
          case 'followup':
            validationResult = await this.shouldCreateInvoice(
              request.patientId,
              request.metadata?.followUpPeriod || '2w',
              request.metadata?.consultationType
            );
            break;
          case 'prescription':
            validationResult = await this.shouldCreatePrescriptionInvoice(
              request.patientId,
              request.referenceId,
              request.amount
            );
            break;
          default:
            validationResult = {
              shouldCreate: false,
              reason: `Unsupported invoice type: ${request.type}`
            };
        }
      } catch (error) {
        validationResult = {
          shouldCreate: false,
          reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }

      results.push({
        ...validationResult,
        requestIndex: i
      });
    }

    return results;
  },

  /**
   * Get invoice validation statistics
   */
  async getValidationStats(patientId?: string, timeRange?: { start: Date; end: Date }): Promise<{
    totalValidations: number;
    invoicesCreated: number;
    invoicesSkipped: number;
    skipReasons: Record<string, number>;
    subscriptionSavings: number;
  }> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // This would typically be stored in a separate validation_logs collection
      // For now, return mock statistics
      return {
        totalValidations: 0,
        invoicesCreated: 0,
        invoicesSkipped: 0,
        skipReasons: {},
        subscriptionSavings: 0
      };
    } catch (error) {
      console.error('Error getting validation stats:', error);
      throw error;
    }
  }
};

export default invoiceValidationService;
