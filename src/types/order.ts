
import { Timestamp } from 'firebase/firestore';
import { BaseDocument } from './global';

export interface Order extends BaseDocument {
  patientId: string;
  providerId?: string;
  status: OrderStatus;
  type: OrderType;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned'
}

export enum OrderType {
  PRESCRIPTION = 'prescription',
  CONSULTATION = 'consultation',
  LAB_TEST = 'lab_test',
  SUPPLEMENT = 'supplement',
  MEDICAL_DEVICE = 'medical_device',
  TELEHEALTH_SESSION = 'telehealth_session'
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionId?: string;
  dosage?: string;
  instructions?: string;
  metadata?: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus[];
  type?: OrderType[];
  patientId?: string;
  providerId?: string;
  paymentStatus?: PaymentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orderCount: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface OrderUpdateData {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderData {
  patientId: string;
  providerId: string;
  type: OrderType;
  items: Omit<OrderItem, 'id'>[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  notes?: string;
  metadata?: Record<string, any>;
}
