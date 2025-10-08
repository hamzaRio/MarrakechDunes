import axios from 'axios';
import * as cheerio from 'cheerio';

export interface MoroccoActivity {
  id: string;
  title: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  link: string;
  description?: string;
  duration?: string;
  location?: string;
  source: 'getyourguide' | 'viator' | 'tripadvisor' | 'fallback';
}

export class MoroccoActivityFetcher {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private static readonly MAX_RESULTS = 10;
  private static readonly TIMEOUT = 15000;

  /**
   * Search for Morocco activities using multiple sources
   */
  static async searchActivities(query: string): Promise<MoroccoActivity[]> {
    console.log(`[Morocco Activity Fetcher] Searching for: "${query}"`);
    
    const results: MoroccoActivity[] = [];
    
    // Try multiple sources in parallel
    const searchPromises = [
      this.searchGetYourGuide(query),
      this.searchViator(query),
      this.searchTripAdvisor(query)
    ];

    try {
      const [gygResults, viatorResults, tripadvisorResults] = await Promise.allSettled(searchPromises);
      
      // Collect successful results
      if (gygResults.status === 'fulfilled') {
        results.push(...gygResults.value);
      }
      if (viatorResults.status === 'fulfilled') {
        results.push(...viatorResults.value);
      }
      if (tripadvisorResults.status === 'fulfilled') {
        results.push(...tripadvisorResults.value);
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.removeDuplicates(results);
      const sortedResults = this.sortByRelevance(uniqueResults, query);
      
      console.log(`[Morocco Activity Fetcher] Found ${sortedResults.length} activities from multiple sources`);
      return sortedResults.slice(0, this.MAX_RESULTS);
      
    } catch (error: any) {
      console.error(`[Morocco Activity Fetcher] Error:`, error.message);
      return this.getFallbackActivities(query);
    }
  }

  /**
   * Search GetYourGuide with improved error handling
   */
  private static async searchGetYourGuide(query: string): Promise<MoroccoActivity[]> {
    try {
      const moroccoQuery = `${query} morocco`;
      const searchUrl = `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.TIMEOUT
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const $ = cheerio.load(response.data);
      const activities: MoroccoActivity[] = [];

      // Parse GetYourGuide results
      $('[data-test-id="activity-card-link"]').each((_, element) => {
        try {
          const $el = $(element);
          const title = $el.find('[data-test-id="activity-card-title"]').text().trim();
          const priceText = $el.find('[data-test-id="activity-card-price"]').text().trim();
          const ratingText = $el.find('[data-test-id="activity-card-rating"]').text().trim();
          const image = $el.find('img').attr('src');
          const link = 'https://www.getyourguide.com' + $el.attr('href');
          
          if (title && priceText) {
            const price = this.parsePrice(priceText);
            const rating = this.parseRating(ratingText);
            
            activities.push({
              id: `gyg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency: 'MAD',
              rating,
              reviewCount: 0,
              image,
              link,
              source: 'getyourguide'
            });
          }
        } catch (parseError) {
          console.warn(`[GetYourGuide] Parse error:`, parseError);
        }
      });

      console.log(`[GetYourGuide] Found ${activities.length} activities`);
      return activities;
      
    } catch (error: any) {
      console.error(`[GetYourGuide] Error:`, error.message);
      return [];
    }
  }

  /**
   * Search Viator for Morocco activities
   */
  private static async searchViator(query: string): Promise<MoroccoActivity[]> {
    try {
      const moroccoQuery = `${query} morocco`;
      const searchUrl = `https://www.viator.com/en/searchResults/all?text=${encodeURIComponent(moroccoQuery)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: this.TIMEOUT
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const $ = cheerio.load(response.data);
      const activities: MoroccoActivity[] = [];

      // Parse Viator results
      $('.product-card').each((_, element) => {
        try {
          const $el = $(element);
          const title = $el.find('.product-title').text().trim();
          const priceText = $el.find('.price').text().trim();
          const ratingText = $el.find('.rating').text().trim();
          const image = $el.find('img').attr('src');
          const link = 'https://www.viator.com' + $el.find('a').attr('href');
          
          if (title && priceText) {
            const price = this.parsePrice(priceText);
            const rating = this.parseRating(ratingText);
            
            activities.push({
              id: `viator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency: 'USD',
              rating,
              reviewCount: 0,
              image,
              link,
              source: 'viator'
            });
          }
        } catch (parseError) {
          console.warn(`[Viator] Parse error:`, parseError);
        }
      });

      console.log(`[Viator] Found ${activities.length} activities`);
      return activities;
      
    } catch (error: any) {
      console.error(`[Viator] Error:`, error.message);
      return [];
    }
  }

  /**
   * Search TripAdvisor for Morocco activities
   */
  private static async searchTripAdvisor(query: string): Promise<MoroccoActivity[]> {
    try {
      const moroccoQuery = `${query} morocco`;
      const searchUrl = `https://www.tripadvisor.com/Attractions-g293734-Activities-${encodeURIComponent(moroccoQuery)}.html`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: this.TIMEOUT
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }

      const $ = cheerio.load(response.data);
      const activities: MoroccoActivity[] = [];

      // Parse TripAdvisor results
      $('.attraction_element').each((_, element) => {
        try {
          const $el = $(element);
          const title = $el.find('.listing_title a').text().trim();
          const priceText = $el.find('.price').text().trim();
          const ratingText = $el.find('.rating').text().trim();
          const image = $el.find('img').attr('src');
          const link = 'https://www.tripadvisor.com' + $el.find('.listing_title a').attr('href');
          
          if (title) {
            const price = this.parsePrice(priceText) || 0;
            const rating = this.parseRating(ratingText);
            
            activities.push({
              id: `tripadvisor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title,
              price,
              currency: 'USD',
              rating,
              reviewCount: 0,
              image,
              link,
              source: 'tripadvisor'
            });
          }
        } catch (parseError) {
          console.warn(`[TripAdvisor] Parse error:`, parseError);
        }
      });

      console.log(`[TripAdvisor] Found ${activities.length} activities`);
      return activities;
      
    } catch (error: any) {
      console.error(`[TripAdvisor] Error:`, error.message);
      return [];
    }
  }

  /**
   * Parse price from text
   */
  private static parsePrice(priceText: string): number {
    if (!priceText) return 0;
    
    const match = priceText.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  /**
   * Parse rating from text
   */
  private static parseRating(ratingText: string): number {
    if (!ratingText) return 0;
    
    const match = ratingText.match(/(\d+\.?\d*)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  }

  /**
   * Remove duplicate activities
   */
  private static removeDuplicates(activities: MoroccoActivity[]): MoroccoActivity[] {
    const seen = new Set<string>();
    return activities.filter(activity => {
      const key = activity.title.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort activities by relevance to query
   */
  private static sortByRelevance(activities: MoroccoActivity[], query: string): MoroccoActivity[] {
    const queryLower = query.toLowerCase();
    
    return activities.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, queryLower);
      const bScore = this.calculateRelevanceScore(b, queryLower);
      return bScore - aScore;
    });
  }

  /**
   * Calculate relevance score for an activity
   */
  private static calculateRelevanceScore(activity: MoroccoActivity, query: string): number {
    let score = 0;
    const title = activity.title.toLowerCase();
    const location = activity.location?.toLowerCase() || '';
    
    // Exact match in title
    if (title.includes(query)) score += 10;
    
    // Partial match in title
    const queryWords = query.split(' ');
    queryWords.forEach(word => {
      if (title.includes(word)) score += 2;
    });
    
    // Morocco-specific keywords
    const moroccoKeywords = ['morocco', 'marrakech', 'rabat', 'casablanca', 'fes', 'agadir', 'essaouira', 'chefchaouen'];
    moroccoKeywords.forEach(keyword => {
      if (title.includes(keyword) || location.includes(keyword)) score += 3;
    });
    
    // Rating bonus
    if (activity.rating && activity.rating > 4) score += 1;
    
    return score;
  }

  /**
   * Get fallback activities for Morocco
   */
  private static getFallbackActivities(query: string): MoroccoActivity[] {
    const queryLower = query.toLowerCase();
    
    const fallbackActivities: MoroccoActivity[] = [
      {
        id: 'fallback-1',
        title: 'Marrakech City Tour',
        price: 180,
        currency: 'MAD',
        rating: 4.5,
        reviewCount: 120,
        link: 'https://www.getyourguide.com/marrakech-l208/',
        description: 'Explore the vibrant city of Marrakech with a local guide',
        duration: '4 hours',
        location: 'Marrakech, Morocco',
        source: 'fallback'
      },
      {
        id: 'fallback-2',
        title: 'Agafay Desert Day Trip',
        price: 520,
        currency: 'MAD',
        rating: 4.8,
        reviewCount: 95,
        link: 'https://www.getyourguide.com/marrakech-l208/',
        description: 'Experience the Agafay Desert with camel riding and traditional lunch',
        duration: '8 hours',
        location: 'Agafay Desert, Morocco',
        source: 'fallback'
      },
      {
        id: 'fallback-3',
        title: 'Ouzoud Waterfalls Tour',
        price: 350,
        currency: 'MAD',
        rating: 4.6,
        reviewCount: 78,
        link: 'https://www.getyourguide.com/marrakech-l208/',
        description: 'Visit the beautiful Ouzoud Waterfalls with boat ride',
        duration: '10 hours',
        location: 'Ouzoud, Morocco',
        source: 'fallback'
      }
    ];

    // Filter based on query
    if (queryLower.includes('marrakech') || queryLower.includes('city')) {
      return [fallbackActivities[0]];
    }
    if (queryLower.includes('agafay') || queryLower.includes('desert')) {
      return [fallbackActivities[1]];
    }
    if (queryLower.includes('ouzoud') || queryLower.includes('waterfall')) {
      return [fallbackActivities[2]];
    }

    return fallbackActivities;
  }
}
