import { Timestamp } from 'firebase/firestore';
import { BaseDocument } from './global';

export interface Notification extends BaseDocument {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel[];
  title: string;
  message: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  scheduledAt?: Timestamp;
  sentAt?: Timestamp;
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
