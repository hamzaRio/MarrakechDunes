import { cacheService } from './cache-service.js';
import { loggingService } from './logging-service.js';

export interface AnalyticsMetrics {
  revenue: {
    total: number;
    daily: number;
    monthly: number;
    growth: number;
    byActivity: Array<{ activityId: string; name: string; revenue: number; percentage: number }>;
    byMonth: Array<{ month: string; revenue: number; bookings: number }>;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    conversionRate: number;
    averageValue: number;
    trends: Array<{ date: string; count: number; revenue: number }>;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    segments: Array<{ segment: string; count: number; percentage: number }>;
    lifetimeValue: number;
    churnRate: number;
  };
  activities: {
    total: number;
    active: number;
    popular: Array<{ activityId: string; name: string; bookings: number; revenue: number; rating: number }>;
    underperforming: Array<{ activityId: string; name: string; bookings: number; revenue: number; issues: string[] }>;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    cacheHitRate: number;
    databasePerformance: number;
  };
}

export interface PredictiveInsights {
  demandForecast: Array<{ date: string; predictedBookings: number; confidence: number }>;
  revenueProjection: Array<{ month: string; projectedRevenue: number; confidence: number }>;
  seasonalTrends: Array<{ month: string; expectedBookings: number; expectedRevenue: number }>;
  riskFactors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; description: string }>;
  opportunities: Array<{ opportunity: string; potentialGain: number; effort: 'low' | 'medium' | 'high' }>;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentBookings: number;
  systemLoad: number;
  responseTime: number;
  errorCount: number;
  cacheStatus: 'healthy' | 'degraded' | 'unhealthy';
  databaseStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export class AdvancedAnalyticsService {
  private metricsCache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async getComprehensiveMetrics(dateRange: { start: Date; end: Date }): Promise<AnalyticsMetrics> {
    try {
      const cacheKey = `analytics:comprehensive:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`;
      const cached = await this.getCachedMetrics(cacheKey);
      if (cached) {
        return cached;
      }

      const metrics = await this.calculateComprehensiveMetrics(dateRange);
      await this.cacheMetrics(cacheKey, metrics);
      
      loggingService.info('Comprehensive analytics generated', { 
        endpoint: 'analytics',
        method: 'GET',
        metric: 'analytics_generated'
      });
      return metrics;
    } catch (error) {
      loggingService.error('Analytics calculation failed', error as Error, { 
        endpoint: 'analytics',
        method: 'GET',
        type: 'analytics_error'
      });
      throw error;
    }
  }

  async getPredictiveInsights(): Promise<PredictiveInsights> {
    try {
      const cacheKey = 'analytics:predictive';
      const cached = await this.getCachedMetrics(cacheKey);
      if (cached) {
        return cached;
      }

      const insights = await this.generatePredictiveInsights();
      await this.cacheMetrics(cacheKey, insights);
      
      return insights;
    } catch (error) {
      loggingService.error('Predictive insights generation failed', error as Error, { 
        endpoint: 'analytics',
        method: 'GET',
        type: 'predictive_error'
      });
      throw error;
    }
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const cacheKey = 'analytics:realtime';
      const cached = await this.getCachedMetrics(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) { // 30 seconds
        return cached.data;
      }

      const metrics = await this.calculateRealTimeMetrics();
      await this.cacheMetrics(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      loggingService.error('Real-time metrics calculation failed', error as Error, { 
        endpoint: 'analytics',
        method: 'GET',
        type: 'realtime_error'
      });
      throw error;
    }
  }

  private async calculateComprehensiveMetrics(dateRange: { start: Date; end: Date }): Promise<AnalyticsMetrics> {
    // This would typically query the database for actual data
    // For now, return mock data with realistic patterns
    
    const revenue = await this.calculateRevenueMetrics(dateRange);
    const bookings = await this.calculateBookingMetrics(dateRange);
    const customers = await this.calculateCustomerMetrics(dateRange);
    const activities = await this.calculateActivityMetrics(dateRange);
    const performance = await this.calculatePerformanceMetrics();

    return {
      revenue,
      bookings,
      customers,
      activities,
      performance
    };
  }

  private async calculateRevenueMetrics(dateRange: { start: Date; end: Date }) {
    // Mock revenue calculation
    const totalRevenue = 150000; // MAD
    const dailyRevenue = totalRevenue / 30;
    const monthlyRevenue = totalRevenue;
    const growth = 0.15; // 15% growth

    const revenueByActivity = [
      { activityId: '1', name: 'Desert Tour', revenue: 60000, percentage: 40 },
      { activityId: '2', name: 'Atlas Mountains', revenue: 45000, percentage: 30 },
      { activityId: '3', name: 'City Tour', revenue: 30000, percentage: 20 },
      { activityId: '4', name: 'Cooking Class', revenue: 15000, percentage: 10 }
    ];

    const revenueByMonth = [
      { month: 'Jan', revenue: 12000, bookings: 24 },
      { month: 'Feb', revenue: 15000, bookings: 30 },
      { month: 'Mar', revenue: 18000, bookings: 36 },
      { month: 'Apr', revenue: 22000, bookings: 44 },
      { month: 'May', revenue: 25000, bookings: 50 },
      { month: 'Jun', revenue: 28000, bookings: 56 }
    ];

    return {
      total: totalRevenue,
      daily: dailyRevenue,
      monthly: monthlyRevenue,
      growth,
      byActivity: revenueByActivity,
      byMonth: revenueByMonth
    };
  }

  private async calculateBookingMetrics(dateRange: { start: Date; end: Date }) {
    const total = 150;
    const confirmed = 120;
    const pending = 20;
    const cancelled = 10;
    const conversionRate = 0.8;
    const averageValue = 1000;

    const trends = [
      { date: '2024-01-01', count: 5, revenue: 5000 },
      { date: '2024-01-02', count: 8, revenue: 8000 },
      { date: '2024-01-03', count: 12, revenue: 12000 },
      { date: '2024-01-04', count: 6, revenue: 6000 },
      { date: '2024-01-05', count: 15, revenue: 15000 }
    ];

    return {
      total,
      confirmed,
      pending,
      cancelled,
      conversionRate,
      averageValue,
      trends
    };
  }

  private async calculateCustomerMetrics(dateRange: { start: Date; end: Date }) {
    const total = 200;
    const newCustomers = 50;
    const returning = 150;
    const lifetimeValue = 2500;
    const churnRate = 0.05;

    const segments = [
      { segment: 'Budget Travelers', count: 80, percentage: 40 },
      { segment: 'Premium Travelers', count: 60, percentage: 30 },
      { segment: 'Luxury Travelers', count: 40, percentage: 20 },
      { segment: 'Corporate Groups', count: 20, percentage: 10 }
    ];

    return {
      total,
      new: newCustomers,
      returning,
      segments,
      lifetimeValue,
      churnRate
    };
  }

  private async calculateActivityMetrics(dateRange: { start: Date; end: Date }) {
    const total = 10;
    const active = 8;

    const popular = [
      { activityId: '1', name: 'Desert Tour', bookings: 45, revenue: 45000, rating: 4.8 },
      { activityId: '2', name: 'Atlas Mountains', bookings: 35, revenue: 35000, rating: 4.6 },
      { activityId: '3', name: 'City Tour', bookings: 25, revenue: 25000, rating: 4.4 }
    ];

    const underperforming = [
      { activityId: '5', name: 'Photography Tour', bookings: 3, revenue: 3000, issues: ['Low demand', 'High price'] },
      { activityId: '6', name: 'Cooking Class', bookings: 5, revenue: 5000, issues: ['Limited capacity', 'Seasonal'] }
    ];

    return {
      total,
      active,
      popular,
      underperforming
    };
  }

  private async calculatePerformanceMetrics() {
    const responseTime = 150; // ms
    const uptime = 99.9; // percentage
    const errorRate = 0.01; // percentage
    const cacheHitRate = 0.85; // percentage
    const databasePerformance = 0.95; // percentage

    return {
      responseTime,
      uptime,
      errorRate,
      cacheHitRate,
      databasePerformance
    };
  }

  private async generatePredictiveInsights(): Promise<PredictiveInsights> {
    const demandForecast = [
      { date: '2024-02-01', predictedBookings: 8, confidence: 0.85 },
      { date: '2024-02-02', predictedBookings: 12, confidence: 0.90 },
      { date: '2024-02-03', predictedBookings: 15, confidence: 0.88 },
      { date: '2024-02-04', predictedBookings: 10, confidence: 0.82 },
      { date: '2024-02-05', predictedBookings: 18, confidence: 0.92 }
    ];

    const revenueProjection = [
      { month: 'Feb', projectedRevenue: 18000, confidence: 0.85 },
      { month: 'Mar', projectedRevenue: 22000, confidence: 0.80 },
      { month: 'Apr', projectedRevenue: 25000, confidence: 0.75 },
      { month: 'May', projectedRevenue: 28000, confidence: 0.70 }
    ];

    const seasonalTrends = [
      { month: 'Spring', expectedBookings: 120, expectedRevenue: 120000 },
      { month: 'Summer', expectedBookings: 80, expectedRevenue: 80000 },
      { month: 'Fall', expectedBookings: 100, expectedRevenue: 100000 },
      { month: 'Winter', expectedBookings: 60, expectedRevenue: 60000 }
    ];

    const riskFactors = [
      { factor: 'Weather Dependencies', impact: 'high' as const, description: 'Activities heavily dependent on weather conditions' },
      { factor: 'Seasonal Fluctuations', impact: 'medium' as const, description: 'Significant revenue variations between seasons' },
      { factor: 'Competition', impact: 'medium' as const, description: 'Increasing competition in the market' }
    ];

    const opportunities = [
      { opportunity: 'Expand Desert Tours', potentialGain: 25000, effort: 'low' as const },
      { opportunity: 'Add Luxury Packages', potentialGain: 40000, effort: 'medium' as const },
      { opportunity: 'Corporate Partnerships', potentialGain: 60000, effort: 'high' as const }
    ];

    return {
      demandForecast,
      revenueProjection,
      seasonalTrends,
      riskFactors,
      opportunities
    };
  }

  private async calculateRealTimeMetrics(): Promise<RealTimeMetrics> {
    const activeUsers = Math.floor(Math.random() * 50) + 10;
    const currentBookings = Math.floor(Math.random() * 20) + 5;
    const systemLoad = Math.random() * 0.8 + 0.2;
    const responseTime = Math.floor(Math.random() * 100) + 50;
    const errorCount = Math.floor(Math.random() * 5);
    
    const cacheStatus = await this.getCacheStatus();
    const databaseStatus = await this.getDatabaseStatus();

    return {
      activeUsers,
      currentBookings,
      systemLoad,
      responseTime,
      errorCount,
      cacheStatus,
      databaseStatus
    };
  }

  private async getCacheStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const health = await cacheService.healthCheck();
      return health.status;
    } catch {
      return 'unhealthy';
    }
  }

  private async getDatabaseStatus(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    // This would check database connection and performance
    // For now, return healthy
    return 'healthy';
  }

  private async getCachedMetrics(key: string): Promise<any> {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private async cacheMetrics(key: string, data: any): Promise<void> {
    this.metricsCache.set(key, { data, timestamp: Date.now() });
  }

  // Export analytics data
  async exportAnalytics(format: 'csv' | 'json' | 'pdf', dateRange: { start: Date; end: Date }): Promise<Buffer | string> {
    const metrics = await this.getComprehensiveMetrics(dateRange);
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(metrics);
      case 'json':
        return JSON.stringify(metrics, null, 2);
      case 'pdf':
        return await this.exportToPDF(metrics);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToCSV(metrics: AnalyticsMetrics): string {
    const headers = ['Metric', 'Value', 'Date'];
    const rows = [
      ['Total Revenue', metrics.revenue.total.toString(), new Date().toISOString()],
      ['Total Bookings', metrics.bookings.total.toString(), new Date().toISOString()],
      ['Total Customers', metrics.customers.total.toString(), new Date().toISOString()],
      ['Active Activities', metrics.activities.active.toString(), new Date().toISOString()]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private async exportToPDF(metrics: AnalyticsMetrics): Promise<Buffer> {
    // This would generate a PDF report
    // For now, return a mock buffer
    return Buffer.from('PDF report would be generated here');
  }

  // Custom analytics queries
  async getCustomAnalytics(query: {
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    dateRange: { start: Date; end: Date };
  }): Promise<any> {
    // This would execute custom analytics queries
    // For now, return mock data
    return {
      results: [],
      metadata: {
        query,
        executionTime: 150,
        recordCount: 0
      }
    };
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
