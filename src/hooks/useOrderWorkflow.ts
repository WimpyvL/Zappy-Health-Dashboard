/**
 * @fileoverview React hook for order workflow management and real-time updates
 */
import { useState, useEffect, useCallback } from 'react';
import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  Unsubscribe,
  Query,
  DocumentData
} from 'firebase/firestore';
import { orderWorkflowOrchestrator } from '@/services/orderWorkflowOrchestrator';
import { notificationService } from '@/services/notificationService';

// Types
export interface Order {
  id: string;
  patientId: string;
  providerId?: string;
  pharmacyId?: string;
  status: string;
  medication?: string;
  isPrescriptionRequired?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  completedAt?: Timestamp;
  orderDate?: Timestamp;
  flow_id?: string;
  consultation_id?: string;
  [key: string]: any;
}

export interface OrderFilters {
  patientId?: string;
  providerId?: string;
  pharmacyId?: string;
  status?: string;
  isPrescriptionRequired?: boolean;
  limit?: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  userType: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  type?: string;
  [key: string]: any;
}

export interface OrderAnalytics {
  totalOrders: number;
  prescriptionOrders: number;
  otcOrders: number;
  completedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  averageCompletionTime: number;
  recentActivity: Order[];
}

export interface UseOrderWorkflowReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  updateOrderStatus: (newStatus: string, details?: any) => Promise<void>;
  progressOrder: (details?: any) => Promise<void>;
  completeOrder: (completionDetails?: any) => Promise<void>;
  cancelOrder: (reason?: string) => Promise<void>;
}

export interface UseOrderListReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

export interface UseOrderNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export interface UseOrderAnalyticsReturn {
  analytics: OrderAnalytics;
  loading: boolean;
}

/**
 * Custom hook for managing order workflows with real-time updates
 */
export const useOrderWorkflow = (orderId: string | null): UseOrderWorkflowReturn => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  // Real-time order subscription
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const db = getFirebaseFirestore();
    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    const orderRef = doc(db, 'orders', orderId);
    
    const unsubscribe: Unsubscribe = onSnapshot(
      orderRef, 
      (doc) => {
        if (doc.exists()) {
          const orderData: Order = { id: doc.id, ...doc.data() } as Order;
          setOrder(orderData);
        } else {
          setError('Order not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to order updates:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // Update order status
  const updateOrderStatus = useCallback(async (newStatus: string, details: any = null): Promise<void> => {
    if (!orderId || updating) return;

    setUpdating(true);
    try {
      await orderWorkflowOrchestrator.updateOrderStatus(orderId, newStatus, details);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdating(false);
    }
  }, [orderId, updating]);

  // Progress order to next status
  const progressOrder = useCallback(async (details: any = null): Promise<void> => {
    if (!orderId || !order || updating) return;

    setUpdating(true);
    try {
      await orderWorkflowOrchestrator.progressOrder(orderId, details);
    } catch (error) {
      console.error('Error progressing order:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdating(false);
    }
  }, [orderId, order, updating]);

  // Handle order completion
  const completeOrder = useCallback(async (completionDetails: any = null): Promise<void> => {
    if (!orderId || updating) return;

    setUpdating(true);
    try {
      await orderWorkflowOrchestrator.completeOrder(orderId, completionDetails);
    } catch (error) {
      console.error('Error completing order:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdating(false);
    }
  }, [orderId, updating]);

  // Cancel order
  const cancelOrder = useCallback(async (reason: string | null = null): Promise<void> => {
    if (!orderId || updating) return;

    setUpdating(true);
    try {
      await orderWorkflowOrchestrator.cancelOrder(orderId, reason);
    } catch (error) {
      console.error('Error canceling order:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setUpdating(false);
    }
  }, [orderId, updating]);

  return {
    order,
    loading,
    error,
    updating,
    updateOrderStatus,
    progressOrder,
    completeOrder,
    cancelOrder
  };
};

/**
 * Custom hook for managing multiple orders with real-time updates
 */
export const useOrderList = (filters: OrderFilters = {}): UseOrderListReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseFirestore();
    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    let q: Query<DocumentData> = collection(db, 'orders');

    // Apply filters
    if (filters.patientId) {
      q = query(q, where('patientId', '==', filters.patientId));
    }
    if (filters.providerId) {
      q = query(q, where('providerId', '==', filters.providerId));
    }
    if (filters.pharmacyId) {
      q = query(q, where('pharmacyId', '==', filters.pharmacyId));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.isPrescriptionRequired !== undefined) {
      q = query(q, where('isPrescriptionRequired', '==', filters.isPrescriptionRequired));
    }

    // Order by created date (most recent first)
    q = query(q, orderBy('createdAt', 'desc'));

    // Limit results if specified
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData: Order[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Order));
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to orders:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filters]);

  return {
    orders,
    loading,
    error
  };
};

/**
 * Custom hook for order notifications
 */
export const useOrderNotifications = (
  userId: string | null, 
  userType: string = 'patient'
): UseOrderNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const db = getFirebaseFirestore();
    if (!db) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const notificationsData = await notificationService.getInAppNotifications(userId, userType);
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Set up real-time subscription for new notifications
    const q = query(
      collection(db, 'in_app_notifications'),
      where('userId', '==', userId),
      where('userType', '==', userType),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe: Unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [userId, userType]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          notificationService.markNotificationAsRead(n.id)
        )
      );
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
};

/**
 * Custom hook for order analytics
 */
export const useOrderAnalytics = (filters: OrderFilters = {}): UseOrderAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<OrderAnalytics>({
    totalOrders: 0,
    prescriptionOrders: 0,
    otcOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    canceledOrders: 0,
    averageCompletionTime: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const db = getFirebaseFirestore();
        if (!db) {
          setLoading(false);
          return;
        }

        let q: Query<DocumentData> = collection(db, 'orders');

        // Apply date filters if provided
        if (filters.startDate) {
          q = query(q, where('createdAt', '>=', filters.startDate));
        }
        if (filters.endDate) {
          q = query(q, where('createdAt', '<=', filters.endDate));
        }

        // Additional filters
        if (filters.providerId) {
          q = query(q, where('providerId', '==', filters.providerId));
        }
        if (filters.pharmacyId) {
          q = query(q, where('pharmacyId', '==', filters.pharmacyId));
        }

        const unsubscribe: Unsubscribe = onSnapshot(q, (querySnapshot) => {
          const orders: Order[] = querySnapshot.docs.map(doc => doc.data() as Order);
          
          const analyticsData: OrderAnalytics = {
            totalOrders: orders.length,
            prescriptionOrders: orders.filter(o => o.isPrescriptionRequired).length,
            otcOrders: orders.filter(o => !o.isPrescriptionRequired).length,
            completedOrders: orders.filter(o => 
              ['order_delivered', 'pharmacy_dispensed'].includes(o.status)
            ).length,
            pendingOrders: orders.filter(o => 
              !['order_delivered', 'pharmacy_dispensed', 'canceled'].includes(o.status)
            ).length,
            canceledOrders: orders.filter(o => o.status === 'canceled').length,
            averageCompletionTime: calculateAverageCompletionTime(orders),
            recentActivity: orders
              .filter(o => o.updatedAt)
              .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
              .slice(0, 10)
          };

          setAnalytics(analyticsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading order analytics:', error);
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [filters]);

  return {
    analytics,
    loading
  };
};

// Helper function to calculate average completion time
const calculateAverageCompletionTime = (orders: Order[]): number => {
  const completedOrders = orders.filter(o => 
    ['order_delivered', 'pharmacy_dispensed'].includes(o.status) &&
    o.createdAt && o.completedAt
  );

  if (completedOrders.length === 0) return 0;

  const totalTime = completedOrders.reduce((sum, order) => {
    const completionTime = (order.completedAt?.seconds || 0) - (order.createdAt?.seconds || 0);
    return sum + completionTime;
  }, 0);

  return Math.round(totalTime / completedOrders.length / 3600); // Convert to hours
};
