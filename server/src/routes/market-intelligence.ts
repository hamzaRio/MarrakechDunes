import express, { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';

const router = express.Router();

// Market Intelligence Types
interface CompetitorActivity {
  id: string;
  title: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  link: string;
  source: 'getyourguide' | 'viator' | 'tripadvisor' | 'airbnb';
  location: string;
  duration: string;
  category: string;
}

interface MarketAnalysis {
  activity: CompetitorActivity;
  ourPrice?: number;
  priceDifference: number;
  competitiveAdvantage: 'strong' | 'moderate' | 'weak';
  marketPosition: 'leader' | 'competitive' | 'follower';
  recommendedPrice: number;
  profitMargin: number;
}

interface MarketIntelligence {
  query: string;
  totalResults: number;
  activities: CompetitorActivity[];
  analysis: MarketAnalysis[];
  marketInsights: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    topCompetitors: string[];
    marketGaps: string[];
  };
}

// Validation schemas
const marketSearchSchema = z.object({
  q: z.string().min(3, 'Query must be at least 3 characters'),
  location: z.string().optional().default('Marrakech'),
  category: z.string().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().optional().default(4.0)
});

/**
 * Market Intelligence Search
 * GET /api/market/search?q=desert+tour&location=Marrakech
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, location, category, maxPrice, minRating } = marketSearchSchema.parse(req.query);
    
    console.log(`[Market Intelligence] Searching for: "${q}" in ${location}`);
    
    // Search multiple competitor sources
    const [getyourguideResults, viatorResults, tripadvisorResults] = await Promise.allSettled([
      searchGetYourGuide(q, location),
      searchViator(q, location),
      searchTripAdvisor(q, location)
    ]);
    
    // Combine and deduplicate results
    const allActivities: CompetitorActivity[] = [];
    
    if (getyourguideResults.status === 'fulfilled') {
      allActivities.push(...getyourguideResults.value);
    }
    if (viatorResults.status === 'fulfilled') {
      allActivities.push(...viatorResults.value);
    }
    if (tripadvisorResults.status === 'fulfilled') {
      allActivities.push(...tripadvisorResults.value);
    }
    
    // Filter and sort results
    const filteredActivities = allActivities
      .filter(activity => {
        if (maxPrice && activity.price > maxPrice) return false;
        if (activity.rating < minRating) return false;
        if (category && !activity.category.toLowerCase().includes(category.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 20); // Top 20 results
    
    // Generate market analysis
    const analysis = generateMarketAnalysis(filteredActivities);
    
    const marketIntelligence: MarketIntelligence = {
      query: q,
      totalResults: filteredActivities.length,
      activities: filteredActivities,
      analysis,
      marketInsights: {
        averagePrice: calculateAveragePrice(filteredActivities),
        priceRange: calculatePriceRange(filteredActivities),
        topCompetitors: getTopCompetitors(filteredActivities),
        marketGaps: identifyMarketGaps(filteredActivities, q)
      }
    };
    
    console.log(`[Market Intelligence] Found ${filteredActivities.length} activities for "${q}"`);
    
    res.json(marketIntelligence);
    
  } catch (error: any) {
    console.error('[Market Intelligence] Error:', error.message);
    res.status(500).json({ 
      error: 'Market intelligence search failed',
      details: error.message 
    });
  }
});

/**
 * Get Competitive Pricing Strategy
 * GET /api/market/pricing-strategy?activity=desert+tour&ourPrice=500
 */
router.get('/pricing-strategy', async (req: Request, res: Response) => {
  try {
    const { activity, ourPrice } = req.query;
    
    if (!activity || !ourPrice) {
      return res.status(400).json({ error: 'Activity and ourPrice are required' });
    }
    
    // Search for similar activities
    const marketData = await searchMarketIntelligence(activity as string);
    
    // Calculate competitive pricing strategy
    const strategy = calculatePricingStrategy(
      Number(ourPrice), 
      marketData.activities
    );
    
    res.json({
      activity,
      ourPrice: Number(ourPrice),
      strategy,
      marketData: {
        averageCompetitorPrice: marketData.marketInsights.averagePrice,
        priceRange: marketData.marketInsights.priceRange,
        recommendedPrice: strategy.recommendedPrice,
        competitiveAdvantage: strategy.advantage
      }
    });
    
  } catch (error: any) {
    console.error('[Pricing Strategy] Error:', error.message);
    res.status(500).json({ error: 'Pricing strategy calculation failed' });
  }
});

/**
 * Add Activity from Market Intelligence
 * POST /api/market/add-activity
 */
router.post('/add-activity', async (req: Request, res: Response) => {
  try {
    const { 
      competitorActivity, 
      ourPrice, 
      ourDescription,
      ourDuration,
      ourLocation 
    } = req.body;
    
    // Create new activity based on competitor data
    const newActivity = {
      name: competitorActivity.title,
      description: ourDescription || competitorActivity.title,
      price: ourPrice.toString(),
      currency: 'MAD',
      category: competitorActivity.category,
      duration: ourDuration || competitorActivity.duration,
      location: ourLocation || competitorActivity.location,
      imageUrls: [competitorActivity.image],
      getyourguidePrice: competitorActivity.price,
      isActive: true,
      approvalStatus: 'approved',
      // Market intelligence data
      competitorData: {
        source: competitorActivity.source,
        originalPrice: competitorActivity.price,
        originalLink: competitorActivity.link,
        competitiveAdvantage: ourPrice < competitorActivity.price ? 
          competitorActivity.price - ourPrice : 0
      }
    };
    
    // Save to database (you'll need to implement this)
    // const savedActivity = await storage.createActivity(newActivity);
    
    console.log(`[Market Intelligence] Added activity: ${newActivity.name} at ${ourPrice} MAD (vs ${competitorActivity.price} MAD competitor)`);
    
    res.json({
      success: true,
      activity: newActivity,
      competitiveAdvantage: ourPrice < competitorActivity.price ? 
        competitorActivity.price - ourPrice : 0,
      message: `Activity added with ${ourPrice < competitorActivity.price ? 'competitive' : 'premium'} pricing`
    });
    
  } catch (error: any) {
    console.error('[Add Activity] Error:', error.message);
    res.status(500).json({ error: 'Failed to add activity from market intelligence' });
  }
});

// Helper Functions

async function searchGetYourGuide(query: string, location: string): Promise<CompetitorActivity[]> {
  try {
    const response = await axios.get(`https://www.getyourguide.com/s/${location}`, {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    // Parse GetYourGuide results (simplified)
    const activities: CompetitorActivity[] = [];
    // Implementation would parse the HTML response
    // This is a simplified version
    
    return activities;
  } catch (error) {
    console.error('[GetYourGuide Search] Error:', error);
    return [];
  }
}

async function searchViator(query: string, location: string): Promise<CompetitorActivity[]> {
  try {
    // Similar implementation for Viator
    return [];
  } catch (error) {
    console.error('[Viator Search] Error:', error);
    return [];
  }
}

async function searchTripAdvisor(query: string, location: string): Promise<CompetitorActivity[]> {
  try {
    // Similar implementation for TripAdvisor
    return [];
  } catch (error) {
    console.error('[TripAdvisor Search] Error:', error);
    return [];
  }
}

function generateMarketAnalysis(activities: CompetitorActivity[]): MarketAnalysis[] {
  return activities.map(activity => {
    const averagePrice = calculateAveragePrice(activities);
    const priceDifference = activity.price - averagePrice;
    
    let competitiveAdvantage: 'strong' | 'moderate' | 'weak';
    if (priceDifference < -50) competitiveAdvantage = 'strong';
    else if (priceDifference < 0) competitiveAdvantage = 'moderate';
    else competitiveAdvantage = 'weak';
    
    const marketPosition: 'leader' | 'competitive' | 'follower' = 
      activity.price < averagePrice ? 'leader' : 
      activity.price <= averagePrice * 1.2 ? 'competitive' : 'follower';
    
    const recommendedPrice = Math.max(activity.price * 0.8, activity.price - 100);
    const profitMargin = recommendedPrice * 0.3; // 30% profit margin
    
    return {
      activity,
      priceDifference,
      competitiveAdvantage,
      marketPosition,
      recommendedPrice,
      profitMargin
    };
  });
}

function calculateAveragePrice(activities: CompetitorActivity[]): number {
  if (activities.length === 0) return 0;
  const total = activities.reduce((sum, activity) => sum + activity.price, 0);
  return total / activities.length;
}

function calculatePriceRange(activities: CompetitorActivity[]): { min: number; max: number } {
  if (activities.length === 0) return { min: 0, max: 0 };
  const prices = activities.map(a => a.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

function getTopCompetitors(activities: CompetitorActivity[]): string[] {
  const sources = activities.map(a => a.source);
  const sourceCounts = sources.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(sourceCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([source]) => source);
}

function identifyMarketGaps(activities: CompetitorActivity[], query: string): string[] {
  // Analyze for market gaps
  const gaps = [];
  
  if (activities.length < 5) {
    gaps.push(`Low competition for "${query}" - opportunity for market entry`);
  }
  
  const averagePrice = calculateAveragePrice(activities);
  if (averagePrice > 1000) {
    gaps.push(`High-end market opportunity - consider budget options`);
  }
  
  return gaps;
}

async function searchMarketIntelligence(query: string): Promise<MarketIntelligence> {
  // This would call the search endpoint internally
  // Simplified for now
  return {
    query,
    totalResults: 0,
    activities: [],
    analysis: [],
    marketInsights: {
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      topCompetitors: [],
      marketGaps: []
    }
  };
}

function calculatePricingStrategy(ourPrice: number, competitors: CompetitorActivity[]) {
  const averageCompetitorPrice = calculateAveragePrice(competitors);
  const priceDifference = ourPrice - averageCompetitorPrice;
  const percentageDifference = (priceDifference / averageCompetitorPrice) * 100;
  
  let advantage: 'strong' | 'moderate' | 'weak';
  if (percentageDifference < -20) advantage = 'strong';
  else if (percentageDifference < 0) advantage = 'moderate';
  else advantage = 'weak';
  
  const recommendedPrice = Math.max(
    averageCompetitorPrice * 0.8, // 20% below average
    ourPrice
  );
  
  return {
    ourPrice,
    averageCompetitorPrice,
    priceDifference,
    percentageDifference,
    advantage,
    recommendedPrice,
    profitMargin: recommendedPrice * 0.3
  };
}

export default router;
