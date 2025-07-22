// AI service for consultation note generation with fallback for client-side
// Note: Genkit AI is server-side only, so we provide fallbacks for client-side usage

/**
 * Client-side compatible AI content generation
 * This provides fallback functionality when server-side AI is not available
 */
async function generateContent(prompt) {
  // For now, return a placeholder response
  // In production, this could call a server-side API endpoint
  console.log('AI Generation requested:', prompt.substring(0, 100) + '...');
  
  // Return a professional placeholder response
  if (prompt.includes('progress notes')) {
    return `Patient presented with chief complaint as documented in intake form. 
    
SUBJECTIVE: Patient reports symptoms and concerns as outlined in intake documentation. Current medications and allergies reviewed and documented.

OBJECTIVE: Vital signs stable. Patient appears comfortable and engaged during consultation.

ASSESSMENT: Based on patient presentation and intake information, clinical assessment indicates need for appropriate therapeutic intervention.

PLAN: Treatment plan discussed with patient including medication recommendations, lifestyle modifications, and follow-up care as appropriate.`;
  }
  
  if (prompt.includes('assessment') || prompt.includes('SOAP')) {
    return `ASSESSMENT:
- Primary concern addressed based on patient presentation
- Current medications reviewed for interactions and efficacy
- Patient demonstrates understanding of condition and treatment options

PLAN:
- Continue current therapeutic approach with modifications as indicated
- Patient education provided regarding condition management
- Follow-up scheduled as clinically appropriate
- Patient advised to contact provider with questions or concerns
- Monitoring plan established for treatment response`;
  }
  
  if (prompt.includes('patient message')) {
    return `Hello! Thank you for taking the time for your consultation today. 

I wanted to follow up on our discussion about your health concerns. We've reviewed your intake information and developed a treatment plan that should help address your needs effectively.

Please remember to follow the treatment recommendations we discussed, and don't hesitate to reach out if you have any questions or concerns. Your health and comfort are our top priorities.

We'll be in touch regarding your follow-up appointment. In the meantime, please take care and feel free to contact our office if you need anything.

Best regards,
Your Healthcare Team`;
  }
  
  // Default response
  return 'AI content generation is currently in development mode. Please review and edit this placeholder content as needed.';
}

export class ConsultationAI {
  /**
   * Enhances progress notes based on intake data
   */
  async enhanceProgressNotes(intakeData, existingNotes = '') {
    if (!intakeData) {
      return existingNotes || 'No intake data available for AI enhancement.';
    }

    const prompt = this.buildProgressNotesPrompt(intakeData, existingNotes);
    
    try {
      const aiResponse = await generateContent(prompt);
      return aiResponse || 'AI generation failed. Please try again.';
    } catch (error) {
      console.error('AI progress notes generation failed:', error);
      return existingNotes || 'Error generating progress notes. Please enter manually.';
    }
  }

  /**
   * Generates assessment and plan based on intake data
   */
  async generateAssessmentPlan(intakeData, patientHistory = '') {
    if (!intakeData) {
      return 'No intake data available for assessment generation.';
    }

    const prompt = this.buildAssessmentPrompt(intakeData, patientHistory);
    
    try {
      const aiResponse = await generateContent(prompt);
      return aiResponse || 'AI generation failed. Please try again.';
    } catch (error) {
      console.error('AI assessment generation failed:', error);
      return 'Error generating assessment. Please enter manually.';
    }
  }

  /**
   * Generates patient message based on intake and treatment plan
   */
  async generatePatientMessage(intakeData, treatmentPlan = '') {
    if (!intakeData) {
      return 'Hello! Thank you for your consultation today. Please don\'t hesitate to reach out if you have any questions.';
    }

    const prompt = this.buildPatientMessagePrompt(intakeData, treatmentPlan);
    
    try {
      const aiResponse = await generateContent(prompt);
      return aiResponse || 'AI generation failed. Please try again.';
    } catch (error) {
      console.error('AI patient message generation failed:', error);
      return 'Hello! Thank you for your consultation today. Please don\'t hesitate to reach out if you have any questions.';
    }
  }

  /**
   * Builds prompt for progress notes generation
   */
  buildProgressNotesPrompt(intakeData, existingNotes) {
    let prompt = 'Generate professional progress notes for a healthcare provider consultation based on the following patient intake data:\n\n';
    
    // Add intake data to prompt
    if (intakeData.chief_complaint) {
      prompt += `Chief Complaint: ${intakeData.chief_complaint}\n`;
    }
    
    if (intakeData.medications) {
      prompt += `Current Medications: ${intakeData.medications}\n`;
    }
    
    if (intakeData.allergies) {
      prompt += `Allergies: ${intakeData.allergies}\n`;
    }

    // Add any other relevant intake fields
    Object.keys(intakeData).forEach(key => {
      if (key !== 'chief_complaint' && key !== 'medications' && key !== 'allergies' && 
          intakeData[key] && typeof intakeData[key] === 'string' && intakeData[key].trim() !== '') {
        prompt += `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${intakeData[key]}\n`;
      }
    });
    
    if (existingNotes) {
      prompt += `\nExisting notes to enhance: ${existingNotes}\n`;
    }
    
    prompt += '\nGenerate comprehensive, professional progress notes that a healthcare provider would use during consultation. Focus on clinical relevance and professional medical language.';
    
    return prompt;
  }

  /**
   * Builds prompt for assessment and plan generation
   */
  buildAssessmentPrompt(intakeData, patientHistory) {
    let prompt = 'Generate a comprehensive SOAP-style assessment and treatment plan based on the following patient information:\n\n';
    
    if (patientHistory) {
      prompt += `Patient History: ${patientHistory}\n\n`;
    }
    
    prompt += 'Intake Information:\n';
    
    if (intakeData.chief_complaint) {
      prompt += `Chief Complaint: ${intakeData.chief_complaint}\n`;
    }
    
    if (intakeData.medications) {
      prompt += `Current Medications: ${intakeData.medications}\n`;
    }
    
    if (intakeData.allergies) {
      prompt += `Allergies: ${intakeData.allergies}\n`;
    }

    // Add other relevant fields
    Object.keys(intakeData).forEach(key => {
      if (key !== 'chief_complaint' && key !== 'medications' && key !== 'allergies' && 
          intakeData[key] && typeof intakeData[key] === 'string' && intakeData[key].trim() !== '') {
        prompt += `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${intakeData[key]}\n`;
      }
    });
    
    prompt += '\nGenerate a professional assessment and treatment plan in SOAP format. Include:\n';
    prompt += '1. Assessment: Clinical assessment based on the information provided\n';
    prompt += '2. Plan: Specific treatment recommendations, follow-up schedule, and next steps\n';
    prompt += 'Use professional medical language appropriate for healthcare documentation.';
    
    return prompt;
  }

  /**
   * Builds prompt for patient message generation
   */
  buildPatientMessagePrompt(intakeData, treatmentPlan) {
    const patientName = intakeData.patient_name || intakeData.name || '';
    
    let prompt = 'Generate a warm, professional message to send to a patient after their consultation. ';
    prompt += 'The message should be reassuring, informative, and encourage follow-up communication.\n\n';
    
    if (patientName) {
      prompt += `Patient Name: ${patientName}\n`;
    }
    
    if (intakeData.chief_complaint) {
      prompt += `Patient's Main Concern: ${intakeData.chief_complaint}\n`;
    }
    
    if (treatmentPlan) {
      prompt += `Treatment Plan Discussed: ${treatmentPlan}\n`;
    }
    
    prompt += '\nGenerate a personalized message that:\n';
    prompt += '- Thanks the patient for their consultation\n';
    prompt += '- Briefly acknowledges their concerns\n';
    prompt += '- Reassures them about the treatment plan\n';
    prompt += '- Encourages them to reach out with questions\n';
    prompt += '- Mentions follow-up as appropriate\n';
    prompt += 'Keep the tone professional but warm and supportive.';
    
    return prompt;
  }

  /**
   * Generates medication recommendations based on intake data
   */
  async generateMedicationRecommendations(intakeData) {
    if (!intakeData || !intakeData.chief_complaint) {
      return [];
    }

    const prompt = `Based on the following patient intake information, suggest appropriate medication considerations for a healthcare provider:

Chief Complaint: ${intakeData.chief_complaint}
Current Medications: ${intakeData.medications || 'None reported'}
Allergies: ${intakeData.allergies || 'None reported'}

Provide medication suggestions in JSON format with the following structure:
[
  {
    "medication": "medication name",
    "reasoning": "clinical reasoning for consideration",
    "category": "therapeutic category"
  }
]

Focus on evidence-based, commonly prescribed medications. This is for provider consideration only, not direct patient advice.`;

    try {
      const aiResponse = await generateContent(prompt);
      // Try to parse JSON response, fallback to empty array if parsing fails
      try {
        return JSON.parse(aiResponse);
      } catch {
        return [];
      }
    } catch (error) {
      console.error('AI medication recommendations generation failed:', error);
      return [];
    }
  }
}

export const consultationAI = new ConsultationAI();
