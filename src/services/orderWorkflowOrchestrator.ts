
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
  onSnapshot,
  DocumentReference,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { 
  Order, 
  OrderStatus, 
  OrderType, 
  CreateOrderData, 
  OrderUpdateData, 
  OrderFilters, 
  OrderAnalytics 
} from '@/types/order';

/**
 * Workflow-specific interfaces
 */
interface WorkflowStep {
  status: string;
  timestamp: Timestamp;
  triggeredBy: string;
  notes: string;
  previousStatus?: string;
  metadata?: Record<string, any>;
}

interface WorkflowProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  estimatedCompletion: Date;
}

interface OrderWithWorkflow extends Order {
  workflowPath: string[];
  currentStepIndex: number;
  statusHistory: WorkflowStep[];
  workflowProgress: WorkflowProgress;
  statusCategory: string;
  nextPossibleActions: string[];
  timeInCurrentStatus: number;
  estimatedCompletion: Date;
}

interface WorkflowTriggerData {
  triggeredBy?: string;
  notes?: string;
  previousStatus?: string;
  stepIndex?: number;
  additionalData?: Record<string, any>;
}

interface CreateOrderResult {
  success: boolean;
  orderId: string;
  initialStatus: string;
  workflowPath: string[];
}

interface StatusAdvanceResult {
  success: boolean;
  previousStatus?: string;
  newStatus?: string;
  stepIndex?: number;
  reason?: string;
}

class OrderWorkflowOrchestrator {
  
  /**
   * Order Status Workflow States
   */
  static readonly ORDER_STATES = {
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
  } as const;

  /**
   * Status Categories for UI Display
   */
  static readonly STATUS_CATEGORIES = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress', 
    READY: 'ready',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  } as const;

  /**
   * Workflow Paths by Product Type
   */
  static readonly WORKFLOW_PATHS = {
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
  } as const;

  private readonly collectionName = 'orders';

  /**
   * Creates order with proper workflow initialization
   */
  async createOrderWithWorkflow(orderData: CreateOrderData & { 
    requiresPrescription?: boolean;
    createdBy?: string;
    medication?: any;
  }): Promise<CreateOrderResult> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Determine workflow path based on product type
      const workflowPath = [...(orderData.requiresPrescription ? 
        OrderWorkflowOrchestrator.WORKFLOW_PATHS.prescription :
        OrderWorkflowOrchestrator.WORKFLOW_PATHS.otc)];

      // Create order with workflow metadata
      const enhancedOrderData = {
        ...orderData,
        status: workflowPath[0] as OrderStatus, // Start with first status in workflow
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
        updatedAt: Timestamp.now(),
        totalAmount: orderData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
        currency: 'USD',
        paymentStatus: 'pending' as const
      };

      const orderRef = await addDoc(collection(db, this.collectionName), enhancedOrderData);
      
      // Trigger initial workflow step
      await this.triggerWorkflowStep(orderRef.id, workflowPath[0], {
        triggeredBy: orderData.createdBy || 'system',
        notes: 'Order workflow initiated'
      });

      return {
        success: true,
        orderId: orderRef.id,
        initialStatus: workflowPath[0],
        workflowPath: [...workflowPath]
      };

    } catch (error) {
      console.error('Error creating order with workflow:', error);
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advances order to next workflow step
   */
  async advanceOrderStatus(orderId: string, triggerData: WorkflowTriggerData = {}): Promise<StatusAdvanceResult> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const orderRef = doc(db, this.collectionName, orderId);
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

      if (!nextStatus) {
        return { success: false, reason: 'Invalid workflow step' };
      }

      // Update order status
      await this.updateOrderStatus(orderId, nextStatus, {
        ...triggerData,
        previousStatus: order.status || '',
        stepIndex: nextIndex
      });

      // Trigger any side effects for this status
      await this.handleStatusSideEffects(orderId, nextStatus, order);

      return {
        success: true,
        previousStatus: order.status || '',
        newStatus: nextStatus,
        stepIndex: nextIndex
      };

    } catch (error) {
      console.error('Error advancing order status:', error);
      throw new Error(`Failed to advance order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates order status with history tracking
   */
  async updateOrderStatus(orderId: string, newStatus: string, metadata: WorkflowTriggerData = {}): Promise<{ success: boolean }> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const orderRef = doc(db, this.collectionName, orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }

      const order = orderSnap.data();
      const statusHistoryEntry: WorkflowStep = {
        status: newStatus,
        timestamp: Timestamp.now(),
        triggeredBy: metadata.triggeredBy || 'system',
        notes: metadata.notes || '',
        previousStatus: metadata.previousStatus || order.status,
        metadata: metadata.additionalData || {}
      };

      // Update order with new status
      const updateData: any = {
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
      throw new Error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handles side effects when status changes
   */
  private async handleStatusSideEffects(orderId: string, newStatus: string, orderData: any): Promise<void> {
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
  private async createPrescriptionFromOrder(orderId: string, orderData: any): Promise<{ success: boolean }> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // This would integrate with the prescription orchestrator
      const prescriptionData = {
        orderId: orderId,
        patientId: orderData.patientId,
        providerId: orderData.providerId,
        medication: orderData.medication,
        // ... other prescription fields
      };

      // Update order with prescription ID
      const orderRef = doc(db, this.collectionName, orderId);
      await updateDoc(orderRef, {
        prescriptionCreated: true,
        prescriptionCreatedAt: Timestamp.now()
      });

      return { success: true };
    } catch (error) {
      console.error('Error creating prescription from order:', error);
      throw new Error(`Failed to create prescription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets comprehensive order details with workflow information
   */
  async getOrderWithWorkflow(orderId: string): Promise<OrderWithWorkflow> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const orderRef = doc(db, this.collectionName, orderId);
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
        patientId: order.patientId,
        providerId: order.providerId,
        status: order.status,
        type: order.type,
        items: order.items || [],
        totalAmount: order.totalAmount || 0,
        currency: order.currency || 'USD',
        paymentStatus: order.paymentStatus || 'pending',
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        paymentMethod: order.paymentMethod,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        metadata: order.metadata,
        workflowPath: order.workflowPath || [],
        currentStepIndex: order.currentStepIndex || 0,
        statusHistory: order.statusHistory || [],
        createdAt: order.createdAt?.toDate() || new Date(),
        updatedAt: order.updatedAt?.toDate() || new Date(),
        estimatedDelivery: order.estimatedDelivery?.toDate(),
        actualDelivery: order.actualDelivery?.toDate(),
        workflowProgress,
        estimatedCompletion,
        statusCategory: this.getStatusCategory(order.status),
        nextPossibleActions: this.getNextPossibleActions(order),
        timeInCurrentStatus: this.getTimeInCurrentStatus(order)
      };

    } catch (error) {
      console.error('Error getting order with workflow:', error);
      throw new Error(`Failed to get order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets orders with filters
   */
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      let q = query(collection(db, this.collectionName));

      if (filters?.status?.length) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters?.type?.length) {
        q = query(q, where('type', 'in', filters.type));
      }

      if (filters?.patientId) {
        q = query(q, where('patientId', '==', filters.patientId));
      }

      if (filters?.providerId) {
        q = query(q, where('providerId', '==', filters.providerId));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        estimatedDelivery: doc.data().estimatedDelivery?.toDate(),
        actualDelivery: doc.data().actualDelivery?.toDate()
      })) as Order[];
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error(`Failed to get orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculates workflow progress percentage
   */
  private calculateWorkflowProgress(order: any): WorkflowProgress {
    if (!order.workflowPath || order.currentStepIndex === undefined) {
      return {
        currentStep: 0,
        totalSteps: 0,
        percentage: 0,
        estimatedCompletion: new Date()
      };
    }
    
    const currentStep = order.currentStepIndex + 1;
    const totalSteps = order.workflowPath.length;
    const percentage = Math.round((currentStep / totalSteps) * 100);
    const estimatedCompletion = this.calculateEstimatedCompletion(order.workflowPath, order.currentStepIndex);
    
    return {
      currentStep,
      totalSteps,
      percentage,
      estimatedCompletion
    };
  }

  /**
   * Gets status category for UI styling
   */
  private getStatusCategory(status: string): string {
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
  private getNextPossibleActions(order: any): string[] {
    const actions: string[] = [];
    
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
  private getTimeInCurrentStatus(order: any): number {
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
  private calculateEstimatedCompletion(workflowPath: string[], currentIndex: number = 0): Date {
    // Average time estimates per step (in hours)
    const stepDurations: Record<string, number> = {
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
      const step = workflowPath[i];
      if (step) {
        totalHours += stepDurations[step] || 1;
      }
    }

    const estimatedDate = new Date();
    estimatedDate.setHours(estimatedDate.getHours() + totalHours);
    
    return estimatedDate;
  }

  /**
   * Triggers notifications for status changes
   */
  private async triggerStatusNotifications(orderId: string, newStatus: string, orderData: any): Promise<{ success: boolean }> {
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
      return { success: false };
    }
  }

  /**
   * Sets up real-time order status listening
   */
  subscribeToOrderUpdates(orderId: string, callback: (order: OrderWithWorkflow) => void): Unsubscribe {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const orderRef = doc(db, this.collectionName, orderId);
    
    return onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data();
        callback({
          id: doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate() || new Date(),
          updatedAt: orderData.updatedAt?.toDate() || new Date(),
          estimatedDelivery: orderData.estimatedDelivery?.toDate(),
          actualDelivery: orderData.actualDelivery?.toDate(),
          workflowProgress: this.calculateWorkflowProgress(orderData),
          statusCategory: this.getStatusCategory(orderData.status),
          nextPossibleActions: this.getNextPossibleActions(orderData),
          timeInCurrentStatus: this.getTimeInCurrentStatus(orderData)
        } as OrderWithWorkflow);
      }
    });
  }

  /**
   * Triggers specific workflow step
   */
  private async triggerWorkflowStep(orderId: string, status: string, metadata: WorkflowTriggerData = {}): Promise<{ success: boolean }> {
    try {
      // Perform any step-specific logic
      console.log(`Triggering workflow step: ${status} for order: ${orderId}`);
      
      // This is where you'd trigger step-specific automation
      // e.g., sending emails, creating tasks, etc.
      
      return { success: true };
    } catch (error) {
      console.error('Error triggering workflow step:', error);
      throw new Error(`Failed to trigger workflow step: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const orderWorkflowOrchestrator = new OrderWorkflowOrchestrator();
export type { OrderWithWorkflow, WorkflowProgress, WorkflowTriggerData };
