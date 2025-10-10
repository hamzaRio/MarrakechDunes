import { Request, Response } from 'express';

export interface ErrorMetrics {
  timestamp: Date;
  error: string;
  stack?: string;
  requestId?: string;
  userId?: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'database' | 'api' | 'payment' | 'notification' | 'authentication' | 'validation' | 'system';
}

export interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class ErrorMonitoringService {
  private errorCounts: Map<string, number> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];
  private errorThresholds = {
    database: 5,
    api: 10,
    payment: 3,
    notification: 5,
    authentication: 3,
    validation: 10,
    system: 2
  };

  logError(error: Error, req: Request, category: ErrorMetrics['category'], severity: ErrorMetrics['severity'] = 'medium'): void {
    const errorMetrics: ErrorMetrics = {
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).session?.user?.id,
      endpoint: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      severity,
      category
    };

    // Log error with appropriate formatting
    const logMessage = this.formatErrorLog(errorMetrics);
    console.error(logMessage);

    // Track error counts for alerting
    this.trackErrorCount(category, severity);

    // Check for error thresholds
    this.checkErrorThresholds(category);

    // Store in memory for analysis (in production, this would go to a monitoring service)
    this.storeErrorMetrics(errorMetrics);
  }

  logPerformance(req: Request, res: Response, startTime: number): void {
    const responseTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();
    
    const performanceMetrics: PerformanceMetrics = {
      timestamp: new Date(),
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
    };

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }

    // Store performance metrics
    this.performanceMetrics.push(performanceMetrics);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  private formatErrorLog(errorMetrics: ErrorMetrics): string {
    const timestamp = errorMetrics.timestamp.toISOString();
    const severity = errorMetrics.severity.toUpperCase();
    const category = errorMetrics.category.toUpperCase();
    
    return `🚨 [${severity}] ${category} ERROR - ${timestamp}
    Error: ${errorMetrics.error}
    Endpoint: ${errorMetrics.method} ${errorMetrics.endpoint}
    User: ${errorMetrics.userId || 'anonymous'}
    IP: ${errorMetrics.ip}
    Request ID: ${errorMetrics.requestId || 'N/A'}
    ${errorMetrics.stack ? `Stack: ${errorMetrics.stack}` : ''}`;
  }

  private trackErrorCount(category: string, severity: string): void {
    const key = `${category}_${severity}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  private checkErrorThresholds(category: string): void {
    const threshold = this.errorThresholds[category as keyof typeof this.errorThresholds];
    if (!threshold) return;

    const count = this.errorCounts.get(`${category}_high`) || 0;
    if (count >= threshold) {
      console.error(`🚨 ALERT: High error rate detected for ${category} - ${count} errors in recent period`);
      // In production, this would trigger alerts (email, Slack, etc.)
    }
  }

  private storeErrorMetrics(errorMetrics: ErrorMetrics): void {
    // In production, this would store in a monitoring service like Sentry, DataDog, etc.
    // For now, we'll just log to console
    if (process.env.NODE_ENV === 'production') {
      // Here you would integrate with your monitoring service
      console.log('📊 Error metrics stored:', {
        category: errorMetrics.category,
        severity: errorMetrics.severity,
        endpoint: errorMetrics.endpoint
      });
    }
  }

  getErrorStats(): { category: string; count: number; severity: string }[] {
    const stats: { category: string; count: number; severity: string }[] = [];
    
    this.errorCounts.forEach((count, key) => {
      const [category, severity] = key.split('_');
      stats.push({ category, count, severity });
    });
    
    return stats;
  }

  getPerformanceStats(): {
    averageResponseTime: number;
    slowestEndpoints: { endpoint: string; avgTime: number }[];
    errorRate: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        slowestEndpoints: [],
        errorRate: 0
      };
    }

    const totalTime = this.performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    const averageResponseTime = totalTime / this.performanceMetrics.length;

    // Group by endpoint and calculate average time
    const endpointTimes = new Map<string, number[]>();
    this.performanceMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointTimes.has(key)) {
        endpointTimes.set(key, []);
      }
      endpointTimes.get(key)!.push(metric.responseTime);
    });

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    const errorCount = this.performanceMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / this.performanceMetrics.length) * 100;

    return {
      averageResponseTime,
      slowestEndpoints,
      errorRate
    };
  }

  resetMetrics(): void {
    this.errorCounts.clear();
    this.performanceMetrics = [];
  }
}

export const errorMonitoring = new ErrorMonitoringService();
