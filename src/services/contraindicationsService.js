/**
 * @fileoverview Service for checking treatment contraindications and medication conflicts
 */
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

class ContraindicationsService {
  
  /**
   * Contraindication severity levels
   */
  static SEVERITY = {
    ABSOLUTE: 'absolute', // Never prescribe
    RELATIVE: 'relative', // Use with extreme caution
    WARNING: 'warning',   // Monitor closely
    CAUTION: 'caution'    // Consider alternatives
  };

  /**
   * Main contraindications check for a patient and medication/treatment
   */
  async checkContraindications(patientData, medicationData) {
    try {
      const contraindications = [];

      // Check allergies
      const allergyContraindications = await this.checkAllergies(patientData, medicationData);
      contraindications.push(...allergyContraindications);

      // Check medical conditions
      const conditionContraindications = await this.checkMedicalConditions(patientData, medicationData);
      contraindications.push(...conditionContraindications);

      // Check drug-drug interactions
      const drugInteractions = await this.checkDrugInteractions(patientData, medicationData);
      contraindications.push(...drugInteractions);

      // Check age/pregnancy contraindications
      const ageContraindications = await this.checkAgeAndPregnancy(patientData, medicationData);
      contraindications.push(...ageContraindications);

      // Check organ function contraindications
      const organContraindications = await this.checkOrganFunction(patientData, medicationData);
      contraindications.push(...organContraindications);

      return {
        hasContraindications: contraindications.length > 0,
        contraindications: this.sortBySeverity(contraindications),
        absoluteContraindications: contraindications.filter(c => c.severity === ContraindicationsService.SEVERITY.ABSOLUTE),
        recommendationAction: this.getRecommendationAction(contraindications)
      };

    } catch (error) {
      console.error('Error checking contraindications:', error);
      throw error;
    }
  }

  /**
   * Check for allergy contraindications
   */
  async checkAllergies(patientData, medicationData) {
    const contraindications = [];
    
    if (!patientData.allergies || patientData.allergies.length === 0) {
      return contraindications;
    }

    const medicationAllergensMap = {
      // Penicillin family
      'amoxicillin': ['penicillin', 'beta-lactam'],
      'ampicillin': ['penicillin', 'beta-lactam'],
      'penicillin': ['penicillin', 'beta-lactam'],
      
      // Sulfa drugs
      'sulfamethoxazole': ['sulfa', 'sulfamethoxazole'],
      'trimethoprim-sulfamethoxazole': ['sulfa', 'sulfamethoxazole'],
      
      // NSAIDs
      'ibuprofen': ['nsaid', 'ibuprofen'],
      'aspirin': ['nsaid', 'aspirin', 'salicylate'],
      'naproxen': ['nsaid', 'naproxen'],
      
      // Others
      'codeine': ['opioid', 'codeine'],
      'morphine': ['opioid', 'morphine'],
      'latex': ['latex']
    };

    const medicationName = medicationData.genericName?.toLowerCase() || medicationData.name?.toLowerCase() || '';
    const medicationAllergens = medicationAllergensMap[medicationName] || [medicationName];

    patientData.allergies.forEach(allergy => {
      const allergyLower = allergy.toLowerCase();
      
      medicationAllergens.forEach(allergen => {
        if (allergyLower.includes(allergen) || allergen.includes(allergyLower)) {
          contraindications.push({
            type: 'allergy',
            severity: ContraindicationsService.SEVERITY.ABSOLUTE,
            title: 'Known Allergy Contraindication',
            description: `Patient has documented allergy to ${allergy}`,
            medication: medicationName,
            details: `Prescribing ${medicationName} is contraindicated due to known allergy to ${allergy}`,
            recommendation: 'Consider alternative medication without cross-reactivity',
            source: 'patient_allergies'
          });
        }
      });
    });

    return contraindications;
  }

  /**
   * Check for medical condition contraindications
   */
  async checkMedicalConditions(patientData, medicationData) {
    const contraindications = [];
    
    if (!patientData.medicalHistory || patientData.medicalHistory.length === 0) {
      return contraindications;
    }

    // Define condition-medication contraindications
    const conditionContraindications = {
      // Cardiovascular conditions
      'heart failure': {
        'metformin': { severity: 'relative', reason: 'Risk of lactic acidosis in heart failure' },
        'nsaid': { severity: 'relative', reason: 'NSAIDs can worsen heart failure' },
        'calcium channel blocker': { severity: 'caution', reason: 'Monitor cardiac function closely' }
      },
      
      // Renal conditions
      'kidney disease': {
        'metformin': { severity: 'absolute', reason: 'Risk of lactic acidosis with renal impairment' },
        'nsaid': { severity: 'relative', reason: 'NSAIDs can worsen kidney function' },
        'ace inhibitor': { severity: 'caution', reason: 'Monitor renal function and potassium' }
      },
      
      // Liver conditions
      'liver disease': {
        'acetaminophen': { severity: 'relative', reason: 'Risk of hepatotoxicity' },
        'statin': { severity: 'caution', reason: 'Monitor liver enzymes' },
        'warfarin': { severity: 'caution', reason: 'Altered metabolism in liver disease' }
      },
      
      // Respiratory conditions
      'asthma': {
        'beta blocker': { severity: 'absolute', reason: 'Beta blockers can trigger bronchospasm' },
        'aspirin': { severity: 'relative', reason: 'Risk of aspirin-induced asthma' }
      },
      
      // Gastrointestinal conditions
      'peptic ulcer': {
        'nsaid': { severity: 'absolute', reason: 'NSAIDs increase risk of GI bleeding' },
        'aspirin': { severity: 'relative', reason: 'Increased bleeding risk' },
        'corticosteroid': { severity: 'relative', reason: 'Increased ulcer risk' }
      },
      
      // Mental health conditions
      'depression': {
        'beta blocker': { severity: 'caution', reason: 'May worsen depression symptoms' },
        'corticosteroid': { severity: 'caution', reason: 'Can trigger mood changes' }
      },
      
      // Pregnancy-related
      'pregnancy': {
        'ace inhibitor': { severity: 'absolute', reason: 'Teratogenic - contraindicated in pregnancy' },
        'warfarin': { severity: 'absolute', reason: 'Teratogenic effects' },
        'metformin': { severity: 'caution', reason: 'Use only if clearly needed' }
      }
    };

    const medicationName = medicationData.genericName?.toLowerCase() || medicationData.name?.toLowerCase() || '';
    const medicationClass = medicationData.drugClass?.toLowerCase() || '';

    patientData.medicalHistory.forEach(condition => {
      const conditionLower = condition.toLowerCase();
      const conditionRules = conditionContraindications[conditionLower];
      
      if (conditionRules) {
        // Check direct medication name
        if (conditionRules[medicationName]) {
          const rule = conditionRules[medicationName];
          contraindications.push({
            type: 'medical_condition',
            severity: rule.severity,
            title: `${condition} Contraindication`,
            description: rule.reason,
            medication: medicationName,
            condition: condition,
            details: `Patient has ${condition}. ${rule.reason}`,
            recommendation: this.getConditionRecommendation(rule.severity, condition),
            source: 'medical_history'
          });
        }
        
        // Check medication class
        if (conditionRules[medicationClass]) {
          const rule = conditionRules[medicationClass];
          contraindications.push({
            type: 'medical_condition',
            severity: rule.severity,
            title: `${condition} Class Contraindication`,
            description: rule.reason,
            medication: medicationName,
            medicationClass: medicationClass,
            condition: condition,
            details: `Patient has ${condition}. ${rule.reason}`,
            recommendation: this.getConditionRecommendation(rule.severity, condition),
            source: 'medical_history'
          });
        }
      }
    });

    return contraindications;
  }

  /**
   * Check for drug-drug interactions
   */
  async checkDrugInteractions(patientData, medicationData) {
    const contraindications = [];
    
    if (!patientData.currentMedications || patientData.currentMedications.length === 0) {
      return contraindications;
    }

    const newMedication = medicationData.genericName?.toLowerCase() || medicationData.name?.toLowerCase() || '';

    // Define major drug interactions
    const drugInteractions = {
      'warfarin': {
        'aspirin': { severity: 'relative', reason: 'Increased bleeding risk' },
        'nsaid': { severity: 'relative', reason: 'Increased bleeding risk' },
        'antibiotic': { severity: 'caution', reason: 'May alter warfarin metabolism' }
      },
      
      'metformin': {
        'contrast dye': { severity: 'relative', reason: 'Risk of lactic acidosis' },
        'diuretic': { severity: 'caution', reason: 'Monitor for dehydration' }
      },
      
      'ace inhibitor': {
        'potassium supplement': { severity: 'caution', reason: 'Risk of hyperkalemia' },
        'nsaid': { severity: 'caution', reason: 'Reduced antihypertensive effect' }
      },
      
      'digoxin': {
        'diuretic': { severity: 'caution', reason: 'Risk of digoxin toxicity' },
        'calcium channel blocker': { severity: 'caution', reason: 'Increased digoxin levels' }
      }
    };

    patientData.currentMedications.forEach(currentMed => {
      const currentMedLower = currentMed.toLowerCase();
      
      // Check if new medication interacts with current medication
      if (drugInteractions[newMedication] && drugInteractions[newMedication][currentMedLower]) {
        const interaction = drugInteractions[newMedication][currentMedLower];
        contraindications.push({
          type: 'drug_interaction',
          severity: interaction.severity,
          title: 'Drug-Drug Interaction',
          description: interaction.reason,
          medication: newMedication,
          interactingMedication: currentMed,
          details: `${newMedication} may interact with ${currentMed}. ${interaction.reason}`,
          recommendation: this.getInteractionRecommendation(interaction.severity),
          source: 'drug_interactions'
        });
      }
      
      // Check if current medication interacts with new medication
      if (drugInteractions[currentMedLower] && drugInteractions[currentMedLower][newMedication]) {
        const interaction = drugInteractions[currentMedLower][newMedication];
        contraindications.push({
          type: 'drug_interaction',
          severity: interaction.severity,
          title: 'Drug-Drug Interaction',
          description: interaction.reason,
          medication: newMedication,
          interactingMedication: currentMed,
          details: `${currentMed} may interact with ${newMedication}. ${interaction.reason}`,
          recommendation: this.getInteractionRecommendation(interaction.severity),
          source: 'drug_interactions'
        });
      }
    });

    return contraindications;
  }

  /**
   * Check age and pregnancy contraindications
   */
  async checkAgeAndPregnancy(patientData, medicationData) {
    const contraindications = [];
    
    const medicationName = medicationData.genericName?.toLowerCase() || medicationData.name?.toLowerCase() || '';
    
    // Age-related contraindications
    if (patientData.age) {
      const age = parseInt(patientData.age);
      
      // Pediatric contraindications
      if (age < 18) {
        const pediatricContraindications = {
          'aspirin': { severity: 'absolute', reason: 'Risk of Reye syndrome in children' },
          'tetracycline': { severity: 'absolute', reason: 'Tooth discoloration in children under 8' },
          'fluoroquinolone': { severity: 'relative', reason: 'Risk of tendon problems in children' }
        };
        
        if (pediatricContraindications[medicationName]) {
          const contra = pediatricContraindications[medicationName];
          contraindications.push({
            type: 'age_contraindication',
            severity: contra.severity,
            title: 'Pediatric Contraindication',
            description: contra.reason,
            medication: medicationName,
            patientAge: age,
            details: `${medicationName} is contraindicated in patients under 18. ${contra.reason}`,
            recommendation: 'Consider pediatric-appropriate alternatives',
            source: 'age_restrictions'
          });
        }
      }
      
      // Geriatric considerations
      if (age >= 65) {
        const geriatricCautions = {
          'benzodiazepine': { severity: 'caution', reason: 'Increased fall risk and cognitive impairment in elderly' },
          'anticholinergic': { severity: 'caution', reason: 'Increased risk of confusion and falls' },
          'nsaid': { severity: 'caution', reason: 'Increased GI and cardiovascular risks in elderly' }
        };
        
        if (geriatricCautions[medicationName] || geriatricCautions[medicationData.drugClass?.toLowerCase()]) {
          const caution = geriatricCautions[medicationName] || geriatricCautions[medicationData.drugClass?.toLowerCase()];
          contraindications.push({
            type: 'geriatric_caution',
            severity: caution.severity,
            title: 'Geriatric Consideration',
            description: caution.reason,
            medication: medicationName,
            patientAge: age,
            details: `Special caution needed in patients ≥65 years. ${caution.reason}`,
            recommendation: 'Consider lower starting dose and close monitoring',
            source: 'geriatric_guidelines'
          });
        }
      }
    }

    // Pregnancy contraindications
    if (patientData.isPregnant || patientData.gender === 'female' && patientData.age >= 12 && patientData.age <= 50) {
      const pregnancyCategories = {
        'ace inhibitor': { severity: 'absolute', category: 'D', reason: 'Fetal renal toxicity' },
        'warfarin': { severity: 'absolute', category: 'X', reason: 'Teratogenic effects' },
        'tetracycline': { severity: 'absolute', category: 'D', reason: 'Tooth and bone development issues' },
        'nsaid': { severity: 'relative', category: 'C/D', reason: 'Risk in third trimester' },
        'metformin': { severity: 'caution', category: 'B', reason: 'Limited data in pregnancy' }
      };
      
      const drugClass = medicationData.drugClass?.toLowerCase() || '';
      const pregnancyInfo = pregnancyCategories[medicationName] || pregnancyCategories[drugClass];
      
      if (pregnancyInfo) {
        contraindications.push({
          type: 'pregnancy_contraindication',
          severity: pregnancyInfo.severity,
          title: `Pregnancy Category ${pregnancyInfo.category}`,
          description: pregnancyInfo.reason,
          medication: medicationName,
          pregnancyCategory: pregnancyInfo.category,
          details: `${medicationName} is pregnancy category ${pregnancyInfo.category}. ${pregnancyInfo.reason}`,
          recommendation: patientData.isPregnant ? 'Discuss pregnancy-safe alternatives' : 'Counsel about pregnancy precautions',
          source: 'pregnancy_categories'
        });
      }
    }

    return contraindications;
  }

  /**
   * Check organ function contraindications
   */
  async checkOrganFunction(patientData, medicationData) {
    const contraindications = [];
    
    const medicationName = medicationData.genericName?.toLowerCase() || medicationData.name?.toLowerCase() || '';
    
    // Renal function checks
    if (patientData.creatinine || patientData.gfr) {
      const gfr = patientData.gfr || this.estimateGFR(patientData.creatinine, patientData.age, patientData.gender);
      
      if (gfr < 60) { // CKD Stage 3 or worse
        const renalDoseAdjustments = {
          'metformin': { gfrLimit: 45, severity: 'absolute', reason: 'Risk of lactic acidosis' },
          'nsaid': { gfrLimit: 60, severity: 'relative', reason: 'Further reduction in kidney function' },
          'ace inhibitor': { gfrLimit: 30, severity: 'caution', reason: 'Monitor renal function closely' }
        };
        
        const renalInfo = renalDoseAdjustments[medicationName];
        if (renalInfo && gfr < renalInfo.gfrLimit) {
          contraindications.push({
            type: 'renal_contraindication',
            severity: renalInfo.severity,
            title: 'Renal Function Contraindication',
            description: renalInfo.reason,
            medication: medicationName,
            patientGFR: gfr,
            gfrThreshold: renalInfo.gfrLimit,
            details: `Patient GFR ${gfr} mL/min/1.73m² is below threshold of ${renalInfo.gfrLimit}. ${renalInfo.reason}`,
            recommendation: 'Consider dose adjustment or alternative medication',
            source: 'renal_guidelines'
          });
        }
      }
    }

    // Liver function checks
    if (patientData.alt || patientData.ast || patientData.liverDisease) {
      const hepaticMedications = {
        'acetaminophen': { severity: 'relative', reason: 'Risk of hepatotoxicity' },
        'statin': { severity: 'caution', reason: 'Monitor liver enzymes' },
        'warfarin': { severity: 'caution', reason: 'Altered metabolism' }
      };
      
      const hepaticInfo = hepaticMedications[medicationName];
      if (hepaticInfo) {
        contraindications.push({
          type: 'hepatic_contraindication',
          severity: hepaticInfo.severity,
          title: 'Hepatic Function Consideration',
          description: hepaticInfo.reason,
          medication: medicationName,
          details: `Patient has hepatic impairment. ${hepaticInfo.reason}`,
          recommendation: 'Consider dose adjustment and close monitoring',
          source: 'hepatic_guidelines'
        });
      }
    }

    return contraindications;
  }

  /**
   * Estimate GFR using simplified formula
   */
  estimateGFR(creatinine, age, gender) {
    // Simplified Cockcroft-Gault estimation
    const multiplier = gender?.toLowerCase() === 'female' ? 0.85 : 1;
    return ((140 - age) * 72 * multiplier) / creatinine;
  }

  /**
   * Sort contraindications by severity
   */
  sortBySeverity(contraindications) {
    const severityOrder = {
      [ContraindicationsService.SEVERITY.ABSOLUTE]: 0,
      [ContraindicationsService.SEVERITY.RELATIVE]: 1,
      [ContraindicationsService.SEVERITY.WARNING]: 2,
      [ContraindicationsService.SEVERITY.CAUTION]: 3
    };
    
    return contraindications.sort((a, b) => 
      severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Get recommendation action based on contraindications
   */
  getRecommendationAction(contraindications) {
    const hasAbsolute = contraindications.some(c => c.severity === ContraindicationsService.SEVERITY.ABSOLUTE);
    const hasRelative = contraindications.some(c => c.severity === ContraindicationsService.SEVERITY.RELATIVE);
    
    if (hasAbsolute) {
      return 'DO_NOT_PRESCRIBE';
    } else if (hasRelative) {
      return 'USE_WITH_EXTREME_CAUTION';
    } else if (contraindications.length > 0) {
      return 'MONITOR_CLOSELY';
    } else {
      return 'SAFE_TO_PRESCRIBE';
    }
  }

  /**
   * Get condition-specific recommendation
   */
  getConditionRecommendation(severity, condition) {
    const recommendations = {
      [ContraindicationsService.SEVERITY.ABSOLUTE]: `Absolutely contraindicated with ${condition}. Select alternative medication.`,
      [ContraindicationsService.SEVERITY.RELATIVE]: `Use with extreme caution in ${condition}. Consider alternatives or specialist consultation.`,
      [ContraindicationsService.SEVERITY.WARNING]: `Monitor closely for complications related to ${condition}.`,
      [ContraindicationsService.SEVERITY.CAUTION]: `Consider dose adjustment or increased monitoring due to ${condition}.`
    };
    
    return recommendations[severity] || 'Review patient condition and medication appropriateness.';
  }

  /**
   * Get interaction-specific recommendation
   */
  getInteractionRecommendation(severity) {
    const recommendations = {
      [ContraindicationsService.SEVERITY.ABSOLUTE]: 'Do not prescribe these medications together.',
      [ContraindicationsService.SEVERITY.RELATIVE]: 'Consider alternative medications or specialist consultation.',
      [ContraindicationsService.SEVERITY.WARNING]: 'Monitor closely for adverse effects.',
      [ContraindicationsService.SEVERITY.CAUTION]: 'Consider dose adjustment or increased monitoring.'
    };
    
    return recommendations[severity] || 'Review drug interaction and consider alternatives.';
  }
}

export const contraindicationsService = new ContraindicationsService();