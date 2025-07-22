/**
 * OCR Service
 * 
 * This service handles Optical Character Recognition (OCR) for medical documents,
 * lab results, and other healthcare-related document processing.
 * Adapted from the old repository to work with modern OCR APIs.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// OCR Processing Status
export type OCRStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'requires_review';

// Document Types
export type DocumentType = 
  | 'lab_results' 
  | 'prescription' 
  | 'medical_record' 
  | 'insurance_card' 
  | 'id_document' 
  | 'progress_photo'
  | 'other';

// OCR Result Interface
export interface OCRResult {
  id: string;
  patientId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl?: string;
  status: OCRStatus;
  
  // OCR Processing Results
  extractedText?: string;
  confidence?: number;
  
  // Structured Data Extraction
  structuredData?: {
    // Lab Results
    testResults?: Array<{
      testName: string;
      value: string;
      unit?: string;
      referenceRange?: string;
      flag?: 'normal' | 'high' | 'low' | 'critical';
    }>;
    
    // Patient Information
    patientInfo?: {
      name?: string;
      dateOfBirth?: string;
      mrn?: string; // Medical Record Number
    };
    
    // Document Metadata
    documentDate?: string;
    provider?: string;
    facility?: string;
    
    // Prescription Data
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      quantity?: string;
      refills?: string;
    }>;
    
    // Insurance Information
    insuranceInfo?: {
      memberID?: string;
      groupNumber?: string;
      planName?: string;
      effectiveDate?: string;
    };
  };
  
  // Processing Metadata
  processingTime?: number;
  errorMessage?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// OCR Configuration
const OCR_CONFIG = {
  // Supported file types
  supportedTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'],
  
  // Maximum file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // OCR API endpoints (would be configured based on chosen provider)
  apiEndpoints: {
    textExtraction: '/api/ocr/extract-text',
    structuredExtraction: '/api/ocr/extract-structured',
    documentClassification: '/api/ocr/classify-document'
  },
  
  // Document type patterns for classification
  documentPatterns: {
    lab_results: [
      /lab\s*result/i,
      /laboratory/i,
      /blood\s*test/i,
      /urinalysis/i,
      /chemistry\s*panel/i,
      /cbc/i,
      /lipid\s*panel/i
    ],
    prescription: [
      /prescription/i,
      /rx/i,
      /medication/i,
      /pharmacy/i,
      /take\s*\d+.*times/i,
      /refill/i
    ],
    insurance_card: [
      /insurance/i,
      /member\s*id/i,
      /group\s*number/i,
      /effective\s*date/i,
      /copay/i,
      /deductible/i
    ]
  }
};

export const ocrService = {
  /**
   * Process a document with OCR
   */
  async processDocument(
    patientId: string,
    file: File,
    documentType?: DocumentType
  ): Promise<OCRResult> {
    try {
      // Validate file
      this.validateFile(file);
      
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      // Create initial OCR record
      const ocrId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ocrResult: OCRResult = {
        id: ocrId,
        patientId,
        documentType: documentType || 'other',
        fileName: file.name,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Save initial record
      const ocrRef = doc(db, 'ocr_results', ocrId);
      await setDoc(ocrRef, ocrResult);

      // Start OCR processing (async)
      this.performOCRProcessing(ocrId, file, documentType);

      return ocrResult;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  },

  /**
   * Validate uploaded file
   */
  validateFile(file: File): void {
    // Check file size
    if (file.size > OCR_CONFIG.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${OCR_CONFIG.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!OCR_CONFIG.supportedTypes.includes(fileExtension)) {
      throw new Error(`Unsupported file type. Supported types: ${OCR_CONFIG.supportedTypes.join(', ')}`);
    }
  },

  /**
   * Perform actual OCR processing (would integrate with OCR API)
   */
  async performOCRProcessing(
    ocrId: string,
    file: File,
    documentType?: DocumentType
  ): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const ocrRef = doc(db, 'ocr_results', ocrId);
      
      // Update status to processing
      await updateDoc(ocrRef, {
        status: 'processing',
        updatedAt: Timestamp.now()
      });

      const startTime = Date.now();

      // TODO: Integrate with actual OCR service (Google Vision, AWS Textract, etc.)
      // For now, we'll simulate OCR processing
      const ocrResults = await this.simulateOCRProcessing(file, documentType);

      const processingTime = Date.now() - startTime;

      // Update with results
      await updateDoc(ocrRef, {
        status: 'completed',
        extractedText: ocrResults.extractedText,
        confidence: ocrResults.confidence,
        structuredData: ocrResults.structuredData,
        processingTime,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('OCR processing failed:', error);
      
      const db = getFirebaseFirestore();
      if (db) {
        const ocrRef = doc(db, 'ocr_results', ocrId);
        await updateDoc(ocrRef, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: Timestamp.now()
        });
      }
    }
  },

  /**
   * Simulate OCR processing (replace with actual OCR API integration)
   */
  async simulateOCRProcessing(
    file: File,
    documentType?: DocumentType
  ): Promise<{
    extractedText: string;
    confidence: number;
    structuredData: any;
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock OCR results based on document type
    if (documentType === 'lab_results') {
      return {
        extractedText: `
          LABORATORY RESULTS
          Patient: John Doe
          DOB: 01/15/1985
          MRN: 123456789
          Date: ${new Date().toLocaleDateString()}
          
          COMPLETE BLOOD COUNT (CBC)
          White Blood Cells: 7.2 K/uL (4.0-11.0)
          Red Blood Cells: 4.5 M/uL (4.2-5.4)
          Hemoglobin: 14.2 g/dL (12.0-16.0)
          Hematocrit: 42.1% (36.0-46.0)
          Platelets: 285 K/uL (150-450)
          
          BASIC METABOLIC PANEL
          Glucose: 95 mg/dL (70-100)
          Sodium: 140 mEq/L (136-145)
          Potassium: 4.1 mEq/L (3.5-5.1)
          Chloride: 102 mEq/L (98-107)
          BUN: 18 mg/dL (7-20)
          Creatinine: 1.0 mg/dL (0.6-1.2)
        `,
        confidence: 0.95,
        structuredData: {
          testResults: [
            { testName: 'White Blood Cells', value: '7.2', unit: 'K/uL', referenceRange: '4.0-11.0', flag: 'normal' },
            { testName: 'Red Blood Cells', value: '4.5', unit: 'M/uL', referenceRange: '4.2-5.4', flag: 'normal' },
            { testName: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'normal' },
            { testName: 'Hematocrit', value: '42.1', unit: '%', referenceRange: '36.0-46.0', flag: 'normal' },
            { testName: 'Platelets', value: '285', unit: 'K/uL', referenceRange: '150-450', flag: 'normal' },
            { testName: 'Glucose', value: '95', unit: 'mg/dL', referenceRange: '70-100', flag: 'normal' },
            { testName: 'Sodium', value: '140', unit: 'mEq/L', referenceRange: '136-145', flag: 'normal' },
            { testName: 'Potassium', value: '4.1', unit: 'mEq/L', referenceRange: '3.5-5.1', flag: 'normal' },
            { testName: 'Chloride', value: '102', unit: 'mEq/L', referenceRange: '98-107', flag: 'normal' },
            { testName: 'BUN', value: '18', unit: 'mg/dL', referenceRange: '7-20', flag: 'normal' },
            { testName: 'Creatinine', value: '1.0', unit: 'mg/dL', referenceRange: '0.6-1.2', flag: 'normal' }
          ],
          patientInfo: {
            name: 'John Doe',
            dateOfBirth: '01/15/1985',
            mrn: '123456789'
          },
          documentDate: new Date().toISOString(),
          provider: 'City Medical Lab',
          facility: 'Downtown Laboratory'
        }
      };
    }

    // Default mock result
    return {
      extractedText: `Mock extracted text from ${file.name}`,
      confidence: 0.85,
      structuredData: {}
    };
  },

  /**
   * Get OCR result by ID
   */
  async getOCRResult(ocrId: string): Promise<OCRResult | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const ocrRef = doc(db, 'ocr_results', ocrId);
      const ocrDoc = await getDoc(ocrRef);

      if (!ocrDoc.exists()) {
        return null;
      }

      return ocrDoc.data() as OCRResult;
    } catch (error) {
      console.error('Error fetching OCR result:', error);
      throw error;
    }
  },

  /**
   * Get all OCR results for a patient
   */
  async getPatientOCRResults(
    patientId: string,
    documentType?: DocumentType,
    limitCount: number = 50
  ): Promise<OCRResult[]> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      let q = query(
        collection(db, 'ocr_results'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (documentType) {
        q = query(
          collection(db, 'ocr_results'),
          where('patientId', '==', patientId),
          where('documentType', '==', documentType),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as OCRResult);
    } catch (error) {
      console.error('Error fetching patient OCR results:', error);
      throw error;
    }
  },

  /**
   * Update OCR result with review information
   */
  async reviewOCRResult(
    ocrId: string,
    reviewNotes: string,
    reviewedBy: string,
    correctedData?: any
  ): Promise<OCRResult> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const ocrRef = doc(db, 'ocr_results', ocrId);
      const updateData: Partial<OCRResult> = {
        reviewNotes,
        reviewedBy,
        reviewedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (correctedData) {
        updateData.structuredData = correctedData;
      }

      await updateDoc(ocrRef, updateData);

      // Return updated result
      const updatedDoc = await getDoc(ocrRef);
      return updatedDoc.data() as OCRResult;
    } catch (error) {
      console.error('Error reviewing OCR result:', error);
      throw error;
    }
  },

  /**
   * Extract lab results from OCR data for measurement service
   */
  extractLabResultsForMeasurements(ocrResult: OCRResult): Array<{
    type: string;
    value: number | string;
    unit?: string;
    referenceRange?: string;
    flag?: string;
    notes?: string;
  }> {
    const measurements: Array<{
      type: string;
      value: number | string;
      unit?: string;
      referenceRange?: string;
      flag?: string;
      notes?: string;
    }> = [];

    if (ocrResult.structuredData?.testResults) {
      ocrResult.structuredData.testResults.forEach(test => {
        measurements.push({
          type: test.testName.toLowerCase().replace(/\s+/g, '_'),
          value: test.value,
          ...(test.unit && { unit: test.unit }),
          ...(test.referenceRange && { referenceRange: test.referenceRange }),
          ...(test.flag && { flag: test.flag }),
          notes: `Lab result from ${ocrResult.fileName}`
        });
      });
    }

    return measurements;
  },

  /**
   * Classify document type based on content
   */
  classifyDocument(extractedText: string): DocumentType {
    const text = extractedText.toLowerCase();

    for (const [docType, patterns] of Object.entries(OCR_CONFIG.documentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return docType as DocumentType;
        }
      }
    }

    return 'other';
  },

  /**
   * Get OCR processing statistics
   */
  async getOCRStats(patientId?: string): Promise<{
    total: number;
    byStatus: Record<OCRStatus, number>;
    byDocumentType: Record<DocumentType, number>;
    averageProcessingTime: number;
    averageConfidence: number;
  }> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      let q = query(collection(db, 'ocr_results'));
      
      if (patientId) {
        q = query(collection(db, 'ocr_results'), where('patientId', '==', patientId));
      }

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => doc.data() as OCRResult);

      const stats = {
        total: results.length,
        byStatus: {} as Record<OCRStatus, number>,
        byDocumentType: {} as Record<DocumentType, number>,
        averageProcessingTime: 0,
        averageConfidence: 0
      };

      let totalProcessingTime = 0;
      let totalConfidence = 0;
      let processedCount = 0;

      results.forEach(result => {
        // Count by status
        stats.byStatus[result.status] = (stats.byStatus[result.status] || 0) + 1;
        
        // Count by document type
        stats.byDocumentType[result.documentType] = (stats.byDocumentType[result.documentType] || 0) + 1;
        
        // Calculate averages
        if (result.processingTime) {
          totalProcessingTime += result.processingTime;
        }
        if (result.confidence) {
          totalConfidence += result.confidence;
          processedCount++;
        }
      });

      stats.averageProcessingTime = results.length > 0 ? totalProcessingTime / results.length : 0;
      stats.averageConfidence = processedCount > 0 ? totalConfidence / processedCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting OCR stats:', error);
      throw error;
    }
  }
};

export default ocrService;
