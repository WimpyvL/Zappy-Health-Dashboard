/**
 * Mixed Order Service
 *
 * Handles creation and management of orders that contain both
 * subscription-based products and one-time purchases.
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// Mixed order interfaces
export interface MixedOrderRequest {
  patientId: string;
  subscriptionProducts?: OrderProduct[];
  oneTimeProducts?: OrderProduct[];
  selectedPlan?: SubscriptionPlan | null;
  formData?: FormData;
  sessionId?: string | null;
}

export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  source?: 'user_selection' | 'ai_recommendation' | 'provider_recommendation';
  recommendationRuleId?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  stripePriceId?: string;
}

export interface FormData {
  shippingAddress?: Address;
  billingAddress?: Address;
  checkout?: {
    paymentMethod?: string;
    discountCode?: string;
  };
  metadata?: Record<string, any>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  patientId: string;
  orderType: 'subscription' | 'one_time' | 'mixed';
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'paid';
  totalAmount: number;
  subscriptionPlanId?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  orderSource: string;
  sessionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, any>;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  itemType: 'subscription_plan' | 'subscription_product' | 'one_time_product';
  productName: string;
  priceAtOrder: number;
  quantity: number;
  subscriptionPlanId?: string;
  source?: string;
  recommendationRuleId?: string;
  confidenceScore?: number;
  metadata?: Record<string, any>;
}

export interface OrderRelationship {
  id: string;
  primaryOrderId: string;
  relatedOrderId: string;
  relationshipType: 'bundled_purchase' | 'follow_up' | 'refill' | 'upgrade';
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}

export interface MixedOrderResult {
  success: boolean;
  subscriptionOrderId?: string;
  oneTimeOrderId?: string;
  orderIds: string[];
  invoiceIds?: string[];
  orderType: 'mixed' | 'subscription' | 'one_time';
  message: string;
  error?: string;
}

/**
 * Mixed Order Service Class
 */
export class MixedOrderService {
  private db = getFirebaseFirestore();

  /**
   * Create mixed order (subscription + one-time products)
   */
  async createMixedOrder({
    patientId,
    subscriptionProducts = [],
    oneTimeProducts = [],
    selectedPlan = null,
    formData = {},
    sessionId = null,
  }: MixedOrderRequest): Promise<MixedOrderResult> {
    let subscriptionOrderId: string | undefined;
    let oneTimeOrderId: string | undefined;

    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      console.log('Creating mixed order:', {
        patientId,
        subscriptionCount: subscriptionProducts.length,
        oneTimeCount: oneTimeProducts.length,
        hasPlan: !!selectedPlan,
        sessionId,
      });

      const orderIds: string[] = [];

      // Create subscription order if needed
      if (subscriptionProducts.length > 0 && selectedPlan) {
        const subscriptionOrder = await this.createSubscriptionOrder({
          patientId,
          selectedPlan,
          products: subscriptionProducts,
          formData,
          sessionId,
        });
        subscriptionOrderId = subscriptionOrder.id;
        orderIds.push(subscriptionOrderId);
      }

      // Create one-time order if needed
      if (oneTimeProducts.length > 0) {
        const oneTimeOrder = await this.createOneTimeOrder({
          patientId,
          products: oneTimeProducts,
          formData,
          sessionId,
        });
        oneTimeOrderId = oneTimeOrder.id;
        orderIds.push(oneTimeOrderId);
      }

      // Link orders if both exist
      if (subscriptionOrderId && oneTimeOrderId) {
        await this.linkOrders(
          subscriptionOrderId,
          oneTimeOrderId,
          'bundled_purchase',
          {
            sessionId,
            createdAt: new Date().toISOString(),
            orderType: 'mixed_cart',
          }
        );
      }

      // Create invoices for all orders
      const invoiceIds: string[] = [];
      for (const orderId of orderIds) {
        try {
          const invoice = await this.createOrderInvoice(orderId, patientId);
          if (invoice) {
            invoiceIds.push(invoice.id);
          }
        } catch (invoiceError) {
          console.error(
            'Error creating invoice for order:',
            orderId,
            invoiceError
          );
          // Continue with other invoices even if one fails
        }
      }

      return {
        success: true,
        subscriptionOrderId,
        oneTimeOrderId,
        orderIds,
        invoiceIds,
        orderType: this.determineOrderType(
          subscriptionProducts,
          oneTimeProducts
        ),
        message: 'Mixed order created successfully',
      };
    } catch (error) {
      console.error('Error in createMixedOrder:', error);

      // Attempt cleanup on failure - only cleanup if we have order IDs
      if (subscriptionOrderId || oneTimeOrderId) {
        await this.cleanupFailedOrder({
          subscriptionOrderId,
          oneTimeOrderId,
          patientId,
        });
      }

      return {
        success: false,
        orderIds: [],
        orderType: this.determineOrderType(subscriptionProducts, oneTimeProducts),
        message: 'Failed to create mixed order',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create subscription-based order
   */
  async createSubscriptionOrder({
    patientId,
    selectedPlan,
    products,
    formData,
    sessionId,
  }: {
    patientId: string;
    selectedPlan: SubscriptionPlan;
    products: OrderProduct[];
    formData?: FormData;
    sessionId?: string | null;
  }): Promise<Order> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const orderData: Order = {
        id: orderId,
        patientId,
        orderType: 'subscription',
        status: 'pending',
        totalAmount: selectedPlan.price,
        subscriptionPlanId: selectedPlan.id,
        shippingAddress: formData?.shippingAddress,
        billingAddress: formData?.billingAddress || formData?.shippingAddress,
        paymentMethod: formData?.checkout?.paymentMethod || 'stripe',
        orderSource: 'intake_form',
        sessionId: sessionId || undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          planName: selectedPlan.name,
          productCount: products.length,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            source: p.source || 'user_selection',
          })),
        },
      };

      // Save order to database
      await setDoc(doc(this.db, 'orders', orderId), orderData);

      // Create order items for the subscription plan
      const planOrderItem: OrderItem = {
        id: `item_${Date.now()}_plan`,
        orderId,
        itemType: 'subscription_plan',
        productName: selectedPlan.name,
        priceAtOrder: selectedPlan.price,
        quantity: 1,
        subscriptionPlanId: selectedPlan.id,
        source: 'plan_selection',
      };

      await setDoc(doc(this.db, 'order_items', planOrderItem.id), planOrderItem);

      // Create order items for each subscription product
      const batch = writeBatch(this.db);
      products.forEach((product, index) => {
        const itemId = `item_${Date.now()}_${index}`;
        const productOrderItem: OrderItem = {
          id: itemId,
          orderId,
          productId: product.id,
          itemType: 'subscription_product',
          productName: product.name,
          priceAtOrder: 0, // Included in plan price
          quantity: product.quantity || 1,
          source: product.source || 'user_selection',
          recommendationRuleId: product.recommendationRuleId,
          confidenceScore: product.confidence || 1.0,
        };

        batch.set(doc(this.db, 'order_items', itemId), productOrderItem);
      });

      await batch.commit();

      console.log('Created subscription order:', orderId);
      return orderData;
    } catch (error) {
      console.error('Error creating subscription order:', error);
      throw new Error(`Failed to create subscription order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create one-time order
   */
  async createOneTimeOrder({
    patientId,
    products,
    formData,
    sessionId,
  }: {
    patientId: string;
    products: OrderProduct[];
    formData?: FormData;
    sessionId?: string | null;
  }): Promise<Order> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalAmount = products.reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);

      const orderData: Order = {
        id: orderId,
        patientId,
        orderType: 'one_time',
        status: 'pending',
        totalAmount,
        shippingAddress: formData?.shippingAddress,
        billingAddress: formData?.billingAddress || formData?.shippingAddress,
        paymentMethod: formData?.checkout?.paymentMethod || 'stripe',
        orderSource: 'intake_form',
        sessionId: sessionId || undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          productCount: products.length,
          aiRecommendedCount: products.filter(
            (p) => p.source === 'ai_recommendation'
          ).length,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            source: p.source || 'user_selection',
          })),
        },
      };

      // Save order to database
      await setDoc(doc(this.db, 'orders', orderId), orderData);

      // Create order items for each one-time product
      const batch = writeBatch(this.db);
      products.forEach((product, index) => {
        const itemId = `item_${Date.now()}_${index}`;
        const orderItem: OrderItem = {
          id: itemId,
          orderId,
          productId: product.id,
          itemType: 'one_time_product',
          productName: product.name,
          priceAtOrder: product.price,
          quantity: product.quantity || 1,
          source: product.source || 'user_selection',
          recommendationRuleId: product.recommendationRuleId,
          confidenceScore: product.confidence || 1.0,
        };

        batch.set(doc(this.db, 'order_items', itemId), orderItem);
      });

      await batch.commit();

      console.log('Created one-time order:', orderId);
      return orderData;
    } catch (error) {
      console.error('Error creating one-time order:', error);
      throw new Error(`Failed to create one-time order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Link related orders
   */
  async linkOrders(
    primaryOrderId: string,
    relatedOrderId: string,
    relationshipType: 'bundled_purchase' | 'follow_up' | 'refill' | 'upgrade',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const relationship: OrderRelationship = {
        id: relationshipId,
        primaryOrderId,
        relatedOrderId,
        relationshipType,
        metadata,
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(this.db, 'order_relationships', relationshipId), relationship);

      console.log('Linked orders:', {
        primaryOrderId,
        relatedOrderId,
        relationshipType,
      });
    } catch (error) {
      console.error('Error linking orders:', error);
      throw new Error(`Failed to link orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create invoice for an order
   */
  async createOrderInvoice(orderId: string, patientId: string): Promise<any | null> {
    try {
      if (!this.db) return null;

      // Get order details
      const orderDoc = await getDoc(doc(this.db, 'orders', orderId));
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

      // Get order items
      const itemsQuery = query(
        collection(this.db, 'order_items'),
        where('orderId', '==', orderId)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Create invoice using existing invoice service (if available)
      // For now, create a basic invoice structure
      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const invoice = {
        id: invoiceId,
        patientId,
        orderId,
        status: 'pending',
        type: order.orderType,
        amount: order.totalAmount,
        items: items.map(item => ({
          description: item.productName,
          amount: item.priceAtOrder,
          quantity: item.quantity,
        })),
        createdAt: Timestamp.now(),
        dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
        metadata: {
          orderId,
          orderType: order.orderType,
        },
      };

      await setDoc(doc(this.db, 'invoices', invoiceId), invoice);
      return invoice;
    } catch (error) {
      console.error('Error creating order invoice:', error);
      // Don't throw here as invoices can be created later
      return null;
    }
  }

  /**
   * Get mixed order details with relationships
   */
  async getMixedOrderDetails(orderId: string): Promise<{
    order: Order;
    relatedOrders: Order[];
    relationships: OrderRelationship[];
    items: OrderItem[];
  }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Get main order
      const orderDoc = await getDoc(doc(this.db, 'orders', orderId));
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }

      const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

      // Get order items
      const itemsQuery = query(
        collection(this.db, 'order_items'),
        where('orderId', '==', orderId)
      );
      
      const itemsSnapshot = await getDocs(itemsQuery);
      const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderItem[];

      // Get relationships
      const relationshipsQuery = query(
        collection(this.db, 'order_relationships'),
        where('primaryOrderId', '==', orderId)
      );
      
      const relationshipsSnapshot = await getDocs(relationshipsQuery);
      const relationships = relationshipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as OrderRelationship[];

      // Get related orders
      const relatedOrderIds = relationships.map(r => r.relatedOrderId);
      const relatedOrders: Order[] = [];

      for (const relatedOrderId of relatedOrderIds) {
        const relatedOrderDoc = await getDoc(doc(this.db, 'orders', relatedOrderId));
        if (relatedOrderDoc.exists()) {
          relatedOrders.push({ id: relatedOrderDoc.id, ...relatedOrderDoc.data() } as Order);
        }
      }

      return {
        order,
        relatedOrders,
        relationships,
        items,
      };
    } catch (error) {
      console.error('Error getting mixed order details:', error);
      throw new Error(`Failed to get order details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update order status across related orders
   */
  async updateMixedOrderStatus(
    orderId: string, 
    newStatus: 'pending' | 'processing' | 'completed' | 'cancelled' | 'paid', 
    reason?: string
  ): Promise<{ success: boolean; updatedOrderIds: string[] }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Get all related orders
      const { relatedOrders } = await this.getMixedOrderDetails(orderId);
      const allOrderIds = [orderId, ...relatedOrders.map((o) => o.id)];

      // Update all related orders
      const batch = writeBatch(this.db);
      
      allOrderIds.forEach(id => {
        const orderRef = doc(this.db!, 'orders', id);
        batch.update(orderRef, {
          status: newStatus,
          updatedAt: Timestamp.now(),
          ...(reason && { statusReason: reason }),
        });
      });

      await batch.commit();

      console.log('Updated mixed order status:', {
        orderIds: allOrderIds,
        newStatus,
      });
      
      return { success: true, updatedOrderIds: allOrderIds };
    } catch (error) {
      console.error('Error updating mixed order status:', error);
      throw new Error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel mixed order
   */
  async cancelMixedOrder(orderId: string, reason = 'User requested cancellation'): Promise<{ success: boolean; updatedOrderIds: string[] }> {
    try {
      const result = await this.updateMixedOrderStatus(
        orderId,
        'cancelled',
        reason
      );

      // Additional cancellation logic can be added here
      // e.g., process refunds, cancel subscriptions, etc.

      return result;
    } catch (error) {
      console.error('Error cancelling mixed order:', error);
      throw new Error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process payment for mixed order
   */
  async processMixedOrderPayment(orderIds: string[], paymentDetails: any): Promise<{ success: boolean; paidOrderIds: string[] }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // This would integrate with payment service
      // For now, just update order statuses
      const batch = writeBatch(this.db);
      
      orderIds.forEach(orderId => {
        const orderRef = doc(this.db!, 'orders', orderId);
        batch.update(orderRef, {
          status: 'paid',
          paymentStatus: 'completed',
          paymentDetails,
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();

      console.log('Processed payment for mixed order:', orderIds);
      return { success: true, paidOrderIds: orderIds };
    } catch (error) {
      console.error('Error processing mixed order payment:', error);
      throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cleanup failed order creation
   */
  async cleanupFailedOrder({ 
    subscriptionOrderId, 
    oneTimeOrderId, 
    patientId 
  }: { 
    subscriptionOrderId?: string; 
    oneTimeOrderId?: string; 
    patientId: string; 
  }): Promise<void> {
    try {
      if (!this.db) return;

      const orderIds = [subscriptionOrderId, oneTimeOrderId].filter(Boolean) as string[];

      if (orderIds.length === 0) return;

      const batch = writeBatch(this.db);

      // Delete order items
      for (const orderId of orderIds) {
        const itemsQuery = query(
          collection(this.db, 'order_items'),
          where('orderId', '==', orderId)
        );
        
        const itemsSnapshot = await getDocs(itemsQuery);
        itemsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      // Delete order relationships
      for (const orderId of orderIds) {
        const relationshipsQuery = query(
          collection(this.db, 'order_relationships'),
          where('primaryOrderId', '==', orderId)
        );
        
        const relationshipsSnapshot = await getDocs(relationshipsQuery);
        relationshipsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      // Delete orders
      orderIds.forEach(orderId => {
        batch.delete(doc(this.db!, 'orders', orderId));
      });

      await batch.commit();

      console.log('Cleaned up failed order creation:', orderIds);
    } catch (error) {
      console.error('Error cleaning up failed order:', error);
      // Don't throw here as this is cleanup
    }
  }

  /**
   * Helper methods
   */
  determineOrderType(subscriptionProducts: OrderProduct[], oneTimeProducts: OrderProduct[]): 'mixed' | 'subscription' | 'one_time' {
    if (subscriptionProducts.length > 0 && oneTimeProducts.length > 0) {
      return 'mixed';
    } else if (subscriptionProducts.length > 0) {
      return 'subscription';
    } else {
      return 'one_time';
    }
  }

  /**
   * Get order analytics for mixed orders
   */
  async getMixedOrderAnalytics(patientId?: string, timeRange = 30): Promise<{
    totalOrders: number;
    mixedOrders: number;
    subscriptionOrders: number;
    oneTimeOrders: number;
    totalValue: number;
    averageOrderValue: number;
  }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - timeRange);

      let ordersQuery = query(
        collection(this.db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('createdAt', 'desc')
      );

      if (patientId) {
        ordersQuery = query(
          collection(this.db, 'orders'),
          where('patientId', '==', patientId),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('createdAt', 'desc')
        );
      }

      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);

      // Get relationships to identify mixed orders
      const relationshipsQuery = query(collection(this.db, 'order_relationships'));
      const relationshipsSnapshot = await getDocs(relationshipsQuery);
      const relationships = relationshipsSnapshot.docs.map(doc => doc.data() as OrderRelationship);

      const mixedOrderIds = new Set([
        ...relationships.map(r => r.primaryOrderId),
        ...relationships.map(r => r.relatedOrderId)
      ]);

      const analytics = {
        totalOrders: orders.length,
        mixedOrders: orders.filter(o => mixedOrderIds.has(o.id)).length,
        subscriptionOrders: orders.filter(o => o.orderType === 'subscription').length,
        oneTimeOrders: orders.filter(o => o.orderType === 'one_time').length,
        totalValue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        averageOrderValue: 0,
      };

      analytics.averageOrderValue = analytics.totalOrders > 0 
        ? analytics.totalValue / analytics.totalOrders 
        : 0;

      return analytics;
    } catch (error) {
      console.error('Error getting mixed order analytics:', error);
      return {
        totalOrders: 0,
        mixedOrders: 0,
        subscriptionOrders: 0,
        oneTimeOrders: 0,
        totalValue: 0,
        averageOrderValue: 0,
      };
    }
  }
}

// Export singleton instance
export const mixedOrderService = new MixedOrderService();
export default mixedOrderService;
