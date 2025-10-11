import { Request, Response, NextFunction } from 'express';
import { loggingService } from './logging-service.js';
import { cacheService } from './cache-service.js';

export interface SecurityEvent {
  type: 'suspicious_activity' | 'brute_force' | 'sql_injection' | 'xss_attempt' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  endpoint: string;
  details: any;
  timestamp: Date;
}

export interface ThreatIntelligence {
  ip: string;
  riskScore: number;
  isBlocked: boolean;
  reason: string;
  lastSeen: Date;
  attempts: number;
}

export class AdvancedSecurityService {
  private blockedIPs: Map<string, ThreatIntelligence> = new Map();
  private suspiciousPatterns = [
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
    /<script.*>/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  private bruteForceThreshold = 5;
  private timeWindow = 15 * 60 * 1000; // 15 minutes

  // Advanced threat detection
  async detectThreats(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const endpoint = req.path;

    try {
      // Check if IP is already blocked
      if (await this.isIPBlocked(ip)) {
        await this.logSecurityEvent({
          type: 'unauthorized_access',
          severity: 'high',
          ip,
          userAgent,
          endpoint,
          details: { reason: 'IP blocked' },
          timestamp: new Date()
        });
        
        res.status(403).json({
          error: 'Access denied',
          code: 'IP_BLOCKED'
        });
        return;
      }

      // Detect SQL injection attempts
      if (this.detectSQLInjection(req)) {
        await this.handleThreat('sql_injection', ip, userAgent, endpoint, req);
        res.status(400).json({
          error: 'Invalid request detected',
          code: 'SECURITY_VIOLATION'
        });
        return;
      }

      // Detect XSS attempts
      if (this.detectXSS(req)) {
        await this.handleThreat('xss_attempt', ip, userAgent, endpoint, req);
        res.status(400).json({
          error: 'Invalid request detected',
          code: 'SECURITY_VIOLATION'
        });
        return;
      }

      // Detect brute force attempts
      if (await this.detectBruteForce(ip, endpoint)) {
        await this.handleThreat('brute_force', ip, userAgent, endpoint, req);
        res.status(429).json({
          error: 'Too many failed attempts',
          code: 'BRUTE_FORCE_DETECTED'
        });
        return;
      }

      // Monitor suspicious activity
      await this.monitorSuspiciousActivity(req, ip, userAgent, endpoint);

      next();
    } catch (error) {
      loggingService.error('Security threat detection failed', error as Error, { 
        endpoint: 'security',
        method: 'POST',
        type: 'security_error'
      });
      next();
    }
  }

  private detectSQLInjection(req: Request): boolean {
    const query = JSON.stringify(req.query);
    const body = JSON.stringify(req.body);
    const params = JSON.stringify(req.params);
    
    const combined = `${query} ${body} ${params}`.toLowerCase();
    
    return this.suspiciousPatterns.some(pattern => pattern.test(combined));
  }

  private detectXSS(req: Request): boolean {
    const query = JSON.stringify(req.query);
    const body = JSON.stringify(req.body);
    const params = JSON.stringify(req.params);
    
    const combined = `${query} ${body} ${params}`;
    
    // Check for script tags and javascript protocols
    return /<script|javascript:|on\w+\s*=/i.test(combined);
  }

  private async detectBruteForce(ip: string, endpoint: string): Promise<boolean> {
    if (!endpoint.includes('/auth/login')) {
      return false;
    }

    const cacheKey = `brute_force:${ip}`;
    const attempts = await cacheService.get<number>('security', cacheKey) || 0;
    
    if (attempts >= this.bruteForceThreshold) {
      return true;
    }

    return false;
  }

  private async handleThreat(
    type: 'sql_injection' | 'xss_attempt' | 'brute_force',
    ip: string,
    userAgent: string,
    endpoint: string,
    req: Request
  ): Promise<void> {
    const severity = type === 'brute_force' ? 'high' : 'critical';
    
    await this.logSecurityEvent({
      type: type === 'brute_force' ? 'brute_force' : 'suspicious_activity',
      severity,
      ip,
      userAgent,
      endpoint,
      details: { type, requestData: this.sanitizeRequest(req) },
      timestamp: new Date()
    });

    // Increment threat score for IP
    await this.incrementThreatScore(ip, severity);

    // Block IP if threat score is too high
    if (await this.shouldBlockIP(ip)) {
      await this.blockIP(ip, `Multiple ${type} attempts detected`);
    }
  }

  private async monitorSuspiciousActivity(
    req: Request,
    ip: string,
    userAgent: string,
    endpoint: string
  ): Promise<void> {
    const suspiciousIndicators = [];

    // Check for unusual request patterns
    if (req.get('User-Agent')?.includes('bot') || !req.get('User-Agent')) {
      suspiciousIndicators.push('suspicious_user_agent');
    }

    // Check for rapid requests
    const requestCount = await this.getRequestCount(ip);
    if (requestCount > 100) { // More than 100 requests in time window
      suspiciousIndicators.push('high_request_frequency');
    }

    // Check for unusual endpoints
    if (endpoint.includes('admin') && !req.session?.user) {
      suspiciousIndicators.push('unauthorized_admin_access');
    }

    if (suspiciousIndicators.length > 0) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        ip,
        userAgent,
        endpoint,
        details: { indicators: suspiciousIndicators },
        timestamp: new Date()
      });
    }
  }

  private async incrementThreatScore(ip: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    const scoreMap = { low: 1, medium: 3, high: 5, critical: 10 };
    const increment = scoreMap[severity];
    
    const cacheKey = `threat_score:${ip}`;
    const currentScore = await cacheService.get<number>('security', cacheKey) || 0;
    const newScore = currentScore + increment;
    
    await cacheService.set('security', cacheKey, newScore, 3600); // 1 hour TTL
  }

  private async shouldBlockIP(ip: string): Promise<boolean> {
    const cacheKey = `threat_score:${ip}`;
    const score = await cacheService.get<number>('security', cacheKey) || 0;
    return score >= 20; // Block if threat score >= 20
  }

  private async blockIP(ip: string, reason: string): Promise<void> {
    const threat: ThreatIntelligence = {
      ip,
      riskScore: 100,
      isBlocked: true,
      reason,
      lastSeen: new Date(),
      attempts: 1
    };

    this.blockedIPs.set(ip, threat);
    
    // Also store in cache for persistence
    await cacheService.set('security', `blocked_ip:${ip}`, threat, 86400); // 24 hours

    loggingService.warn('IP address blocked', { 
      endpoint: 'security',
      method: 'POST',
      type: 'ip_blocked',
      ip: ip
    });
  }

  private async isIPBlocked(ip: string): Promise<boolean> {
    // Check memory cache first
    if (this.blockedIPs.has(ip)) {
      return this.blockedIPs.get(ip)!.isBlocked;
    }

    // Check persistent cache
    const threat = await cacheService.get<ThreatIntelligence>('security', `blocked_ip:${ip}`);
    if (threat && threat.isBlocked) {
      this.blockedIPs.set(ip, threat);
      return true;
    }

    return false;
  }

  private async getRequestCount(ip: string): Promise<number> {
    const cacheKey = `request_count:${ip}`;
    return await cacheService.get<number>('security', cacheKey) || 0;
  }

  private async incrementRequestCount(ip: string): Promise<void> {
    const cacheKey = `request_count:${ip}`;
    const count = await this.getRequestCount(ip);
    await cacheService.set('security', cacheKey, count + 1, 900); // 15 minutes TTL
  }

  private sanitizeRequest(req: Request): any {
    return {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
        'content-length': req.get('Content-Length')
      },
      query: req.query,
      body: this.sanitizeBody(req.body),
      params: req.params
    };
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '...';
      }
    });
    
    return sanitized;
  }

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    loggingService.warn('Security event detected', {
      type: event.type,
      ip: event.ip,
      endpoint: event.endpoint,
      action: 'security_event'
    });

    // Store in cache for analysis
    const cacheKey = `security_events:${event.ip}:${Date.now()}`;
    await cacheService.set('security', cacheKey, event, 86400); // 24 hours
  }

  // Security analytics
  async getSecurityMetrics(): Promise<{
    blockedIPs: number;
    threatEvents: number;
    topThreats: Array<{ type: string; count: number }>;
    riskScore: number;
  }> {
    const blockedCount = this.blockedIPs.size;
    const threatEvents = await this.getThreatEventCount();
    const topThreats = await this.getTopThreats();
    const riskScore = await this.calculateRiskScore();

    return {
      blockedIPs: blockedCount,
      threatEvents,
      topThreats,
      riskScore
    };
  }

  private async getThreatEventCount(): Promise<number> {
    // This would typically query a database
    // For now, return a placeholder
    return 0;
  }

  private async getTopThreats(): Promise<Array<{ type: string; count: number }>> {
    // This would analyze stored security events
    return [];
  }

  private async calculateRiskScore(): Promise<number> {
    const blockedCount = this.blockedIPs.size;
    const threatEvents = await this.getThreatEventCount();
    
    // Simple risk calculation
    return Math.min((blockedCount * 10 + threatEvents * 5) / 100, 1.0);
  }

  // IP whitelist management
  async whitelistIP(ip: string, reason: string): Promise<void> {
    this.blockedIPs.delete(ip);
    await cacheService.del('security', `blocked_ip:${ip}`);
    
    loggingService.info('IP address whitelisted', { 
      endpoint: 'security',
      method: 'POST',
      type: 'ip_whitelisted',
      ip: ip
    });
  }

  // Security health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    const metrics = await this.getSecurityMetrics();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (metrics.riskScore > 0.7) {
      status = 'unhealthy';
    } else if (metrics.riskScore > 0.4) {
      status = 'degraded';
    }
    
    return {
      status,
      details: metrics
    };
  }
}

export const advancedSecurityService = new AdvancedSecurityService();
