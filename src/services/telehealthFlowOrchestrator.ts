/**
 * @fileoverview Service for orchestrating the entire telehealth flow,
 * from category selection to order fulfillment.
 */
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, Timestamp, CollectionReference, DocumentReference } from 'firebase/firestore';
import { categoryProductOrchestrator } from './categoryProductOrchestrator';

// Types
export interface TelehealthFlow {
  id: string;
  patient_id: string;
  category_id: string;
  product_id?: string | null;
  subscription_duration_id?: string | null;
  current_status: string;
  started_at: Timestamp;
  last_activity_at: Timestamp;
  flow_metadata: {
    categoryName: string;
    [key: string]: any;
  };
  pricing_snapshot?: any;
  form_submission_id?: string;
  consultation_id?: string;
  order_id?: string;
  invoice_id?: string;
}

export interface FlowInitializationParams {
  patientId: string;
  categoryId: string;
  productId?: string;
}

export interface FlowResult {
  success: boolean;
  flow: TelehealthFlow | null;
  error: Error | null;
}

export interface ApprovalData {
  providerId: string;
  notes?: string;
  medicationName?: string;
  approved: boolean;
}

export interface FormSubmissionData {
  [key: string]: any;
}

export const FLOW_STATUSES = {
  STARTED: 'started',
  CATEGORY_SELECTED: 'category_selected',
  PRODUCT_SELECTED: 'product_selected',
  SUBSCRIPTION_CONFIGURED: 'subscription_configured',
  INTAKE_STARTED: 'intake_started',
  INTAKE_COMPLETED: 'intake_completed',
  CONSULTATION_PENDING: 'consultation_pending',
  CONSULTATION_APPROVED: 'consultation_approved',
  ORDER_CREATED: 'order_created',
  INVOICE_GENERATED: 'invoice_generated',
  PAYMENT_PENDING: 'payment_pending',
  SUBSCRIPTION_ACTIVE: 'subscription_active',
  ORDER_FULFILLED: 'order_fulfilled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type FlowStatus = typeof FLOW_STATUSES[keyof typeof FLOW_STATUSES];

class TelehealthFlowOrchestrator {
  private flowsCollection: CollectionReference | null = null;

  constructor() {
    const db = getFirebaseFirestore();
    if (db) {
      this.flowsCollection = collection(db, 'enhanced_telehealth_flows');
    }
  }

  /**
   * Initializes a new telehealth flow for a patient.
   */
  async initializeFlow({ patientId, categoryId, productId }: FlowInitializationParams): Promise<FlowResult> {
    try {
      if (!this.flowsCollection) {
        throw new Error('Firebase not initialized');
      }

      const flowData: Omit<TelehealthFlow, 'id'> = {
        patient_id: patientId,
        category_id: categoryId,
        product_id: productId || null,
        current_status: productId ? FLOW_STATUSES.PRODUCT_SELECTED : FLOW_STATUSES.CATEGORY_SELECTED,
        started_at: Timestamp.now(),
        last_activity_at: Timestamp.now(),
        flow_metadata: { categoryName: '' }, // Add more metadata as needed
      };

      const docRef = await addDoc(this.flowsCollection, flowData);
      const flow: TelehealthFlow = { id: docRef.id, ...flowData };
      
      await this.logStateTransition(docRef.id, null, flowData.current_status);

      return { success: true, flow, error: null };
    } catch (error) {
      console.error('Error initializing telehealth flow:', error);
      return { success: false, flow: null, error: error as Error };
    }
  }
  
  /**
   * Updates the flow when a product and subscription are selected.
   */
  async processProductSelection(
    flowId: string, 
    productId: string, 
    subscriptionDurationId?: string
  ): Promise<FlowResult> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const flowRef = doc(db, 'enhanced_telehealth_flows', flowId);
      const pricingSnapshot = await categoryProductOrchestrator.calculatePricing(productId, subscriptionDurationId);

      const updateData = {
        product_id: productId,
        subscription_duration_id: subscriptionDurationId || null,
        current_status: FLOW_STATUSES.SUBSCRIPTION_CONFIGURED,
        pricing_snapshot: pricingSnapshot,
        last_activity_at: Timestamp.now(),
      };
      
      await updateDoc(flowRef, updateData);
      
      const updatedFlowSnap = await getDoc(flowRef);
      if (!updatedFlowSnap.exists()) {
        throw new Error('Flow not found after update');
      }

      const updatedFlow: TelehealthFlow = { 
        id: updatedFlowSnap.id, 
        ...updatedFlowSnap.data() 
      } as TelehealthFlow;
      
      await this.logStateTransition(
        flowId, 
        FLOW_STATUSES.CATEGORY_SELECTED, 
        FLOW_STATUSES.SUBSCRIPTION_CONFIGURED, 
        { productId, subscriptionDurationId }
      );

      return { success: true, flow: updatedFlow, error: null };
    } catch (error) {
      console.error('Error processing product selection:', error);
      return { success: false, flow: null, error: error as Error };
    }
  }

  /**
   * Processes the intake form submission.
   * This step now creates a pending consultation for a provider to review.
   * Order and Invoice creation are deferred until provider approval.
   */
  async processIntakeForm(flowId: string, formData: FormSubmissionData): Promise<FlowResult> {
    const db = getFirebaseFirestore();
    if (!db) {
      return { success: false, flow: null, error: new Error('Firebase not initialized') };
    }

    const flowRef = doc(db, 'enhanced_telehealth_flows', flowId);
    let flowData: TelehealthFlow | null = null;
    
    try {
      const flowSnap = await getDoc(flowRef);
      if (!flowSnap.exists()) {
        throw new Error("Flow not found.");
      }

      flowData = { id: flowSnap.id, ...flowSnap.data() } as TelehealthFlow;
      const fromStatus = flowData.current_status;

      // 1. Save form submission
      const submissionRef = await addDoc(collection(db, 'form_submissions'), {
        flow_id: flowId,
        patient_id: flowData.patient_id,
        form_data: formData,
        submitted_at: Timestamp.now(),
      });

      await this.logStateTransition(
        flowId, 
        fromStatus, 
        FLOW_STATUSES.INTAKE_COMPLETED, 
        { submissionId: submissionRef.id }
      );

      // 2. Assign a provider (mock logic for now)
      const assignedProvider = { 
        id: 'mockProvider123', 
        email: 'provider@example.com' 
      }; // In real app, fetch this from a provider assignment service
      
      // 3. Create a PENDING consultation record
      const consultationRef = await addDoc(collection(db, 'consultations'), {
        patient_id: flowData.patient_id,
        provider_id: assignedProvider.id,
        status: 'pending_review',
        form_submission_id: submissionRef.id,
        flow_id: flowId,
        created_at: Timestamp.now(),
      });

      await this.logStateTransition(
        flowId, 
        FLOW_STATUSES.INTAKE_COMPLETED, 
        FLOW_STATUSES.CONSULTATION_PENDING, 
        { consultationId: consultationRef.id }
      );

      // 4. Update the main flow document
      const finalUpdateData = {
        current_status: FLOW_STATUSES.CONSULTATION_PENDING,
        form_submission_id: submissionRef.id,
        consultation_id: consultationRef.id,
        last_activity_at: Timestamp.now(),
      };

      await updateDoc(flowRef, finalUpdateData);
      
      const finalFlowSnap = await getDoc(flowRef);
      if (!finalFlowSnap.exists()) {
        throw new Error('Flow not found after final update');
      }

      const finalFlow: TelehealthFlow = { 
        id: finalFlowSnap.id, 
        ...finalFlowSnap.data() 
      } as TelehealthFlow;

      return { success: true, flow: finalFlow, error: null };
    } catch (error) {
      console.error('Error processing intake form:', error);
      return { success: false, flow: flowData, error: error as Error };
    }
  }

  /**
   * Processes a provider's approval of a consultation.
   * This is a new step that creates the order and invoice AFTER provider approval.
   */
  async processConsultationApproval(flowId: string, approvalData: ApprovalData): Promise<FlowResult> {
    const db = getFirebaseFirestore();
    if (!db) {
      return { success: false, flow: null, error: new Error('Firebase not initialized') };
    }

    const flowRef = doc(db, 'enhanced_telehealth_flows', flowId);
    let flowData: TelehealthFlow | null = null;
    
    try {
      const flowSnap = await getDoc(flowRef);
      if (!flowSnap.exists()) {
        throw new Error("Flow not found.");
      }

      flowData = { id: flowSnap.id, ...flowSnap.data() } as TelehealthFlow;

      if (!flowData.consultation_id) {
        throw new Error("No consultation ID found in flow");
      }

      // 1. Update consultation status to 'approved'
      const consultationRef = doc(db, 'consultations', flowData.consultation_id);
      await updateDoc(consultationRef, { 
        status: 'approved', 
        provider_id: approvalData.providerId,
        provider_notes: approvalData.notes || ''
      });

      await this.logStateTransition(
        flowId, 
        FLOW_STATUSES.CONSULTATION_PENDING, 
        FLOW_STATUSES.CONSULTATION_APPROVED, 
        { providerId: approvalData.providerId }
      );

      // 2. Create the Order
      const orderRef = await addDoc(collection(db, 'orders'), {
        patientId: flowData.patient_id,
        status: 'pending_payment',
        medication: approvalData.medicationName || '',
        orderDate: Timestamp.now(),
        flow_id: flowId,
        consultation_id: flowData.consultation_id,
      });

      await this.logStateTransition(
        flowId, 
        FLOW_STATUSES.CONSULTATION_APPROVED, 
        FLOW_STATUSES.ORDER_CREATED, 
        { orderId: orderRef.id }
      );

      // 3. Create the Invoice
      const invoiceRef = await addDoc(collection(db, 'invoices'), {
        patientId: flowData.patient_id,
        orderId: orderRef.id,
        amount: flowData.pricing_snapshot?.final_price || 0,
        status: 'pending_payment',
        dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Due in 7 days
        createdAt: Timestamp.now(),
      });

      await this.logStateTransition(
        flowId, 
        FLOW_STATUSES.ORDER_CREATED, 
        FLOW_STATUSES.INVOICE_GENERATED, 
        { invoiceId: invoiceRef.id }
      );

      // 4. Update the main flow status to 'payment_pending'
      const finalUpdateData = {
        current_status: FLOW_STATUSES.PAYMENT_PENDING,
        order_id: orderRef.id,
        invoice_id: invoiceRef.id,
        last_activity_at: Timestamp.now(),
      };

      await updateDoc(flowRef, finalUpdateData);

      const finalFlowSnap = await getDoc(flowRef);
      if (!finalFlowSnap.exists()) {
        throw new Error('Flow not found after final update');
      }

      const finalFlow: TelehealthFlow = { 
        id: finalFlowSnap.id, 
        ...finalFlowSnap.data() 
      } as TelehealthFlow;

      return { success: true, flow: finalFlow, error: null };
    } catch (error) {
      console.error('Error processing consultation approval:', error);
      return { success: false, flow: flowData, error: error as Error };
    }
  }

  /**
   * Logs a state transition for a given flow.
   */
  private async logStateTransition(
    flowId: string, 
    fromStatus: string | null, 
    toStatus: string, 
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        console.warn('Firebase not initialized, skipping state transition log');
        return;
      }

      const transitionsCollection = collection(db, 'flow_state_transitions');
      await addDoc(transitionsCollection, {
        flow_id: flowId,
        from_status: fromStatus,
        to_status: toStatus,
        transition_data: data,
        created_at: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error logging state transition for flow ${flowId}:`, error);
      // Don't rethrow, as logging is non-critical to the main flow
    }
  }
}

export const telehealthFlowOrchestrator = new TelehealthFlowOrchestrator();
