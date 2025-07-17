/**
 * @fileoverview Service for orchestrating the entire telehealth flow,
 * from category selection to order fulfillment.
 */
import { db } from '@/lib/firebase/client';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
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
        started_at: new Date(),
        last_activity_at: new Date(),
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
        last_activity_at: new Date(),
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
      created_at: new Date(),
    });
  }

  // Future methods to be added:
  // async processIntakeForm(flowId, formData) {}
  // async processConsultationApproval(flowId, approvalData) {}
  // async getFlowStatus(flowId) {}
}

export const telehealthFlowOrchestrator = new TelehealthFlowOrchestrator();
