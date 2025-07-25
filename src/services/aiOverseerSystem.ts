/**
 * AI Overseer System
 * 
 * Comprehensive AI workflow management system that orchestrates all AI services.
 * Provides clinical decision support, automated recommendations, and intelligent routing.
 * Adapted from the old repository to work with Firebase and modern TypeScript.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// Import existing services for orchestration
import { aiRecommendationService } from './aiRecommendationService';
import { categoryPlansService } from './categoryPlansService';
import { bundleOptimizationService } from './bundleOptimizationService';
import { analyticsService } from './analyticsService';

// AI Overseer interfaces
export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  workflowType: 'clinical_decision' | 'treatment_recommendation' | 'quality_assurance' | 'optimization' | 'routing';
  status: 'active' | 'inactive' | 'testing' | 'deprecated';
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  outputs: WorkflowOutput[];
  performance: WorkflowPerformance;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'patient_intake' | 'consultation_complete' | 'form_submission' | 'order_placed' | 'scheduled_task';
  conditions: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  stepType: 'ai_analysis' | 'recommendation' | 'validation' | 'notification' | 'data_update';
  service: string; // Which AI service to use
  parameters: Record<string, any>;
  successCriteria: Record<string, any>;
  failureHandling: 'retry' | 'skip' | 'abort' | 'escalate';
  timeout: number; // seconds
  order: number;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowOutput {
  id: string;
  type: 'recommendation' | 'alert' | 'data_update' | 'notification' | 'report';
  destination: string;
  format: 'json' | 'text' | 'html' | 'pdf';
  template?: string;
}

export interface WorkflowPerformance {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted?: Timestamp;
  errorCount: number;
  lastError?: string;
}

export interface ClinicalDecision {
  id: string;
  patientId: string;
  providerId?: string;
  decisionType: 'treatment_plan' | 'medication_recommendation' | 'referral' | 'follow_up' | 'risk_assessment';
  inputData: Record<string, any>;
  aiRecommendations: AIRecommendation[];
  providerOverride?: ProviderOverride;
  finalDecision: Record<string, any>;
  confidence: number;
  reasoning: string[];
  evidenceBase: EvidenceSource[];
  status: 'pending' | 'approved' | 'modified' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AIRecommendation {
  id: string;
  type: 'treatment' | 'medication' | 'test' | 'referral' | 'lifestyle';
  recommendation: string;
  confidence: number;
  reasoning: string[];
  supportingData: Record<string, any>;
  riskFactors: string[];
  contraindications: string[];
  alternatives: string[];
}

export interface ProviderOverride {
  providerId: string;
  reason: string;
  modifications: Record<string, any>;
  timestamp: Timestamp;
}

export interface EvidenceSource {
  type: 'clinical_guideline' | 'research_study' | 'patient_history' | 'lab_result' | 'vital_signs';
  source: string;
  relevance: number;
  quality: 'high' | 'medium' | 'low';
  url?: string;
}

export interface QualityAssessment {
  id: string;
  assessmentType: 'treatment_adherence' | 'outcome_prediction' | 'risk_stratification' | 'care_gap_analysis';
  patientId: string;
  providerId?: string;
  inputData: Record<string, any>;
  aiAnalysis: QualityAnalysis;
  recommendations: QualityRecommendation[];
  riskScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'monitoring';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QualityAnalysis {
  overallScore: number;
  dimensions: {
    effectiveness: number;
    safety: number;
    timeliness: number;
    patientCentered: number;
    efficiency: number;
    equity: number;
  };
  insights: string[];
  trends: QualityTrend[];
}

export interface QualityTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  timeframe: string;
}

export interface QualityRecommendation {
  type: 'process_improvement' | 'clinical_intervention' | 'patient_education' | 'provider_training';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedImpact: number;
  implementation: string;
  timeline: string;
}

export interface IntelligentRouting {
  id: string;
  routingType: 'patient_assignment' | 'task_prioritization' | 'resource_allocation' | 'appointment_scheduling';
  inputCriteria: Record<string, any>;
  aiAnalysis: RoutingAnalysis;
  recommendations: RoutingRecommendation[];
  finalAssignment: Record<string, any>;
  confidence: number;
  createdAt: Timestamp;
}

export interface RoutingAnalysis {
  patientComplexity: number;
  providerCapacity: Record<string, number>;
  resourceAvailability: Record<string, number>;
  urgencyScore: number;
  matchingFactors: string[];
}

export interface RoutingRecommendation {
  option: string;
  score: number;
  reasoning: string[];
  pros: string[];
  cons: string[];
  estimatedOutcome: Record<string, any>;
}

/**
 * AI Overseer System Class
 */
export class AIOverseerSystem {
  private db = getFirebaseFirestore();

  /**
   * Execute clinical decision support workflow
   */
  async executeClinicalDecisionSupport(
    patientId: string,
    decisionType: 'treatment_plan' | 'medication_recommendation' | 'referral' | 'follow_up' | 'risk_assessment',
    inputData: Record<string, any>,
    providerId?: string
  ): Promise<ClinicalDecision> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      console.log('Executing clinical decision support:', { patientId, decisionType });

      // Get patient data for context
      const patientData = await this.getPatientContext(patientId);
      
      // Generate AI recommendations based on decision type
      const aiRecommendations = await this.generateClinicalRecommendations(
        decisionType,
        { ...inputData, ...patientData }
      );

      // Create clinical decision record
      const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const clinicalDecision: ClinicalDecision = {
        id: decisionId,
        patientId,
        providerId,
        decisionType,
        inputData: { ...inputData, patientContext: patientData },
        aiRecommendations,
        finalDecision: {}, // To be filled by provider
        confidence: this.calculateOverallConfidence(aiRecommendations),
        reasoning: this.extractReasoningFromRecommendations(aiRecommendations),
        evidenceBase: this.generateEvidenceBase(decisionType, inputData),
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save clinical decision
      await setDoc(doc(this.db, 'clinical_decisions', decisionId), clinicalDecision);

      // Trigger quality assurance workflow
      await this.triggerQualityAssurance(patientId, decisionType, clinicalDecision);

      console.log('Clinical decision support completed:', decisionId);
      return clinicalDecision;
    } catch (error) {
      console.error('Error in clinical decision support:', error);
      throw new Error(`Clinical decision support failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute treatment recommendation workflow
   */
  async executeTreatmentRecommendation(
    patientId: string,
    symptoms: string[],
    medicalHistory: Record<string, any>,
    preferences?: Record<string, any>
  ): Promise<{
    treatmentPlans: any[];
    productRecommendations: any[];
    bundleRecommendations: any[];
    confidence: number;
  }> {
    try {
      console.log('Executing treatment recommendation workflow:', { patientId, symptoms });

      // Get comprehensive patient context
      const patientContext = await this.getPatientContext(patientId);
      
      // Generate treatment plan recommendations using Category Plans Service
      const treatmentPlans = await categoryPlansService.getPatientPlanRecommendations(patientId);
      
      // Generate product recommendations using AI Recommendation Service
      const productRecommendations = await aiRecommendationService.getBaseRecommendations(
        patientId
      );

      // Generate bundle recommendations using Bundle Optimization Service
      const bundleRecommendations = await bundleOptimizationService.getBundleRecommendations(
        patientId,
        {
          preferences: symptoms,
          purchaseHistory: patientContext.orderHistory || []
        }
      );

      // Calculate overall confidence
      const confidence = this.calculateTreatmentConfidence(
        treatmentPlans,
        productRecommendations,
        bundleRecommendations
      );

      // Log treatment recommendation for analytics
      await this.logTreatmentRecommendation(patientId, {
        treatmentPlans,
        productRecommendations,
        bundleRecommendations,
        confidence,
        symptoms,
        medicalHistory
      });

      return {
        treatmentPlans,
        productRecommendations,
        bundleRecommendations,
        confidence
      };
    } catch (error) {
      console.error('Error in treatment recommendation:', error);
      throw new Error(`Treatment recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute quality assurance workflow
   */
  async executeQualityAssurance(
    patientId: string,
    assessmentType: 'treatment_adherence' | 'outcome_prediction' | 'risk_stratification' | 'care_gap_analysis',
    inputData: Record<string, any>
  ): Promise<QualityAssessment> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      console.log('Executing quality assurance:', { patientId, assessmentType });

      // Get patient context and history
      const patientContext = await this.getPatientContext(patientId);
      const treatmentHistory = await this.getTreatmentHistory(patientId);

      // Perform AI analysis based on assessment type
      const aiAnalysis = await this.performQualityAnalysis(
        assessmentType,
        { ...inputData, ...patientContext, treatmentHistory }
      );

      // Generate quality recommendations
      const recommendations = await this.generateQualityRecommendations(
        assessmentType,
        aiAnalysis,
        patientContext
      );

      // Calculate risk score
      const riskScore = this.calculateRiskScore(aiAnalysis, treatmentHistory);

      // Create quality assessment record
      const assessmentId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const qualityAssessment: QualityAssessment = {
        id: assessmentId,
        assessmentType,
        patientId,
        inputData,
        aiAnalysis,
        recommendations,
        riskScore,
        priority: this.determinePriority(riskScore, aiAnalysis),
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save quality assessment
      await setDoc(doc(this.db, 'quality_assessments', assessmentId), qualityAssessment);

      // Trigger alerts if high risk
      if (riskScore > 0.8) {
        await this.triggerHighRiskAlert(patientId, qualityAssessment);
      }

      console.log('Quality assurance completed:', assessmentId);
      return qualityAssessment;
    } catch (error) {
      console.error('Error in quality assurance:', error);
      throw new Error(`Quality assurance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute intelligent routing workflow
   */
  async executeIntelligentRouting(
    routingType: 'patient_assignment' | 'task_prioritization' | 'resource_allocation' | 'appointment_scheduling',
    inputCriteria: Record<string, any>
  ): Promise<IntelligentRouting> {
    try {
      console.log('Executing intelligent routing:', { routingType, inputCriteria });

      // Analyze routing requirements
      const routingAnalysis = await this.performRoutingAnalysis(routingType, inputCriteria);
      
      // Generate routing recommendations
      const recommendations = await this.generateRoutingRecommendations(
        routingType,
        routingAnalysis,
        inputCriteria
      );

      // Select optimal assignment
      const finalAssignment = this.selectOptimalAssignment(recommendations);
      
      // Calculate confidence
      const confidence = this.calculateRoutingConfidence(recommendations, routingAnalysis);

      // Create routing record
      const routingId = `routing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const intelligentRouting: IntelligentRouting = {
        id: routingId,
        routingType,
        inputCriteria,
        aiAnalysis: routingAnalysis,
        recommendations,
        finalAssignment,
        confidence,
        createdAt: Timestamp.now(),
      };

      // Save routing decision (optional - for analytics)
      if (this.db) {
        await setDoc(doc(this.db, 'intelligent_routing', routingId), intelligentRouting);
      }

      console.log('Intelligent routing completed:', routingId);
      return intelligentRouting;
    } catch (error) {
      console.error('Error in intelligent routing:', error);
      throw new Error(`Intelligent routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AI system performance metrics
   */
  async getAISystemMetrics(timeRange = 30): Promise<{
    clinicalDecisions: {
      total: number;
      successRate: number;
      averageConfidence: number;
      providerAcceptanceRate: number;
    };
    treatmentRecommendations: {
      total: number;
      averageConfidence: number;
      patientSatisfaction: number;
      outcomeImprovement: number;
    };
    qualityAssessments: {
      total: number;
      highRiskCases: number;
      preventedAdverseEvents: number;
      qualityImprovement: number;
    };
    intelligentRouting: {
      total: number;
      efficiencyGain: number;
      resourceUtilization: number;
      patientWaitTime: number;
    };
  }> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - timeRange);

      // Get clinical decisions metrics
      const clinicalDecisionsQuery = query(
        collection(this.db, 'clinical_decisions'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('createdAt', 'desc')
      );
      
      const clinicalDecisionsSnapshot = await getDocs(clinicalDecisionsQuery);
      const clinicalDecisions = clinicalDecisionsSnapshot.docs.map(doc => doc.data());

      // Get quality assessments metrics
      const qualityAssessmentsQuery = query(
        collection(this.db, 'quality_assessments'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('createdAt', 'desc')
      );
      
      const qualityAssessmentsSnapshot = await getDocs(qualityAssessmentsQuery);
      const qualityAssessments = qualityAssessmentsSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const metrics = {
        clinicalDecisions: {
          total: clinicalDecisions.length,
          successRate: this.calculateSuccessRate(clinicalDecisions),
          averageConfidence: this.calculateAverageConfidence(clinicalDecisions),
          providerAcceptanceRate: this.calculateProviderAcceptanceRate(clinicalDecisions),
        },
        treatmentRecommendations: {
          total: 0, // Would be tracked separately
          averageConfidence: 0.85, // Mock data
          patientSatisfaction: 0.92, // Mock data
          outcomeImprovement: 0.15, // Mock data
        },
        qualityAssessments: {
          total: qualityAssessments.length,
          highRiskCases: qualityAssessments.filter(qa => qa.riskScore > 0.8).length,
          preventedAdverseEvents: 0, // Would be tracked separately
          qualityImprovement: 0.12, // Mock data
        },
        intelligentRouting: {
          total: 0, // Would be tracked separately
          efficiencyGain: 0.25, // Mock data
          resourceUtilization: 0.88, // Mock data
          patientWaitTime: -0.18, // Mock data (negative = improvement)
        },
      };

      return metrics;
    } catch (error) {
      console.error('Error getting AI system metrics:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async getPatientContext(patientId: string): Promise<Record<string, any>> {
    try {
      if (!this.db) return {};

      const patientDoc = await getDoc(doc(this.db, 'patients', patientId));
      if (!patientDoc.exists()) {
        return {};
      }

      const patientData = patientDoc.data();
      
      // Get additional context (orders, consultations, etc.)
      const ordersQuery = query(
        collection(this.db, 'orders'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orderHistory = ordersSnapshot.docs.map(doc => doc.data());

      return {
        ...patientData,
        orderHistory,
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting patient context:', error);
      return {};
    }
  }

  private async generateClinicalRecommendations(
    decisionType: string,
    inputData: Record<string, any>
  ): Promise<AIRecommendation[]> {
    // Simplified AI recommendation generation
    // In a real implementation, this would use ML models or clinical decision trees
    
    const recommendations: AIRecommendation[] = [];
    
    switch (decisionType) {
      case 'treatment_plan':
        recommendations.push({
          id: `rec_${Date.now()}_1`,
          type: 'treatment',
          recommendation: 'Comprehensive lifestyle modification program',
          confidence: 0.85,
          reasoning: ['Patient symptoms align with metabolic syndrome', 'Previous successful outcomes with similar patients'],
          supportingData: inputData,
          riskFactors: ['Family history', 'Sedentary lifestyle'],
          contraindications: [],
          alternatives: ['Medication-based approach', 'Surgical intervention']
        });
        break;
      case 'medication_recommendation':
        recommendations.push({
          id: `rec_${Date.now()}_2`,
          type: 'medication',
          recommendation: 'Start with low-dose ACE inhibitor',
          confidence: 0.78,
          reasoning: ['Blood pressure readings indicate hypertension', 'No contraindications found'],
          supportingData: inputData,
          riskFactors: ['Kidney function monitoring required'],
          contraindications: ['Pregnancy', 'Severe kidney disease'],
          alternatives: ['ARB therapy', 'Calcium channel blockers']
        });
        break;
      default:
        recommendations.push({
          id: `rec_${Date.now()}_3`,
          type: 'referral',
          recommendation: 'Refer to specialist for further evaluation',
          confidence: 0.70,
          reasoning: ['Complex case requiring specialist input'],
          supportingData: inputData,
          riskFactors: [],
          contraindications: [],
          alternatives: ['Continue monitoring', 'Additional testing']
        });
    }

    return recommendations;
  }

  private calculateOverallConfidence(recommendations: AIRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    const totalConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0);
    return totalConfidence / recommendations.length;
  }

  private extractReasoningFromRecommendations(recommendations: AIRecommendation[]): string[] {
    return recommendations.flatMap(rec => rec.reasoning);
  }

  private generateEvidenceBase(decisionType: string, inputData: Record<string, any>): EvidenceSource[] {
    // Mock evidence sources - in real implementation, would query medical databases
    return [
      {
        type: 'clinical_guideline',
        source: 'American Heart Association Guidelines 2023',
        relevance: 0.9,
        quality: 'high',
        url: 'https://www.ahajournals.org/guidelines'
      },
      {
        type: 'patient_history',
        source: 'Patient medical history',
        relevance: 0.95,
        quality: 'high'
      }
    ];
  }

  private async triggerQualityAssurance(
    patientId: string,
    decisionType: string,
    clinicalDecision: ClinicalDecision
  ): Promise<void> {
    // Trigger quality assurance workflow asynchronously
    setTimeout(async () => {
      try {
        await this.executeQualityAssurance(
          patientId,
          'outcome_prediction',
          { clinicalDecision }
        );
      } catch (error) {
        console.error('Error in triggered quality assurance:', error);
      }
    }, 1000);
  }

  private calculateTreatmentConfidence(
    treatmentPlans: any[],
    productRecommendations: any[],
    bundleRecommendations: any[]
  ): number {
    // Calculate weighted confidence based on all recommendations
    let totalWeight = 0;
    let weightedConfidence = 0;

    if (treatmentPlans.length > 0) {
      const avgPlanScore = treatmentPlans.reduce((sum, plan) => sum + plan.score, 0) / treatmentPlans.length;
      weightedConfidence += avgPlanScore * 0.4;
      totalWeight += 0.4;
    }

    if (productRecommendations.length > 0) {
      const avgProductConfidence = productRecommendations.reduce((sum, rec) => sum + (rec.confidence || 0.5), 0) / productRecommendations.length;
      weightedConfidence += avgProductConfidence * 0.3;
      totalWeight += 0.3;
    }

    if (bundleRecommendations.length > 0) {
      const avgBundleConfidence = bundleRecommendations.reduce((sum, bundle) => sum + bundle.confidence, 0) / bundleRecommendations.length;
      weightedConfidence += avgBundleConfidence * 0.3;
      totalWeight += 0.3;
    }

    return totalWeight > 0 ? weightedConfidence / totalWeight : 0.5;
  }

  private async logTreatmentRecommendation(patientId: string, data: any): Promise<void> {
    // Log treatment recommendation for analytics
    try {
      await analyticsService.trackEvent('treatment_recommendation_generated', {
        patientId,
        treatmentPlansCount: data.treatmentPlans.length,
        productRecommendationsCount: data.productRecommendations.length,
        bundleRecommendationsCount: data.bundleRecommendations.length,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging treatment recommendation:', error);
    }
  }

  private async performQualityAnalysis(
    assessmentType: string,
    inputData: Record<string, any>
  ): Promise<QualityAnalysis> {
    // Simplified quality analysis - would use ML models in real implementation
    return {
      overallScore: 0.82,
      dimensions: {
        effectiveness: 0.85,
        safety: 0.90,
        timeliness: 0.75,
        patientCentered: 0.88,
        efficiency: 0.80,
        equity: 0.85
      },
      insights: [
        'Treatment adherence is above average',
        'Patient satisfaction scores are high',
        'Room for improvement in care coordination'
      ],
      trends: [
        {
          metric: 'effectiveness',
          direction: 'improving',
          changePercentage: 5.2,
          timeframe: '30 days'
        }
      ]
    };
  }

  private async generateQualityRecommendations(
    assessmentType: string,
    analysis: QualityAnalysis,
    patientContext: Record<string, any>
  ): Promise<QualityRecommendation[]> {
    const recommendations: QualityRecommendation[] = [];

    if (analysis.dimensions.timeliness < 0.8) {
      recommendations.push({
        type: 'process_improvement',
        description: 'Implement automated appointment reminders to improve timeliness',
        priority: 'high',
        expectedImpact: 0.15,
        implementation: 'Configure SMS/email reminders 24h before appointments',
        timeline: '2 weeks'
      });
    }

    if (analysis.dimensions.efficiency < 0.85) {
      recommendations.push({
        type: 'clinical_intervention',
        description: 'Streamline intake process to improve efficiency',
        priority: 'medium',
        expectedImpact: 0.12,
        implementation: 'Deploy digital intake forms and pre-visit questionnaires',
        timeline: '4 weeks'
      });
    }

    return recommendations;
  }

  private calculateRiskScore(analysis: QualityAnalysis, treatmentHistory: any[]): number {
    // Calculate risk score based on quality analysis and treatment history
    let riskScore = 1 - analysis.overallScore;
    
    // Adjust based on treatment history complexity
    if (treatmentHistory.length > 5) {
      riskScore += 0.1; // Higher complexity = higher risk
    }

    return Math.min(1, Math.max(0, riskScore));
  }

  private determinePriority(riskScore: number, analysis: QualityAnalysis): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore > 0.8) return 'critical';
    if (riskScore > 0.6) return 'high';
    if (riskScore > 0.4) return 'medium';
    return 'low';
  }

  private async triggerHighRiskAlert(patientId: string, assessment: QualityAssessment): Promise<void> {
    // Trigger high-risk alert - would integrate with notification service
    console.log('HIGH RISK ALERT:', { patientId, assessmentId: assessment.id, riskScore: assessment.riskScore });
    
    // TODO: Integrate with notification service
    // await notificationService.sendHighRiskAlert(patientId, assessment);
  }

  private async getTreatmentHistory(patientId: string): Promise<any[]> {
    try {
      if (!this.db) return [];

      const consultationsQuery = query(
        collection(this.db, 'consultations'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const consultationsSnapshot = await getDocs(consultationsQuery);
      return consultationsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting treatment history:', error);
      return [];
    }
  }

  private async performRoutingAnalysis(
    routingType: string,
    inputCriteria: Record<string, any>
  ): Promise<RoutingAnalysis> {
    // Simplified routing analysis
    return {
      patientComplexity: 0.6,
      providerCapacity: {
        'provider_1': 0.8,
        'provider_2': 0.4,
        'provider_3': 0.9
      },
      resourceAvailability: {
        'room_1': 0.7,
        'room_2': 0.3,
        'equipment_1': 0.9
      },
      urgencyScore: 0.5,
      matchingFactors: ['specialty_match', 'availability', 'patient_preference']
    };
  }

  private async generateRoutingRecommendations(
    routingType: string,
    analysis: RoutingAnalysis,
    inputCriteria: Record<string, any>
  ): Promise<RoutingRecommendation[]> {
    // Simplified routing recommendations
    const recommendations: RoutingRecommendation[] = [];

    switch (routingType) {
      case 'patient_assignment':
        Object.entries(analysis.providerCapacity).forEach(([providerId, capacity]) => {
          recommendations.push({
            option: providerId,
            score: capacity * 0.8 + Math.random() * 0.2,
            reasoning: [`Provider has ${(capacity * 100).toFixed(0)}% capacity available`],
            pros: ['Available', 'Experienced'],
            cons: capacity < 0.5 ? ['High workload'] : [],
            estimatedOutcome: { waitTime: Math.round((1 - capacity) * 60) }
          });
        });
        break;
      default:
        recommendations.push({
          option: 'default_assignment',
          score: 0.7,
          reasoning: ['Standard routing applied'],
          pros: ['Reliable'],
          cons: ['Not optimized'],
          estimatedOutcome: { waitTime: 30 }
        });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private selectOptimalAssignment(recommendations: RoutingRecommendation[]): Record<string, any> {
    if (recommendations.length === 0) {
      return { assignment: 'none', reason: 'No recommendations available' };
    }

    const bestRecommendation = recommendations[0];
    return {
      assignment: bestRecommendation.option,
      score: bestRecommendation.score,
      reasoning: bestRecommendation.reasoning,
      estimatedOutcome: bestRecommendation.estimatedOutcome
    };
  }

  private calculateRoutingConfidence(
    recommendations: RoutingRecommendation[],
    analysis: RoutingAnalysis
  ): number {
    if (recommendations.length === 0) return 0;

    const bestScore = recommendations[0].score;
    const scoreSpread = recommendations.length > 1 ? 
      bestScore - recommendations[recommendations.length - 1].score : 0;

    // Higher confidence when there's a clear best option
    return Math.min(1, bestScore + (scoreSpread * 0.2));
  }

  private calculateSuccessRate(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    const successfulDecisions = decisions.filter(d => 
      d.status === 'approved' || d.status === 'completed'
    );
    
    return successfulDecisions.length / decisions.length;
  }

  private calculateAverageConfidence(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    const totalConfidence = decisions.reduce((sum, d) => sum + (d.confidence || 0), 0);
    return totalConfidence / decisions.length;
  }

  private calculateProviderAcceptanceRate(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    
    const acceptedDecisions = decisions.filter(d => 
      d.status === 'approved' && !d.providerOverride
    );
    
    return acceptedDecisions.length / decisions.length;
  }
}

// Export singleton instance
export const aiOverseerSystem = new AIOverseerSystem();
export default aiOverseerSystem;
