
/**
 * @fileoverview Service for handling notifications, such as email or SMS.
 * This service will call Firebase Cloud Functions to trigger backend actions.
 */

// In a real app, you would get the function URL from environment variables.
const SEND_NOTIFICATION_URL = 'https://us-central1-zappy-health-c1kob.cloudfunctions.net/sendProviderNotification';

class NotificationService {
  /**
   * Notifies a provider about a new consultation.
   * @param {object} params - The notification parameters.
   * @param {string} params.providerEmail - The email of the provider to notify.
   * @param {string} params.patientName - The name of the patient.
   * @param {string} params.consultationId - The ID of the new consultation.
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  async notifyProviderOfNewConsultation({ providerEmail, patientName, consultationId }) {
    if (!providerEmail || !patientName || !consultationId) {
      const errorMsg = "Missing information for provider notification.";
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const response = await fetch(SEND_NOTIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerEmail,
          patientName,
          consultationId,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to send notification: ${response.status} ${errorBody}`);
      }

      const result = await response.json();
      console.log("Notification service response:", result.message);
      return { success: true, message: result.message };

    } catch (error) {
      console.error('Error sending provider notification:', error);
      return { success: false, error: error.message };
    }
  }
}

export const notificationService = new NotificationService();
