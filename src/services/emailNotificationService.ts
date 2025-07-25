import sgMail from '@sendgrid/mail';
import { emailNotificationsService, patientsService, ordersService, BaseDocument } from '@/lib/database';
import { getFirebaseAuth } from '@/lib/firebase';

// --- Interfaces ---

interface SendEmailOptions {
  to: string;
  templateId: string;
  dynamicData: Record<string, any>;
  subject?: string;
  from?: string;
  fromName?: string;
}

interface EmailLogOptions {
  type: string;
  recipientEmail: string;
  recipientId?: string;
  orderId?: string;
  prescriptionId?: string;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

// --- Configuration ---

const SENDGRID_API_KEY = process.env.NEXT_PUBLIC_SENDGRID_API_KEY;
const FROM_EMAIL = process.env.NEXT_PUBLIC_SENDGRID_FROM_EMAIL || 'notifications@zappy.health';
const FROM_NAME = process.env.NEXT_PUBLIC_SENDGRID_FROM_NAME || 'Zappy Health';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('SendGrid API key not found. Email service will be disabled.');
}

// --- Email Templates ---

const EMAIL_TEMPLATES = {
  // Order related templates
  ORDER_CONFIRMATION: 'd-abc123456789', // Replace with actual template IDs
  ORDER_SHIPPED: 'd-def123456789',
  ORDER_DELIVERED: 'd-ghi123456789',
  ORDER_DELAYED: 'd-jkl123456789',

  // Prescription related templates
  PRESCRIPTION_RECEIVED: 'd-mno123456789',
  PRESCRIPTION_UNDER_REVIEW: 'd-pqr123456789',
  PRESCRIPTION_APPROVED: 'd-stu123456789',
  PRESCRIPTION_DENIED: 'd-vwx123456789',
  PRESCRIPTION_REQUIRES_INFO: 'd-yz0123456789',

  // Refill related templates
  REFILL_REMINDER: 'd-123abc456def',
  REFILL_PROCESSED: 'd-456def789ghi',
  REFILL_READY: 'd-789ghi012jkl',

  // General templates
  WELCOME: 'd-012jkl345mno',
  PASSWORD_RESET: 'd-345mno678pqr',
  ACCOUNT_VERIFICATION: 'd-678pqr901stu',
};

// --- Core Functions ---

/**
 * Sends an email using SendGrid.
 */
const sendEmail = async (options: SendEmailOptions) => {
  if (!SENDGRID_API_KEY) {
    const errorMsg = 'Email service is not configured.';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const { to, templateId, dynamicData, subject } = options;

  const msg = {
    to,
    from: {
      email: options.from || FROM_EMAIL,
      name: options.fromName || FROM_NAME,
    },
    templateId,
    dynamic_template_data: dynamicData,
    subject: subject || 'Zappy Health Notification', // Provide a default subject
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message, details: error.response?.body };
  }
};

/**
 * Logs an email notification in the database.
 */
const logEmailNotification = async (options: EmailLogOptions) => {
  const { type, recipientEmail, recipientId, orderId, prescriptionId, metadata, success, errorMessage } = options;

  const result = await emailNotificationsService.create({
    type,
    recipient_email: recipientEmail,
    recipient_id: recipientId,
    order_id: orderId,
    prescription_id: prescriptionId,
    metadata: metadata || {},
    success: success !== undefined ? success : true,
    error_message: errorMessage,
  });

  if (!result.success) {
    console.error('Error logging email notification:', result.error);
  }

  return result;
};

// --- Helper Functions ---

/**
 * Retrieves a patient's email address by their ID.
 */
const getPatientEmail = async (patientId: string): Promise<string | null> => {
    if (!patientId) return null;

    try {
        const { data: patient, error } = await patientsService.getById<BaseDocument & { email?: string; user_id?: string }>(patientId);

        if (error || !patient) {
            console.error(`Error getting patient ${patientId}:`, error);
            return null;
        }

        if (patient.email) {
            return patient.email;
        }

        // As a fallback, try to get the email from the auth user if user_id is available
        if (patient.user_id) {
            try {
                const auth = getFirebaseAuth();
                // This will not work on the client side. This needs to be a backend function.
                // const userRecord = await auth.getUser(patient.user_id);
                // return userRecord.email || null;
                return null;
            } catch (authError) {
                console.error(`Error getting auth user ${patient.user_id}:`, authError);
                return null;
            }
        }

        return null;
    } catch (error: any) {
        console.error(`Error in getPatientEmail for patient ${patientId}:`, error);
        return null;
    }
};

// --- Exported Service Functions ---

// ... (Implementation of sendOrderConfirmationEmail, sendOrderShippedEmail, etc. will go here)
// For now, we'll just export the core functions and a placeholder.

const sendOrderConfirmationEmail = async (options: { orderId: string; patientId?: string; recipientEmail?: string }) => {
  const { orderId, patientId, recipientEmail } = options;

  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }

  const { data: order, error: orderError } = await ordersService.getById<any>(orderId);

  if (orderError || !order) {
    console.error('Error getting order details:', orderError);
    return { success: false, error: 'Failed to get order details' };
  }

  let toEmail = recipientEmail;
  if (!toEmail && patientId) {
    toEmail = await getPatientEmail(patientId);
  } else if (!toEmail && order.patient_id) {
    toEmail = await getPatientEmail(order.patient_id);
  }

  if (!toEmail) {
    return { success: false, error: 'Recipient email not found' };
  }

  // NOTE: This assumes the order object has the necessary fields.
  // You may need to fetch related data (like order items) separately if they are not embedded.
  const dynamicData = {
    order_id: order.id,
    order_number: order.order_number || order.id,
    order_date: order.createdAt.toDate().toLocaleDateString(),
    customer_name: 'Valued Customer', // Placeholder
    total: order.total_amount?.toFixed(2) || 'N/A',
    order_status_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.id}`,
  };

  const emailResult = await sendEmail({
    to: toEmail,
    templateId: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
    dynamicData,
    subject: `Your Zappy Health Order Confirmation #${order.order_number || order.id}`,
  });

  const logOptions: EmailLogOptions = {
    type: 'order_confirmation',
    recipientEmail: toEmail,
    success: emailResult.success,
    errorMessage: emailResult.error,
  };

  if (order.patient_id) {
    logOptions.recipientId = order.patient_id;
  }

  if (order.id) {
    logOptions.orderId = order.id;
  }

  await logEmailNotification(logOptions);

  return emailResult;
};


const emailNotificationService = {
  sendOrderConfirmationEmail,
  // Add other exported functions here
};

export default emailNotificationService;
