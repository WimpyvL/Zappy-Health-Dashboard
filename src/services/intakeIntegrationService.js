// Service for integrating intake form data with consultation notes
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class IntakeIntegrationService {
  /**
   * Fetches intake data for consultation display
   */
  async getIntakeConsultationData(sessionId) {
    try {
      console.log(`[IntakeIntegration] Fetching consultation data for session: ${sessionId}`);

      // Get session to find form_submission_id
      const sessionRef = doc(db, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        console.log(`[IntakeIntegration] Session not found: ${sessionId}`);
        return null;
      }
      
      const sessionData = sessionSnap.data();
      console.log(`[IntakeIntegration] Session data:`, sessionData);
      
      // Get form submission data
      if (sessionData.form_submission_id) {
        const submissionRef = doc(db, "form_submissions", sessionData.form_submission_id);
        const submissionSnap = await getDoc(submissionRef);
        
        if (submissionSnap.exists()) {
          const submissionData = submissionSnap.data();
          console.log(`[IntakeIntegration] Found form submission:`, submissionData);
          return this.transformIntakeToConsultation(submissionData.form_data || submissionData);
        } else {
          console.log(`[IntakeIntegration] Form submission not found: ${sessionData.form_submission_id}`);
        }
      } else {
        console.log(`[IntakeIntegration] No form_submission_id in session data`);
      }
      
      return null;
    } catch (error) {
      console.error("[IntakeIntegration] Error fetching intake consultation data:", error);
      throw error;
    }
  }

  /**
   * Transforms intake form data to consultation format
   */
  transformIntakeToConsultation(formData) {
    console.log(`[IntakeIntegration] Transforming intake data:`, formData);

    return {
      // Patient History Section
      patientHistory: this.generatePatientHistory(formData),
      
      // Assessment & Plan
      assessment: this.generateAssessment(formData),
      
      // Patient Message
      patientMessage: this.generatePatientMessage(formData),
      
      // Services based on intake
      selectedServices: this.mapIntakeServices(formData),
      
      // Follow-up schedule
      selectedFollowup: this.mapFollowupSchedule(formData),
      
      // Resources
      selectedResources: this.mapIntakeResources(formData),
      
      // Medication data for the interface
      medicationData: this.mapIntakeMedications(formData),
      
      // Raw intake data for reference
      rawIntakeData: formData
    };
  }

  generatePatientHistory(formData) {
    const historyParts = [];
    
    // Chief complaint
    if (formData.chief_complaint) {
      historyParts.push(`Chief Complaint: ${formData.chief_complaint}`);
    }
    
    // Current medications
    if (formData.medications && formData.medications !== 'None') {
      historyParts.push(`Current Medications: ${formData.medications}`);
    } else {
      historyParts.push('Current Medications: None reported');
    }
    
    // Allergies
    if (formData.allergies && formData.allergies !== 'None') {
      historyParts.push(`Allergies: ${formData.allergies}`);
    } else {
      historyParts.push('Allergies: No known allergies');
    }

    // Additional history based on other fields in the form data
    Object.keys(formData).forEach(key => {
      if (key.includes('history') || key.includes('symptoms') || key.includes('condition')) {
        if (formData[key] && typeof formData[key] === 'string' && formData[key].trim() !== '') {
          historyParts.push(`${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${formData[key]}`);
        }
      }
    });
    
    return historyParts.join('\n\n');
  }

  generateAssessment(formData) {
    const assessmentParts = [];
    
    // Primary concern based on chief complaint
    if (formData.chief_complaint) {
      const complaint = formData.chief_complaint.toLowerCase();
      
      if (complaint.includes('weight') || complaint.includes('obesity')) {
        assessmentParts.push('1. Weight Management - Patient seeking medical weight loss support');
      } else if (complaint.includes('sexual') || complaint.includes('ed') || complaint.includes('erectile')) {
        assessmentParts.push('1. Erectile Dysfunction - Patient seeking treatment options');
      } else if (complaint.includes('mental') || complaint.includes('anxiety') || complaint.includes('depression')) {
        assessmentParts.push('1. Mental Health - Patient seeking psychological support');
      } else {
        assessmentParts.push(`1. ${formData.chief_complaint}`);
      }
    }
    
    // Plan based on intake data
    assessmentParts.push('\nPlan:');
    assessmentParts.push('- Review patient intake information');
    assessmentParts.push('- Discuss treatment options based on patient concerns');
    assessmentParts.push('- Establish appropriate follow-up schedule');
    
    return assessmentParts.join('\n');
  }

  generatePatientMessage(formData) {
    const patientName = formData.patient_name || formData.name || 'Patient';
    
    let baseMessage = `Hello ${patientName}! Thank you for your consultation today. `;
    
    if (formData.chief_complaint) {
      baseMessage += `We've discussed your concerns regarding ${formData.chief_complaint.toLowerCase()}. `;
    }
    
    baseMessage += `I've reviewed your intake information and we've developed a treatment plan tailored to your needs. `;
    baseMessage += `Please don't hesitate to reach out if you have any questions or concerns. `;
    baseMessage += `Your next appointment will be scheduled as discussed.`;
    
    return baseMessage;
  }

  mapIntakeServices(formData) {
    const services = [];
    
    if (!formData.chief_complaint) return services;
    
    const complaint = formData.chief_complaint.toLowerCase();
    
    if (complaint.includes('weight') || complaint.includes('obesity')) {
      services.push('wm');
    }
    if (complaint.includes('sexual') || complaint.includes('ed') || complaint.includes('erectile')) {
      services.push('ed');
    }
    if (complaint.includes('mental') || complaint.includes('anxiety') || complaint.includes('depression')) {
      services.push('mh');
    }
    if (complaint.includes('primary') || complaint.includes('general')) {
      services.push('pc');
    }
    if (complaint.includes('women') || complaint.includes('gynecol')) {
      services.push('wh');
    }
    if (complaint.includes('skin') || complaint.includes('dermat')) {
      services.push('derm');
    }
    if (complaint.includes('hair')) {
      services.push('hair');
    }
    
    return services;
  }

  mapFollowupSchedule(formData) {
    // Default follow-up based on chief complaint
    if (!formData.chief_complaint) return '4w';
    
    const complaint = formData.chief_complaint.toLowerCase();
    
    if (complaint.includes('weight') || complaint.includes('mental')) {
      return '2w'; // More frequent follow-up for weight management and mental health
    }
    
    return '4w'; // Standard follow-up
  }

  mapIntakeResources(formData) {
    const resources = [];
    
    if (!formData.chief_complaint) return resources;
    
    const complaint = formData.chief_complaint.toLowerCase();
    
    if (complaint.includes('weight')) {
      resources.push('nutrition-guide', 'exercise-tips');
    }
    if (complaint.includes('mental')) {
      resources.push('mental-health-resources', 'coping-strategies');
    }
    if (complaint.includes('sexual') || complaint.includes('ed')) {
      resources.push('ed-education', 'relationship-health');
    }
    
    return resources;
  }

  mapIntakeMedications(formData) {
    const medicationData = {};
    
    // Don't pre-select medications - let providers make decisions
    // Just return empty object for now
    return medicationData;
  }

  /**
   * Gets intake form summary for patient dashboard
   */
  async getIntakeFormSummary(patientId) {
    try {
      // Query for form submissions by patient
      const submissionsQuery = query(
        collection(db, "form_submissions"),
        where("patient_id", "==", patientId),
        orderBy("created_at", "desc"),
        limit(1)
      );
      
      const submissionsSnap = await getDocs(submissionsQuery);
      
      if (submissionsSnap.empty) {
        return null;
      }
      
      const latestSubmission = submissionsSnap.docs[0].data();
      const formData = latestSubmission.form_data || latestSubmission;
      
      return {
        completionDate: latestSubmission.created_at || latestSubmission.submitted_at,
        status: latestSubmission.status || 'completed',
        chiefComplaint: formData.chief_complaint || 'Not specified',
        medications: formData.medications || 'None reported',
        allergies: formData.allergies || 'None reported',
        hasFormData: true
      };
    } catch (error) {
      console.error(`[IntakeIntegration] Error getting intake form summary for patient ${patientId}:`, error);
      return null;
    }
  }

  /**
   * Checks if a patient has completed their intake form
   */
  async hasCompletedIntakeForm(patientId) {
    try {
      const summary = await this.getIntakeFormSummary(patientId);
      return summary !== null && summary.hasFormData;
    } catch (error) {
      console.error(`[IntakeIntegration] Error checking intake form completion for patient ${patientId}:`, error);
      return false;
    }
  }
}

export const intakeIntegrationService = new IntakeIntegrationService();
