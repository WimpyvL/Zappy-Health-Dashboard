import twilio from 'twilio';
import { smsNotificationsService, patientsService, ordersService, BaseDocument } from '@/lib/database';

// --- Interfaces ---

interface SendSMSOptions {
  to: string;
  message: string;
  from?: string;
}

interface SMSLogOptions {
  type: string;
  recipientPhone: string;
  recipientId?: string;
  orderId?: string;
  prescriptionId?: string;
  appointmentId?: string;
  message: string;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
}

interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  countryCode: string;
  nationalFormat: string;
  error?: string;
}

// --- Configuration ---

const TWILIO_ACCOUNT_SID = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN; // This should be server-side only
const TWILIO_PHONE_NUMBER = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  console.warn('Twilio credentials not found. SMS service will be disabled.');
}

// --- SMS Message Templates ---

const SMS_TEMPLATES = {
  // Appointment related
  APPOINTMENT_REMINDER: (patientName: string, date: string, time: string) =>
    `Hi ${patientName}, this is a reminder of your appointment on ${date} at ${time}. Reply STOP to opt out.`,
  
  APPOINTMENT_CONFIRMATION: (patientName: string, date: string, time: string) =>
    `Hi ${patientName}, your appointment is confirmed for ${date} at ${time}. Reply STOP to opt out.`,
  
  APPOINTMENT_CANCELLED: (patientName: string, date: string) =>
    `Hi ${patientName}, your appointment on ${date} has been cancelled. Please call to reschedule. Reply STOP to opt out.`,

  // Order related
  ORDER_SHIPPED: (orderNumber: string, trackingNumber?: string) =>
    trackingNumber 
      ? `Your order #${orderNumber} has shipped! Track it with: ${trackingNumber}. Reply STOP to opt out.`
      : `Your order #${orderNumber} has shipped! You'll receive tracking info soon. Reply STOP to opt out.`,
  
  ORDER_DELIVERED: (orderNumber: string) =>
    `Your order #${orderNumber} has been delivered! Reply STOP to opt out.`,
  
  ORDER_DELAYED: (orderNumber: string, newDate?: string) =>
    newDate
      ? `Your order #${orderNumber} is delayed. New expected delivery: ${newDate}. Reply STOP to opt out.`
      : `Your order #${orderNumber} is delayed. We'll update you soon. Reply STOP to opt out.`,

  // Prescription related
  PRESCRIPTION_READY: (patientName: string, medicationName: string) =>
    `Hi ${patientName}, your prescription for ${medicationName} is ready for pickup. Reply STOP to opt out.`,
  
  PRESCRIPTION_APPROVED: (patientName: string, medicationName: string) =>
    `Hi ${patientName}, your prescription for ${medicationName} has been approved. Reply STOP to opt out.`,
  
  PRESCRIPTION_DENIED: (patientName: string, reason?: string) =>
    reason
      ? `Hi ${patientName}, your prescription request was denied: ${reason}. Please contact us. Reply STOP to opt out.`
      : `Hi ${patientName}, your prescription request was denied. Please contact us for details. Reply STOP to opt out.`,

  // Refill related
  REFILL_REMINDER: (patientName: string, medicationName: string, daysLeft: number) =>
    `Hi ${patientName}, you have ${daysLeft} days left of ${medicationName}. Time to refill! Reply STOP to opt out.`,
  
  REFILL_PROCESSED: (patientName: string, medicationName: string) =>
    `Hi ${patientName}, your refill for ${medicationName} is being processed. Reply STOP to opt out.`,

  // Payment related
  PAYMENT_FAILED: (patientName: string, amount: string) =>
    `Hi ${patientName}, your payment of $${amount} failed. Please update your payment method. Reply STOP to opt out.`,
  
  PAYMENT_REMINDER: (patientName: string, amount: string, dueDate: string) =>
    `Hi ${patientName}, you have an outstanding balance of $${amount} due ${dueDate}. Reply STOP to opt out.`,

  // General
  WELCOME: (patientName: string) =>
    `Welcome to Zappy Health, ${patientName}! We're here to help with your healthcare needs. Reply STOP to opt out.`,
  
  VERIFICATION_CODE: (code: string) =>
    `Your Zappy Health verification code is: ${code}. This code expires in 10 minutes.`,
};

// --- Phone Number Utilities ---

/**
 * Validates and formats a phone number
 */
const validateAndFormatPhone = async (phoneNumber: string): Promise<PhoneValidationResult> => {
  if (!twilioClient) {
    return {
      isValid: false,
      formatted: phoneNumber,
      countryCode: '',
      nationalFormat: phoneNumber,
      error: 'Twilio client not initialized',
    };
  }

  try {
    // Use Twilio's lookup service to validate and format the phone number
    const lookup = await twilioClient.lookups.v1.phoneNumbers(phoneNumber).fetch();
    
    return {
      isValid: true,
      formatted: lookup.phoneNumber,
      countryCode: lookup.countryCode || '',
      nationalFormat: lookup.nationalFormat || lookup.phoneNumber,
    };
  } catch (error: any) {
    // If lookup fails, try basic formatting
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      // US number without country code
      return {
        isValid: true,
        formatted: `+1${cleaned}`,
        countryCode: 'US',
        nationalFormat: `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`,
      };
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US number with country code
      return {
        isValid: true,
        formatted: `+${cleaned}`,
        countryCode: 'US',
        nationalFormat: `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`,
      };
    }
    
    return {
      isValid: false,
      formatted: phoneNumber,
      countryCode: '',
      nationalFormat: phoneNumber,
      error: error.message || 'Invalid phone number format',
    };
  }
};

// --- Core Functions ---

/**
 * Sends an SMS message using Twilio
 */
const sendSMS = async (options: SendSMSOptions) => {
  if (!twilioClient) {
    const errorMsg = 'SMS service is not configured.';
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const { to, message, from } = options;

  // Validate and format the phone number
  const phoneValidation = await validateAndFormatPhone(to);
  if (!phoneValidation.isValid) {
    return { 
      success: false, 
      error: `Invalid phone number: ${phoneValidation.error}` 
    };
  }

  try {
    const fromNumber = from || TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      return { 
        success: false, 
        error: 'No Twilio phone number configured' 
      };
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: phoneValidation.formatted,
    });

    return { 
      success: true, 
      messageSid: result.sid,
      formattedPhone: phoneValidation.formatted 
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

/**
 * Logs an SMS notification in the database
 */
const logSMSNotification = async (options: SMSLogOptions) => {
  const { 
    type, 
    recipientPhone, 
    recipientId, 
    orderId, 
    prescriptionId, 
    appointmentId,
    message,
    metadata, 
    success, 
    errorMessage 
  } = options;

  const result = await smsNotificationsService.create({
    type,
    recipient_phone: recipientPhone,
    recipient_id: recipientId || undefined,
    order_id: orderId || undefined,
    prescription_id: prescriptionId || undefined,
    appointment_id: appointmentId || undefined,
    message,
    metadata: metadata || {},
    success: success !== undefined ? success : true,
    error_message: errorMessage || undefined,
  });

  if (!result.success) {
    console.error('Error logging SMS notification:', result.error);
  }

  return result;
};

// --- Helper Functions ---

/**
 * Retrieves a patient's phone number by their ID
 */
const getPatientPhone = async (patientId: string): Promise<string | undefined> => {
  if (!patientId) return undefined;

  try {
    const { data: patient, error } = await patientsService.getById<BaseDocument & { 
      phone?: string; 
      mobile_phone?: string;
      primary_phone?: string;
    }>(patientId);

    if (error || !patient) {
      console.error(`Error getting patient ${patientId}:`, error);
      return undefined;
    }

    // Try different phone field names
    return patient.phone || patient.mobile_phone || patient.primary_phone || undefined;
  } catch (error: any) {
    console.error(`Error in getPatientPhone for patient ${patientId}:`, error);
    return undefined;
  }
};

/**
 * Retrieves a patient's name by their ID
 */
const getPatientName = async (patientId: string): Promise<string> => {
  if (!patientId) return 'Patient';

  try {
    const { data: patient, error } = await patientsService.getById<BaseDocument & { 
      first_name?: string; 
      last_name?: string;
      name?: string;
    }>(patientId);

    if (error || !patient) {
      return 'Patient';
    }

    if (patient.name) return patient.name;
    if (patient.first_name && patient.last_name) {
      return `${patient.first_name} ${patient.last_name}`;
    }
    if (patient.first_name) return patient.first_name;
    
    return 'Patient';
  } catch (error: any) {
    console.error(`Error in getPatientName for patient ${patientId}:`, error);
    return 'Patient';
  }
};

// --- Exported Service Functions ---

/**
 * Sends an appointment reminder SMS
 */
const sendAppointmentReminder = async (options: {
  patientId: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  recipientPhone?: string;
}) => {
  const { patientId, appointmentId, appointmentDate, appointmentTime, recipientPhone } = options;

  let toPhone = recipientPhone;
  if (!toPhone) {
    toPhone = await getPatientPhone(patientId);
  }

  if (!toPhone) {
    return { success: false, error: 'Recipient phone number not found' };
  }

  const patientName = await getPatientName(patientId);
  const message = SMS_TEMPLATES.APPOINTMENT_REMINDER(patientName, appointmentDate, appointmentTime);

  const smsResult = await sendSMS({
    to: toPhone,
    message,
  });

  const logOptions: SMSLogOptions = {
    type: 'appointment_reminder',
    recipientPhone: smsResult.formattedPhone || toPhone,
    message,
    success: smsResult.success,
    errorMessage: smsResult.error,
  };

  if (patientId) {
    logOptions.recipientId = patientId;
  }

  if (appointmentId) {
    logOptions.appointmentId = appointmentId;
  }

  await logSMSNotification(logOptions);

  return smsResult;
};

/**
 * Sends an order shipped notification SMS
 */
const sendOrderShippedNotification = async (options: {
  orderId: string;
  patientId?: string;
  trackingNumber?: string;
  recipientPhone?: string;
}) => {
  const { orderId, patientId, trackingNumber, recipientPhone } = options;

  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }

  const { data: order, error: orderError } = await ordersService.getById<any>(orderId);

  if (orderError || !order) {
    console.error('Error getting order details:', orderError);
    return { success: false, error: 'Failed to get order details' };
  }

  let toPhone = recipientPhone;
  const orderPatientId = patientId || order.patient_id;
  
  if (!toPhone && orderPatientId) {
    toPhone = await getPatientPhone(orderPatientId);
  }

  if (!toPhone) {
    return { success: false, error: 'Recipient phone number not found' };
  }

  const orderNumber = order.order_number || order.id;
  const message = SMS_TEMPLATES.ORDER_SHIPPED(orderNumber, trackingNumber);

  const smsResult = await sendSMS({
    to: toPhone,
    message,
  });

  const logOptions: SMSLogOptions = {
    type: 'order_shipped',
    recipientPhone: smsResult.formattedPhone || toPhone,
    message,
    metadata: { trackingNumber },
    success: smsResult.success,
    errorMessage: smsResult.error,
  };

  if (orderPatientId) {
    logOptions.recipientId = orderPatientId;
  }

  if (order.id) {
    logOptions.orderId = order.id;
  }

  await logSMSNotification(logOptions);

  return smsResult;
};

/**
 * Sends a prescription ready notification SMS
 */
const sendPrescriptionReadyNotification = async (options: {
  prescriptionId: string;
  patientId: string;
  medicationName: string;
  recipientPhone?: string;
}) => {
  const { prescriptionId, patientId, medicationName, recipientPhone } = options;

  let toPhone = recipientPhone;
  if (!toPhone) {
    toPhone = await getPatientPhone(patientId);
  }

  if (!toPhone) {
    return { success: false, error: 'Recipient phone number not found' };
  }

  const patientName = await getPatientName(patientId);
  const message = SMS_TEMPLATES.PRESCRIPTION_READY(patientName, medicationName);

  const smsResult = await sendSMS({
    to: toPhone,
    message,
  });

  const logOptions: SMSLogOptions = {
    type: 'prescription_ready',
    recipientPhone: smsResult.formattedPhone || toPhone,
    message,
    metadata: { medicationName },
    success: smsResult.success,
    errorMessage: smsResult.error,
  };

  if (patientId) {
    logOptions.recipientId = patientId;
  }

  if (prescriptionId) {
    logOptions.prescriptionId = prescriptionId;
  }

  await logSMSNotification(logOptions);

  return smsResult;
};

/**
 * Sends a refill reminder SMS
 */
const sendRefillReminder = async (options: {
  patientId: string;
  medicationName: string;
  daysLeft: number;
  prescriptionId?: string;
  recipientPhone?: string;
}) => {
  const { patientId, medicationName, daysLeft, prescriptionId, recipientPhone } = options;

  let toPhone = recipientPhone;
  if (!toPhone) {
    toPhone = await getPatientPhone(patientId);
  }

  if (!toPhone) {
    return { success: false, error: 'Recipient phone number not found' };
  }

  const patientName = await getPatientName(patientId);
  const message = SMS_TEMPLATES.REFILL_REMINDER(patientName, medicationName, daysLeft);

  const smsResult = await sendSMS({
    to: toPhone,
    message,
  });

  const logOptions: SMSLogOptions = {
    type: 'refill_reminder',
    recipientPhone: smsResult.formattedPhone || toPhone,
    message,
    metadata: { medicationName, daysLeft },
    success: smsResult.success,
    errorMessage: smsResult.error,
  };

  if (patientId) {
    logOptions.recipientId = patientId;
  }

  if (prescriptionId) {
    logOptions.prescriptionId = prescriptionId;
  }

  await logSMSNotification(logOptions);

  return smsResult;
};

/**
 * Sends a verification code SMS
 */
const sendVerificationCode = async (options: {
  phone: string;
  code: string;
  patientId?: string;
}) => {
  const { phone, code, patientId } = options;

  const message = SMS_TEMPLATES.VERIFICATION_CODE(code);

  const smsResult = await sendSMS({
    to: phone,
    message,
  });

  const logOptions: SMSLogOptions = {
    type: 'verification_code',
    recipientPhone: smsResult.formattedPhone || phone,
    message,
    metadata: { code },
    success: smsResult.success,
    errorMessage: smsResult.error,
  };

  if (patientId) {
    logOptions.recipientId = patientId;
  }

  await logSMSNotification(logOptions);

  return smsResult;
};

// --- Main Service Export ---

const smsNotificationService = {
  // Core functions
  sendSMS,
  validateAndFormatPhone,
  
  // Specific notification types
  sendAppointmentReminder,
  sendOrderShippedNotification,
  sendPrescriptionReadyNotification,
  sendRefillReminder,
  sendVerificationCode,
  
  // Helper functions
  getPatientPhone,
  getPatientName,
  
  // Templates (for external use)
  templates: SMS_TEMPLATES,
};

export default smsNotificationService;
