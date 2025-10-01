import type { PricingQuote, DynamicPricingConfig } from "marrakechdunes-shared/schema";

export interface PricingContext {
  activityId: string;
  date: Date;
  partySize: number;
  basePrice: number;
  currentBookings: number;
  maxCapacity: number;
}

export function calculateDynamicPricing(
  context: PricingContext,
  config?: DynamicPricingConfig
): PricingQuote {
  const { basePrice, date, partySize, currentBookings, maxCapacity } = context;
  
  // Default configuration if not provided
  const defaultConfig: DynamicPricingConfig = {
    seasonal: {
      peak: { months: [6, 7, 8], adjustment: 0.3 }, // June-August: +30%
      shoulder: { months: [4, 5, 9, 10], adjustment: 0.1 }, // Apr-May, Sep-Oct: +10%
      low: { months: [11, 12, 1, 2, 3], adjustment: -0.1 } // Nov-Mar: -10%
    },
    demand: {
      high: { threshold: 0.8, adjustment: 0.2 }, // >80% capacity: +20%
      medium: { threshold: 0.5, adjustment: 0 }, // 50-80% capacity: 0%
      low: { threshold: 0, adjustment: -0.2 } // <50% capacity: -20%
    },
    group: {
      small: { min: 2, max: 4, discount: 0.05 }, // 2-4 people: 5%
      medium: { min: 5, max: 8, discount: 0.10 }, // 5-8 people: 10%
      large: { min: 9, max: 999, discount: 0.15 } // 9+ people: 15%
    }
  };
  
  const pricingConfig = config || defaultConfig;
  
  // Calculate seasonal adjustment
  const month = date.getMonth() + 1; // 1-12
  let seasonalAdjustment = 0;
  
  if (pricingConfig.seasonal.peak.months.includes(month)) {
    seasonalAdjustment = pricingConfig.seasonal.peak.adjustment;
  } else if (pricingConfig.seasonal.shoulder.months.includes(month)) {
    seasonalAdjustment = pricingConfig.seasonal.shoulder.adjustment;
  } else if (pricingConfig.seasonal.low.months.includes(month)) {
    seasonalAdjustment = pricingConfig.seasonal.low.adjustment;
  }
  
  // Calculate demand adjustment
  const capacityUtilization = currentBookings / maxCapacity;
  let demandAdjustment = 0;
  
  if (capacityUtilization >= pricingConfig.demand.high.threshold) {
    demandAdjustment = pricingConfig.demand.high.adjustment;
  } else if (capacityUtilization >= pricingConfig.demand.medium.threshold) {
    demandAdjustment = pricingConfig.demand.medium.adjustment;
  } else {
    demandAdjustment = pricingConfig.demand.low.adjustment;
  }
  
  // Calculate group discount
  let groupDiscount = 0;
  if (partySize >= pricingConfig.group.large.min) {
    groupDiscount = pricingConfig.group.large.discount;
  } else if (partySize >= pricingConfig.group.medium.min) {
    groupDiscount = pricingConfig.group.medium.discount;
  } else if (partySize >= pricingConfig.group.small.min) {
    groupDiscount = pricingConfig.group.small.discount;
  }
  
  // Calculate final price
  const seasonalAmount = basePrice * seasonalAdjustment;
  const demandAmount = basePrice * demandAdjustment;
  const groupAmount = basePrice * groupDiscount;
  
  const finalPrice = basePrice + seasonalAmount + demandAmount - groupAmount;
  
  return {
    basePrice,
    seasonalAdjustment: seasonalAdjustment * 100, // Convert to percentage
    demandAdjustment: demandAdjustment * 100,
    groupDiscount: groupDiscount * 100,
    finalPrice: Math.round(finalPrice),
    breakdown: {
      base: basePrice,
      seasonal: Math.round(seasonalAmount),
      demand: Math.round(demandAmount),
      group: Math.round(groupAmount),
      total: Math.round(finalPrice)
    }
  };
}

export function getSeasonalDescription(month: number): string {
  const seasons = {
    1: 'Winter (Low Season)',
    2: 'Winter (Low Season)',
    3: 'Spring (Low Season)',
    4: 'Spring (Shoulder Season)',
    5: 'Spring (Shoulder Season)',
    6: 'Summer (Peak Season)',
    7: 'Summer (Peak Season)',
    8: 'Summer (Peak Season)',
    9: 'Autumn (Shoulder Season)',
    10: 'Autumn (Shoulder Season)',
    11: 'Autumn (Low Season)',
    12: 'Winter (Low Season)'
  };
  
  return seasons[month as keyof typeof seasons] || 'Unknown Season';
}
