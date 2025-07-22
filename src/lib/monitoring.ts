"use client";

// Types for monitoring events
export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export interface MonitoringEvent {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  metadata?: Record<string, any>;
  stack?: string;
  component?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: string;
  tags?: Record<string, string>;
}

export interface UserAction {
  action: string;
  component: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;
  private eventQueue: MonitoringEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private actionQueue: UserAction[] = [];
  private flushInterval: number | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    
    if (this.isEnabled) {
      this.startPerformanceMonitoring();
      this.setupErrorListeners();
      this.startAutoFlush();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPerformanceMonitoring() {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          this.recordPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
          this.recordPerformance('dns_lookup_time', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
          this.recordPerformance('tcp_connect_time', navigation.connectEnd - navigation.connectStart, 'ms');
          this.recordPerformance('server_response_time', navigation.responseEnd - navigation.requestStart, 'ms');
          this.recordPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
        }, 0);
      });
    }

    // Monitor Core Web Vitals
    this.setupWebVitalsMonitoring();
  }

  private setupWebVitalsMonitoring() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            this.recordPerformance('lcp', lastEntry.startTime, 'ms', { good: lastEntry.startTime < 2500 });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID) - approximation
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.recordPerformance('fid', fid, 'ms', { good: fid < 100 });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS) - basic implementation
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordPerformance('cls', clsValue, 'count', { good: clsValue < 0.1 });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }

  private setupErrorListeners() {
    // Global error handler
    window.addEventListener('error', (event) => {
      // Prevent infinite loops by checking if error is from monitoring itself
      if (event.filename?.includes('monitoring') || event.message?.includes('monitoring')) {
        return;
      }
      
      try {
        this.logError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error'
        });
      } catch (monitoringError) {
        // Fallback to console if monitoring fails
        console.error('Monitoring system error:', monitoringError);
        console.error('Original error:', event.error || event.message);
      }
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      // Prevent infinite loops
      if (event.reason?.message?.includes('monitoring') || event.reason?.stack?.includes('monitoring')) {
        return;
      }
      
      try {
        this.logError(new Error(event.reason), {
          type: 'unhandled_promise_rejection'
        });
      } catch (monitoringError) {
        console.error('Monitoring system error:', monitoringError);
        console.error('Original promise rejection:', event.reason);
      }
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const src = (event.target as any)?.src || (event.target as any)?.href;
        // Skip monitoring resource errors to prevent loops
        if (src?.includes('monitoring') || src?.includes('channel')) {
          return;
        }
        
        try {
          this.logError(new Error(`Resource loading failed: ${src}`), {
            type: 'resource_error',
            element: (event.target as any)?.tagName
          });
        } catch (monitoringError) {
          console.error('Monitoring system error:', monitoringError);
          console.error('Original resource error:', src);
        }
      }
    }, true);
  }

  private startAutoFlush() {
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public logError(error: Error, metadata?: Record<string, any>) {
    // Prevent infinite loops from monitoring errors
    if (error.message?.includes('monitoring') || error.stack?.includes('monitoring')) {
      console.error('Monitoring system internal error (not logged):', error);
      return;
    }

    try {
      const event: MonitoringEvent = {
        level: 'ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        ...(this.userId && { userId: this.userId }),
        sessionId: this.sessionId,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...(error.stack && { stack: error.stack }),
        ...(metadata && { metadata }),
      };

      this.eventQueue.push(event);
      console.error('Monitoring Error:', event);

      // For critical errors, flush immediately
      if (this.isCriticalError(error)) {
        this.flush();
      }
    } catch (monitoringError) {
      // Fallback to console if monitoring fails
      console.error('Monitoring system failed to log error:', monitoringError);
      console.error('Original error:', error);
    }
  }

  public logWarning(message: string, metadata?: Record<string, any>) {
    const event: MonitoringEvent = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      ...(this.userId && { userId: this.userId }),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...(metadata && { metadata }),
    };

    this.eventQueue.push(event);
    console.warn('Monitoring Warning:', event);
  }

  public logInfo(message: string, metadata?: Record<string, any>) {
    const event: MonitoringEvent = {
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...(this.userId && { userId: this.userId }),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...(metadata && { metadata }),
    };

    this.eventQueue.push(event);
    console.info('Monitoring Info:', event);
  }

  public recordPerformance(name: string, value: number, unit: 'ms' | 'bytes' | 'count', tags?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      ...(tags && { tags }),
    };

    this.performanceQueue.push(metric);
  }

  public trackUserAction(action: string, component: string, metadata?: Record<string, any>) {
    const userAction: UserAction = {
      action,
      component,
      timestamp: new Date().toISOString(),
      ...(this.userId && { userId: this.userId }),
      ...(metadata && { metadata }),
    };

    this.actionQueue.push(userAction);
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordPerformance(name, duration, 'ms');
    };
  }

  public measureFunction<T>(name: string, fn: () => T): T {
    const stopTimer = this.startTimer(name);
    try {
      const result = fn();
      return result;
    } finally {
      stopTimer();
    }
  }

  public async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const stopTimer = this.startTimer(name);
    try {
      const result = await fn();
      return result;
    } finally {
      stopTimer();
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      /authentication/i,
      /authorization/i,
      /payment/i,
      /billing/i,
      /security/i,
      /firebase.*permission/i,
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  private async flush() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const events = [...this.eventQueue];
    const performances = [...this.performanceQueue];
    const actions = [...this.actionQueue];

    // Clear queues
    this.eventQueue = [];
    this.performanceQueue = [];
    this.actionQueue = [];

    if (events.length === 0 && performances.length === 0 && actions.length === 0) {
      return;
    }

    try {
      // In production, send to your monitoring service
      // For now, we'll log to console and localStorage for debugging

      if (events.length > 0) {
        console.group('📊 Monitoring Events');
        events.forEach(event => console.log(event));
        console.groupEnd();
        
        // Store in localStorage for debugging (remove in production)
        try {
          const storedEvents = JSON.parse(localStorage.getItem('monitoring_events') || '[]');
          storedEvents.push(...events);
          localStorage.setItem('monitoring_events', JSON.stringify(storedEvents.slice(-100))); // Keep last 100
        } catch (storageError) {
          console.warn('Failed to store monitoring events in localStorage:', storageError);
        }
      }

      if (performances.length > 0) {
        console.group('⚡ Performance Metrics');
        performances.forEach(metric => console.log(metric));
        console.groupEnd();
        
        try {
          const storedMetrics = JSON.parse(localStorage.getItem('monitoring_performance') || '[]');
          storedMetrics.push(...performances);
          localStorage.setItem('monitoring_performance', JSON.stringify(storedMetrics.slice(-100)));
        } catch (storageError) {
          console.warn('Failed to store performance metrics in localStorage:', storageError);
        }
      }

      if (actions.length > 0) {
        console.group('👤 User Actions');
        actions.forEach(action => console.log(action));
        console.groupEnd();
        
        try {
          const storedActions = JSON.parse(localStorage.getItem('monitoring_actions') || '[]');
          storedActions.push(...actions);
          localStorage.setItem('monitoring_actions', JSON.stringify(storedActions.slice(-100)));
        } catch (storageError) {
          console.warn('Failed to store user actions in localStorage:', storageError);
        }
      }

      // Example: Send to external monitoring service
      // await fetch('/api/monitoring', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events, performances, actions }),
      // });

    } catch (error) {
      console.error('Failed to flush monitoring data:', error);
      // Re-add events to queue if sending failed (but limit to prevent memory leaks)
      if (this.eventQueue.length < 50) {
        this.eventQueue.unshift(...events.slice(-25));
      }
      if (this.performanceQueue.length < 50) {
        this.performanceQueue.unshift(...performances.slice(-25));
      }
      if (this.actionQueue.length < 50) {
        this.actionQueue.unshift(...actions.slice(-25));
      }
    }
  }

  public destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
const monitoring = new MonitoringService();

// Export functions for easy use
export const logError = (error: Error, metadata?: Record<string, any>) => monitoring.logError(error, metadata);
export const logWarning = (message: string, metadata?: Record<string, any>) => monitoring.logWarning(message, metadata);
export const logInfo = (message: string, metadata?: Record<string, any>) => monitoring.logInfo(message, metadata);
export const recordPerformance = (name: string, value: number, unit: 'ms' | 'bytes' | 'count', tags?: Record<string, any>) => monitoring.recordPerformance(name, value, unit, tags);
export const trackUserAction = (action: string, component: string, metadata?: Record<string, any>) => monitoring.trackUserAction(action, component, metadata);
export const startTimer = (name: string) => monitoring.startTimer(name);
export const measureFunction = <T>(name: string, fn: () => T) => monitoring.measureFunction(name, fn);
export const measureAsyncFunction = <T>(name: string, fn: () => Promise<T>) => monitoring.measureAsyncFunction(name, fn);
export const setUserId = (userId: string) => monitoring.setUserId(userId);

export default monitoring;
