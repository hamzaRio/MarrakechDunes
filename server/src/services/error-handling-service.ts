import { Request, Response, NextFunction } from 'express';
import { loggingService } from './logging-service.js';
import { cacheService } from './cache-service.js';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  timestamp: Date;
  requestId?: string;
}

export interface ErrorClassification {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'database' | 'network' | 'business' | 'system';
  recoverable: boolean;
  userFacing: boolean;
  retryable: boolean;
}

export interface ErrorRecovery {
  action: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation';
  maxRetries?: number;
  fallbackData?: any;
  circuitBreakerThreshold?: number;
  degradedMode?: boolean;
}

export class ErrorHandlingService {
  private errorCounts = new Map<string, number>();
  private circuitBreakers = new Map<string, { failures: number; lastFailure: Date; isOpen: boolean }>();
  private fallbackData = new Map<string, any>();

  // Main error handler
  async handleError(
    error: Error,
    context: ErrorContext,
    req?: Request,
    res?: Response
  ): Promise<void> {
    try {
      // Classify the error
      const classification = this.classifyError(error);
      
      // Log the error
      await this.logError(error, context, classification);
      
      // Check if we should open circuit breaker
      await this.checkCircuitBreaker(error, context);
      
      // Determine recovery strategy
      const recovery = this.determineRecoveryStrategy(error, classification);
      
      // Execute recovery if possible
      if (recovery && res) {
        await this.executeRecovery(recovery, req, res, error);
      }
      
      // Update error metrics
      this.updateErrorMetrics(error, classification);
      
    } catch (handlingError) {
      // If error handling itself fails, log it but don't throw
      loggingService.error('Error handling failed', handlingError as Error, { 
        endpoint: 'error_handling',
        method: 'POST',
        type: 'error_handling_failed'
      });
    }
  }

  private classifyError(error: Error): ErrorClassification {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Database errors
    if (errorName.includes('mongodb') || errorName.includes('mongoose') || errorMessage.includes('database')) {
      return {
        severity: 'high',
        category: 'database',
        recoverable: true,
        userFacing: false,
        retryable: true
      };
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return {
        severity: 'medium',
        category: 'authentication',
        recoverable: true,
        userFacing: true,
        retryable: false
      };
    }

    // Authorization errors
    if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      return {
        severity: 'medium',
        category: 'authorization',
        recoverable: false,
        userFacing: true,
        retryable: false
      };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        severity: 'low',
        category: 'validation',
        recoverable: true,
        userFacing: true,
        retryable: false
      };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return {
        severity: 'medium',
        category: 'network',
        recoverable: true,
        userFacing: false,
        retryable: true
      };
    }

    // Business logic errors
    if (errorMessage.includes('booking') || errorMessage.includes('activity') || errorMessage.includes('payment')) {
      return {
        severity: 'medium',
        category: 'business',
        recoverable: true,
        userFacing: true,
        retryable: false
      };
    }

    // System errors
    if (errorName.includes('error') || errorMessage.includes('internal')) {
      return {
        severity: 'high',
        category: 'system',
        recoverable: false,
        userFacing: false,
        retryable: true
      };
    }

    // Default classification
    return {
      severity: 'medium',
      category: 'system',
      recoverable: true,
      userFacing: true,
      retryable: true
    };
  }

  private async logError(
    error: Error,
    context: ErrorContext,
    classification: ErrorClassification
  ): Promise<void> {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      classification,
      context,
      timestamp: new Date().toISOString()
    };

    // Log based on severity
    switch (classification.severity) {
      case 'critical':
        loggingService.error('Critical error occurred', errorData);
        break;
      case 'high':
        loggingService.error('High severity error', errorData);
        break;
      case 'medium':
        loggingService.warn('Medium severity error', { 
          endpoint: 'error_handling',
          method: 'POST',
          type: 'medium_error'
        });
        break;
      case 'low':
        loggingService.info('Low severity error', { 
          endpoint: 'error_handling',
          method: 'POST',
          type: 'low_error'
        });
        break;
    }

    // Store in cache for analysis
    const cacheKey = `error:${context.timestamp.getTime()}`;
    await cacheService.set('errors', cacheKey, errorData, 86400); // 24 hours
  }

  private async checkCircuitBreaker(error: Error, context: ErrorContext): Promise<void> {
    const serviceKey = this.getServiceKey(context);
    const breaker = this.circuitBreakers.get(serviceKey);
    
    if (!breaker) {
      this.circuitBreakers.set(serviceKey, {
        failures: 1,
        lastFailure: new Date(),
        isOpen: false
      });
      return;
    }

    breaker.failures++;
    breaker.lastFailure = new Date();

    // Open circuit breaker if threshold exceeded
    if (breaker.failures >= 5) {
      breaker.isOpen = true;
      loggingService.warn('Circuit breaker opened', { 
        endpoint: 'circuit_breaker',
        method: 'POST',
        type: 'circuit_breaker_opened'
      });
    }
  }

  private determineRecoveryStrategy(
    error: Error,
    classification: ErrorClassification
  ): ErrorRecovery | null {
    if (!classification.recoverable) {
      return null;
    }

    // Database errors - retry with exponential backoff
    if (classification.category === 'database') {
      return {
        action: 'retry',
        maxRetries: 3
      };
    }

    // Network errors - circuit breaker
    if (classification.category === 'network') {
      return {
        action: 'circuit_breaker',
        circuitBreakerThreshold: 5,
        fallbackData: this.getFallbackData('network')
      };
    }

    // Validation errors - graceful degradation
    if (classification.category === 'validation') {
      return {
        action: 'graceful_degradation',
        degradedMode: true
      };
    }

    // Business errors - fallback
    if (classification.category === 'business') {
      return {
        action: 'fallback',
        fallbackData: this.getFallbackData('business')
      };
    }

    return null;
  }

  private async executeRecovery(
    recovery: ErrorRecovery,
    req: Request | undefined,
    res: Response | undefined,
    error: Error
  ): Promise<void> {
    if (!res) return;

    switch (recovery.action) {
      case 'retry':
        await this.handleRetry(recovery, req, res, error);
        break;
      case 'fallback':
        await this.handleFallback(recovery, res);
        break;
      case 'circuit_breaker':
        await this.handleCircuitBreaker(recovery, res);
        break;
      case 'graceful_degradation':
        await this.handleGracefulDegradation(recovery, res);
        break;
    }
  }

  private async handleRetry(
    recovery: ErrorRecovery,
    req: Request | undefined,
    res: Response | undefined,
    error: Error
  ): Promise<void> {
    if (!req || !res) return;

    const maxRetries = recovery.maxRetries || 3;
    const retryCount = parseInt(req.headers['x-retry-count'] as string) || 0;

    if (retryCount < maxRetries) {
      // Add retry header and retry the request
      req.headers['x-retry-count'] = (retryCount + 1).toString();
      
      // Wait with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        // This would typically retry the original request
        loggingService.info('Retrying request', { 
          endpoint: 'retry',
          method: 'POST',
          type: 'request_retry'
        });
      }, delay);
    } else {
      // Max retries exceeded
      res.status(503).json({
        error: 'Service temporarily unavailable',
        code: 'MAX_RETRIES_EXCEEDED',
        retryAfter: 60
      });
    }
  }

  private async handleFallback(recovery: ErrorRecovery, res: Response): Promise<void> {
    const fallbackData = recovery.fallbackData || this.getDefaultFallbackData();
    
    res.status(200).json({
      data: fallbackData,
      warning: 'Service operating in fallback mode',
      fallback: true
    });
  }

  private async handleCircuitBreaker(recovery: ErrorRecovery, res: Response): Promise<void> {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'CIRCUIT_BREAKER_OPEN',
      retryAfter: 300 // 5 minutes
    });
  }

  private async handleGracefulDegradation(recovery: ErrorRecovery, res: Response): Promise<void> {
    res.status(200).json({
      data: null,
      warning: 'Service operating in degraded mode',
      degraded: true
    });
  }

  private getServiceKey(context: ErrorContext): string {
    return context.endpoint || 'unknown';
  }

  private getFallbackData(type: string): any {
    const fallbackData = this.fallbackData.get(type);
    if (fallbackData) {
      return fallbackData;
    }

    // Default fallback data
    switch (type) {
      case 'network':
        return { message: 'Service temporarily unavailable, please try again later' };
      case 'business':
        return { message: 'Service operating in limited mode' };
      default:
        return { message: 'Service temporarily unavailable' };
    }
  }

  private getDefaultFallbackData(): any {
    return {
      message: 'Service temporarily unavailable',
      activities: [],
      bookings: []
    };
  }

  private updateErrorMetrics(error: Error, classification: ErrorClassification): void {
    const errorKey = `${classification.category}:${classification.severity}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
  }

  // Circuit breaker management
  isCircuitBreakerOpen(serviceKey: string): boolean {
    const breaker = this.circuitBreakers.get(serviceKey);
    if (!breaker) return false;

    // Auto-close circuit breaker after 5 minutes
    const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
    if (timeSinceLastFailure > 5 * 60 * 1000) {
      breaker.isOpen = false;
      breaker.failures = 0;
      loggingService.info('Circuit breaker auto-closed', { 
        endpoint: 'circuit_breaker',
        method: 'POST',
        type: 'circuit_breaker_closed'
      });
    }

    return breaker.isOpen;
  }

  // Error analytics
  async getErrorAnalytics(): Promise<{
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    circuitBreakerStatus: Record<string, boolean>;
    topErrors: Array<{ error: string; count: number }>;
  }> {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    for (const [key, count] of this.errorCounts.entries()) {
      const [category, severity] = key.split(':');
      errorsByCategory[category] = (errorsByCategory[category] || 0) + count;
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + count;
    }

    const circuitBreakerStatus: Record<string, boolean> = {};
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      circuitBreakerStatus[service] = breaker.isOpen;
    }

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      circuitBreakerStatus,
      topErrors: [] // Would be populated from stored error data
    };
  }

  // Health check
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const analytics = await this.getErrorAnalytics();
    const openCircuitBreakers = Object.values(analytics.circuitBreakerStatus).filter(Boolean).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (openCircuitBreakers > 0) {
      status = 'degraded';
    }
    
    if (analytics.totalErrors > 100 || openCircuitBreakers > 2) {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        ...analytics,
        openCircuitBreakers
      }
    };
  }
}

export const errorHandlingService = new ErrorHandlingService();
