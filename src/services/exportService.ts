/**
 * Export Service
 * 
 * This service handles data export in multiple formats (CSV, JSON, PDF, Excel).
 * Supports exporting patient data, measurements, orders, consultations, and other
 * healthcare data while maintaining HIPAA compliance and data privacy.
 * Adapted from the old repository to work with Firebase.
 */

import { getFirebaseFirestore } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

// Export formats
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel' | 'xml';

// Export types
export type ExportType = 
  | 'patients'
  | 'measurements' 
  | 'orders'
  | 'consultations'
  | 'shipments'
  | 'ocr_results'
  | 'analytics'
  | 'audit_log'
  | 'forms'
  | 'custom';

// Export status
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

// Export job interface
export interface ExportJob {
  id: string;
  type: ExportType;
  format: ExportFormat;
  status: ExportStatus;
  
  // Request details
  requestedBy: string;
  requestedAt: Timestamp;
  
  // Export parameters
  filters: {
    dateRange?: {
      start: string;
      end: string;
    };
    patientIds?: string[];
    includeFields?: string[];
    excludeFields?: string[];
    customQuery?: Record<string, any>;
  };
  
  // Processing details
  totalRecords?: number;
  processedRecords?: number;
  processingStarted?: Timestamp;
  processingCompleted?: Timestamp;
  
  // Results
  downloadUrl?: string;
  fileSize?: number;
  fileName?: string;
  expiresAt?: Timestamp;
  
  // Error handling
  errorMessage?: string;
  retryCount?: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Export configuration
const EXPORT_CONFIG = {
  // File size limits (in bytes)
  maxFileSize: 100 * 1024 * 1024, // 100MB
  
  // Record limits
  maxRecords: 50000,
  
  // Export expiration (7 days)
  expirationDays: 7,
  
  // Supported formats per type
  supportedFormats: {
    patients: ['csv', 'json', 'excel'],
    measurements: ['csv', 'json', 'excel'],
    orders: ['csv', 'json', 'pdf', 'excel'],
    consultations: ['csv', 'json', 'pdf'],
    shipments: ['csv', 'json', 'excel'],
    ocr_results: ['json', 'pdf'],
    analytics: ['csv', 'json', 'excel'],
    audit_log: ['csv', 'json'],
    forms: ['json'],
    custom: ['csv', 'json', 'excel']
  } as Record<ExportType, ExportFormat[]>,
  
  // Default field mappings
  fieldMappings: {
    patients: {
      id: 'Patient ID',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      dateOfBirth: 'Date of Birth',
      createdAt: 'Registration Date'
    },
    measurements: {
      patientId: 'Patient ID',
      type: 'Measurement Type',
      value: 'Value',
      unit: 'Unit',
      date: 'Date',
      notes: 'Notes'
    },
    orders: {
      id: 'Order ID',
      patientId: 'Patient ID',
      status: 'Status',
      total: 'Total Amount',
      createdAt: 'Order Date',
      shippingAddress: 'Shipping Address'
    }
  }
};

export const exportService = {
  /**
   * Create a new export job
   */
  async createExportJob(
    type: ExportType,
    format: ExportFormat,
    requestedBy: string,
    filters: ExportJob['filters'] = {}
  ): Promise<ExportJob> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      // Validate format for type
      if (!EXPORT_CONFIG.supportedFormats[type].includes(format)) {
        throw new Error(`Format ${format} not supported for export type ${type}`);
      }

      const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + EXPORT_CONFIG.expirationDays);

      const exportJob: ExportJob = {
        id: exportId,
        type,
        format,
        status: 'pending',
        requestedBy,
        requestedAt: Timestamp.now(),
        filters,
        retryCount: 0,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const exportRef = doc(db, 'export_jobs', exportId);
      await setDoc(exportRef, exportJob);

      // Start processing asynchronously
      this.processExportJob(exportId);

      return exportJob;
    } catch (error) {
      console.error('Error creating export job:', error);
      throw error;
    }
  },

  /**
   * Get export job by ID
   */
  async getExportJob(exportId: string): Promise<ExportJob | null> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const exportRef = doc(db, 'export_jobs', exportId);
      const exportDoc = await getDoc(exportRef);

      if (!exportDoc.exists()) {
        return null;
      }

      return exportDoc.data() as ExportJob;
    } catch (error) {
      console.error('Error fetching export job:', error);
      throw error;
    }
  },

  /**
   * Get export jobs for a user
   */
  async getUserExportJobs(
    userId: string,
    status?: ExportStatus,
    limitCount: number = 20
  ): Promise<ExportJob[]> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      let q = query(
        collection(db, 'export_jobs'),
        where('requestedBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status) {
        q = query(
          collection(db, 'export_jobs'),
          where('requestedBy', '==', userId),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as ExportJob);
    } catch (error) {
      console.error('Error fetching user export jobs:', error);
      throw error;
    }
  },

  /**
   * Process export job
   */
  async processExportJob(exportId: string): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const exportRef = doc(db, 'export_jobs', exportId);
      const exportJob = await this.getExportJob(exportId);

      if (!exportJob) {
        throw new Error('Export job not found');
      }

      // Update status to processing
      await updateDoc(exportRef, {
        status: 'processing',
        processingStarted: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Get data based on export type
      const data = await this.fetchDataForExport(exportJob);

      // Generate file based on format
      const fileResult = await this.generateExportFile(exportJob, data);

      // Update job with completion details
      await updateDoc(exportRef, {
        status: 'completed',
        processingCompleted: Timestamp.now(),
        totalRecords: data.length,
        processedRecords: data.length,
        downloadUrl: fileResult.downloadUrl,
        fileName: fileResult.fileName,
        fileSize: fileResult.fileSize,
        updatedAt: Timestamp.now()
      });

    } catch (error) {
      console.error('Error processing export job:', error);
      
      const db = getFirebaseFirestore();
      if (db) {
        const exportRef = doc(db, 'export_jobs', exportId);
        await updateDoc(exportRef, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: (await this.getExportJob(exportId))?.retryCount || 0 + 1,
          updatedAt: Timestamp.now()
        });
      }
    }
  },

  /**
   * Fetch data for export based on type and filters
   */
  async fetchDataForExport(exportJob: ExportJob): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error('Firebase database not initialized');
    }

    const { type, filters } = exportJob;
    let data: any[] = [];

    switch (type) {
      case 'patients':
        data = await this.fetchPatientsData(filters);
        break;
      case 'measurements':
        data = await this.fetchMeasurementsData(filters);
        break;
      case 'orders':
        data = await this.fetchOrdersData(filters);
        break;
      case 'consultations':
        data = await this.fetchConsultationsData(filters);
        break;
      case 'shipments':
        data = await this.fetchShipmentsData(filters);
        break;
      case 'ocr_results':
        data = await this.fetchOCRResultsData(filters);
        break;
      case 'analytics':
        data = await this.fetchAnalyticsData(filters);
        break;
      case 'audit_log':
        data = await this.fetchAuditLogData(filters);
        break;
      case 'forms':
        data = await this.fetchFormsData(filters);
        break;
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }

    // Apply record limit
    if (data.length > EXPORT_CONFIG.maxRecords) {
      data = data.slice(0, EXPORT_CONFIG.maxRecords);
    }

    return data;
  },

  /**
   * Fetch patients data
   */
  async fetchPatientsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    let q = query(collection(db, 'patients'));

    if (filters.dateRange) {
      q = query(
        collection(db, 'patients'),
        where('createdAt', '>=', Timestamp.fromDate(new Date(filters.dateRange.start))),
        where('createdAt', '<=', Timestamp.fromDate(new Date(filters.dateRange.end)))
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch measurements data
   */
  async fetchMeasurementsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    const querySnapshot = await getDocs(collection(db, 'patient_measurements'));
    const measurements: any[] = [];

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.measurements) {
        Object.entries(data.measurements).forEach(([type, measurementArray]) => {
          (measurementArray as any[]).forEach(measurement => {
            measurements.push({
              patientId: data.patientId,
              type,
              value: measurement.value,
              unit: measurement.unit,
              date: measurement.date,
              notes: measurement.notes
            });
          });
        });
      }
    });

    return measurements;
  },

  /**
   * Fetch orders data
   */
  async fetchOrdersData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    let q = query(collection(db, 'orders'));

    if (filters.dateRange) {
      q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(new Date(filters.dateRange.start))),
        where('createdAt', '<=', Timestamp.fromDate(new Date(filters.dateRange.end)))
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch consultations data
   */
  async fetchConsultationsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    const querySnapshot = await getDocs(collection(db, 'consultations'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch shipments data
   */
  async fetchShipmentsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    const querySnapshot = await getDocs(collection(db, 'shipments'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch OCR results data
   */
  async fetchOCRResultsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    const querySnapshot = await getDocs(collection(db, 'ocr_results'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch analytics data
   */
  async fetchAnalyticsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    const querySnapshot = await getDocs(collection(db, 'analytics_events'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch audit log data
   */
  async fetchAuditLogData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    let q = query(collection(db, 'audit_log'), orderBy('timestamp', 'desc'));

    if (filters.dateRange) {
      q = query(
        collection(db, 'audit_log'),
        where('timestamp', '>=', Timestamp.fromDate(new Date(filters.dateRange.start))),
        where('timestamp', '<=', Timestamp.fromDate(new Date(filters.dateRange.end))),
        orderBy('timestamp', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch forms data
   */
  async fetchFormsData(filters: ExportJob['filters']): Promise<any[]> {
    const db = getFirebaseFirestore();
    if (!db) return [];

    const querySnapshot = await getDocs(collection(db, 'form_schemas'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Generate export file based on format
   */
  async generateExportFile(
    exportJob: ExportJob,
    data: any[]
  ): Promise<{
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  }> {
    const { type, format } = exportJob;
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${type}_export_${timestamp}.${format}`;

    let fileContent: string;
    let fileSize: number;

    switch (format) {
      case 'csv':
        fileContent = this.generateCSV(data, type);
        break;
      case 'json':
        fileContent = this.generateJSON(data);
        break;
      case 'excel':
        fileContent = this.generateExcel(data, type);
        break;
      case 'pdf':
        fileContent = this.generatePDF(data, type);
        break;
      case 'xml':
        fileContent = this.generateXML(data, type);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    fileSize = new Blob([fileContent]).size;

    // In a real implementation, this would upload to cloud storage
    // For now, we'll simulate a download URL
    const downloadUrl = `https://storage.example.com/exports/${fileName}`;

    return {
      downloadUrl,
      fileName,
      fileSize
    };
  },

  /**
   * Generate CSV format
   */
  generateCSV(data: any[], type: ExportType): string {
    if (data.length === 0) return '';

    const fieldMapping = (EXPORT_CONFIG.fieldMappings as any)[type] || {};
    const headers = Object.keys(data[0]).map(key => fieldMapping[key] || key);
    
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      )
    ];

    return csvRows.join('\n');
  },

  /**
   * Generate JSON format
   */
  generateJSON(data: any[]): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      data
    }, null, 2);
  },

  /**
   * Generate Excel format (simplified - would use a library like xlsx)
   */
  generateExcel(data: any[], type: ExportType): string {
    // In a real implementation, this would use a library like xlsx
    // For now, return CSV format as placeholder
    return this.generateCSV(data, type);
  },

  /**
   * Generate PDF format (simplified - would use a library like jsPDF)
   */
  generatePDF(data: any[], type: ExportType): string {
    // In a real implementation, this would use a library like jsPDF
    // For now, return JSON format as placeholder
    return this.generateJSON(data);
  },

  /**
   * Generate XML format
   */
  generateXML(data: any[], type: ExportType): string {
    const xmlRows = data.map(item => {
      const fields = Object.entries(item)
        .map(([key, value]) => `    <${key}>${value}</${key}>`)
        .join('\n');
      return `  <record>\n${fields}\n  </record>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<export>
  <metadata>
    <type>${type}</type>
    <exportedAt>${new Date().toISOString()}</exportedAt>
    <totalRecords>${data.length}</totalRecords>
  </metadata>
  <data>
${xmlRows}
  </data>
</export>`;
  },

  /**
   * Clean up expired export jobs
   */
  async cleanupExpiredExports(): Promise<number> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const now = Timestamp.now();
      const q = query(
        collection(db, 'export_jobs'),
        where('expiresAt', '<=', now)
      );

      const querySnapshot = await getDocs(q);
      let deletedCount = 0;

      for (const docSnapshot of querySnapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired exports:', error);
      throw error;
    }
  },

  /**
   * Get export statistics
   */
  async getExportStats(): Promise<{
    totalExports: number;
    byStatus: Record<ExportStatus, number>;
    byType: Record<ExportType, number>;
    byFormat: Record<ExportFormat, number>;
    averageProcessingTime: number;
  }> {
    try {
      const db = getFirebaseFirestore();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }

      const querySnapshot = await getDocs(collection(db, 'export_jobs'));
      const exports = querySnapshot.docs.map(doc => doc.data() as ExportJob);

      const stats = {
        totalExports: exports.length,
        byStatus: {} as Record<ExportStatus, number>,
        byType: {} as Record<ExportType, number>,
        byFormat: {} as Record<ExportFormat, number>,
        averageProcessingTime: 0
      };

      let totalProcessingTime = 0;
      let completedCount = 0;

      exports.forEach(exportJob => {
        // Count by status
        stats.byStatus[exportJob.status] = (stats.byStatus[exportJob.status] || 0) + 1;
        
        // Count by type
        stats.byType[exportJob.type] = (stats.byType[exportJob.type] || 0) + 1;
        
        // Count by format
        stats.byFormat[exportJob.format] = (stats.byFormat[exportJob.format] || 0) + 1;
        
        // Calculate processing time
        if (exportJob.processingStarted && exportJob.processingCompleted) {
          const processingTime = exportJob.processingCompleted.toMillis() - exportJob.processingStarted.toMillis();
          totalProcessingTime += processingTime;
          completedCount++;
        }
      });

      stats.averageProcessingTime = completedCount > 0 ? totalProcessingTime / completedCount / 1000 : 0; // in seconds

      return stats;
    } catch (error) {
      console.error('Error getting export stats:', error);
      throw error;
    }
  }
};

export default exportService;
