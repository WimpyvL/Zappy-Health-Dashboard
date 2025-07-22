/**
 * @fileoverview Service for orchestrating prescription workflows, compliance, and routing
 */
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { contraindicationsService } from './contraindicationsService';

class PrescriptionOrchestrator {
  
  /**
   * Product Classification Types
   */
  static PRODUCT_TYPES = {
    PRESCRIPTION: 'prescription',
    OTC: 'otc',
    CONTROLLED: 'controlled',
    SUPPLEMENT: 'supplement',
    DEVICE: 'device'
  };

  static CONTROLLED_SCHEDULES = {
    SCHEDULE_I: 'CI',
    SCHEDULE_II: 'CII', 
    SCHEDULE_III: 'CIII',
    SCHEDULE_IV: 'CIV',
    SCHEDULE_V: 'CV'
  };

  /**
   * Determines if a product requires prescription workflow
   */
  async requiresPrescriptionWorkflow(productId) {
    try {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error("Product not found");
      }

      const product = productSnap.data();
      
      return {
        requiresPrescription: product.requiresPrescription || false,
        productType: product.productType || PrescriptionOrchestrator.PRODUCT_TYPES.OTC,
        controlledSchedule: product.controlledSchedule || null,
        deaRequired: product.deaRequired || false,
        specialHandling: product.specialHandling || false
      };
    } catch (error) {
      console.error('Error checking prescription requirements:', error);
      throw error;
    }
  }

  /**
   * Routes product order through appropriate workflow
   */
  async routeProductOrder(productId, patientId, providerData = null) {
    try {
      const prescriptionInfo = await this.requiresPrescriptionWorkflow(productId);
      
      if (!prescriptionInfo.requiresPrescription) {
        // Direct OTC/supplement order
        return await this.createDirectOrder(productId, patientId);
      }

      // Prescription workflow required
      return await this.createPrescriptionOrder(productId, patientId, providerData);
      
    } catch (error) {
      console.error('Error routing product order:', error);
      throw error;
    }
  }

  /**
   * Creates direct order for OTC products
   */
  async createDirectOrder(productId, patientId) {
    try {
      const orderData = {
        productId,
        patientId,
        orderType: 'direct',
        status: 'pending_payment',
        requiresApproval: false,
        createdAt: Timestamp.now(),
        workflow: 'otc_direct'
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);
      
      return {
        success: true,
        orderId: orderRef.id,
        workflow: 'direct',
        nextStep: 'payment'
      };
    } catch (error) {
      console.error('Error creating direct order:', error);
      throw error;
    }
  }

  /**
   * Creates prescription order requiring provider approval
   */
  async createPrescriptionOrder(productId, patientId, providerData) {
    try {
      const orderData = {
        productId,
        patientId,
        orderType: 'prescription',
        status: 'pending_consultation',
        requiresApproval: true,
        providerRequired: true,
        createdAt: Timestamp.now(),
        workflow: 'prescription_required'
      };

      // Add provider info if available
      if (providerData) {
        orderData.assignedProviderId = providerData.providerId;
        orderData.consultationId = providerData.consultationId;
      }

      const orderRef = await addDoc(collection(db, "orders"), orderData);
      
      return {
        success: true,
        orderId: orderRef.id,
        workflow: 'prescription',
        nextStep: 'consultation'
      };
    } catch (error) {
      console.error('Error creating prescription order:', error);
      throw error;
    }
  }

  /**
   * Provider authorization for prescription
   */
  async authorizePrescription(orderId, providerId, prescriptionData) {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }

      const order = orderSnap.data();
      
      // Validate provider authorization
      const providerAuth = await this.validateProviderAuthorization(providerId, order.productId);
      if (!providerAuth.authorized) {
        throw new Error(`Provider not authorized: ${providerAuth.reason}`);
      }

      // Create prescription record
      const prescriptionRecord = {
        orderId,
        providerId,
        patientId: order.patientId,
        productId: order.productId,
        medication: prescriptionData.medication,
        dosage: prescriptionData.dosage,
        instructions: prescriptionData.instructions,
        quantity: prescriptionData.quantity,
        refills: prescriptionData.refills || 0,
        daysSupply: prescriptionData.daysSupply,
        pharmacyId: prescriptionData.pharmacyId,
        status: 'active',
        prescribedAt: Timestamp.now(),
        expiresAt: prescriptionData.expiresAt || null,
        digitalSignature: `provider_${providerId}_${Date.now()}`,
        complianceFlags: await this.checkComplianceFlags(prescriptionData)
      };

      // Save prescription
      const prescriptionRef = await addDoc(collection(db, "prescriptions"), prescriptionRecord);
      
      // Update order status
      await updateDoc(orderRef, {
        status: 'prescription_approved',
        prescriptionId: prescriptionRef.id,
        approvedBy: providerId,
        approvedAt: Timestamp.now()
      });

      // Route to pharmacy if specified
      if (prescriptionData.pharmacyId) {
        await this.routeToPharmacy(prescriptionRef.id, prescriptionData.pharmacyId);
      }

      return {
        success: true,
        prescriptionId: prescriptionRef.id,
        nextStep: 'pharmacy_fulfillment'
      };
      
    } catch (error) {
      console.error('Error authorizing prescription:', error);
      throw error;
    }
  }

  /**
   * Validates provider authorization for prescribing
   */
  async validateProviderAuthorization(providerId, productId) {
    try {
      const providerRef = doc(db, "providers", providerId);
      const providerSnap = await getDoc(providerRef);
      
      if (!providerSnap.exists()) {
        return { authorized: false, reason: "Provider not found" };
      }

      const provider = providerSnap.data();
      
      // Check basic licensing
      if (!provider.licenseNumber || !provider.licenseState) {
        return { authorized: false, reason: "Invalid license information" };
      }

      if (provider.licenseStatus !== 'active') {
        return { authorized: false, reason: "License not active" };
      }

      // Check DEA authorization for controlled substances
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const product = productSnap.data();
        
        if (product.controlledSchedule && !provider.deaNumber) {
          return {
            authorized: false,
            reason: "DEA number required for controlled substances"
          };
        }
      }

      return { authorized: true };
      
    } catch (error) {
      console.error('Error validating provider authorization:', error);
      return { authorized: false, reason: "Authorization check failed" };
    }
  }

  /**
   * Routes prescription to pharmacy
   */
  async routeToPharmacy(prescriptionId, pharmacyId) {
    try {
      const pharmacyOrderData = {
        prescriptionId,
        pharmacyId,
        status: 'pending_fulfillment',
        routedAt: Timestamp.now(),
        fulfillmentType: 'standard'
      };

      await addDoc(collection(db, "pharmacy_orders"), pharmacyOrderData);
      
      // Update prescription status
      const prescriptionRef = doc(db, "prescriptions", prescriptionId);
      await updateDoc(prescriptionRef, {
        status: 'routed_to_pharmacy',
        pharmacyId,
        routedAt: Timestamp.now()
      });

      return { success: true };
      
    } catch (error) {
      console.error('Error routing to pharmacy:', error);
      throw error;
    }
  }

  /**
   * Checks compliance flags for prescription using comprehensive contraindications service
   */
  async checkComplianceFlags(prescriptionData) {
    try {
      // Prepare patient data for contraindications check
      const patientData = {
        allergies: prescriptionData.patientAllergies || [],
        currentMedications: prescriptionData.patientMedications || [],
        medicalHistory: prescriptionData.patientMedicalHistory || [],
        age: prescriptionData.patientAge,
        gender: prescriptionData.patientGender,
        isPregnant: prescriptionData.isPregnant || false,
        creatinine: prescriptionData.patientCreatinine,
        gfr: prescriptionData.patientGFR,
        alt: prescriptionData.patientALT,
        ast: prescriptionData.patientAST,
        liverDisease: prescriptionData.hasLiverDisease || false
      };

      // Prepare medication data
      const medicationData = {
        name: prescriptionData.medication,
        genericName: prescriptionData.genericName || prescriptionData.medication,
        brandName: prescriptionData.brandName,
        drugClass: prescriptionData.drugClass,
        dosage: prescriptionData.dosage,
        quantity: prescriptionData.quantity
      };

      // Get comprehensive contraindications check
      const contraindicationsResult = await contraindicationsService.checkContraindications(
        patientData,
        medicationData
      );

      // Convert contraindications to compliance flags format
      const flags = contraindicationsResult.contraindications.map(contra => ({
        type: contra.type,
        severity: this.mapSeverityToLevel(contra.severity),
        title: contra.title,
        details: contra.details,
        recommendation: contra.recommendation,
        source: contra.source,
        originalContraindication: contra
      }));

      // Add basic dosage validation
      const dosageCheck = this.validateDosage(prescriptionData);
      if (!dosageCheck.appropriate) {
        flags.push({
          type: 'dosage_warning',
          severity: 'warning',
          title: 'Dosage Validation',
          details: dosageCheck.reason,
          recommendation: 'Review dosage appropriateness',
          source: 'dosage_validation'
        });
      }

      return {
        flags,
        contraindicationsResult,
        hasAbsoluteContraindications: contraindicationsResult.absoluteContraindications.length > 0,
        recommendationAction: contraindicationsResult.recommendationAction
      };

    } catch (error) {
      console.error('Error checking compliance flags:', error);
      // Return basic validation on error
      return {
        flags: [{
          type: 'system_error',
          severity: 'warning',
          title: 'System Warning',
          details: 'Unable to complete full safety check. Proceed with clinical judgment.',
          recommendation: 'Manual review recommended',
          source: 'system'
        }],
        hasAbsoluteContraindications: false,
        recommendationAction: 'MANUAL_REVIEW_REQUIRED'
      };
    }
  }

  /**
   * Maps contraindication severity to compliance flag severity
   */
  mapSeverityToLevel(severity) {
    const severityMap = {
      'absolute': 'critical',
      'relative': 'warning',
      'warning': 'warning',
      'caution': 'info'
    };
    return severityMap[severity] || 'warning';
  }

  /**
   * Placeholder for drug interaction checking
   */
  async checkDrugInteractions(newMedication, currentMedications) {
    // This would integrate with a drug interaction database
    // For now, return empty array
    return [];
  }

  /**
   * Placeholder for allergy checking
   */
  async checkAllergies(medication, patientAllergies) {
    // This would check medication against patient allergy list
    return { hasAllergy: false, allergies: [] };
  }

  /**
   * Basic dosage validation
   */
  validateDosage(prescriptionData) {
    // Basic validation - would be more complex in real implementation
    if (!prescriptionData.dosage || !prescriptionData.quantity) {
      return {
        appropriate: false,
        reason: "Missing dosage or quantity information"
      };
    }

    return { appropriate: true };
  }

  /**
   * Gets patient's prescription history
   */
  async getPatientPrescriptionHistory(patientId) {
    try {
      const prescriptionsQuery = query(
        collection(db, "prescriptions"),
        where("patientId", "==", patientId),
        orderBy("prescribedAt", "desc")
      );
      
      const snapshot = await getDocs(prescriptionsQuery);
      const prescriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return prescriptions;
      
    } catch (error) {
      console.error('Error fetching prescription history:', error);
      throw error;
    }
  }

  /**
   * Creates audit trail for prescription actions
   */
  async createAuditTrail(action, data) {
    try {
      const auditData = {
        action,
        timestamp: Timestamp.now(),
        userId: data.userId,
        patientId: data.patientId,
        prescriptionId: data.prescriptionId,
        orderId: data.orderId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      };

      await addDoc(collection(db, "prescription_audit"), auditData);
      
    } catch (error) {
      console.error('Error creating audit trail:', error);
      // Don't throw - audit failure shouldn't block operations
    }
  }
}

export const prescriptionOrchestrator = new PrescriptionOrchestrator();