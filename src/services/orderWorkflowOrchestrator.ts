
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, OrderType, OrderFilters, OrderAnalytics } from '@/types/order';
import { notificationService } from './notificationService';
import { dbService } from './database/hooks';

export class OrderWorkflowOrchestrator {
  private readonly collectionName = 'orders';

  async createOrderFromFlow(flow: any, approvalData: any) {
    const orderData = {
        patientId: flow.patientId,
        providerId: 'provider-placeholder', // This should be the approving provider's ID
        items: [{
            productId: flow.productId,
            name: approvalData.prescription_data.medication,
            quantity: approvalData.prescription_data.quantity,
            unitPrice: 99, // This should come from product data
            totalPrice: 99 * approvalData.prescription_data.quantity,
        }],
        totalAmount: 99 * approvalData.prescription_data.quantity,
        status: OrderStatus.PENDING,
        type: OrderType.PRESCRIPTION,
        currency: 'USD',
        flowId: flow.id,
    };
    const orderResult = await this.createOrder(orderData as any);
    if (!orderResult.success || !orderResult.data?.id) {
        throw new Error("Failed to create order");
    }
    return { success: true, orderId: orderResult.data.id };
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items'> & { items: any[] }): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
      const now = new Date();
      const orderToCreate = {
        ...orderData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      const docRef = await addDoc(collection(db, this.collectionName), orderToCreate);

      return { success: true, data: { id: docRef.id } };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: 'Failed to create order' };
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, details?: any): Promise<void> {
    try {
      const orderRef = doc(db, this.collectionName, orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
        ...details
      });

      const order = (await this.getOrder(orderId)) as Order;
      if (order) {
        notificationService.sendNotification(order.patientId, {
            type: 'order_status_update' as any,
            title: 'Order Status Updated',
            message: `Your order #${orderId.substring(0, 6)} is now ${status}.`
        });
      }

    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.collectionName, orderId));
      
      if (!orderDoc.exists()) {
        return null;
      }

      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const {data} = await dbService.orders.getAll(filters);
    return data as Order[] || [];
  }

  async getOrderAnalytics(filters?: OrderFilters): Promise<OrderAnalytics> {
    try {
      const orders = await this.getOrders(filters);
      
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<OrderStatus, number>);

      const ordersByType = orders.reduce((acc, order) => {
        acc[order.type] = (acc[order.type] || 0) + 1;
        return acc;
      }, {} as Record<OrderType, number>);

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        ordersByType,
        revenueByMonth: [], // Placeholder
        topProducts: [] // Placeholder
      };
    } catch (error) {
      console.error('Error getting order analytics:', error);
      throw new Error('Failed to get order analytics');
    }
  }

  async progressOrder(orderId: string, details?: any): Promise<void> {
    // This is a placeholder for a more complex state machine
    const order = await this.getOrder(orderId);
    if (!order) throw new Error("Order not found");

    let nextStatus = order.status;
    switch (order.status) {
        case OrderStatus.PENDING:
            nextStatus = OrderStatus.PROCESSING;
            break;
        case OrderStatus.PROCESSING:
            nextStatus = OrderStatus.SHIPPED;
            break;
        case OrderStatus.SHIPPED:
            nextStatus = OrderStatus.DELIVERED;
            break;
    }
    
    if (nextStatus !== order.status) {
        await this.updateOrderStatus(orderId, nextStatus, details);
    }
  }
}

export const orderWorkflowOrchestrator = new OrderWorkflowOrchestrator();
