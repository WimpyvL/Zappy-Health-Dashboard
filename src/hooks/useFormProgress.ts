import { useEffect, useRef, useState, useCallback } from 'react';
import formProgressService, { 
  FormProgress, 
  FormProgressOptions, 
  FormAbandonmentAnalytics 
} from '@/services/formProgressService';

/**
 * Hook for form progress tracking with auto-save
 */
export const useFormProgress = (
  formType: string,
  options: FormProgressOptions = {}
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedProgress, setSavedProgress] = useState<FormProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const startTime = useRef<number>(Date.now());
  const currentStep = useRef<number>(0);
  const formData = useRef<Record<string, any>>({});
  const isAutoSaveActive = useRef<boolean>(false);

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await formProgressService.loadFormProgress(formType, options);
        
        if (result.success && result.data) {
          setSavedProgress(result.data);
          currentStep.current = result.data.current_step;
          formData.current = result.data.step_data;
        } else if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [formType, options.patientId, options.sessionId]);

  // Save progress manually
  const saveProgress = useCallback(async (
    step: number, 
    data: Record<string, any>
  ): Promise<boolean> => {
    try {
      currentStep.current = step;
      formData.current = data;
      
      const result = await formProgressService.saveFormProgress(
        formType, 
        step, 
        data, 
        options
      );
      
      if (result.success && result.data) {
        setSavedProgress(result.data);
        setHasUnsavedChanges(false);
        setError(null);
        return true;
      } else {
        setError(result.error || 'Failed to save progress');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
      return false;
    }
  }, [formType, options]);

  // Start auto-save
  const startAutoSave = useCallback(() => {
    if (!isAutoSaveActive.current) {
      formProgressService.startAutoSave(
        formType,
        () => ({
          step: currentStep.current,
          data: formData.current
        }),
        options
      );
      isAutoSaveActive.current = true;
    }
  }, [formType, options]);

  // Stop auto-save
  const stopAutoSave = useCallback(() => {
    if (isAutoSaveActive.current) {
      formProgressService.stopAutoSave(formType, options);
      isAutoSaveActive.current = false;
    }
  }, [formType, options]);

  // Update form data (triggers unsaved changes)
  const updateFormData = useCallback((
    step: number, 
    data: Record<string, any>
  ) => {
    currentStep.current = step;
    formData.current = data;
    setHasUnsavedChanges(true);
  }, []);

  // Clear progress (on completion or abandonment)
  const clearProgress = useCallback(async (): Promise<boolean> => {
    try {
      const result = await formProgressService.clearFormProgress(formType, options);
      
      if (result.success) {
        setSavedProgress(null);
        setHasUnsavedChanges(false);
        setError(null);
        stopAutoSave();
        return true;
      } else {
        setError(result.error || 'Failed to clear progress');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear progress');
      return false;
    }
  }, [formType, options, stopAutoSave]);

  // Track form abandonment
  const trackAbandonment = useCallback(async (reason?: string): Promise<boolean> => {
    try {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      
      const abandonmentOptions = { ...options };
      if (reason) {
        (abandonmentOptions as any).reason = reason;
      }
      
      const result = await formProgressService.trackFormAbandonment(
        formType,
        currentStep.current,
        timeSpent,
        abandonmentOptions
      );
      
      if (result.success) {
        setError(null);
        return true;
      } else {
        setError(result.error || 'Failed to track abandonment');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track abandonment');
      return false;
    }
  }, [formType, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoSave();
      
      // Track abandonment if there are unsaved changes
      if (hasUnsavedChanges && Object.keys(formData.current).length > 0) {
        formProgressService.trackFormAbandonment(
          formType,
          currentStep.current,
          Math.floor((Date.now() - startTime.current) / 1000),
          { ...options, reason: 'page_unload' }
        );
      }
    };
  }, [formType, options, hasUnsavedChanges, stopAutoSave]);

  return {
    // State
    isLoading,
    hasUnsavedChanges,
    savedProgress,
    error,
    
    // Actions
    saveProgress,
    updateFormData,
    clearProgress,
    trackAbandonment,
    startAutoSave,
    stopAutoSave,
    
    // Computed values
    hasExistingProgress: !!savedProgress,
    currentStep: currentStep.current,
    formData: formData.current
  };
};

/**
 * Hook for form abandonment analytics
 */
export const useFormAbandonmentAnalytics = (
  formType?: string,
  days: number = 30
) => {
  const [analytics, setAnalytics] = useState<FormAbandonmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await formProgressService.getFormAbandonmentAnalytics(formType, days);
      
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [formType, days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    isLoading,
    error,
    reload: loadAnalytics
  };
};

/**
 * Hook for cleanup expired progress data
 */
export const useFormProgressCleanup = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);
  const [cleanedCount, setCleanedCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const runCleanup = useCallback(async (): Promise<boolean> => {
    setIsRunning(true);
    setError(null);
    
    try {
      const result = await formProgressService.cleanupExpiredProgress();
      
      if (result.success) {
        setCleanedCount(result.cleaned || 0);
        setLastCleanup(new Date());
        return true;
      } else {
        setError(result.error || 'Cleanup failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
      return false;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    isRunning,
    lastCleanup,
    cleanedCount,
    error,
    runCleanup
  };
};

/**
 * Higher-order hook that adds form progress tracking to any form
 */
export const withFormProgress = <T extends Record<string, any>>(
  formType: string,
  options: FormProgressOptions = {}
) => {
  return (initialData: T) => {
    const {
      isLoading,
      hasUnsavedChanges,
      savedProgress,
      saveProgress,
      updateFormData,
      clearProgress,
      startAutoSave,
      stopAutoSave,
      hasExistingProgress
    } = useFormProgress(formType, options);

    const [formData, setFormData] = useState<T>(initialData);
    const [currentStep, setCurrentStep] = useState(0);

    // Load saved progress if available
    useEffect(() => {
      if (hasExistingProgress && savedProgress) {
        setFormData({ ...initialData, ...savedProgress.step_data });
        setCurrentStep(savedProgress.current_step);
      }
    }, [hasExistingProgress, savedProgress, initialData]);

    // Update progress when form data changes
    const updateProgress = useCallback((step: number, data: T) => {
      setCurrentStep(step);
      setFormData(data);
      updateFormData(step, data);
    }, [updateFormData]);

    // Save current progress
    const save = useCallback(() => {
      return saveProgress(currentStep, formData);
    }, [saveProgress, currentStep, formData]);

    return {
      // Form state
      formData,
      currentStep,
      setFormData,
      setCurrentStep,
      
      // Progress state
      isLoading,
      hasUnsavedChanges,
      hasExistingProgress,
      
      // Actions
      updateProgress,
      save,
      clearProgress,
      startAutoSave,
      stopAutoSave
    };
  };
};

export default useFormProgress;
