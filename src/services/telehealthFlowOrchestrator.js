/**
 * @fileoverview Service for orchestrating the entire telehealth flow,
 * from category selection to order fulfillment.
 */
import { db } from '@/lib/firebase/client';
import { collection, addDoc, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { categoryProductOrchestrator } from './categoryProductOrchestrator';

export const FLOW_STATUSES = {
  STARTED: 'started',
  CATEGORY_SELECTED: 'category_selected',
  PRODUCT_SELECTED: 'product_selected',
  SUBSCRIPTION_CONFIGURED: 'subscription_configured',
  INTAKE_STARTED: 'intake_started',
  INTAKE_COMPLETED: 'intake_completed',
  ORDER_CREATED: 'order_created',
  CONSULTATION_PENDING: 'consultation_pending',
  CONSULTATION_APPROVED: 'consultation_approved',
  INVOICE_GENERATED: 'invoice_generated',
  SUBSCRIPTION_ACTIVE: 'subscription_active',
  ORDER_FULFILLED: 'order_fulfilled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

class TelehealthFlowOrchestrator {
  constructor() {
    this.flowsCollection = collection(db, 'enhanced_telehealth_flows');
  }

  /**
   * Initializes a new telehealth flow for a patient.
   * @param {object} params - The initial parameters for the flow.
   * @param {string} params.patientId - The ID of the patient.
   * @param {string} params.categoryId - The ID of the selected category.
   * @returns {Promise<{success: boolean, flow: object, error: Error|null}>}
   */
  async initializeFlow({ patientId, categoryId }) {
    try {
      const flowData = {
        patient_id: patientId,
        category_id: categoryId,
        current_status: FLOW_STATUSES.CATEGORY_SELECTED,
        started_at: Timestamp.now(),
        last_activity_at: Timestamp.now(),
        flow_metadata: { categoryName: '' }, // Add more metadata as needed
      };
      const docRef = await addDoc(this.flowsCollection, flowData);
      const flow = { id: docRef.id, ...flowData };
      
      // Log state transition
      await this.logStateTransition(docRef.id, null, FLOW_STATUSES.CATEGORY_SELECTED);

      return { success: true, flow, error: null };
    } catch (error) {
      console.error('Error initializing telehealth flow:', error);
      return { success: false, flow: null, error };
    }
  }
  
  /**
   * Updates the flow when a product and subscription are selected.
   * @param {string} flowId - The ID of the telehealth flow.
   * @param {string} productId - The ID of the selected product.
   * @param {string} [subscriptionDurationId] - The optional ID of the subscription duration.
   * @returns {Promise<{success: boolean, flow: object, error: Error|null}>}
   */
  async processProductSelection(flowId, productId, subscriptionDurationId) {
    try {
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
      const updatedFlow = { id: updatedFlowSnap.id, ...updatedFlowSnap.data() };
      
      await this.logStateTransition(flowId, FLOW_STATUSES.CATEGORY_SELECTED, FLOW_STATUSES.SUBSCRIPTION_CONFIGURED, { productId, subscriptionDurationId });

      return { success: true, flow: updatedFlow, error: null };
    } catch (error) {
        console.error('Error processing product selection:', error);
        return { success: false, flow: null, error };
    }
  }

  /**
   * Processes the intake form, creates related records, and updates the flow.
   * @param {string} flowId - The ID of the telehealth flow.
   * @param {object} formData - The submitted form data.
   * @returns {Promise<{success: boolean, flow: object, order: object, consultation: object, error: Error|null}>}
   */
  async processIntakeForm(flowId, formData) {
    const flowRef = doc(db, 'enhanced_telehealth_flows', flowId);
    let flowData;

    try {
      // Step 1: Get current flow data
      const flowSnap = await getDoc(flowRef);
      if (!flowSnap.exists()) throw new Error("Flow not found.");
      flowData = { id: flowSnap.id, ...flowSnap.data() };

      // Step 2: Save the form submission
      const submissionRef = await addDoc(collection(db, 'form_submissions'), {
        flow_id: flowId,
        patient_id: flowData.patient_id,
        form_data: formData,
        submitted_at: Timestamp.now(),
      });
      
      await this.logStateTransition(flowId, flowData.current_status, FLOW_STATUSES.INTAKE_COMPLETED, { submissionId: submissionRef.id });

      // Step 3: Create Consultation
      const consultationRef = await addDoc(collection(db, 'consultations'), {
          patient_id: flowData.patient_id,
          provider_id: null, // To be assigned by a provider later
          status: 'pending_review',
          form_submission_id: submissionRef.id,
          created_at: Timestamp.now(),
      });

      await this.logStateTransition(flowId, FLOW_STATUSES.INTAKE_COMPLETED, FLOW_STATUSES.CONSULTATION_PENDING, { consultationId: consultationRef.id });

      // Step 4: Create Order
      const orderRef = await addDoc(collection(db, 'orders'), {
        patient_id: flowData.patient_id,
        status: 'pending_consultation',
        items: [{ productId: flowData.product_id, quantity: 1, price: flowData.pricing_snapshot.final_price }],
        total: flowData.pricing_snapshot.final_price,
        created_at: Timestamp.now(),
        consultation_id: consultationRef.id,
      });

      await this.logStateTransition(flowId, FLOW_STATUSES.CONSULTATION_PENDING, FLOW_STATUSES.ORDER_CREATED, { orderId: orderRef.id });

      // Step 5: Create Invoice
      const invoiceRef = await addDoc(collection(db, 'invoices'), {
          patient_id: flowData.patient_id,
          order_id: orderRef.id,
          amount: flowData.pricing_snapshot.final_price,
          status: 'pending',
          due_date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Due in 7 days
          created_at: Timestamp.now(),
      });

      await this.logStateTransition(flowId, FLOW_STATUSES.ORDER_CREATED, FLOW_STATUSES.INVOICE_GENERATED, { invoiceId: invoiceRef.id });

      // Step 6: Update the main flow document with all new references
      const finalUpdateData = {
        current_status: FLOW_STATUSES.CONSULTATION_PENDING,
        form_submission_id: submissionRef.id,
        consultation_id: consultationRef.id,
        order_id: orderRef.id,
        invoice_id: invoiceRef.id,
        last_activity_at: Timestamp.now(),
      };
      await updateDoc(flowRef, finalUpdateData);
      
      const finalFlowSnap = await getDoc(flowRef);
      const finalFlow = { id: finalFlowSnap.id, ...finalFlowSnap.data() };
      
      return { 
        success: true, 
        flow: finalFlow, 
        order: {id: orderRef.id}, 
        consultation: {id: consultationRef.id}, 
        error: null 
      };

    } catch (error) {
      console.error('Error processing intake form:', error);
      // Optional: Add rollback logic here if needed
      return { success: false, flow: flowData, error };
    }
  }


  /**
   * Logs a state transition for a given flow.
   * @param {string} flowId - The ID of the flow.
   * @param {string|null} fromStatus - The previous status.
   * @param {string} toStatus - The new status.
   * @param {object} [data={}] - Additional data about the transition.
   */
  async logStateTransition(flowId, fromStatus, toStatus, data = {}) {
    const transitionsCollection = collection(db, 'flow_state_transitions');
    await addDoc(transitionsCollection, {
      flow_id: flowId,
      from_status: fromStatus,
      to_status: toStatus,
      transition_data: data,
      created_at: Timestamp.now(),
    });
  }

  // Future methods to be added:
  // async processConsultationApproval(flowId, approvalData) {}
  // async getFlowStatus(flowId) {}
}

export const telehealthFlowOrchestrator = new TelehealthFlowOrchestrator();
