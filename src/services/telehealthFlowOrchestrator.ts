
/**
 * @fileoverview Service for orchestrating the entire telehealth flow,
 * from category selection to order fulfillment.
 */
import { dbService } from './database';
import { categoryProductOrchestrator } from './categoryProductOrchestrator';

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
};

interface FlowData {
  id?: string;
  patient_id: string;
  category_id: string;
  product_id: string | null;
  current_status: string;
  started_at: Date;
  last_activity_at: Date;
  flow_metadata: { categoryName: string };
  [key: string]: any;
}

class TelehealthFlowOrchestrator {
  private collectionName = 'enhanced_telehealth_flows';

  async initializeFlow({ patientId, categoryId, productId }: { patientId: string; categoryId: string; productId?: string }) {
    try {
      const flowData: Omit<FlowData, 'id'> = {
        patient_id: patientId,
        category_id: categoryId,
        product_id: productId || null,
        current_status: productId ? FLOW_STATUSES.PRODUCT_SELECTED : FLOW_STATUSES.CATEGORY_SELECTED,
        started_at: new Date(),
        last_activity_at: new Date(),
        flow_metadata: { categoryName: '' },
      };
      
      const response = await dbService.create(this.collectionName, flowData);
      if (response.error || !response.data) throw new Error(response.error || 'Failed to create flow');
      
      const flow = response.data;
      await this.logStateTransition(flow.id, null, flow.current_status);

      const createdFlow = await dbService.getById<FlowData>(this.collectionName, flow.id);
      if (createdFlow.error || !createdFlow.data) throw new Error(createdFlow.error || 'Failed to fetch created flow');
      
      return { success: true, flow: createdFlow.data, error: null };
    } catch (error: any) {
      console.error('Error initializing telehealth flow:', error);
      return { success: false, flow: null, error };
    }
  }
  
  async processProductSelection(flowId: string, productId: string, subscriptionDurationId?: string) {
    try {
      const pricingSnapshot = await categoryProductOrchestrator.calculatePricing(productId, subscriptionDurationId);

      const updateData = {
        product_id: productId,
        subscription_duration_id: subscriptionDurationId || null,
        current_status: FLOW_STATUSES.SUBSCRIPTION_CONFIGURED,
        pricing_snapshot: pricingSnapshot,
        last_activity_at: new Date(),
      };
      
      await dbService.update(this.collectionName, flowId, updateData);
      
      const updatedFlowRes = await dbService.getById<FlowData>(this.collectionName, flowId);
      if (updatedFlowRes.error || !updatedFlowRes.data) throw new Error(updatedFlowRes.error || 'Failed to fetch updated flow');

      await this.logStateTransition(flowId, FLOW_STATUSES.CATEGORY_SELECTED, FLOW_STATUSES.SUBSCRIPTION_CONFIGURED, { productId, subscriptionDurationId });

      return { success: true, flow: updatedFlowRes.data, error: null };
    } catch (error: any) {
        console.error('Error processing product selection:', error);
        return { success: false, flow: null, error };
    }
  }

  async processIntakeForm(flowId: string, formData: any) {
    let flowData: FlowData | null = null;
    
    try {
        const flowRes = await dbService.getById<FlowData>(this.collectionName, flowId);
        if (flowRes.error || !flowRes.data) throw new Error(flowRes.error || "Flow not found.");
        flowData = flowRes.data;
        const fromStatus = flowData.current_status;

        const submissionRes = await dbService.create('form_submissions', {
            flow_id: flowId,
            patient_id: flowData.patient_id,
            form_data: formData,
        });
        if (submissionRes.error || !submissionRes.data) throw new Error(submissionRes.error || 'Failed to create form submission');
        await this.logStateTransition(flowId, fromStatus, FLOW_STATUSES.INTAKE_COMPLETED, { submissionId: submissionRes.data.id });

        const assignedProvider = { id: 'mockProvider123', email: 'provider@example.com' };
        
        const consultationRes = await dbService.create('consultations', {
            patient_id: flowData.patient_id,
            provider_id: assignedProvider.id,
            status: 'pending_review',
            form_submission_id: submissionRes.data.id,
            flow_id: flowId,
        });
        if (consultationRes.error || !consultationRes.data) throw new Error(consultationRes.error || 'Failed to create consultation');
        await this.logStateTransition(flowId, FLOW_STATUSES.INTAKE_COMPLETED, FLOW_STATUSES.CONSULTATION_PENDING, { consultationId: consultationRes.data.id });

        const finalUpdateData = {
            current_status: FLOW_STATUSES.CONSULTATION_PENDING,
            form_submission_id: submissionRes.data.id,
            consultation_id: consultationRes.data.id,
            last_activity_at: new Date(),
        };
        await dbService.update(this.collectionName, flowId, finalUpdateData);
        
        const finalFlowRes = await dbService.getById<FlowData>(this.collectionName, flowId);
        if (finalFlowRes.error || !finalFlowRes.data) throw new Error(finalFlowRes.error || 'Failed to fetch final flow');

        return { success: true, flow: finalFlowRes.data, error: null };
    } catch (error: any) {
        console.error('Error processing intake form:', error);
        return { success: false, flow: flowData, error };
    }
  }

  async processConsultationApproval(flowId: string, approvalData: { providerId: string; notes: string; medicationName: string; }) {
    let flowData: FlowData | null = null;
    
    try {
      const flowRes = await dbService.getById<FlowData>(this.collectionName, flowId);
      if (flowRes.error || !flowRes.data) throw new Error(flowRes.error || "Flow not found.");
      flowData = flowRes.data;

      await dbService.update('consultations', flowData.consultation_id, { 
        status: 'approved', 
        provider_id: approvalData.providerId,
        provider_notes: approvalData.notes 
      });
      await this.logStateTransition(flowId, FLOW_STATUSES.CONSULTATION_PENDING, FLOW_STATUSES.CONSULTATION_APPROVED, { providerId: approvalData.providerId });

      const orderRes = await dbService.create('orders', {
        patientId: flowData.patient_id,
        status: 'pending_payment',
        medication: approvalData.medicationName,
        flow_id: flowId,
        consultation_id: flowData.consultation_id,
      });
      if (orderRes.error || !orderRes.data) throw new Error(orderRes.error || 'Failed to create order');
      await this.logStateTransition(flowId, FLOW_STATUSES.CONSULTATION_APPROVED, FLOW_STATUSES.ORDER_CREATED, { orderId: orderRes.data.id });

      const invoiceRes = await dbService.create('invoices', {
          patientId: flowData.patient_id,
          orderId: orderRes.data.id,
          amount: flowData.pricing_snapshot?.final_price || 0,
          status: 'pending_payment',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      });
      if (invoiceRes.error || !invoiceRes.data) throw new Error(invoiceRes.error || 'Failed to create invoice');
      await this.logStateTransition(flowId, FLOW_STATUSES.ORDER_CREATED, FLOW_STATUSES.INVOICE_GENERATED, { invoiceId: invoiceRes.data.id });

      const finalUpdateData = {
        current_status: FLOW_STATUSES.PAYMENT_PENDING,
        order_id: orderRes.data.id,
        invoice_id: invoiceRes.data.id,
        last_activity_at: new Date(),
      };
      await dbService.update(this.collectionName, flowId, finalUpdateData);

      const finalFlowRes = await dbService.getById<FlowData>(this.collectionName, flowId);
      if (finalFlowRes.error || !finalFlowRes.data) throw new Error(finalFlowRes.error || 'Failed to fetch final flow');

      return { success: true, flow: finalFlowRes.data, error: null };
    } catch(error: any) {
      console.error('Error processing consultation approval:', error);
      return { success: false, flow: flowData, error };
    }
  }

  async logStateTransition(flowId: string, fromStatus: string | null, toStatus: string, data: object = {}) {
    try {
      await dbService.create('flow_state_transitions', {
        flow_id: flowId,
        from_status: fromStatus,
        to_status: toStatus,
        transition_data: data,
      });
    } catch (error) {
      console.error(`Error logging state transition for flow ${flowId}:`, error);
    }
  }
}

export const telehealthFlowOrchestrator = new TelehealthFlowOrchestrator();
