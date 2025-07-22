/**
 * @fileoverview Service for automated notifications (SMS, Email, Push) for order status updates
 */
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

class NotificationService {
  
  /**
   * Notification Types
   */
  static NOTIFICATION_TYPES = {
    SMS: 'sms',
    EMAIL: 'email',
    PUSH: 'push',
    IN_APP: 'in_app'
  };

  /**
   * Notification Categories
   */
  static CATEGORIES = {
    ORDER_STATUS: 'order_status',
    PRESCRIPTION_READY: 'prescription_ready',
    APPOINTMENT_REMINDER: 'appointment_reminder',
    PAYMENT_REQUIRED: 'payment_required',
    PROVIDER_MESSAGE: 'provider_message',
    SYSTEM_ALERT: 'system_alert'
  };

  /**
   * Priority Levels
   */
  static PRIORITIES = {
    LOW: 'low',
    NORMAL: 'normal', 
    HIGH: 'high',
    URGENT: 'urgent'
  };

  /**
   * Sends order status notification to patient and relevant parties
   */
  async sendOrderStatusNotification(orderId, newStatus, orderData) {
    try {
      // Get notification preferences for patient and provider
      const patientPrefs = await this.getNotificationPreferences(orderData.patientId, 'patient');
      const providerPrefs = orderData.providerId ? 
        await this.getNotificationPreferences(orderData.providerId, 'provider') : null;

      // Determine notification content based on status
      const notificationContent = this.getStatusNotificationContent(newStatus, orderData);
      
      // Send patient notifications
      if (patientPrefs && this.shouldNotifyPatient(newStatus)) {
        await this.sendPatientNotifications(orderData.patientId, notificationContent.patient, patientPrefs);
      }

      // Send provider notifications
      if (providerPrefs && this.shouldNotifyProvider(newStatus)) {
        await this.sendProviderNotifications(orderData.providerId, notificationContent.provider, providerPrefs);
      }

      // Send pharmacy notifications if applicable
      if (orderData.pharmacyId && this.shouldNotifyPharmacy(newStatus)) {
        await this.sendPharmacyNotifications(orderData.pharmacyId, notificationContent.pharmacy, orderData);
      }

      // Log notification activity
      await this.logNotificationActivity(orderId, newStatus, {
        patientNotified: !!patientPrefs,
        providerNotified: !!providerPrefs,
        pharmacyNotified: !!orderData.pharmacyId
      });

      return { success: true };

    } catch (error) {
      console.error('Error sending order status notification:', error);
      throw error;
    }
  }

  /**
   * Gets notification content based on order status
   */
  getStatusNotificationContent(status, orderData) {
    const medicationName = orderData.medication || 'your medication';
    
    const contentMap = {
      consultation_pending: {
        patient: {
          title: 'Consultation Scheduled',
          message: `Your consultation for ${medicationName} has been scheduled. Please complete your intake form.`,
          action: 'Complete Intake',
          actionUrl: `/dashboard/intake/${orderData.consultationId}`
        },
        provider: {
          title: 'New Consultation Request',
          message: `New consultation request for ${medicationName} from patient ${orderData.patientName}`,
          action: 'Review Request',
          actionUrl: `/dashboard/consultations/${orderData.consultationId}`
        }
      },

      provider_review: {
        patient: {
          title: 'Under Provider Review',
          message: `Your consultation for ${medicationName} is being reviewed by our medical team.`,
          action: 'View Status',
          actionUrl: `/dashboard/orders/${orderData.id}`
        },
        provider: {
          title: 'Consultation Ready for Review',
          message: `Patient consultation for ${medicationName} is ready for your review.`,
          action: 'Review Now',
          actionUrl: `/dashboard/consultations/${orderData.consultationId}`
        }
      },

      provider_approved: {
        patient: {
          title: 'Consultation Approved',
          message: `Great news! Your consultation for ${medicationName} has been approved by our medical team.`,
          action: 'View Details',
          actionUrl: `/dashboard/orders/${orderData.id}`
        }
      },

      prescription_sent: {
        patient: {
          title: 'Prescription Sent to Pharmacy',
          message: `Your prescription for ${medicationName} has been sent to ${orderData.pharmacyName || 'your pharmacy'}.`,
          action: 'Track Order',
          actionUrl: `/dashboard/orders/${orderData.id}`
        },
        pharmacy: {
          title: 'New Prescription Received',
          message: `New prescription for ${medicationName} received for patient ${orderData.patientName}`,
          action: 'Process Prescription',
          orderDetails: orderData
        }
      },

      pharmacy_filling: {
        patient: {
          title: 'Prescription Being Filled',
          message: `Your prescription for ${medicationName} is currently being filled at ${orderData.pharmacyName || 'the pharmacy'}.`,
          action: 'Track Progress',
          actionUrl: `/dashboard/orders/${orderData.id}`
        }
      },

      pharmacy_ready: {
        patient: {
          title: 'Prescription Ready for Pickup',
          message: `Your prescription for ${medicationName} is ready for pickup at ${orderData.pharmacyName || 'the pharmacy'}!`,
          action: 'View Pickup Details',
          actionUrl: `/dashboard/orders/${orderData.id}`,
          priority: NotificationService.PRIORITIES.HIGH
        }
      },

      pharmacy_dispensed: {
        patient: {
          title: 'Prescription Picked Up',
          message: `Thank you for picking up your prescription for ${medicationName}. Take care!`,
          action: 'Leave Feedback',
          actionUrl: `/dashboard/feedback/${orderData.id}`
        }
      },

      order_shipped: {
        patient: {
          title: 'Order Shipped',
          message: `Your order for ${medicationName} has been shipped! Tracking: ${orderData.trackingNumber || 'Available soon'}`,
          action: 'Track Package',
          actionUrl: `/dashboard/orders/${orderData.id}`
        }
      },

      order_delivered: {
        patient: {
          title: 'Order Delivered',
          message: `Your order for ${medicationName} has been delivered. Thank you for choosing our service!`,
          action: 'Leave Review',
          actionUrl: `/dashboard/feedback/${orderData.id}`
        }
      }
    };

    return contentMap[status] || {
      patient: {
        title: 'Order Update',
        message: `Your order status has been updated.`,
        action: 'View Order',
        actionUrl: `/dashboard/orders/${orderData.id}`
      }
    };
  }

  /**
   * Sends notifications to patient based on preferences
   */
  async sendPatientNotifications(patientId, content, preferences) {
    try {
      const notifications = [];

      // SMS notification
      if (preferences.sms?.enabled && preferences.sms?.orderUpdates) {
        const smsNotification = await this.sendSMS(
          preferences.sms.phoneNumber,
          this.formatSMSMessage(content),
          { patientId, category: NotificationService.CATEGORIES.ORDER_STATUS }
        );
        notifications.push(smsNotification);
      }

      // Email notification
      if (preferences.email?.enabled && preferences.email?.orderUpdates) {
        const emailNotification = await this.sendEmail(
          preferences.email.emailAddress,
          content.title,
          this.formatEmailMessage(content),
          { patientId, category: NotificationService.CATEGORIES.ORDER_STATUS }
        );
        notifications.push(emailNotification);
      }

      // Push notification
      if (preferences.push?.enabled && preferences.push?.orderUpdates) {
        const pushNotification = await this.sendPushNotification(
          patientId,
          content.title,
          content.message,
          { category: NotificationService.CATEGORIES.ORDER_STATUS, actionUrl: content.actionUrl }
        );
        notifications.push(pushNotification);
      }

      // In-app notification (always sent)
      const inAppNotification = await this.createInAppNotification(
        patientId,
        content.title,
        content.message,
        { 
          category: NotificationService.CATEGORIES.ORDER_STATUS,
          actionUrl: content.actionUrl,
          priority: content.priority || NotificationService.PRIORITIES.NORMAL
        }
      );
      notifications.push(inAppNotification);

      return notifications;

    } catch (error) {
      console.error('Error sending patient notifications:', error);
      throw error;
    }
  }

  /**
   * Sends notifications to provider
   */
  async sendProviderNotifications(providerId, content, preferences) {
    try {
      const notifications = [];

      // Email notification (primary for providers)
      if (preferences.email?.enabled) {
        const emailNotification = await this.sendEmail(
          preferences.email.emailAddress,
          content.title,
          this.formatEmailMessage(content),
          { providerId, category: NotificationService.CATEGORIES.ORDER_STATUS }
        );
        notifications.push(emailNotification);
      }

      // In-app notification
      const inAppNotification = await this.createInAppNotification(
        providerId,
        content.title,
        content.message,
        { 
          category: NotificationService.CATEGORIES.ORDER_STATUS,
          actionUrl: content.actionUrl,
          userType: 'provider'
        }
      );
      notifications.push(inAppNotification);

      return notifications;

    } catch (error) {
      console.error('Error sending provider notifications:', error);
      throw error;
    }
  }

  /**
   * Sends SMS notification
   */
  async sendSMS(phoneNumber, message, metadata = {}) {
    try {
      // In a real implementation, this would integrate with Twilio, AWS SNS, etc.
      console.log(`SMS to ${phoneNumber}: ${message}`);
      
      // Create notification record
      const notificationRecord = {
        type: NotificationService.NOTIFICATION_TYPES.SMS,
        recipient: phoneNumber,
        message: message,
        status: 'sent',
        sentAt: Timestamp.now(),
        metadata: metadata
      };

      const notificationRef = await addDoc(collection(db, "notifications"), notificationRecord);
      
      return {
        success: true,
        notificationId: notificationRef.id,
        type: 'sms'
      };

    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message,
        type: 'sms'
      };
    }
  }

  /**
   * Sends email notification
   */
  async sendEmail(emailAddress, subject, message, metadata = {}) {
    try {
      // In a real implementation, this would integrate with SendGrid, AWS SES, etc.
      console.log(`Email to ${emailAddress}: ${subject}\n${message}`);
      
      // Create notification record
      const notificationRecord = {
        type: NotificationService.NOTIFICATION_TYPES.EMAIL,
        recipient: emailAddress,
        subject: subject,
        message: message,
        status: 'sent',
        sentAt: Timestamp.now(),
        metadata: metadata
      };

      const notificationRef = await addDoc(collection(db, "notifications"), notificationRecord);
      
      return {
        success: true,
        notificationId: notificationRef.id,
        type: 'email'
      };

    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message,
        type: 'email'
      };
    }
  }

  /**
   * Sends push notification
   */
  async sendPushNotification(userId, title, body, metadata = {}) {
    try {
      // In a real implementation, this would integrate with FCM, APNS, etc.
      console.log(`Push to ${userId}: ${title} - ${body}`);
      
      // Create notification record
      const notificationRecord = {
        type: NotificationService.NOTIFICATION_TYPES.PUSH,
        recipient: userId,
        title: title,
        body: body,
        status: 'sent',
        sentAt: Timestamp.now(),
        metadata: metadata
      };

      const notificationRef = await addDoc(collection(db, "notifications"), notificationRecord);
      
      return {
        success: true,
        notificationId: notificationRef.id,
        type: 'push'
      };

    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: error.message,
        type: 'push'
      };
    }
  }

  /**
   * Creates in-app notification
   */
  async createInAppNotification(userId, title, message, metadata = {}) {
    try {
      const notificationRecord = {
        type: NotificationService.NOTIFICATION_TYPES.IN_APP,
        userId: userId,
        title: title,
        message: message,
        read: false,
        createdAt: Timestamp.now(),
        priority: metadata.priority || NotificationService.PRIORITIES.NORMAL,
        category: metadata.category || NotificationService.CATEGORIES.ORDER_STATUS,
        actionUrl: metadata.actionUrl,
        userType: metadata.userType || 'patient'
      };

      const notificationRef = await addDoc(collection(db, "in_app_notifications"), notificationRecord);
      
      return {
        success: true,
        notificationId: notificationRef.id,
        type: 'in_app'
      };

    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return {
        success: false,
        error: error.message,
        type: 'in_app'
      };
    }
  }

  /**
   * Gets user notification preferences
   */
  async getNotificationPreferences(userId, userType = 'patient') {
    try {
      const userRef = doc(db, userType === 'provider' ? 'providers' : 'patients', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return this.getDefaultNotificationPreferences();
      }

      const userData = userSnap.data();
      return userData.notificationPreferences || this.getDefaultNotificationPreferences();

    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultNotificationPreferences();
    }
  }

  /**
   * Default notification preferences
   */
  getDefaultNotificationPreferences() {
    return {
      sms: {
        enabled: true,
        orderUpdates: true,
        appointmentReminders: true,
        prescriptionReady: true,
        phoneNumber: null
      },
      email: {
        enabled: true,
        orderUpdates: true,
        appointmentReminders: true,
        prescriptionReady: true,
        marketing: false,
        emailAddress: null
      },
      push: {
        enabled: true,
        orderUpdates: true,
        appointmentReminders: true,
        prescriptionReady: true,
        marketing: false
      }
    };
  }

  /**
   * Determines if patient should be notified for this status
   */
  shouldNotifyPatient(status) {
    const patientNotificationStatuses = [
      'provider_approved',
      'prescription_sent',
      'pharmacy_filling',
      'pharmacy_ready',
      'pharmacy_dispensed',
      'order_shipped',
      'order_delivered',
      'payment_pending'
    ];
    
    return patientNotificationStatuses.includes(status);
  }

  /**
   * Determines if provider should be notified for this status
   */
  shouldNotifyProvider(status) {
    const providerNotificationStatuses = [
      'consultation_pending',
      'provider_review',
      'intake_completed'
    ];
    
    return providerNotificationStatuses.includes(status);
  }

  /**
   * Determines if pharmacy should be notified for this status
   */
  shouldNotifyPharmacy(status) {
    const pharmacyNotificationStatuses = [
      'prescription_sent'
    ];
    
    return pharmacyNotificationStatuses.includes(status);
  }

  /**
   * Formats message for SMS
   */
  formatSMSMessage(content) {
    return `${content.title}: ${content.message}`;
  }

  /**
   * Formats message for email
   */
  formatEmailMessage(content) {
    return `
      <h2>${content.title}</h2>
      <p>${content.message}</p>
      ${content.action && content.actionUrl ? 
        `<p><a href="${content.actionUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">${content.action}</a></p>` : 
        ''
      }
      <p><small>This is an automated message from your telehealth provider.</small></p>
    `;
  }

  /**
   * Logs notification activity
   */
  async logNotificationActivity(orderId, status, metadata) {
    try {
      const logRecord = {
        orderId: orderId,
        status: status,
        timestamp: Timestamp.now(),
        ...metadata
      };

      await addDoc(collection(db, "notification_logs"), logRecord);
      
    } catch (error) {
      console.error('Error logging notification activity:', error);
    }
  }

  /**
   * Gets in-app notifications for user
   */
  async getInAppNotifications(userId, userType = 'patient', limit = 20) {
    try {
      const q = query(
        collection(db, "in_app_notifications"),
        where("userId", "==", userId),
        where("userType", "==", userType)
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return notifications.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds).slice(0, limit);

    } catch (error) {
      console.error('Error getting in-app notifications:', error);
      return [];
    }
  }

  /**
   * Marks notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, "in_app_notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: Timestamp.now()
      });

      return { success: true };

    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();