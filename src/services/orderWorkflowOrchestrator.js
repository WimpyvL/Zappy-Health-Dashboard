/**
 * @fileoverview Service for orchestrating real-time order workflows with prescription integration
 */
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  orderBy,
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';
import { prescriptionOrchestrator } from './prescriptionOrchestrator';

class OrderWorkflowOrchestrator {
  
  /**
   * Order Status Workflow States
   */
  static ORDER_STATES = {
    // Initial States
    CONSULTATION_PENDING: 'consultation_pending',
    INTAKE_COMPLETED: 'intake_completed',
    
    // Provider Review States
    PROVIDER_REVIEW: 'provider_review',
    PROVIDER_APPROVED: 'provider_approved',
    PROVIDER_DECLINED: 'provider_declined',
    
    // Prescription States (for Rx products)
    PRESCRIPTION_CREATED: 'prescription_created',
    PRESCRIPTION_SENT: 'prescription_sent',
    
    // Pharmacy States
    PHARMACY_RECEIVED: 'pharmacy_received',
    PHARMACY_FILLING: 'pharmacy_filling',
    PHARMACY_READY: 'pharmacy_ready',
    PHARMACY_DISPENSED: 'pharmacy_dispensed',
    
    // Shipping States (for direct orders)
    PAYMENT_PENDING: 'payment_pending',
    PAYMENT_COMPLETED: 'payment_completed',
    ORDER_PROCESSING: 'order_processing',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_DELIVERED: 'order_delivered',
    
    // Final States
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  };

  /**
   * Status Categories for UI Display
   */
  static STATUS_CATEGORIES = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress', 
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  /**
   * Workflow Paths by Product Type
   */
  static WORKFLOW_PATHS = {
    prescription: [
      'consultation_pending',
      'intake_completed', 
      'provider_review',
      'provider_approved',
      'prescription_created',
      'prescription_sent',
      'pharmacy_received',
      'pharmacy_filling',
      'pharmacy_ready',
      'pharmacy_dispensed',
      'completed'
    ],
    otc: [
      'payment_pending',
      'payment_completed',
      'order_processing', 
      'order_shipped',
      'order_delivered',
      'completed'
    ]
  };

  /**
   * Creates order with proper workflow initialization
   */
  async createOrderWithWorkflow(orderData) {
    try {
      // Determine workflow path based on product type
      const workflowPath = orderData.requiresPrescription ? 
        OrderWorkflowOrchestrator.WORKFLOW_PATHS.prescription :
        OrderWorkflowOrchestrator.WORKFLOW_PATHS.otc;

      // Create order with workflow metadata
      const enhancedOrderData = {
        ...orderData,
        status: workflowPath[0], // Start with first status in workflow
        workflowPath: workflowPath,
        currentStepIndex: 0,
        statusHistory: [{
          status: workflowPath[0],
          timestamp: Timestamp.now(),
          triggeredBy: orderData.createdBy || 'system',
          notes: 'Order created'
        }],
        estimatedCompletionDate: this.calculateEstimatedCompletion(workflowPath),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const orderRef = await addDoc(collection(db, "orders"), enhancedOrderData);
      
      // Trigger initial workflow step
      await this.triggerWorkflowStep(orderRef.id, workflowPath[0], {
        triggeredBy: orderData.createdBy || 'system',
        notes: 'Order workflow initiated'
      });

      return {
        success: true,
        orderId: orderRef.id,
        initialStatus: workflowPath[0],
        workflowPath: workflowPath
      };

    } catch (error) {
      console.error('Error creating order with workflow:', error);
      throw error;
    }
  }

  /**
   * Advances order to next workflow step
   */
  async advanceOrderStatus(orderId, triggerData = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }

      const order = orderSnap.data();
      const currentIndex = order.currentStepIndex || 0;
      const workflowPath = order.workflowPath || [];
      
      // Check if we can advance
      if (currentIndex >= workflowPath.length - 1) {
        console.log('Order already at final status');
        return { success: false, reason: 'Order already at final status' };
      }

      const nextIndex = currentIndex + 1;
      const nextStatus = workflowPath[nextIndex];

      // Update order status
      await this.updateOrderStatus(orderId, nextStatus, {
        ...triggerData,
        previousStatus: order.status,
        stepIndex: nextIndex
      });

      // Trigger any side effects for this status
      await this.handleStatusSideEffects(orderId, nextStatus, order);

      return {
        success: true,
        previousStatus: order.status,
        newStatus: nextStatus,
        stepIndex: nextIndex
      };

    } catch (error) {
      console.error('Error advancing order status:', error);
      throw error;
    }
  }

  /**
   * Updates order status with history tracking
   */
  async updateOrderStatus(orderId, newStatus, metadata = {}) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }

      const order = orderSnap.data();
      const statusHistoryEntry = {
        status: newStatus,
        timestamp: Timestamp.now(),
        triggeredBy: metadata.triggeredBy || 'system',
        notes: metadata.notes || '',
        previousStatus: metadata.previousStatus || order.status,
        metadata: metadata.additionalData || {}
      };

      // Update order with new status
      const updateData = {
        status: newStatus,
        currentStepIndex: metadata.stepIndex !== undefined ? metadata.stepIndex : order.currentStepIndex,
        statusHistory: [...(order.statusHistory || []), statusHistoryEntry],
        updatedAt: Timestamp.now()
      };

      // Add specific fields based on status
      if (newStatus === OrderWorkflowOrchestrator.ORDER_STATES.PRESCRIPTION_SENT) {
        updateData.prescriptionSentAt = Timestamp.now();
      } else if (newStatus === OrderWorkflowOrchestrator.ORDER_STATES.PHARMACY_READY) {
        updateData.readyForPickupAt = Timestamp.now();
      } else if (newStatus === OrderWorkflowOrchestrator.ORDER_STATES.COMPLETED) {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(orderRef, updateData);

      // Trigger notifications
      await this.triggerStatusNotifications(orderId, newStatus, order);

      return { success: true };

    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Handles side effects when status changes
   */
  async handleStatusSideEffects(orderId, newStatus, orderData) {
    try {
      switch (newStatus) {
        case OrderWorkflowOrchestrator.ORDER_STATES.PROVIDER_APPROVED:
          // Automatically create prescription if needed
          if (orderData.requiresPrescription) {
            await this.createPrescriptionFromOrder(orderId, orderData);
          }
          break;

        case OrderWorkflowOrchestrator.ORDER_STATES.PRESCRIPTION_SENT:
          // Auto-advance to pharmacy received after delay (simulating transmission)
          setTimeout(() => {
            this.advanceOrderStatus(orderId, {
              triggeredBy: 'system',
              notes: 'Prescription received by pharmacy'
            });
          }, 30000); // 30 seconds delay
          break;

        case OrderWorkflowOrchestrator.ORDER_STATES.PHARMACY_RECEIVED:
          // Start filling process
          setTimeout(() => {
            this.advanceOrderStatus(orderId, {
              triggeredBy: 'pharmacy_system',
              notes: 'Prescription filling started'
            });
          }, 60000); // 1 minute delay
          break;

        case OrderWorkflowOrchestrator.ORDER_STATES.PAYMENT_COMPLETED:
          // For OTC orders, start processing
          if (!orderData.requiresPrescription) {
            await this.advanceOrderStatus(orderId, {
              triggeredBy: 'payment_system',
              notes: 'Payment confirmed, processing order'
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error handling status side effects:', error);
    }
  }

  /**
   * Creates prescription from approved order
   */
  async createPrescriptionFromOrder(orderId, orderData) {
    try {
      // This would integrate with the prescription orchestrator
      const prescriptionData = {
        orderId: orderId,
        patientId: orderData.patientId,
        providerId: orderData.providerId,
        medication: orderData.medication,
        // ... other prescription fields
      };

      // Update order with prescription ID
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        prescriptionCreated: true,
        prescriptionCreatedAt: Timestamp.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating prescription from order:', error);
      throw error;
    }
  }

  /**
   * Gets comprehensive order details with workflow information
   */
  async getOrderWithWorkflow(orderId) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }

      const order = orderSnap.data();
      
      // Calculate workflow progress
      const workflowProgress = this.calculateWorkflowProgress(order);
      
      // Get estimated completion
      const estimatedCompletion = this.calculateEstimatedCompletion(
        order.workflowPath, 
        order.currentStepIndex
      );

      return {
        id: orderId,
        ...order,
        workflowProgress,
        estimatedCompletion,
        statusCategory: this.getStatusCategory(order.status),
        nextPossibleActions: this.getNextPossibleActions(order),
        timeInCurrentStatus: this.getTimeInCurrentStatus(order)
      };

    } catch (error) {
      console.error('Error getting order with workflow:', error);
      throw error;
    }
  }

  /**
   * Calculates workflow progress percentage
   */
  calculateWorkflowProgress(order) {
    if (!order.workflowPath || !order.currentStepIndex) {
      return 0;
    }
    
    const progress = ((order.currentStepIndex + 1) / order.workflowPath.length) * 100;
    return Math.round(progress);
  }

  /**
   * Gets status category for UI styling
   */
  getStatusCategory(status) {
    const pendingStates = [
      'consultation_pending', 
      'intake_completed', 
      'payment_pending'
    ];
    
    const inProgressStates = [
      'provider_review',
      'prescription_created',
      'prescription_sent',
      'pharmacy_received',
      'pharmacy_filling',
      'order_processing'
    ];
    
    const readyStates = [
      'pharmacy_ready',
      'order_shipped'
    ];
    
    const completedStates = [
      'completed',
      'pharmacy_dispensed',
      'order_delivered'
    ];

    if (pendingStates.includes(status)) return OrderWorkflowOrchestrator.STATUS_CATEGORIES.PENDING;
    if (inProgressStates.includes(status)) return OrderWorkflowOrchestrator.STATUS_CATEGORIES.IN_PROGRESS;
    if (readyStates.includes(status)) return OrderWorkflowOrchestrator.STATUS_CATEGORIES.READY;
    if (completedStates.includes(status)) return OrderWorkflowOrchestrator.STATUS_CATEGORIES.COMPLETED;
    if (status === 'cancelled') return OrderWorkflowOrchestrator.STATUS_CATEGORIES.CANCELLED;
    
    return OrderWorkflowOrchestrator.STATUS_CATEGORIES.PENDING;
  }

  /**
   * Gets possible next actions for current status
   */
  getNextPossibleActions(order) {
    const actions = [];
    
    switch (order.status) {
      case 'provider_review':
        actions.push('approve', 'decline', 'request_more_info');
        break;
      case 'pharmacy_filling':
        actions.push('mark_ready', 'delay', 'out_of_stock');
        break;
      case 'pharmacy_ready':
        actions.push('dispense', 'cancel');
        break;
      case 'order_processing':
        actions.push('ship', 'delay', 'cancel');
        break;
      default:
        if (order.currentStepIndex < (order.workflowPath?.length || 0) - 1) {
          actions.push('advance');
        }
    }
    
    return actions;
  }

  /**
   * Calculates time spent in current status
   */
  getTimeInCurrentStatus(order) {
    if (!order.statusHistory || order.statusHistory.length === 0) {
      return 0;
    }
    
    const currentStatusEntry = order.statusHistory[order.statusHistory.length - 1];
    const currentTime = new Date();
    const statusTime = currentStatusEntry.timestamp.toDate();
    
    return currentTime.getTime() - statusTime.getTime(); // milliseconds
  }

  /**
   * Calculates estimated completion date
   */
  calculateEstimatedCompletion(workflowPath, currentIndex = 0) {
    // Average time estimates per step (in hours)
    const stepDurations = {
      'consultation_pending': 24,
      'intake_completed': 2,
      'provider_review': 4,
      'provider_approved': 0.5,
      'prescription_created': 0.5,
      'prescription_sent': 1,
      'pharmacy_received': 2,
      'pharmacy_filling': 24,
      'pharmacy_ready': 0,
      'payment_pending': 24,
      'payment_completed': 0.5,
      'order_processing': 24,
      'order_shipped': 72
    };

    let totalHours = 0;
    for (let i = currentIndex; i < workflowPath.length; i++) {
      totalHours += stepDurations[workflowPath[i]] || 1;
    }

    const estimatedDate = new Date();
    estimatedDate.setHours(estimatedDate.getHours() + totalHours);
    
    return estimatedDate;
  }

  /**
   * Triggers notifications for status changes
   */
  async triggerStatusNotifications(orderId, newStatus, orderData) {
    try {
      // This would integrate with the notification service
      const notificationData = {
        orderId,
        status: newStatus,
        patientId: orderData.patientId,
        providerId: orderData.providerId,
        medication: orderData.medication,
        timestamp: new Date()
      };

      // Queue notifications (would be implemented in notification service)
      console.log('Triggering notifications for status change:', notificationData);
      
      return { success: true };
    } catch (error) {
      console.error('Error triggering notifications:', error);
    }
  }

  /**
   * Sets up real-time order status listening
   */
  subscribeToOrderUpdates(orderId, callback) {
    const orderRef = doc(db, "orders", orderId);
    
    return onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data();
        callback({
          id: doc.id,
          ...orderData,
          workflowProgress: this.calculateWorkflowProgress(orderData),
          statusCategory: this.getStatusCategory(orderData.status)
        });
      }
    });
  }

  /**
   * Triggers specific workflow step
   */
  async triggerWorkflowStep(orderId, status, metadata = {}) {
    try {
      // Perform any step-specific logic
      console.log(`Triggering workflow step: ${status} for order: ${orderId}`);
      
      // This is where you'd trigger step-specific automation
      // e.g., sending emails, creating tasks, etc.
      
      return { success: true };
    } catch (error) {
      console.error('Error triggering workflow step:', error);
      throw error;
    }
  }
}

export const orderWorkflowOrchestrator = new OrderWorkflowOrchestrator();