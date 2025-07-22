/**
 * Consultation Invoice Service
 * 
 * Handles automated invoice generation after consultation approval.
 * Integrates with subscription plans and provider workflows.
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
  Timestamp 
} from 'firebase/firestore';
import { invoiceValidationService } from './invoiceValidationService';

// Consultation and invoice interfaces
export interface Consultation {
  id: string;
  patientId: string;
  providerId: string;
  orderId?: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  type: 'initial' | 'followup' | 'urgent' | 'routine';
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  prescriptions?: Prescription[];
  approvedBy?: string;
  approvedAt?: Timestamp;
  approvalNotes?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  cost?: number;
}

export interface Order {
  id: string;
  patientId: string;
  status: 'pending' | 'processing' | 'completed' | 'canceled';
  items: OrderItem[];
  totalAmount: number;
  createdAt: Timestamp;
  metadata?: Record<string, any>;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  type: 'product' | 'service' | 'consultation' | 'prescription';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingInterval: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  includesConsultations: boolean;
  includesFollowups: boolean;
  consultationLimit?: number;
  followupLimit?: number;
}

export interface InvoiceGenerationResult {
  success: boolean;
  message: string;
  data?: {
    consultation: Consultation;
    invoice?: any;
    subscriptionPlan?: SubscriptionPlan;
  };
  error?: any;
}

export const consultationInvoiceService = {
  /**
   * Get subscription plan for a product
   */
  async getSubscriptionPlanForProduct(productId: string): Promise<SubscriptionPlan | null> {
    try {
      if (!productId) return null;

      const db = getFirebaseFirestore();
      if (!db) return null;

      // Query the product_subscription_plans collection to find the subscription plan for this product
      const planQuery = query(
        collection(db, 'product_subscription_plans'),
        where('productId', '==', productId),
        limit(1)
      );

      const planSnapshot = await getDocs(planQuery);

      if (planSnapshot.empty) {
        return null; // No subscription plan found
      }

      const planData = planSnapshot.docs[0].data();
      
      if (!planData.subscriptionPlanId) {
        return null;
      }

      // Get the subscription plan details
      const subscriptionPlanDoc = await getDoc(doc(db, 'subscription_plans', planData.subscriptionPlanId));
      
      if (!subscriptionPlanDoc.exists()) {
        return null;
      }

      return {
        id: subscriptionPlanDoc.id,
        ...subscriptionPlanDoc.data()
      } as SubscriptionPlan;
    } catch (error) {
      console.error('Error in getSubscriptionPlanForProduct:', error);
      return null;
    }
  },

  /**
   * Generate invoice after consultation approval
   */
  async generateInvoiceAfterApproval({
    consultationId,
    approverId,
    approvalNotes = {},
  }: {
    consultationId: string;
    approverId: string;
    approvalNotes?: Record<string, any>;
  }): Promise<InvoiceGenerationResult> {
    try {
      if (!consultationId) {
        throw new Error('Consultation ID is required');
      }

      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Get the consultation
      const consultationDoc = await getDoc(doc(db, 'consultations', consultationId));

      if (!consultationDoc.exists()) {
        throw new Error('Consultation not found');
      }

      const consultation = {
        id: consultationDoc.id,
        ...consultationDoc.data()
      } as Consultation;

      // Update consultation status to approved
      await updateDoc(doc(db, 'consultations', consultationId), {
        status: 'approved',
        approvedBy: approverId,
        approvedAt: Timestamp.now(),
        approvalNotes: approvalNotes,
        updatedAt: Timestamp.now(),
      });

      // Get the order if it exists
      let order: Order | null = null;
      if (consultation.orderId) {
        const orderDoc = await getDoc(doc(db, 'orders', consultation.orderId));
        if (orderDoc.exists()) {
          order = {
            id: orderDoc.id,
            ...orderDoc.data()
          } as Order;
        }
      }

      // Get the subscription plan for the product (if applicable)
      let subscriptionPlan: SubscriptionPlan | null = null;
      if (order && order.items.length > 0) {
        const firstProduct = order.items[0];
        if (firstProduct.productId) {
          subscriptionPlan = await this.getSubscriptionPlanForProduct(firstProduct.productId);
        }
      }

      // Check if we should create an invoice
      const validationResult = await invoiceValidationService.shouldCreateConsultationInvoice(
        consultation.patientId,
        consultationId,
        consultation.type
      );

      if (!validationResult.shouldCreate) {
        return {
          success: true,
          message: `Consultation approved but no invoice created: ${validationResult.reason}`,
          data: {
            consultation: {
              ...consultation,
              status: 'approved',
              approvedBy: approverId,
              approvedAt: Timestamp.now(),
              approvalNotes,
              updatedAt: Timestamp.now(),
            },
            subscriptionPlan: subscriptionPlan || undefined,
          },
        };
      }

      // Generate the invoice
      const invoiceResult = await this.generateInvoiceFromConsultation({
        consultation,
        order,
        subscriptionPlan,
        taxRate: 0, // No tax for prescriptions
        discountPercentage: 0, // No discount by default
      });

      if (!invoiceResult.success) {
        throw new Error(invoiceResult.error || 'Failed to generate invoice');
      }

      return {
        success: true,
        message: 'Consultation approved and invoice generated',
        data: {
          consultation: {
            ...consultation,
            status: 'approved',
            approvedBy: approverId,
            approvedAt: Timestamp.now(),
            approvalNotes,
            updatedAt: Timestamp.now(),
          },
          invoice: invoiceResult.data,
          subscriptionPlan: subscriptionPlan || undefined,
        },
      };
    } catch (error) {
      console.error('Error in generateInvoiceAfterApproval:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate invoice after approval',
        error,
      };
    }
  },

  /**
   * Generate invoice from consultation data
   */
  async generateInvoiceFromConsultation({
    consultation,
    order,
    subscriptionPlan,
    taxRate = 0,
    discountPercentage = 0,
  }: {
    consultation: Consultation;
    order?: Order | null;
    subscriptionPlan?: SubscriptionPlan | null;
    taxRate?: number;
    discountPercentage?: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Calculate invoice items
      const invoiceItems: any[] = [];
      let subtotal = 0;

      // Add consultation fee
      const consultationFee = this.getConsultationFee(consultation.type, subscriptionPlan);
      if (consultationFee > 0) {
        invoiceItems.push({
          id: `consultation_${consultation.id}`,
          description: `${consultation.type} consultation`,
          amount: consultationFee,
          quantity: 1,
          type: 'consultation',
          metadata: {
            consultationId: consultation.id,
            consultationType: consultation.type,
          },
        });
        subtotal += consultationFee;
      }

      // Add prescription costs
      if (consultation.prescriptions && consultation.prescriptions.length > 0) {
        for (const prescription of consultation.prescriptions) {
          if (prescription.cost && prescription.cost > 0) {
            invoiceItems.push({
              id: `prescription_${prescription.id}`,
              description: `${prescription.medicationName} - ${prescription.dosage}`,
              amount: prescription.cost,
              quantity: 1,
              type: 'prescription',
              metadata: {
                prescriptionId: prescription.id,
                medicationName: prescription.medicationName,
              },
            });
            subtotal += prescription.cost;
          }
        }
      }

      // Add order items if applicable
      if (order && order.items.length > 0) {
        for (const item of order.items) {
          invoiceItems.push({
            id: `order_item_${item.id}`,
            description: item.productName,
            amount: item.price,
            quantity: item.quantity,
            type: 'product',
            metadata: {
              orderId: order.id,
              productId: item.productId,
            },
          });
          subtotal += item.price * item.quantity;
        }
      }

      // Calculate totals
      const discountAmount = (subtotal * discountPercentage) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const totalAmount = taxableAmount + taxAmount;

      // Create invoice
      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      const invoice = {
        id: invoiceId,
        patientId: consultation.patientId,
        consultationId: consultation.id,
        status: 'pending',
        type: 'consultation',
        items: invoiceItems,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        currency: 'USD',
        dueDate: Timestamp.fromDate(dueDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          consultationType: consultation.type,
          providerId: consultation.providerId,
          orderId: order?.id,
          subscriptionPlanId: subscriptionPlan?.id,
          taxRate,
          discountPercentage,
        },
      };

      // Save invoice to database
      await setDoc(doc(db, 'invoices', invoiceId), invoice);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      console.error('Error generating invoice from consultation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Process consultation approval
   */
  async processConsultationApproval({
    consultationId,
    approverId,
    approvalData = {},
  }: {
    consultationId: string;
    approverId: string;
    approvalData?: Record<string, any>;
  }): Promise<InvoiceGenerationResult> {
    try {
      // Generate invoice after approval
      const result = await this.generateInvoiceAfterApproval({
        consultationId,
        approverId,
        approvalNotes: approvalData.notes,
      });

      if (!result.success) {
        throw new Error(
          result.message || 'Failed to process consultation approval'
        );
      }

      // Send notification to patient about the approval and invoice
      // This would be implemented in a notification service
      if (result.data?.invoice) {
        await this.sendInvoiceNotification(result.data.consultation.patientId, result.data.invoice);
      }

      return {
        success: true,
        message: 'Consultation approved and invoice generated',
        data: result.data,
      };
    } catch (error) {
      console.error('Error in processConsultationApproval:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process consultation approval',
        error,
      };
    }
  },

  /**
   * Get consultation fee based on type and subscription
   */
  getConsultationFee(consultationType: string, subscriptionPlan?: SubscriptionPlan | null): number {
    // If patient has subscription that covers consultations, no fee
    if (subscriptionPlan && subscriptionPlan.includesConsultations) {
      return 0;
    }

    // Default consultation fees
    const consultationFees: Record<string, number> = {
      initial: 150,
      followup: 75,
      urgent: 200,
      routine: 100,
    };

    return consultationFees[consultationType] || consultationFees.routine;
  },

  /**
   * Send invoice notification to patient
   */
  async sendInvoiceNotification(patientId: string, invoice: any): Promise<void> {
    try {
      // This would integrate with the notification service
      console.log('Sending invoice notification to patient:', patientId, 'for invoice:', invoice.id);
      
      // TODO: Implement actual notification sending
      // await notificationService.sendInvoiceNotification(patientId, invoice);
    } catch (error) {
      console.error('Error sending invoice notification:', error);
      // Don't throw here as this is not critical to the main flow
    }
  },

  /**
   * Get consultation invoices for a patient
   */
  async getPatientConsultationInvoices(
    patientId: string,
    status?: string,
    limitCount: number = 20
  ): Promise<any[]> {
    try {
      const db = getFirebaseFirestore();
      if (!db) return [];

      let invoiceQuery = query(
        collection(db, 'invoices'),
        where('patientId', '==', patientId),
        where('type', '==', 'consultation'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status) {
        invoiceQuery = query(
          collection(db, 'invoices'),
          where('patientId', '==', patientId),
          where('type', '==', 'consultation'),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const invoiceSnapshot = await getDocs(invoiceQuery);
      return invoiceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting patient consultation invoices:', error);
      return [];
    }
  },

  /**
   * Get consultation invoice statistics
   */
  async getConsultationInvoiceStats(timeRange?: { start: Date; end: Date }): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    averageInvoiceAmount: number;
    invoicesByStatus: Record<string, number>;
    invoicesByType: Record<string, number>;
  }> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Database not initialized');
      }

      let invoiceQuery = query(
        collection(db, 'invoices'),
        where('type', '==', 'consultation'),
        orderBy('createdAt', 'desc')
      );

      if (timeRange) {
        invoiceQuery = query(
          collection(db, 'invoices'),
          where('type', '==', 'consultation'),
          where('createdAt', '>=', Timestamp.fromDate(timeRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(timeRange.end)),
          orderBy('createdAt', 'desc')
        );
      }

      const invoiceSnapshot = await getDocs(invoiceQuery);
      const invoices = invoiceSnapshot.docs.map(doc => doc.data());

      const stats = {
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        averageInvoiceAmount: 0,
        invoicesByStatus: {} as Record<string, number>,
        invoicesByType: {} as Record<string, number>,
      };

      stats.averageInvoiceAmount = stats.totalInvoices > 0 ? stats.totalRevenue / stats.totalInvoices : 0;

      // Count by status and consultation type
      invoices.forEach(invoice => {
        const status = invoice.status || 'unknown';
        const consultationType = invoice.metadata?.consultationType || 'unknown';

        stats.invoicesByStatus[status] = (stats.invoicesByStatus[status] || 0) + 1;
        stats.invoicesByType[consultationType] = (stats.invoicesByType[consultationType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting consultation invoice stats:', error);
      throw error;
    }
  },
};

export default consultationInvoiceService;
