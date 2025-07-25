import { 
  formProgressService as dbFormProgressService,
  formAbandonmentEventsService,
  BaseDocument 
} from '@/lib/database';

// --- Types and Interfaces ---

export interface FormProgress extends BaseDocument {
  patient_id?: string;
  session_id?: string;
  form_type: string;
  current_step: number;
  step_data: Record<string, any>;
  last_updated: string;
  expires_at?: string;
}

export interface FormAbandonmentEvent extends BaseDocument {
  patient_id?: string;
  session_id?: string;
  form_type: string;
  step_abandoned: number;
  time_spent_seconds: number;
  abandonment_reason?: string;
  created_at: string;
}

export interface FormProgressOptions {
  patientId?: string;
  sessionId?: string;
  expirationHours?: number;
  useLocalStorage?: boolean;
}

export interface FormAbandonmentAnalytics {
  totalAbandonments: number;
  averageTimeSpent: number;
  abandonmentByStep: Record<number, number>;
  abandonmentReasons: Record<string, number>;
  completionRate: number;
}

// --- Constants ---

const STORAGE_KEY_PREFIX = 'intake_form_progress_';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEFAULT_EXPIRATION_HOURS = 24;

// --- Form Progress Service Class ---

class FormProgressService {
  private autoSaveIntervals: Map<string, NodeJS.Timeout>;
  private progressCache: Map<string, FormProgress>;

  constructor() {
    this.autoSaveIntervals = new Map();
    this.progressCache = new Map();
  }

  /**
   * Save form progress to localStorage (immediate) and database (background)
   */
  async saveFormProgress(
    formType: string,
    currentStep: number,
    formData: Record<string, any>,
    options: FormProgressOptions = {}
  ): Promise<{ success: boolean; data?: FormProgress; error?: string }> {
    try {
      const {
        patientId,
        sessionId,
        expirationHours = DEFAULT_EXPIRATION_HOURS,
        useLocalStorage = true
      } = options;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

      const progressData: any = {
        form_type: formType,
        current_step: currentStep,
        step_data: formData,
        last_updated: now.toISOString(),
        expires_at: expiresAt.toISOString()
      };

      if (patientId) {
        progressData.patient_id = patientId;
      }
      if (sessionId) {
        progressData.session_id = sessionId;
      }

      // Save to localStorage immediately for instant recovery
      if (useLocalStorage && typeof window !== 'undefined') {
        const storageKey = this.generateStorageKey(formType, patientId, sessionId);
        try {
          localStorage.setItem(storageKey, JSON.stringify(progressData));
        } catch (localStorageError) {
          console.warn('Failed to save to localStorage:', localStorageError);
        }
      }

      // Save to database in background
      try {
        // Check if progress already exists
        const existingProgress = await this.findExistingProgress(formType, patientId, sessionId);
        
        let savedProgress: FormProgress;
        if (existingProgress) {
          // @ts-ignore - Database service type mismatch
          const result = await dbFormProgressService.update(existingProgress.id, progressData);
          savedProgress = { ...existingProgress, ...progressData } as FormProgress;
        } else {
          // @ts-ignore - Database service type mismatch
          const result = await dbFormProgressService.create(progressData);
          savedProgress = { ...progressData, id: result.data?.id || 'temp' } as FormProgress;
        }

        // Update cache
        const cacheKey = this.generateCacheKey(formType, patientId, sessionId);
        this.progressCache.set(cacheKey, savedProgress);

        return { success: true, data: savedProgress };
      } catch (dbError) {
        console.warn('Failed to save form progress to database:', dbError);
        // Don't throw error - localStorage save may have succeeded
        return { success: true, data: progressData as FormProgress };
      }
    } catch (error) {
      console.error('Error saving form progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Load form progress from cache, localStorage, then database as fallback
   */
  async loadFormProgress(
    formType: string,
    options: FormProgressOptions = {}
  ): Promise<{ success: boolean; data?: FormProgress | null; error?: string }> {
    try {
      const { patientId, sessionId, useLocalStorage = true } = options;
      const cacheKey = this.generateCacheKey(formType, patientId, sessionId);

      // Try cache first (fastest)
      if (this.progressCache.has(cacheKey)) {
        const cachedData = this.progressCache.get(cacheKey)!;
        if (this.isProgressValid(cachedData)) {
          return { success: true, data: cachedData };
        } else {
          this.progressCache.delete(cacheKey);
        }
      }

      // Try localStorage second (fast)
      if (useLocalStorage && typeof window !== 'undefined') {
        const storageKey = this.generateStorageKey(formType, patientId, sessionId);
        try {
          const localData = localStorage.getItem(storageKey);
          if (localData) {
            const progressData = JSON.parse(localData) as FormProgress;
            if (this.isProgressValid(progressData)) {
              this.progressCache.set(cacheKey, progressData);
              return { success: true, data: progressData };
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        } catch (localStorageError) {
          console.warn('Failed to load from localStorage:', localStorageError);
        }
      }

      // Fallback to database
      const existingProgress = await this.findExistingProgress(formType, patientId, sessionId);
      if (existingProgress && this.isProgressValid(existingProgress)) {
        // Update localStorage and cache with database data
        if (useLocalStorage && typeof window !== 'undefined') {
          const storageKey = this.generateStorageKey(formType, patientId, sessionId);
          try {
            localStorage.setItem(storageKey, JSON.stringify(existingProgress));
          } catch (localStorageError) {
            console.warn('Failed to update localStorage:', localStorageError);
          }
        }
        this.progressCache.set(cacheKey, existingProgress);
        return { success: true, data: existingProgress };
      }

      return { success: true, data: null };
    } catch (error) {
      console.error('Error loading form progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: null };
    }
  }

  /**
   * Clear form progress (when form is completed or abandoned)
   */
  async clearFormProgress(
    formType: string,
    options: FormProgressOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { patientId, sessionId, useLocalStorage = true } = options;

      // Clear cache
      const cacheKey = this.generateCacheKey(formType, patientId, sessionId);
      this.progressCache.delete(cacheKey);

      // Clear localStorage
      if (useLocalStorage && typeof window !== 'undefined') {
        const storageKey = this.generateStorageKey(formType, patientId, sessionId);
        try {
          localStorage.removeItem(storageKey);
        } catch (localStorageError) {
          console.warn('Failed to clear localStorage:', localStorageError);
        }
      }

      // Clear auto-save interval
      const intervalKey = this.generateCacheKey(formType, patientId, sessionId);
      if (this.autoSaveIntervals.has(intervalKey)) {
        clearInterval(this.autoSaveIntervals.get(intervalKey)!);
        this.autoSaveIntervals.delete(intervalKey);
      }

      // Clear database
      try {
        const existingProgress = await this.findExistingProgress(formType, patientId, sessionId);
        if (existingProgress) {
          await dbFormProgressService.delete(existingProgress.id);
        }
      } catch (dbError) {
        console.warn('Failed to clear form progress from database:', dbError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error clearing form progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Start auto-save for a form
   */
  startAutoSave(
    formType: string,
    getCurrentData: () => { step: number; data: Record<string, any> },
    options: FormProgressOptions = {}
  ): void {
    const { patientId, sessionId } = options;
    const intervalKey = this.generateCacheKey(formType, patientId, sessionId);

    // Clear existing interval if any
    if (this.autoSaveIntervals.has(intervalKey)) {
      clearInterval(this.autoSaveIntervals.get(intervalKey)!);
    }

    // Start new auto-save interval
    const interval = setInterval(async () => {
      try {
        const { step, data } = getCurrentData();
        if (Object.keys(data).length > 0) {
          await this.saveFormProgress(formType, step, data, options);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, AUTO_SAVE_INTERVAL);

    this.autoSaveIntervals.set(intervalKey, interval);
  }

  /**
   * Stop auto-save for a form
   */
  stopAutoSave(formType: string, options: FormProgressOptions = {}): void {
    const { patientId, sessionId } = options;
    const intervalKey = this.generateCacheKey(formType, patientId, sessionId);

    if (this.autoSaveIntervals.has(intervalKey)) {
      clearInterval(this.autoSaveIntervals.get(intervalKey)!);
      this.autoSaveIntervals.delete(intervalKey);
    }
  }

  /**
   * Track form abandonment event
   */
  async trackFormAbandonment(
    formType: string,
    stepAbandoned: number,
    timeSpentSeconds: number,
    options: FormProgressOptions & { reason?: string } = {}
  ): Promise<{ success: boolean; data?: FormAbandonmentEvent; error?: string }> {
    try {
      const { patientId, sessionId, reason } = options;

      const abandonmentData: any = {
        form_type: formType,
        step_abandoned: stepAbandoned,
        time_spent_seconds: timeSpentSeconds,
        created_at: new Date().toISOString()
      };

      if (reason) {
        abandonmentData.abandonment_reason = reason;
      }

      if (patientId) {
        abandonmentData.patient_id = patientId;
      }
      if (sessionId) {
        abandonmentData.session_id = sessionId;
      }

      // @ts-ignore - Database service type mismatch
      const result = await formAbandonmentEventsService.create(abandonmentData);
      const savedEvent = { ...abandonmentData, id: result.data?.id || 'temp' } as FormAbandonmentEvent;
      
      return { success: true, data: savedEvent };
    } catch (error) {
      console.error('Error tracking form abandonment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get form abandonment analytics
   */
  async getFormAbandonmentAnalytics(
    formType?: string,
    days: number = 30
  ): Promise<{ success: boolean; data?: FormAbandonmentAnalytics; error?: string }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const filters: Array<{ field: string; operator: any; value: any }> = [
        { field: 'created_at', operator: '>=', value: startDate.toISOString() }
      ];

      if (formType) {
        filters.push({ field: 'form_type', operator: '==', value: formType });
      }

      // @ts-ignore - Database service type mismatch
      const { data: events } = await formAbandonmentEventsService.getMany({
        filters,
        orderBy: { field: 'created_at', direction: 'desc' }
      });

      // Calculate analytics
      const analytics: FormAbandonmentAnalytics = {
        totalAbandonments: events.length,
        averageTimeSpent: events.length > 0 
          ? events.reduce((sum: number, event: any) => sum + (event.time_spent_seconds || 0), 0) / events.length 
          : 0,
        abandonmentByStep: {},
        abandonmentReasons: {},
        completionRate: 0 // This would need additional data to calculate properly
      };

      events.forEach((event: any) => {
        // Count by step
        const step = event.step_abandoned;
        analytics.abandonmentByStep[step] = (analytics.abandonmentByStep[step] || 0) + 1;

        // Count by reason
        if (event.abandonment_reason) {
          const reason = event.abandonment_reason;
          analytics.abandonmentReasons[reason] = (analytics.abandonmentReasons[reason] || 0) + 1;
        }
      });

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Error getting form abandonment analytics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Cleanup expired progress data
   */
  async cleanupExpiredProgress(): Promise<{ success: boolean; cleaned?: number; error?: string }> {
    try {
      const now = new Date().toISOString();
      
      // @ts-ignore - Database service type mismatch
      const { data: expiredProgress } = await dbFormProgressService.getMany({
        filters: [
          { field: 'expires_at', operator: '<', value: now }
        ]
      });

      let cleanedCount = 0;
      for (const progress of expiredProgress) {
        try {
          await dbFormProgressService.delete(progress.id);
          cleanedCount++;
        } catch (deleteError) {
          console.warn('Failed to delete expired progress:', deleteError);
        }
      }

      // Also cleanup localStorage if available
      if (typeof window !== 'undefined') {
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.expires_at && new Date(data.expires_at) < new Date()) {
                  keysToRemove.push(key);
                }
              } catch (parseError) {
                // Invalid data, remove it
                keysToRemove.push(key);
              }
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (localStorageError) {
          console.warn('Failed to cleanup localStorage:', localStorageError);
        }
      }

      return { success: true, cleaned: cleanedCount };
    } catch (error) {
      console.error('Error cleaning up expired progress:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // --- Private Methods ---

  private generateStorageKey(formType: string, patientId?: string, sessionId?: string): string {
    const identifier = patientId || sessionId || 'anonymous';
    return `${STORAGE_KEY_PREFIX}${identifier}_${formType}`;
  }

  private generateCacheKey(formType: string, patientId?: string, sessionId?: string): string {
    const identifier = patientId || sessionId || 'anonymous';
    return `${identifier}_${formType}`;
  }

  private async findExistingProgress(
    formType: string, 
    patientId?: string, 
    sessionId?: string
  ): Promise<FormProgress | null> {
    try {
      const filters: Array<{ field: string; operator: any; value: any }> = [
        { field: 'form_type', operator: '==', value: formType }
      ];

      if (patientId) {
        filters.push({ field: 'patient_id', operator: '==', value: patientId });
      } else if (sessionId) {
        filters.push({ field: 'session_id', operator: '==', value: sessionId });
      } else {
        return null; // Can't find without identifier
      }

      // @ts-ignore - Database service type mismatch
      const { data: progressList } = await dbFormProgressService.getMany({
        filters,
        orderBy: { field: 'last_updated', direction: 'desc' },
        limit: 1
      });

      return progressList.length > 0 ? (progressList[0] as FormProgress) : null;
    } catch (error) {
      console.error('Error finding existing progress:', error);
      return null;
    }
  }

  private isProgressValid(progress: FormProgress): boolean {
    if (!progress.expires_at) return true; // No expiration set
    return new Date(progress.expires_at) > new Date();
  }

  /**
   * Cleanup on service destruction
   */
  cleanup(): void {
    // Clear all auto-save intervals
    this.autoSaveIntervals.forEach(interval => clearInterval(interval));
    this.autoSaveIntervals.clear();
    this.progressCache.clear();
  }
}

// Create singleton instance
const formProgressService = new FormProgressService();

// Auto-cleanup on page unload (browser only)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    formProgressService.cleanup();
  });
}

export default formProgressService;

// Named exports for convenience
export const {
  saveFormProgress,
  loadFormProgress,
  clearFormProgress,
  startAutoSave,
  stopAutoSave,
  trackFormAbandonment,
  getFormAbandonmentAnalytics,
  cleanupExpiredProgress
} = formProgressService;

// Export constants
export { AUTO_SAVE_INTERVAL, DEFAULT_EXPIRATION_HOURS };
