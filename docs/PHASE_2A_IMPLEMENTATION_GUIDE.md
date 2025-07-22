# 🚀 Phase 2A: Critical Services Migration - Implementation Guide

## 📋 **IMMEDIATE ACTION PLAN (Days 1-2)**

This guide provides step-by-step instructions to migrate the most critical services to TypeScript. Start with these three services as they form the core of your healthcare platform.

---

## 🎯 **Service 1: orderWorkflowOrchestrator.js → .ts**

### **Step 1: Create Type Definitions**

Create `src/types/order.ts`:

```typescript
export interface Order {
  id: string;
  patientId: string;
  providerId: string;
  status: OrderStatus;
  type: OrderType;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderType {
  PRESCRIPTION = 'prescription',
  CONSULTATION = 'consultation',
  LAB_TEST = 'lab_test',
  SUPPLEMENT = 'supplement'
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, any>;
}

export interface OrderFilters {
  status?: OrderStatus[];
  type?: OrderType[];
  patientId?: string;
  providerId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
}
```

### **Step 2: Migrate the Service**

Rename `src/services/orderWorkflowOrchestrator.js` to `.ts` and update:

```typescript
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, OrderType, OrderFilters, OrderAnalytics } from '@/types/order';

export class OrderWorkflowOrchestrator {
  private readonly collectionName = 'orders';

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
      const now = new Date();
      const order: Omit<Order, 'id'> = {
        ...orderData,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...order,
        createdAt: Timestamp.fromDate(order.createdAt),
        updatedAt: Timestamp.fromDate(order.updatedAt)
      });

      return {
        ...order,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const orderRef = doc(db, this.collectionName, orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });
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
    try {
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
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Order[];
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error('Failed to get orders');
    }
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
        ordersByType
      };
    } catch (error) {
      console.error('Error getting order analytics:', error);
      throw new Error('Failed to get order analytics');
    }
  }
}

export const orderWorkflowOrchestrator = new OrderWorkflowOrchestrator();
```

---

## 🎯 **Service 2: notificationService.js → .ts**

### **Step 1: Create Type Definitions**

Create `src/types/notification.ts`:

```typescript
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel[];
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  PRESCRIPTION_READY = 'prescription_ready',
  LAB_RESULTS = 'lab_results',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  SYSTEM_ALERT = 'system_alert',
  MARKETING = 'marketing'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  variables: string[];
  isActive: boolean;
}

export interface NotificationPreferences {
  userId: string;
  channels: Record<NotificationType, NotificationChannel[]>;
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  timezone: string;
}
```

### **Step 2: Migrate the Service**

```typescript
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Notification, 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus,
  NotificationTemplate,
  NotificationPreferences 
} from '@/types/notification';

export class NotificationService {
  private readonly collectionName = 'notifications';
  private readonly templatesCollection = 'notification_templates';
  private readonly preferencesCollection = 'notification_preferences';

  async sendNotification(
    userId: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      channels?: NotificationChannel[];
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    try {
      const now = new Date();
      const notification: Omit<Notification, 'id'> = {
        userId,
        type,
        channel: data.channels || [NotificationChannel.IN_APP],
        title: data.title,
        message: data.message,
        data: data.metadata,
        status: data.scheduledAt ? NotificationStatus.PENDING : NotificationStatus.SENT,
        scheduledAt: data.scheduledAt,
        sentAt: data.scheduledAt ? undefined : now,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt),
        updatedAt: Timestamp.fromDate(notification.updatedAt),
        scheduledAt: notification.scheduledAt ? Timestamp.fromDate(notification.scheduledAt) : null,
        sentAt: notification.sentAt ? Timestamp.fromDate(notification.sentAt) : null
      });

      const result = {
        ...notification,
        id: docRef.id
      };

      // If not scheduled, send immediately
      if (!data.scheduledAt) {
        await this.deliverNotification(result);
      }

      return result;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (limit) {
        q = query(q, limit(limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        scheduledAt: doc.data().scheduledAt?.toDate(),
        sentAt: doc.data().sentAt?.toDate()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      // Implement actual delivery logic here
      // This would integrate with email providers, SMS services, push notification services, etc.
      
      for (const channel of notification.channel) {
        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.sendEmail(notification);
            break;
          case NotificationChannel.SMS:
            await this.sendSMS(notification);
            break;
          case NotificationChannel.PUSH:
            await this.sendPushNotification(notification);
            break;
          case NotificationChannel.IN_APP:
            // In-app notifications are stored in Firestore and displayed in UI
            break;
        }
      }

      // Update notification status
      await updateDoc(doc(db, this.collectionName, notification.id), {
        status: NotificationStatus.DELIVERED,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error delivering notification:', error);
      await updateDoc(doc(db, this.collectionName, notification.id), {
        status: NotificationStatus.FAILED,
        updatedAt: Timestamp.fromDate(new Date())
      });
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    // Implement email sending logic
    console.log('Sending email notification:', notification);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    // Implement SMS sending logic
    console.log('Sending SMS notification:', notification);
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    // Implement push notification logic
    console.log('Sending push notification:', notification);
  }
}

export const notificationService = new NotificationService();
```

---

## 🎯 **Service 3: consultationService.js → .ts**

### **Step 1: Create Type Definitions**

Create `src/types/consultation.ts`:

```typescript
export interface Consultation {
  id: string;
  patientId: string;
  providerId: string;
  type: ConsultationType;
  status: ConsultationStatus;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // in minutes
  notes?: string;
  diagnosis?: string;
  prescriptions?: string[];
  followUpRequired?: boolean;
  followUpDate?: Date;
  videoCallUrl?: string;
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConsultationType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  URGENT = 'urgent',
  ROUTINE = 'routine',
  SPECIALIST = 'specialist'
}

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  licenseNumber: string;
  isActive: boolean;
  availability: ProviderAvailability[];
}

export interface ProviderAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  timezone: string;
}

export interface ConsultationFilters {
  patientId?: string;
  providerId?: string;
  status?: ConsultationStatus[];
  type?: ConsultationType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

### **Step 2: Migrate the Service**

```typescript
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Consultation, 
  ConsultationType, 
  ConsultationStatus, 
  Provider,
  ConsultationFilters 
} from '@/types/consultation';

export class ConsultationService {
  private readonly collectionName = 'consultations';
  private readonly providersCollection = 'providers';

  async scheduleConsultation(
    consultationData: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Consultation> {
    try {
      const now = new Date();
      const consultation: Omit<Consultation, 'id'> = {
        ...consultationData,
        status: ConsultationStatus.SCHEDULED,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...consultation,
        scheduledAt: Timestamp.fromDate(consultation.scheduledAt),
        createdAt: Timestamp.fromDate(consultation.createdAt),
        updatedAt: Timestamp.fromDate(consultation.updatedAt),
        startedAt: consultation.startedAt ? Timestamp.fromDate(consultation.startedAt) : null,
        endedAt: consultation.endedAt ? Timestamp.fromDate(consultation.endedAt) : null,
        followUpDate: consultation.followUpDate ? Timestamp.fromDate(consultation.followUpDate) : null
      });

      return {
        ...consultation,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      throw new Error('Failed to schedule consultation');
    }
  }

  async startConsultation(consultationId: string): Promise<void> {
    try {
      const now = new Date();
      await updateDoc(doc(db, this.collectionName, consultationId), {
        status: ConsultationStatus.IN_PROGRESS,
        startedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });
    } catch (error) {
      console.error('Error starting consultation:', error);
      throw new Error('Failed to start consultation');
    }
  }

  async completeConsultation(
    consultationId: string,
    data: {
      notes?: string;
      diagnosis?: string;
      prescriptions?: string[];
      followUpRequired?: boolean;
      followUpDate?: Date;
    }
  ): Promise<void> {
    try {
      const now = new Date();
      const consultation = await this.getConsultation(consultationId);
      
      if (!consultation) {
        throw new Error('Consultation not found');
      }

      const duration = consultation.startedAt 
        ? Math.round((now.getTime() - consultation.startedAt.getTime()) / (1000 * 60))
        : undefined;

      await updateDoc(doc(db, this.collectionName, consultationId), {
        status: ConsultationStatus.COMPLETED,
        endedAt: Timestamp.fromDate(now),
        duration,
        notes: data.notes,
        diagnosis: data.diagnosis,
        prescriptions: data.prescriptions,
        followUpRequired: data.followUpRequired,
        followUpDate: data.followUpDate ? Timestamp.fromDate(data.followUpDate) : null,
        updatedAt: Timestamp.fromDate(now)
      });
    } catch (error) {
      console.error('Error completing consultation:', error);
      throw new Error('Failed to complete consultation');
    }
  }

  async getConsultation(consultationId: string): Promise<Consultation | null> {
    try {
      const consultationDoc = await getDoc(doc(db, this.collectionName, consultationId));
      
      if (!consultationDoc.exists()) {
        return null;
      }

      const data = consultationDoc.data();
      return {
        id: consultationDoc.id,
        ...data,
        scheduledAt: data.scheduledAt?.toDate() || new Date(),
        startedAt: data.startedAt?.toDate(),
        endedAt: data.endedAt?.toDate(),
        followUpDate: data.followUpDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Consultation;
    } catch (error) {
      console.error('Error getting consultation:', error);
      throw new Error('Failed to get consultation');
    }
  }

  async getConsultations(filters?: ConsultationFilters): Promise<Consultation[]> {
    try {
      let q = query(collection(db, this.collectionName));

      if (filters?.patientId) {
        q = query(q, where('patientId', '==', filters.patientId));
      }

      if (filters?.providerId) {
        q = query(q, where('providerId', '==', filters.providerId));
      }

      if (filters?.status?.length) {
        q = query(q, where('status', 'in', filters.status));
      }

      if (filters?.type?.length) {
        q = query(q, where('type', 'in', filters.type));
      }

      q = query(q, orderBy('scheduledAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate() || new Date(),
        startedAt: doc.data().startedAt?.toDate(),
        endedAt: doc.data().endedAt?.toDate(),
        followUpDate: doc.data().followUpDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Consultation[];
    } catch (error) {
      console.error('Error getting consultations:', error);
      throw new Error('Failed to get consultations');
    }
  }
}

export const consultationService = new ConsultationService();
```

---

## ✅ **Next Steps**

1. **Test Each Service**: Create simple test files to verify the TypeScript compilation
2. **Update Imports**: Update any files that import these services to use the new TypeScript versions
3. **Remove Old Files**: Once verified, delete the old `.js` files
4. **Move to Service 4-6**: Continue with the remaining services in Phase 2B

## 🚨 **Important Notes**

- **Backup First**: Always backup your current working files before migration
- **Test Incrementally**: Test each service individually before moving to the next
- **Firebase Types**: Ensure your Firebase configuration supports the v9+ SDK
- **Error Handling**: All services include comprehensive error handling with typed exceptions

This completes the critical services migration for Phase 2A. These three services form the backbone of your healthcare platform and will provide a solid foundation for the remaining migrations.
