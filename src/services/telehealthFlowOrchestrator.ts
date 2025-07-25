
'use server';

/**
 * @fileoverview Orchestrator for the entire telehealth flow, from initiation to completion.
 */

import { dbService } from '@/services/database/index';
import { notificationService } from './notificationService';
import { orderWorkflowOrchestrator } from './orderWorkflowOrchestrator';
import { intakeIntegrationService } from './intakeIntegrationService';
import { Timestamp } from 'firebase/firestore';

export const FLOW_STATUSES = {
  STARTED: 'started',
  PRODUCT_SELECTED: 'product_selected',
  INTAKE_COMPLETED: 'intake_completed',
  CONSULTATION_APPROVED: 'consultation_approved',
  CONSULTATION_REJECTED: 'consultation_rejected',
  ORDER_CREATED: 'order_created',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_COMPLETED: 'payment_completed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

class TelehealthFlowOrchestrator {
  private flowCollection = 'enhanced_telehealth_flows';

  /**
   * Initializes a new telehealth flow.
   */
  async initializeFlow({ patientId, categoryId, productId }: { patientId: string; categoryId: string; productId?: string; }) {
    try {
      const flowData = {
        patientId,
        categoryId,
        productId,
        current_status: FLOW_STATUSES.STARTED,
        status_history: [{ status: FLOW_STATUSES.STARTED, timestamp: new Date() }],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const result = await dbService.create(this.flowCollection, flowData as any);
      
      if (!result.success || !result.data?.id) {
          throw new Error(result.error || "Failed to create flow");
      }

      const flow = await dbService.getById(this.flowCollection, result.data.id);

      return { success: true, flow: flow.data };
    } catch (error: any) {
      console.error('Error initializing flow:', error);
      return { success: false, error };
    }
  }

  /**
   * Processes product selection within a flow.
   */
  async processProductSelection(flowId: string, productId: string, subscriptionDurationId: string) {
    try {
      const updateData = {
        productId,
        subscriptionDurationId,
        current_status: FLOW_STATUSES.PRODUCT_SELECTED,
        status_history: [...(await this.getFlowStatusHistory(flowId)), { status: FLOW_STATUSES.PRODUCT_SELECTED, timestamp: new Date() }],
      };
      await dbService.update(this.flowCollection, flowId, updateData);
      const updatedFlow = await dbService.getById(this.flowCollection, flowId);

      return { success: true, flow: updatedFlow.data };
    } catch (error: any) {
      console.error('Error processing product selection:', error);
      return { success: false, error };
    }
  }

  /**
   * Processes intake form submission.
   */
  async processIntakeForm(flowId: string, formData: any) {
    try {
      const intakeResult = await intakeIntegrationService.processIntakeCompletion(formData, flowId);
      if (!intakeResult.success) {
        throw new Error(intakeResult.error || 'Intake processing failed');
      }

      const updateData = {
        intake_form_data: intakeResult.processedData,
        current_status: FLOW_STATUSES.INTAKE_COMPLETED,
        status_history: [...(await this.getFlowStatusHistory(flowId)), { status: FLOW_STATUSES.INTAKE_COMPLETED, timestamp: new Date() }],
      };
      await dbService.update(this.flowCollection, flowId, updateData);
      const updatedFlow = await dbService.getById(this.flowCollection, flowId);
      
      return { success: true, flow: updatedFlow.data };
    } catch (error: any) {
      console.error('Error processing intake form:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Processes consultation approval or rejection.
   */
  async processConsultationApproval(flowId: string, approvalData: { approved: boolean, notes?: string, prescription_data?: any }) {
    try {
      const flowRes = await dbService.getById(this.flowCollection, flowId);
      if (!flowRes.success || !flowRes.data) throw new Error('Flow not found.');
      const flow = flowRes.data as any;

      if (approvalData.approved) {
        // Create order
        const orderResult = await orderWorkflowOrchestrator.createOrderFromFlow(flow, approvalData);
        if (!orderResult.success) {
          throw new Error('Failed to create order');
        }

        const updateData = {
          current_status: FLOW_STATUSES.CONSULTATION_APPROVED,
          consultation_data: approvalData,
          orderId: orderResult.orderId,
          status_history: [...(await this.getFlowStatusHistory(flowId)), { status: FLOW_STATUSES.CONSULTATION_APPROVED, timestamp: new Date() }],
        };
        await dbService.update(this.flowCollection, flowId, updateData);
        
        // This is a placeholder for a real notification service
        // await notificationService.sendNotification(flow.patientId, {
        //     type: 'consultation_approved' as any,
        //     title: 'Consultation Approved',
        //     message: 'Your consultation has been approved and your order is being processed.',
        //     data: { flowId, orderId: orderResult.orderId }
        // });

      } else {
        await dbService.update(this.flowCollection, flowId, {
          current_status: FLOW_STATUSES.CONSULTATION_REJECTED,
          consultation_data: approvalData,
          status_history: [...(await this.getFlowStatusHistory(flowId)), { status: FLOW_STATUSES.CONSULTATION_REJECTED, timestamp: new Date() }],
        });

        // This is a placeholder for a real notification service
        // await notificationService.sendNotification(flow.patientId, {
        //     type: 'consultation_rejected' as any,
        //     title: 'Consultation Update',
        //     message: 'There was an issue with your consultation. Please check your messages.',
        //     data: { flowId, reason: approvalData.notes }
        // });
      }

      const updatedFlow = await dbService.getById(this.flowCollection, flowId);
      return { success: true, flow: updatedFlow.data };
    } catch (error: any) {
      console.error('Error processing consultation approval:', error);
      return { success: false, error };
    }
  }

  private async getFlowStatusHistory(flowId: string) {
    const flowRes = await dbService.getById(this.flowCollection, flowId);
    return (flowRes.data as any)?.status_history || [];
  }
}

export const telehealthFlowOrchestrator = new TelehealthFlowOrchestrator();
