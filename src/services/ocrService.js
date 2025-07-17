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

      this.worker = await this.Tesseract.createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
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
      // Convert PDF to image if needed (simplified approach)
      const imageFile = await this.prepareFileForOCR(file);

      const {
        data: { text },
      } = await this.worker.recognize(imageFile, {
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
   * Prepare file for OCR processing
   * For PDFs, we'll use the first page as an image
   */
  async prepareFileForOCR(file) {
    if (file.type === 'application/pdf') {
      // For now, we'll ask the user to upload an image version
      // In a full implementation, we'd use PDF.js to convert PDF to canvas
      throw new Error(
        'PDF processing requires conversion to image. Please upload an image version of your lab results.'
      );
    }

    return file;
  }

  /**
   * Parse lab values from extracted text using pattern matching
   * @param {string} text - Raw extracted text
   * @returns {Array} - Array of parsed lab results
   */
  parseLabValues(text) {
    const labPatterns = {
      'Total Cholesterol': {
        pattern:
          /(?:total\s+)?cholesterol[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
        unit: 'mg/dL',
      },
      Glucose: {
        pattern: /glucose[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
        unit: 'mg/dL',
      },
      HbA1c: {
        pattern: /hba1c[:\s]+(\d+(?:\.\d+)?)\s*%?/i,
        unit: '%',
      },
      Triglycerides: {
        pattern: /triglycerides[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
        unit: 'mg/dL',
      },
      'HDL Cholesterol': {
        pattern: /hdl[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
        unit: 'mg/dL',
      },
      'LDL Cholesterol': {
        pattern: /ldl[:\s]+(\d+(?:\.\d+)?)\s*(mg\/dl|mmol\/l)?/i,
        unit: 'mg/dL',
      },
      Hemoglobin: {
        pattern: /hemoglobin[:\s]+(\d+(?:\.\d+)?)\s*(g\/dl)?/i,
        unit: 'g/dL',
      },
      'White Blood Cell Count': {
        pattern:
          /(?:wbc|white\s+blood\s+cell)[:\s]+(\d+(?:\.\d+)?)\s*(k\/ul)?/i,
        unit: 'K/uL',
      },
      'Red Blood Cell Count': {
        pattern: /(?:rbc|red\s+blood\s+cell)[:\s]+(\d+(?:\.\d+)?)\s*(m\/ul)?/i,
        unit: 'M/uL',
      },
    };

    const referencePatterns = {
      range: /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/,
      lessThan: /<\s*(\d+(?:\.\d+)?)/,
      greaterThan: />\s*(\d+(?:\.\d+)?)/,
      normal: /normal|within\s+range/i,
    };

    const results = [];
    const textLines = text.split('\n');

    for (const [testName, config] of Object.entries(labPatterns)) {
      const match = text.match(config.pattern);
      if (match) {
        const value = match[1];
        const extractedUnit = match[2] || config.unit;

        // Try to find reference range in nearby text
        let referenceRange = '';
        let status = 'normal';

        // Look for reference range in the same line or nearby lines
        const testLineIndex = textLines.findIndex((line) =>
          config.pattern.test(line)
        );

        if (testLineIndex !== -1) {
          // Check current line and next few lines for reference range
          for (
            let i = testLineIndex;
            i < Math.min(testLineIndex + 3, textLines.length);
            i++
          ) {
            const line = textLines[i];
            const rangeMatch = line.match(referencePatterns.range);
            if (rangeMatch) {
              referenceRange = `${rangeMatch[1]}-${rangeMatch[2]} ${extractedUnit}`;

              // Determine status based on value and range
              const numValue = parseFloat(value);
              const minRange = parseFloat(rangeMatch[1]);
              const maxRange = parseFloat(rangeMatch[2]);

              if (numValue < minRange) {
                status = 'low';
              } else if (numValue > maxRange) {
                status = 'elevated';
              } else {
                status = 'normal';
              }
              break;
            }
          }
        }

        results.push({
          name: testName,
          value: value,
          unit: extractedUnit,
          referenceRange: referenceRange || 'N/A',
          status: status,
          confidence: 0.8, // Base confidence score
          extracted: true, // Flag to indicate this was auto-extracted
        });
      }
    }

    return results;
  }

  /**
   * Extract lab information (date, provider, lab name) from text
   * @param {string} text - Raw extracted text
   * @returns {Object} - Lab information
   */
  parseLabInfo(text) {
    const datePattern =
      /(?:date|collected|drawn)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const providerPattern = /(?:provider|doctor|physician)[:\s]*([a-z\s\.]+)/i;
    const labNamePattern = /(?:quest|labcorp|lab\s+corp|laboratory)[a-z\s]*/i;

    const dateMatch = text.match(datePattern);
    const providerMatch = text.match(providerPattern);
    const labNameMatch = text.match(labNamePattern);

    return {
      testDate: dateMatch ? this.formatDate(dateMatch[1]) : '',
      orderingProvider: providerMatch ? providerMatch[1].trim() : '',
      labName: labNameMatch ? labNameMatch[0].trim() : '',
    };
  }

  /**
   * Format date string to YYYY-MM-DD
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
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