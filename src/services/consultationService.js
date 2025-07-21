/**
 * Consultation Service - Firebase Implementation
 *
 * This service handles the creation and management of consultations,
 * including saving consultation data, AI integration, and workflow management.
 */

import { doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { consultationAI } from './consultationAI';

/**
 * Save consultation data to Firebase
 * @param {string} sessionId - The session ID
 * @param {Object} consultationData - The consultation data to save
 * @returns {Promise<Object>} The saved consultation data
 */
export const saveConsultationData = async (sessionId, consultationData) => {
  try {
    console.log(`[ConsultationService] Saving consultation data for session: ${sessionId}`);

    const sessionRef = doc(db, "sessions", sessionId);
    
    // Prepare the update data
    const updateData = {
      ...consultationData,
      updatedAt: serverTimestamp(),
      lastModified: new Date().toISOString()
    };

    // Save to Firebase
    await updateDoc(sessionRef, updateData);

    console.log(`[ConsultationService] Successfully saved consultation data`);
    return { success: true, data: updateData };
  } catch (error) {
    console.error('[ConsultationService] Error saving consultation data:', error);
    throw new Error(`Failed to save consultation: ${error.message}`);
  }
};

/**
 * Auto-save consultation data with debouncing
 * @param {string} sessionId - The session ID
 * @param {Object} consultationData - The consultation data to save
 * @param {number} delay - Debounce delay in milliseconds (default: 2000)
 * @returns {Promise<void>}
 */
let autoSaveTimeout = null;
export const autoSaveConsultationData = async (sessionId, consultationData, delay = 2000) => {
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  // Set new timeout for auto-save
  autoSaveTimeout = setTimeout(async () => {
    try {
      await saveConsultationData(sessionId, {
        ...consultationData,
        autoSaved: true,
        autoSavedAt: new Date().toISOString()
      });
      console.log(`[ConsultationService] Auto-saved consultation data for session: ${sessionId}`);
    } catch (error) {
      console.error('[ConsultationService] Auto-save failed:', error);
    }
  }, delay);
};

/**
 * Complete a consultation and update status
 * @param {string} sessionId - The session ID
 * @param {Object} finalData - The final consultation data
 * @returns {Promise<Object>} The completed consultation
 */
export const completeConsultation = async (sessionId, finalData) => {
  try {
    console.log(`[ConsultationService] Completing consultation for session: ${sessionId}`);

    const sessionRef = doc(db, "sessions", sessionId);
    
    const completionData = {
      ...finalData,
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isCompleted: true
    };

    await updateDoc(sessionRef, completionData);

    // Create a consultation record in the consultations collection
    const consultationRef = await addDoc(collection(db, "consultations"), {
      sessionId: sessionId,
      patientId: finalData.patientId,
      providerId: finalData.providerId || null,
      status: 'completed',
      consultationData: finalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[ConsultationService] Consultation completed with ID: ${consultationRef.id}`);
    return { success: true, consultationId: consultationRef.id, data: completionData };
  } catch (error) {
    console.error('[ConsultationService] Error completing consultation:', error);
    throw new Error(`Failed to complete consultation: ${error.message}`);
  }
};

/**
 * Send patient message and update consultation
 * @param {string} sessionId - The session ID
 * @param {string} patientId - The patient ID
 * @param {string} message - The message to send
 * @param {Object} additionalData - Additional consultation data
 * @returns {Promise<Object>} The result of the operation
 */
export const sendPatientMessage = async (sessionId, patientId, message, additionalData = {}) => {
  try {
    console.log(`[ConsultationService] Sending patient message for session: ${sessionId}`);

    // 1. Save the message to the messages collection
    const messageRef = await addDoc(collection(db, "messages"), {
      patientId: patientId,
      sessionId: sessionId,
      message: message,
      type: 'consultation_message',
      status: 'sent',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // 2. Update the session with the message info
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      patientMessage: message,
      messageSent: true,
      messageSentAt: serverTimestamp(),
      messageId: messageRef.id,
      ...additionalData,
      updatedAt: serverTimestamp()
    });

    console.log(`[ConsultationService] Patient message sent with ID: ${messageRef.id}`);
    return { success: true, messageId: messageRef.id };
  } catch (error) {
    console.error('[ConsultationService] Error sending patient message:', error);
    throw new Error(`Failed to send patient message: ${error.message}`);
  }
};

/**
 * Schedule follow-up for a consultation
 * @param {string} sessionId - The session ID
 * @param {string} patientId - The patient ID
 * @param {string} followUpPeriod - The follow-up period (e.g., '2w', '4w')
 * @param {Object} additionalData - Additional data
 * @returns {Promise<Object>} The scheduled follow-up
 */
export const scheduleFollowUp = async (sessionId, patientId, followUpPeriod, additionalData = {}) => {
  try {
    console.log(`[ConsultationService] Scheduling follow-up for session: ${sessionId}, period: ${followUpPeriod}`);

    // Calculate follow-up date
    const followUpDate = calculateFollowUpDate(followUpPeriod);

    // Create follow-up record
    const followUpRef = await addDoc(collection(db, "follow_ups"), {
      sessionId: sessionId,
      patientId: patientId,
      followUpPeriod: followUpPeriod,
      scheduledDate: followUpDate,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      ...additionalData
    });

    // Update session with follow-up info
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      followUpScheduled: true,
      followUpPeriod: followUpPeriod,
      followUpDate: followUpDate,
      followUpId: followUpRef.id,
      updatedAt: serverTimestamp()
    });

    console.log(`[ConsultationService] Follow-up scheduled with ID: ${followUpRef.id}`);
    return { success: true, followUpId: followUpRef.id, scheduledDate: followUpDate };
  } catch (error) {
    console.error('[ConsultationService] Error scheduling follow-up:', error);
    throw new Error(`Failed to schedule follow-up: ${error.message}`);
  }
};

/**
 * Calculate follow-up date based on period
 * @param {string} period - The follow-up period (e.g., '2w', '4w', '1m')
 * @returns {Date} The calculated follow-up date
 */
const calculateFollowUpDate = (period) => {
  const now = new Date();
  const periodMap = {
    '1w': 7,
    '2w': 14,
    '3w': 21,
    '4w': 28,
    '6w': 42,
    '8w': 56,
    '1m': 30,
    '2m': 60,
    '3m': 90,
    '6m': 180
  };

  const days = periodMap[period] || 28; // Default to 4 weeks
  const followUpDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return followUpDate;
};

/**
 * Get consultation history for a patient
 * @param {string} patientId - The patient ID
 * @param {number} limitCount - Number of consultations to retrieve
 * @returns {Promise<Array>} Array of consultation records
 */
export const getConsultationHistory = async (patientId, limitCount = 10) => {
  try {
    const consultationsQuery = query(
      collection(db, "consultations"),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(consultationsQuery);
    const consultations = [];

    querySnapshot.forEach((doc) => {
      consultations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return consultations;
  } catch (error) {
    console.error('[ConsultationService] Error getting consultation history:', error);
    throw new Error(`Failed to get consultation history: ${error.message}`);
  }
};

/**
 * Generate and save AI-enhanced consultation notes
 * @param {string} sessionId - The session ID
 * @param {Object} intakeData - The intake data
 * @param {Object} currentData - Current consultation data
 * @returns {Promise<Object>} The AI-enhanced notes
 */
export const generateAIConsultationNotes = async (sessionId, intakeData, currentData) => {
  try {
    console.log(`[ConsultationService] Generating AI consultation notes for session: ${sessionId}`);

    // Generate AI content for different sections
    const [progressNotes, assessmentPlan, patientMessage] = await Promise.all([
      consultationAI.enhanceProgressNotes(intakeData, currentData.progressNotes),
      consultationAI.generateAssessmentPlan(intakeData, currentData.progressNotes),
      consultationAI.generatePatientMessage(intakeData, currentData.assessmentPlan)
    ]);

    const aiEnhancedData = {
      progressNotes,
      assessmentPlan,
      patientMessage,
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString()
    };

    // Save the AI-enhanced data
    await saveConsultationData(sessionId, aiEnhancedData);

    console.log(`[ConsultationService] AI consultation notes generated and saved`);
    return { success: true, data: aiEnhancedData };
  } catch (error) {
    console.error('[ConsultationService] Error generating AI consultation notes:', error);
    throw new Error(`Failed to generate AI consultation notes: ${error.message}`);
  }
};

/**
 * Publish consultation to patient
 * @param {string} sessionId - The session ID
 * @param {string} patientId - The patient ID
 * @param {Object} consultationData - The consultation data to publish
 * @returns {Promise<Object>} The result of the operation
 */
export const publishConsultationToPatient = async (sessionId, patientId, consultationData) => {
  try {
    console.log(`[ConsultationService] Publishing consultation to patient for session: ${sessionId}`);

    // 1. Send the patient message if provided
    if (consultationData.patientMessage) {
      await sendPatientMessage(sessionId, patientId, consultationData.patientMessage, consultationData);
    }

    // 2. Schedule follow-up if specified
    if (consultationData.followUpPeriod) {
      await scheduleFollowUp(sessionId, patientId, consultationData.followUpPeriod);
    }

    // 3. Complete the consultation
    const completionResult = await completeConsultation(sessionId, {
      ...consultationData,
      patientId,
      publishedToPatient: true,
      publishedAt: new Date().toISOString()
    });

    console.log(`[ConsultationService] Consultation published to patient successfully`);
    return { success: true, ...completionResult };
  } catch (error) {
    console.error('[ConsultationService] Error publishing consultation to patient:', error);
    throw new Error(`Failed to publish consultation to patient: ${error.message}`);
  }
};
