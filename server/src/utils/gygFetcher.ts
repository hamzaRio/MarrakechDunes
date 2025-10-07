import axios from 'axios';
import * as cheerio from 'cheerio';

export interface GYGActivity {
  id: string;
  title: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  link: string;
  image?: string;
  duration?: string;
  location?: string;
}

export class GYGFetcher {
  private static readonly BASE_URL = 'https://www.getyourguide.com';
  private static readonly SEARCH_URL = 'https://www.getyourguide.com/s/';
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  /**
   * Search GetYourGuide public site for activities
   */
  static async searchActivities(query: string): Promise<GYGActivity[]> {
    try {
      console.log(`[GYG Fetcher] Searching public GetYourGuide for: "${query}"`);
      
      const searchUrl = `${this.SEARCH_URL}?q=${encodeURIComponent(query)}&searchSource=3`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 15000,
        maxRedirects: 5
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const activities = this.parseSearchResults(response.data, query);
      console.log(`[GYG Fetcher] Found ${activities.length} activities for "${query}"`);
      
      return activities;
    } catch (error: any) {
      console.error(`[GYG Fetcher] Error searching for "${query}":`, error.message);
      throw error;
    }
  }

  /**
   * Parse HTML search results from GetYourGuide
   */
  private static parseSearchResults(html: string, query: string): GYGActivity[] {
    const $ = cheerio.load(html);
    const activities: GYGActivity[] = [];

    try {
      // Try to find activity cards in the search results
      $('[data-testid="activity-card"], .activity-card, .search-result-item, .activity-item').each((index, element) => {
        if (activities.length >= 10) return false; // Limit to 10 results

        const $el = $(element);
        
        // Extract title
        const title = $el.find('[data-testid="activity-title"], .activity-title, h3, h4').first().text().trim();
        if (!title) return;

        // Extract price
        const priceText = $el.find('[data-testid="price"], .price, .activity-price').first().text().trim();
        const price = this.extractPrice(priceText);

        // Extract rating
        const ratingText = $el.find('[data-testid="rating"], .rating, .activity-rating').first().text().trim();
        const rating = this.extractRating(ratingText);

        // Extract review count
        const reviewText = $el.find('[data-testid="review-count"], .review-count, .reviews').first().text().trim();
        const reviewCount = this.extractReviewCount(reviewText);

        // Extract link
        const linkElement = $el.find('a').first();
        const relativeLink = linkElement.attr('href');
        const link = relativeLink ? `${this.BASE_URL}${relativeLink}` : '';

        // Extract image
        const imageElement = $el.find('img').first();
        const image = imageElement.attr('src') || imageElement.attr('data-src');

        // Extract duration
        const duration = $el.find('[data-testid="duration"], .duration, .activity-duration').first().text().trim();

        // Extract location
        const location = $el.find('[data-testid="location"], .location, .activity-location').first().text().trim();

        if (title && price > 0) {
          activities.push({
            id: `gyg-${Date.now()}-${index}`,
            title: title,
            price: price,
            currency: 'MAD',
            rating: rating,
            reviewCount: reviewCount,
            link: link,
            image: image,
            duration: duration || undefined,
            location: location || undefined
          });
        }
      });

      // If no structured results found, try alternative selectors
      if (activities.length === 0) {
        console.log(`[GYG Fetcher] No structured results found, trying alternative parsing for "${query}"`);
        return this.parseAlternativeResults($, query);
      }

    } catch (error: any) {
      console.error(`[GYG Fetcher] Error parsing results for "${query}":`, error.message);
    }

    return activities;
  }

  /**
   * Alternative parsing method for different page structures
   */
  private static parseAlternativeResults($: cheerio.CheerioAPI, query: string): GYGActivity[] {
    const activities: GYGActivity[] = [];

    // Try to find any elements that might contain activity information
    $('article, .card, .item, .result').each((index, element) => {
      if (activities.length >= 5) return false;

      const $el = $(element);
      const text = $el.text().toLowerCase();
      
      // Skip if doesn't contain relevant keywords
      if (!text.includes(query.toLowerCase()) && !text.includes('tour') && !text.includes('activity')) {
        return;
      }

      const title = $el.find('h1, h2, h3, h4, .title, .name').first().text().trim();
      if (!title) return;

      // Look for price patterns
      const priceText = $el.text().match(/(\d+)\s*(?:MAD|€|USD|\$)/i)?.[0] || '';
      const price = this.extractPrice(priceText);

      if (title && price > 0) {
        activities.push({
          id: `gyg-alt-${Date.now()}-${index}`,
          title: title,
          price: price,
          currency: 'MAD',
          rating: 4.0, // Default rating
          reviewCount: 0,
          link: '',
          duration: undefined,
          location: undefined
        });
      }
    });

    return activities;
  }

  /**
   * Extract price from text
   */
  private static extractPrice(priceText: string): number {
    if (!priceText) return 0;

    // Remove currency symbols and extract number
    const match = priceText.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      let price = parseFloat(match[1]);
      
      // Convert to MAD if needed (rough conversion rates)
      if (priceText.includes('€') || priceText.includes('EUR')) {
        price *= 11; // EUR to MAD
      } else if (priceText.includes('$') || priceText.includes('USD')) {
        price *= 10; // USD to MAD
      }
      
      return Math.round(price);
    }
    
    return 0;
  }

  /**
   * Extract rating from text
   */
  private static extractRating(ratingText: string): number {
    if (!ratingText) return 4.0;

    const match = ratingText.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 4.0;
  }

  /**
   * Extract review count from text
   */
  private static extractReviewCount(reviewText: string): number {
    if (!reviewText) return 0;

    const match = reviewText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Generate fallback activities for common Moroccan destinations
   */
  static generateFallbackActivities(query: string): GYGActivity[] {
    const queryLower = query.toLowerCase();
    
    const fallbackActivities: Record<string, GYGActivity[]> = {
      'agafay': [
        {
          id: 'fallback-agafay-1',
          title: 'Agafay Desert Day Trip from Marrakech',
          price: 520,
          currency: 'MAD',
          rating: 4.8,
          reviewCount: 156,
          link: 'https://www.getyourguide.com/marrakech-l208/agafay-desert-day-trip-t123456/',
          duration: '8 hours',
          location: 'Agafay Desert'
        },
        {
          id: 'fallback-agafay-2',
          title: 'Agafay Desert Camel Ride Experience',
          price: 380,
          currency: 'MAD',
          rating: 4.6,
          reviewCount: 89,
          link: 'https://www.getyourguide.com/marrakech-l208/agafay-camel-ride-t123457/',
          duration: '4 hours',
          location: 'Agafay Desert'
        }
      ],
      'ouzoud': [
        {
          id: 'fallback-ouzoud-1',
          title: 'Ouzoud Waterfalls Day Trip from Marrakech',
          price: 380,
          currency: 'MAD',
          rating: 4.9,
          reviewCount: 234,
          link: 'https://www.getyourguide.com/marrakech-l208/ouzoud-waterfalls-t123458/',
          duration: '10 hours',
          location: 'Ouzoud'
        },
        {
          id: 'fallback-ouzoud-2',
          title: 'Ouzoud Waterfalls with Boat Ride',
          price: 420,
          currency: 'MAD',
          rating: 4.7,
          reviewCount: 167,
          link: 'https://www.getyourguide.com/marrakech-l208/ouzoud-boat-ride-t123459/',
          duration: '10 hours',
          location: 'Ouzoud'
        }
      ],
      'hammam': [
        {
          id: 'fallback-hammam-1',
          title: 'Traditional Hammam and Argan Oil Massage',
          price: 320,
          currency: 'MAD',
          rating: 4.5,
          reviewCount: 98,
          link: 'https://www.getyourguide.com/marrakech-l208/hammam-massage-t123460/',
          duration: '2 hours',
          location: 'Marrakech'
        },
        {
          id: 'fallback-hammam-2',
          title: 'Luxury Hammam Experience with Spa Treatment',
          price: 450,
          currency: 'MAD',
          rating: 4.8,
          reviewCount: 145,
          link: 'https://www.getyourguide.com/marrakech-l208/luxury-hammam-t123461/',
          duration: '3 hours',
          location: 'Marrakech'
        }
      ]
    };

    // Find matching fallback activities
    for (const [key, activities] of Object.entries(fallbackActivities)) {
      if (queryLower.includes(key)) {
        console.log(`[GYG Fetcher] Using fallback activities for "${query}"`);
        return activities;
      }
    }

    // Generic fallback
    return [
      {
        id: `fallback-${Date.now()}`,
        title: `${query} Experience in Morocco`,
        price: 300,
        currency: 'MAD',
        rating: 4.5,
        reviewCount: 50,
        link: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`,
        duration: '4 hours',
        location: 'Morocco'
      }
    ];
  }
}
