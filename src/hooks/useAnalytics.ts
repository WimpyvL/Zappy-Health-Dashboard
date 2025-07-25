import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import analyticsService from '@/services/analyticsService';

/**
 * Analytics Hook
 * Provides easy integration of analytics tracking throughout the app
 */
export const useAnalytics = () => {
  const router = useRouter();
  const isInitialized = useRef(false);
  const lastPath = useRef('');

  // Initialize analytics when component mounts
  useEffect(() => {
    if (!isInitialized.current) {
      // Initialize as anonymous user for now
      // In a real app, you'd get user info from auth context
      analyticsService.initialize(undefined, {
        user_type: 'anonymous'
      });
      isInitialized.current = true;
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (currentPath !== lastPath.current && currentPath) {
      analyticsService.trackPageView(currentPath, {
        page_title: typeof document !== 'undefined' ? document.title : '',
        referrer: lastPath.current || (typeof document !== 'undefined' ? document.referrer : '')
      });
      lastPath.current = currentPath;
    }
  }, [router]);

  // Return analytics methods for manual tracking
  return {
    // Basic tracking
    track: analyticsService.track.bind(analyticsService),
    trackPageView: analyticsService.trackPageView.bind(analyticsService),
    trackConversion: analyticsService.trackConversion.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
    
    // Funnel tracking
    trackFunnelStep: analyticsService.trackFunnelStep.bind(analyticsService),
    
    // User interactions
    trackInteraction: analyticsService.trackInteraction.bind(analyticsService),
    trackForm: analyticsService.trackForm.bind(analyticsService),
    
    // Performance tracking
    trackPerformance: analyticsService.trackPerformance.bind(analyticsService),
    
    // E-commerce
    trackProductView: analyticsService.trackProductView.bind(analyticsService),
    trackAddToCart: analyticsService.trackAddToCart.bind(analyticsService),
    trackPurchase: analyticsService.trackPurchase.bind(analyticsService),
    
    // Healthcare specific
    trackConsultationStart: analyticsService.trackConsultationStart.bind(analyticsService),
    trackPrescriptionApproval: analyticsService.trackPrescriptionApproval.bind(analyticsService),
    trackAppointmentBooked: analyticsService.trackAppointmentBooked.bind(analyticsService),
    
    // A/B Testing
    getExperimentVariant: analyticsService.getExperimentVariant.bind(analyticsService),
    trackExperimentConversion: analyticsService.trackExperimentConversion.bind(analyticsService),
    
    // User properties
    identify: analyticsService.identify.bind(analyticsService),
    setUserProperties: analyticsService.setUserProperties.bind(analyticsService)
  };
};

/**
 * Hook for A/B Testing
 * Simplifies experiment management
 */
export const useExperiment = (experimentName: string, variants: string[] = ['control', 'treatment']) => {
  const analytics = useAnalytics();
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVariant = async () => {
      try {
        const assignedVariant = await analytics.getExperimentVariant(experimentName, variants);
        setVariant(assignedVariant);
      } catch (error) {
        console.error('Failed to load experiment variant:', error);
        setVariant(variants[0] || 'control'); // Fallback to control
      } finally {
        setLoading(false);
      }
    };

    loadVariant();
  }, [experimentName, variants.join(',')]);

  const trackConversion = (goalName: string, value: number = 1) => {
    analytics.trackExperimentConversion(experimentName, goalName, value);
  };

  return {
    variant,
    loading,
    isControl: variant === 'control',
    isTreatment: variant === 'treatment',
    trackConversion
  };
};

/**
 * Hook for Form Analytics
 * Automatically tracks form interactions
 */
export const useFormAnalytics = (formName: string) => {
  const analytics = useAnalytics();
  const startTime = useRef<number | null>(null);
  const hasStarted = useRef(false);

  const trackFormStart = (additionalData: Record<string, any> = {}) => {
    if (!hasStarted.current) {
      startTime.current = Date.now();
      hasStarted.current = true;
      analytics.trackForm(formName, 'start', {
        start_timestamp: new Date().toISOString(),
        ...additionalData
      });
    }
  };

  const trackFormStep = (stepName: string, stepData: Record<string, any> = {}) => {
    analytics.trackFunnelStep(`${formName}_funnel`, stepName, {
      form_name: formName,
      time_on_step: startTime.current ? Date.now() - startTime.current : 0,
      ...stepData
    });
  };

  const trackFormComplete = (completionData: Record<string, any> = {}) => {
    const completionTime = startTime.current ? Date.now() - startTime.current : 0;
    analytics.trackForm(formName, 'complete', {
      completion_time_ms: completionTime,
      completion_timestamp: new Date().toISOString(),
      ...completionData
    });
    analytics.trackConversion('form_completion', 1, {
      form_name: formName,
      completion_time_ms: completionTime
    });
  };

  const trackFormAbandon = (abandonData: Record<string, any> = {}) => {
    const abandonTime = startTime.current ? Date.now() - startTime.current : 0;
    analytics.trackForm(formName, 'abandon', {
      abandon_time_ms: abandonTime,
      abandon_timestamp: new Date().toISOString(),
      ...abandonData
    });
  };

  const trackFormError = (errorType: string, errorMessage: string, errorData: Record<string, any> = {}) => {
    analytics.trackForm(formName, 'error', {
      error_type: errorType,
      error_message: errorMessage,
      ...errorData
    });
  };

  return {
    trackFormStart,
    trackFormStep,
    trackFormComplete,
    trackFormAbandon,
    trackFormError
  };
};

/**
 * Hook for Performance Tracking
 * Tracks page load times and performance metrics
 */
export const usePerformanceTracking = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
      if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        const firstPaint = timing.responseStart - timing.navigationStart;

        analytics.trackPerformance('page_load_time', loadTime, {
          dom_ready_time: domReady,
          first_paint_time: firstPaint,
          page_path: window.location.pathname
        });
      }
    };

    // Track when page is fully loaded
    if (typeof document !== 'undefined') {
      if (document.readyState === 'complete') {
        trackPageLoad();
      } else {
        window.addEventListener('load', trackPageLoad);
        return () => window.removeEventListener('load', trackPageLoad);
      }
    }
  }, [analytics]);

  const trackCustomMetric = (metricName: string, value: number, properties: Record<string, any> = {}) => {
    analytics.trackPerformance(metricName, value, properties);
  };

  return {
    trackCustomMetric
  };
};


/**
 * Hook for Click Tracking
 * Automatically tracks button and link clicks
 */
export const useClickTracking = () => {
  const analytics = useAnalytics();

  const trackClick = (elementId: string, additionalData: Record<string, any> = {}) => {
    analytics.trackInteraction(elementId, 'click', {
      timestamp: new Date().toISOString(),
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...additionalData
    });
  };

  const trackButtonClick = (buttonName: string, buttonType: string = 'button', additionalData: Record<string, any> = {}) => {
    trackClick(buttonName, {
      element_type: 'button',
      button_type: buttonType,
      ...additionalData
    });
  };

  const trackLinkClick = (linkUrl: string, linkText: string = '', additionalData: Record<string, any> = {}) => {
    trackClick('link', {
      element_type: 'link',
      link_url: linkUrl,
      link_text: linkText,
      ...additionalData
    });
  };

  return {
    trackClick,
    trackButtonClick,
    trackLinkClick
  };
};

export default useAnalytics;
