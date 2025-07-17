
/**
 * OCR Service for extracting text from PDF and image files
 * Uses Tesseract.js for client-side text recognition (dynamically imported)
 */

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.Tesseract = null;
  }

  /**
   * Initialize the OCR worker with dynamic import
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Dynamic import of Tesseract.js - only loads when needed
      if (!this.Tesseract) {
        const module = await import('tesseract.js');
        this.Tesseract = module.default;
      }

      this.worker = await this.Tesseract.createWorker('eng');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR service initialization failed');
    }
  }

  /**
   * Extract text from a file (PDF or image)
   * @param {File} file - The file to process
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(file, onProgress = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const {
        data: { text },
      } = await this.worker.recognize(file, {}, {
        logger: onProgress
          ? (m) => {
              if (m.status === 'recognizing text') {
                onProgress(Math.round(m.progress * 100));
              }
            }
          : undefined,
      });

      return text;
    } catch (error) {
      console.error('OCR text extraction failed:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  /**
   * Parse lab values from extracted text using pattern matching
   * @param {string} text - Raw extracted text
   * @returns {Array} - Array of parsed lab results
   */
  parseLabValues(text) {
    const labPatterns = {
      'Total Cholesterol': /(?:total\s+)?cholesterol[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
      'Glucose': /glucose[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
      'HbA1c': /hba1c[:\s]+(\d+(?:\.\d+)?)\s*%?/i,
      'Triglycerides': /triglycerides[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
      'HDL Cholesterol': /hdl[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
      'LDL Cholesterol': /ldl[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
      'Hemoglobin': /hemoglobin[:\s]+(\d+(?:\.\d+)?)\s*(g\/dl)?/i,
      'WBC': /(?:wbc|white\s+blood\s+cell)[:\s]+(\d+(?:\.\d+)?)\s*(k\/ul)?/i,
      'RBC': /(?:rbc|red\s+blood\s+cell)[:\s]+(\d+(?:\.\d+)?)\s*(m\/ul)?/i,
    };

    const results = [];
    for (const [testName, config] of Object.entries(labPatterns)) {
      const match = text.match(config.pattern);
      if (match) {
        results.push({
          name: testName,
          value: match[1],
          unit: match[2] || config.unit || '',
          confidence: 0.85, 
        });
      }
    }
    return results;
  }

  /**
   * Clean up resources
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService();
export default ocrService;

    