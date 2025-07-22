/**
 * @fileoverview Service for handling user notifications via various channels.
 */
import { Timestamp, collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification, NotificationChannel, NotificationStatus, NotificationType } from '@/types/notification';

class NotificationService {
  private readonly collectionName = 'notifications';

  /**
   * Sends a notification to a user.
   * @param userId The ID of the user to notify.
   * @param data The notification data.
   * @returns The created notification object.
   */
  async sendNotification(
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      channels?: NotificationChannel[];
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    const now = new Date();
    const notification: Omit<Notification, 'id'> = {
      userId,
      type: data.type,
      channel: data.channels || [NotificationChannel.IN_APP],
      title: data.title,
      message: data.message,
      data: data.metadata,
      status: data.scheduledAt ? NotificationStatus.PENDING : NotificationStatus.SENT,
      scheduledAt: data.scheduledAt ? Timestamp.fromDate(data.scheduledAt) : undefined,
      sentAt: data.scheduledAt ? undefined : Timestamp.fromDate(now),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      read: false,
    };

    const docRef = await addDoc(collection(db, this.collectionName), notification);
    const result: Notification = { ...notification, id: docRef.id };

    if (!data.scheduledAt) {
      await this.deliverNotification(result);
    }

    return result;
  }

  /**
   * Delivers a notification through its specified channels.
   * @param notification The notification to deliver.
   */
  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      // In a real app, this would integrate with email, SMS, and push notification services.
      // For now, we'll log the delivery.
      for (const channel of notification.channel) {
        switch (channel) {
          case NotificationChannel.EMAIL:
            console.log(`Sending email for notification: ${notification.id}`);
            break;
          case NotificationChannel.SMS:
            console.log(`Sending SMS for notification: ${notification.id}`);
            break;
          case NotificationChannel.PUSH:
            console.log(`Sending push notification for notification: ${notification.id}`);
            break;
        }
      }

      await updateDoc(doc(db, this.collectionName, notification.id), {
        status: NotificationStatus.DELIVERED,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error delivering notification ${notification.id}:`, error);
      await updateDoc(doc(db, this.collectionName, notification.id), {
        status: NotificationStatus.FAILED,
        updatedAt: Timestamp.now(),
      });
    }
  }
}

export const notificationService = new NotificationService();
