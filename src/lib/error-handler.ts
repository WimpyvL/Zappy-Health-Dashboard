"use client";

import { logError, logWarning } from './monitoring';

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  API = 'api',
  COMPONENT = 'component',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  type: ErrorType;
  severity: ErrorSeverity;
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly timestamp: string;

  constructor(
    message: string,
    context: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = context.type;
    this.severity = context.severity;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Preserve original stack trace if available
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }
}

// Error handler class
class ErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_ERRORS_PER_WINDOW = 10;

  public handleError(error: Error | AppError, context?: Partial<ErrorContext>): void {
    try {
      const errorKey = this.getErrorKey(error);
      
      // Rate limiting to prevent spam
      if (this.isRateLimited(errorKey)) {
        return;
      }

      const appError = error instanceof AppError 
        ? error 
        : this.createAppError(error, context);

      // Log based on severity
      if (appError.severity === ErrorSeverity.CRITICAL || appError.severity === ErrorSeverity.HIGH) {
        logError(appError, {
          type: appError.type,
          severity: appError.severity,
          component: appError.context.component,
          action: appError.context.action,
          ...appError.context.metadata,
        });
      } else {
        logWarning(`${appError.type} error: ${appError.message}`, {
          type: appError.type,
          severity: appError.severity,
          component: appError.context.component,
          action: appError.context.action,
          ...appError.context.metadata,
        });
      }

      // Update error tracking
      this.updateErrorTracking(errorKey);

      // Handle specific error types
      this.handleSpecificError(appError);

    } catch (handlingError) {
      // Fallback if error handling itself fails
      console.error('Error handler failed:', handlingError);
      console.error('Original error:', error);
    }
  }

  private createAppError(error: Error, context?: Partial<ErrorContext>): AppError {
    const errorType = this.determineErrorType(error);
    const severity = this.determineSeverity(error, errorType);

    return new AppError(
      error.message,
      {
        type: errorType,
        severity,
        component: context?.component || 'unknown',
        ...(context?.userId && { userId: context.userId }),
        ...(context?.action && { action: context.action }),
        ...(context?.metadata && { metadata: context.metadata }),
      },
      error
    );
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('forbidden') || message.includes('unauthorized')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('database') || message.includes('firestore') || message.includes('query')) {
      return ErrorType.DATABASE;
    }
    if (message.includes('api') || message.includes('endpoint') || message.includes('route')) {
      return ErrorType.API;
    }
    if (stack.includes('react') || stack.includes('component') || message.includes('render')) {
      return ErrorType.COMPONENT;
    }

    return ErrorType.UNKNOWN;
  }

  private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      type === ErrorType.AUTHENTICATION ||
      type === ErrorType.AUTHORIZATION ||
      message.includes('critical') ||
      message.includes('security') ||
      message.includes('payment')
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (
      type === ErrorType.DATABASE ||
      message.includes('crash') ||
      message.includes('fatal') ||
      message.includes('corrupt')
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (
      type === ErrorType.API ||
      type === ErrorType.NETWORK ||
      message.includes('timeout') ||
      message.includes('failed')
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors (validation, UI issues, etc.)
    return ErrorSeverity.LOW;
  }

  private getErrorKey(error: Error): string {
    // Create a unique key for rate limiting based on error type and message
    return `${error.name}:${error.message.substring(0, 100)}`;
  }

  private isRateLimited(errorKey: string): boolean {
    const now = Date.now();
    const lastTime = this.lastErrorTime.get(errorKey) || 0;
    const count = this.errorCounts.get(errorKey) || 0;

    // Reset count if outside window
    if (now - lastTime > this.RATE_LIMIT_WINDOW) {
      this.errorCounts.set(errorKey, 1);
      this.lastErrorTime.set(errorKey, now);
      return false;
    }

    // Check if rate limited
    if (count >= this.MAX_ERRORS_PER_WINDOW) {
      return true;
    }

    // Increment count
    this.errorCounts.set(errorKey, count + 1);
    this.lastErrorTime.set(errorKey, now);
    return false;
  }

  private updateErrorTracking(errorKey: string): void {
    // This could be expanded to track error patterns, frequencies, etc.
    // For now, just basic tracking is handled in isRateLimited
  }

  private handleSpecificError(error: AppError): void {
    switch (error.type) {
      case ErrorType.NETWORK:
        this.handleNetworkError(error);
        break;
      case ErrorType.AUTHENTICATION:
        this.handleAuthError(error);
        break;
      case ErrorType.API:
        this.handleApiError(error);
        break;
      // Add more specific handlers as needed
    }
  }

  private handleNetworkError(error: AppError): void {
    // Could implement retry logic, offline handling, etc.
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      // Show user notification about network issues
      console.warn('Network error detected:', error.message);
    }
  }

  private handleAuthError(error: AppError): void {
    // Could trigger re-authentication flow
    console.warn('Authentication error detected:', error.message);
  }

  private handleApiError(error: AppError): void {
    // Could implement API-specific error handling
    console.warn('API error detected:', error.message);
  }

  public getErrorStats(): { errorCounts: Map<string, number>; lastErrorTime: Map<string, number> } {
    return {
      errorCounts: new Map(this.errorCounts),
      lastErrorTime: new Map(this.lastErrorTime),
    };
  }

  public clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }
}

// Singleton instance
const errorHandler = new ErrorHandler();

// Convenience functions
export const handleError = (error: Error | AppError, context?: Partial<ErrorContext>) => {
  errorHandler.handleError(error, context);
};

export const createAppError = (
  message: string,
  type: ErrorType,
  severity: ErrorSeverity,
  context?: Partial<ErrorContext>
) => {
  return new AppError(message, {
    type,
    severity,
    ...context,
  });
};

// React error boundary helper
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorContext>
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          handleError(error, context);
          throw error; // Re-throw to maintain promise chain
        });
      }
      
      return result;
    } catch (error) {
      handleError(error as Error, context);
      throw error; // Re-throw to maintain error flow
    }
  }) as T;
};

// Async function wrapper
export const withAsyncErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Partial<ErrorContext>
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, context);
      throw error; // Re-throw to maintain promise chain
    }
  }) as T;
};

export default errorHandler;
