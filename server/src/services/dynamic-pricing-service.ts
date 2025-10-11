import { cacheService } from './cache-service.js';
import { loggingService } from './logging-service.js';

export interface PricingContext {
  activityId: string;
  date: Date;
  groupSize: number;
  customerType: 'new' | 'returning' | 'vip';
  season: 'peak' | 'shoulder' | 'low';
  weather: {
    condition: string;
    temperature: number;
    suitable: boolean;
  };
  demand: {
    level: 'high' | 'medium' | 'low';
    bookings: number;
    capacity: number;
  };
  competition: {
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
  };
}

export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  adjustments: {
    seasonal: number;
    demand: number;
    weather: number;
    group: number;
    competition: number;
    loyalty: number;
  };
  breakdown: {
    original: number;
    seasonalAdjustment: number;
    demandAdjustment: number;
    weatherAdjustment: number;
    groupDiscount: number;
    competitionAdjustment: number;
    loyaltyDiscount: number;
    final: number;
  };
  confidence: number;
  reasoning: string[];
}

export interface GroupDiscountTier {
  minSize: number;
  maxSize: number;
  discountPercentage: number;
  name: string;
}

export class DynamicPricingService {
  private pricingRules = {
    seasonal: {
      peak: { multiplier: 1.3, months: [3, 4, 5, 9, 10, 11] }, // Spring and Fall
      shoulder: { multiplier: 1.1, months: [2, 6, 8, 12] }, // Winter and Summer
      low: { multiplier: 0.9, months: [1, 7] } // January and July
    },
    demand: {
      high: { threshold: 0.8, multiplier: 1.2 },
      medium: { threshold: 0.5, multiplier: 1.0 },
      low: { threshold: 0.2, multiplier: 0.8 }
    },
    weather: {
      excellent: { multiplier: 1.1 },
      good: { multiplier: 1.0 },
      poor: { multiplier: 0.9 }
    },
    group: [
      { minSize: 2, maxSize: 4, discountPercentage: 5, name: 'Small Group' },
      { minSize: 5, maxSize: 9, discountPercentage: 10, name: 'Medium Group' },
      { minSize: 10, maxSize: 19, discountPercentage: 15, name: 'Large Group' },
      { minSize: 20, maxSize: 50, discountPercentage: 20, name: 'Corporate Group' }
    ],
    loyalty: {
      new: { discountPercentage: 0 },
      returning: { discountPercentage: 5 },
      vip: { discountPercentage: 10 }
    }
  };

  async calculatePrice(context: PricingContext): Promise<PricingResult> {
    try {
      // Check cache first
      const cacheKey = `pricing:${context.activityId}:${context.date.toISOString()}:${context.groupSize}`;
      const cached = await cacheService.get<PricingResult>('pricing', cacheKey);
      if (cached) {
        loggingService.debug('Pricing served from cache', { 
          endpoint: 'pricing',
          method: 'GET',
          type: 'cache_hit'
        });
        return cached;
      }

      // Get base price from activity
      const basePrice = await this.getBasePrice(context.activityId);
      if (!basePrice) {
        throw new Error('Activity not found');
      }

      // Calculate adjustments
      const adjustments = await this.calculateAdjustments(context, basePrice);
      
      // Apply adjustments
      const finalPrice = this.applyAdjustments(basePrice, adjustments);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(context, adjustments);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(context, adjustments);

      const result: PricingResult = {
        basePrice,
        finalPrice,
        adjustments,
        breakdown: {
          original: basePrice,
          seasonalAdjustment: adjustments.seasonal,
          demandAdjustment: adjustments.demand,
          weatherAdjustment: adjustments.weather,
          groupDiscount: adjustments.group,
          competitionAdjustment: adjustments.competition,
          loyaltyDiscount: adjustments.loyalty,
          final: finalPrice
        },
        confidence,
        reasoning
      };

      // Cache the result
      await cacheService.set('pricing', cacheKey, result, 1800); // 30 minutes

      loggingService.info('Dynamic pricing calculated', {
        endpoint: 'pricing',
        method: 'GET',
        type: 'pricing_calculated',
        metric: 'pricing_success'
      });

      return result;
    } catch (error) {
      loggingService.error('Dynamic pricing calculation failed', error as Error, { 
        endpoint: 'pricing',
        method: 'GET',
        type: 'pricing_error'
      });
      throw error;
    }
  }

  private async getBasePrice(activityId: string): Promise<number> {
    // This would typically fetch from database
    // For now, return a mock price
    return 500; // MAD
  }

  private async calculateAdjustments(context: PricingContext, basePrice: number) {
    const adjustments = {
      seasonal: 0,
      demand: 0,
      weather: 0,
      group: 0,
      competition: 0,
      loyalty: 0
    };

    // Seasonal adjustment
    adjustments.seasonal = this.calculateSeasonalAdjustment(context, basePrice);
    
    // Demand adjustment
    adjustments.demand = this.calculateDemandAdjustment(context, basePrice);
    
    // Weather adjustment
    adjustments.weather = this.calculateWeatherAdjustment(context, basePrice);
    
    // Group discount
    adjustments.group = this.calculateGroupDiscount(context, basePrice);
    
    // Competition adjustment
    adjustments.competition = this.calculateCompetitionAdjustment(context, basePrice);
    
    // Loyalty discount
    adjustments.loyalty = this.calculateLoyaltyDiscount(context, basePrice);

    return adjustments;
  }

  private calculateSeasonalAdjustment(context: PricingContext, basePrice: number): number {
    const month = context.date.getMonth() + 1;
    const season = this.getSeason(month);
    const rule = this.pricingRules.seasonal[season];
    
    return (rule.multiplier - 1) * basePrice;
  }

  private calculateDemandAdjustment(context: PricingContext, basePrice: number): number {
    const demandLevel = this.getDemandLevel(context.demand);
    const rule = this.pricingRules.demand[demandLevel];
    
    return (rule.multiplier - 1) * basePrice;
  }

  private calculateWeatherAdjustment(context: PricingContext, basePrice: number): number {
    const weatherQuality = this.getWeatherQuality(context.weather);
    const rule = this.pricingRules.weather[weatherQuality];
    
    return (rule.multiplier - 1) * basePrice;
  }

  private calculateGroupDiscount(context: PricingContext, basePrice: number): number {
    const groupTier = this.getGroupTier(context.groupSize);
    if (!groupTier) return 0;
    
    const discountAmount = (groupTier.discountPercentage / 100) * basePrice;
    return -discountAmount; // Negative because it's a discount
  }

  private calculateCompetitionAdjustment(context: PricingContext, basePrice: number): number {
    if (!context.competition.averagePrice) return 0;
    
    const priceDifference = basePrice - context.competition.averagePrice;
    const adjustmentPercentage = Math.min(Math.abs(priceDifference) / basePrice, 0.2); // Max 20% adjustment
    
    if (basePrice > context.competition.averagePrice) {
      return -basePrice * adjustmentPercentage; // Reduce price to be competitive
    } else {
      return basePrice * adjustmentPercentage; // Increase price if we're too cheap
    }
  }

  private calculateLoyaltyDiscount(context: PricingContext, basePrice: number): number {
    const rule = this.pricingRules.loyalty[context.customerType];
    const discountAmount = (rule.discountPercentage / 100) * basePrice;
    return -discountAmount; // Negative because it's a discount
  }

  private applyAdjustments(basePrice: number, adjustments: any): number {
    let finalPrice = basePrice;
    
    Object.values(adjustments).forEach((adjustment) => {
      finalPrice += Number(adjustment);
    });
    
    // Ensure minimum price (at least 50% of base price)
    finalPrice = Math.max(finalPrice, basePrice * 0.5);
    
    // Round to nearest 10
    return Math.round(finalPrice / 10) * 10;
  }

  private generateReasoning(context: PricingContext, adjustments: any): string[] {
    const reasoning: string[] = [];
    
    if (adjustments.seasonal > 0) {
      reasoning.push(`Peak season pricing (+${Math.round(adjustments.seasonal)} MAD)`);
    } else if (adjustments.seasonal < 0) {
      reasoning.push(`Low season discount (${Math.round(adjustments.seasonal)} MAD)`);
    }
    
    if (adjustments.demand > 0) {
      reasoning.push(`High demand premium (+${Math.round(adjustments.demand)} MAD)`);
    } else if (adjustments.demand < 0) {
      reasoning.push(`Low demand discount (${Math.round(adjustments.demand)} MAD)`);
    }
    
    if (adjustments.weather > 0) {
      reasoning.push(`Excellent weather conditions (+${Math.round(adjustments.weather)} MAD)`);
    } else if (adjustments.weather < 0) {
      reasoning.push(`Weather discount (${Math.round(adjustments.weather)} MAD)`);
    }
    
    if (adjustments.group < 0) {
      const groupTier = this.getGroupTier(context.groupSize);
      reasoning.push(`${groupTier?.name} discount (${Math.round(Math.abs(adjustments.group))} MAD)`);
    }
    
    if (adjustments.competition !== 0) {
      reasoning.push(`Competitive pricing adjustment (${Math.round(adjustments.competition)} MAD)`);
    }
    
    if (adjustments.loyalty < 0) {
      reasoning.push(`Loyalty discount (${Math.round(Math.abs(adjustments.loyalty))} MAD)`);
    }
    
    return reasoning;
  }

  private calculateConfidence(context: PricingContext, adjustments: any): number {
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence if we have limited data
    if (!context.competition.averagePrice) confidence -= 0.1;
    if (!context.weather.suitable) confidence -= 0.1;
    if (context.demand.bookings === 0) confidence -= 0.1;
    
    // Increase confidence for returning customers
    if (context.customerType === 'returning') confidence += 0.1;
    if (context.customerType === 'vip') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private getSeason(month: number): 'peak' | 'shoulder' | 'low' {
    if ([3, 4, 5, 9, 10, 11].includes(month)) return 'peak';
    if ([2, 6, 8, 12].includes(month)) return 'shoulder';
    return 'low';
  }

  private getDemandLevel(demand: any): 'high' | 'medium' | 'low' {
    const utilization = demand.bookings / demand.capacity;
    if (utilization >= 0.8) return 'high';
    if (utilization >= 0.5) return 'medium';
    return 'low';
  }

  private getWeatherQuality(weather: any): 'excellent' | 'good' | 'poor' {
    if (weather.suitable && weather.temperature > 20 && weather.temperature < 35) {
      return 'excellent';
    }
    if (weather.suitable) return 'good';
    return 'poor';
  }

  private getGroupTier(groupSize: number): GroupDiscountTier | null {
    return this.pricingRules.group.find(tier => 
      groupSize >= tier.minSize && groupSize <= tier.maxSize
    ) || null;
  }

  // Batch pricing for multiple activities
  async calculateBatchPricing(
    activities: string[],
    context: Omit<PricingContext, 'activityId'>
  ): Promise<Map<string, PricingResult>> {
    const results = new Map<string, PricingResult>();
    
    const promises = activities.map(async (activityId) => {
      const fullContext = { ...context, activityId };
      const pricing = await this.calculatePrice(fullContext);
      results.set(activityId, pricing);
    });
    
    await Promise.all(promises);
    return results;
  }

  // Price optimization for revenue maximization
  async optimizePricing(activityId: string, date: Date): Promise<{
    recommendedPrice: number;
    expectedBookings: number;
    expectedRevenue: number;
    confidence: number;
  }> {
    // This would implement more sophisticated optimization
    // For now, return a simple recommendation
    const basePrice = await this.getBasePrice(activityId);
    const optimizedPrice = basePrice * 1.1; // 10% increase
    
    return {
      recommendedPrice: optimizedPrice,
      expectedBookings: 5,
      expectedRevenue: optimizedPrice * 5,
      confidence: 0.7
    };
  }

  // Get pricing analytics
  async getPricingAnalytics(activityId: string, dateRange: { start: Date; end: Date }) {
    // This would analyze historical pricing data
    return {
      averagePrice: 500,
      priceRange: { min: 400, max: 700 },
      bookingTrends: [],
      revenueImpact: 0.15
    };
  }
}

export const dynamicPricingService = new DynamicPricingService();
