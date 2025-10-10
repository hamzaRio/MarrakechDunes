import { Request, Response } from 'express';
import { createWriteStream } from 'fs';
import { join } from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: {
    userId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    duration?: number;
    statusCode?: number;
    bookingId?: string;
    type?: string;
    action?: string;
    event?: string;
    metric?: string;
    memoryUsage?: string;
    totalBookings?: string;
    totalRevenue?: string;
    activeUsers?: string;
    conversionRate?: string;
  };
  metadata?: Record<string, any>;
}

export class LoggingService {
  private logFile: string;
  private errorLogFile: string;
  private accessLogFile: string;

  constructor() {
    const logDir = process.env.LOG_DIR || './logs';
    this.logFile = join(logDir, 'application.log');
    this.errorLogFile = join(logDir, 'error.log');
    this.accessLogFile = join(logDir, 'access.log');
  }

  private formatLogEntry(entry: LogEntry): string {
    const baseLog = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    
    if (entry.context) {
      const contextStr = Object.entries(entry.context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      return `${baseLog} | ${contextStr}`;
    }
    
    return baseLog;
  }

  private writeToFile(filename: string, message: string): void {
    try {
      const stream = createWriteStream(filename, { flags: 'a' });
      stream.write(message + '\n');
      stream.end();
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  info(message: string, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      metadata
    };
    
    const formattedLog = this.formatLogEntry(entry);
    console.log(formattedLog);
    this.writeToFile(this.logFile, formattedLog);
  }

  warn(message: string, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      metadata
    };
    
    const formattedLog = this.formatLogEntry(entry);
    console.warn(formattedLog);
    this.writeToFile(this.logFile, formattedLog);
  }

  error(message: string, error?: Error, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error ? `${message}: ${error.message}` : message,
      context,
      metadata: {
        ...metadata,
        stack: error?.stack
      }
    };
    
    const formattedLog = this.formatLogEntry(entry);
    console.error(formattedLog);
    this.writeToFile(this.errorLogFile, formattedLog);
  }

  debug(message: string, context?: LogEntry['context'], metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context,
        metadata
      };
      
      const formattedLog = this.formatLogEntry(entry);
      console.debug(formattedLog);
      this.writeToFile(this.logFile, formattedLog);
    }
  }

  // Request logging
  logRequest(req: Request, res: Response, duration: number): void {
    const accessLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: (req as any).session?.user?.id
    };

    const formattedLog = Object.entries(accessLog)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    console.log(`[ACCESS] ${formattedLog}`);
    this.writeToFile(this.accessLogFile, formattedLog);
  }

  // Business logic logging
  logBooking(bookingId: string, action: string, details: Record<string, any>): void {
    this.info(`Booking ${action}`, {
      bookingId,
      action
    }, details);
  }

  logPayment(bookingId: string, amount: number, method: string, status: string): void {
    this.info(`Payment processed`, {
      bookingId,
      endpoint: `${amount} MAD`,
      method,
      statusCode: status === 'success' ? 200 : 400
    });
  }

  logNotification(type: string, recipient: string, status: string): void {
    this.info(`Notification sent`, {
      type,
      endpoint: recipient,
      statusCode: status === 'sent' ? 200 : 400
    });
  }

  logAdminAction(userId: string, action: string, details: Record<string, any>): void {
    this.info(`Admin action: ${action}`, {
      userId,
      action
    }, details);
  }

  logSecurityEvent(event: string, ip: string, details: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      ip,
      event
    }, details);
  }

  logPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.info(`Performance metric: ${metric}`, {
      metric,
      duration: value
    }, context);
  }

  // System health logging
  logSystemHealth(metrics: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    cpuUsage: NodeJS.CpuUsage;
  }): void {
    this.info('System health check', {
      memoryUsage: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
      duration: Math.round(metrics.uptime),
      metric: `${Math.round(metrics.cpuUsage.user / 1000000)}s`
    });
  }

  // Database logging
  logDatabaseOperation(operation: string, collection: string, duration: number, success: boolean): void {
    this.info(`Database ${operation}`, {
      action: operation,
      endpoint: collection,
      duration: duration,
      statusCode: success ? 200 : 500
    });
  }

  // Cache logging
  logCacheOperation(operation: string, key: string, hit: boolean, duration?: number): void {
    this.debug(`Cache ${operation}`, {
      action: operation,
      endpoint: key,
      duration: duration || 0,
      statusCode: hit ? 200 : 404
    });
  }

  // Error tracking with context
  trackError(error: Error, req?: Request, context?: Record<string, any>): void {
    this.error('Application error', error, {
      endpoint: req?.path,
      method: req?.method,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      userId: (req as any)?.session?.user?.id
    }, context);
  }

  // Business metrics logging
  logBusinessMetrics(metrics: {
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
    conversionRate: number;
  }): void {
    this.info('Business metrics', {
      totalBookings: metrics.totalBookings.toString(),
      totalRevenue: `${metrics.totalRevenue} MAD`,
      activeUsers: metrics.activeUsers.toString(),
      conversionRate: `${metrics.conversionRate}%`
    });
  }
}

export const loggingService = new LoggingService();
