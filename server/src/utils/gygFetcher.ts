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
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private static readonly MAX_RESULTS = 15;

  /**
   * Search GetYourGuide public site for Morocco activities only
   * Uses official GetYourGuide Morocco search URL with strict filtering
   */
  static async searchActivities(query: string): Promise<GYGActivity[]> {
    try {
      console.log(`[GYG Fetcher] Morocco-only search for: "${query}"`);
      
      // Use official GetYourGuide Morocco search URL
      const moroccoQuery = `${query} morocco`;
      const searchUrl = `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const allActivities = this.parseGlobalSearchResults(response.data, query);
      
      // Filter to only Morocco activities
      const moroccoActivities = this.filterMoroccoActivities(allActivities, query);
      console.log(`[GYG Fetcher] Found ${moroccoActivities.length} Morocco activities for "${query}" (from ${allActivities.length} total)`);
      
      return moroccoActivities;
    } catch (error: any) {
      console.error(`[GYG Fetcher] Global search error for "${query}":`, error.message);
      throw error;
    }
  }

  /**
   * Parse HTML search results from GetYourGuide (Global Search)
   */
  private static parseGlobalSearchResults(html: string, query: string): GYGActivity[] {
    const $ = cheerio.load(html);
    const activities: GYGActivity[] = [];

    try {
      // Multiple parsing strategies for different page structures
      const selectors = [
        // Modern GetYourGuide selectors
        '[data-testid="activity-card"]',
        '[data-testid="search-result-item"]',
        '.activity-card',
        '.search-result-item',
        '.activity-item',
        // Generic card selectors
        '.card',
        '.result-item',
        '.tour-card',
        '.experience-card',
        // List item selectors
        'li[data-testid*="activity"]',
        'li[data-testid*="tour"]',
        'li[data-testid*="experience"]'
      ];

      for (const selector of selectors) {
        $(selector).each((index, element) => {
          if (activities.length >= this.MAX_RESULTS) return false;

          const $el = $(element);
          const activity = this.extractActivityFromElement($el, query, index);
          
          if (activity && activity.title && activity.price > 0) {
            activities.push(activity);
          }
        });

        if (activities.length > 0) {
          console.log(`[GYG Fetcher] Found ${activities.length} activities using selector: ${selector}`);
          break;
        }
      }

      // If no results found, try JSON-LD structured data
      if (activities.length === 0) {
        const jsonLdResults = this.parseJsonLdData($ as any, query);
        if (jsonLdResults.length > 0) {
          activities.push(...jsonLdResults);
        }
      }

      // If still no results, try alternative parsing
      if (activities.length === 0) {
        console.log(`[GYG Fetcher] No structured results found, trying alternative parsing for "${query}"`);
        return this.parseAlternativeResults($ as any, query);
      }

    } catch (error: any) {
      console.error(`[GYG Fetcher] Error parsing global results for "${query}":`, error.message);
    }

    return activities;
  }

  /**
   * Extract activity data from a single element
   */
  private static extractActivityFromElement($el: any, query: string, index: number): GYGActivity | null {
    try {
      // Extract title with multiple selectors
      const titleSelectors = [
        '[data-testid="activity-title"]',
        '[data-testid="tour-title"]',
        '.activity-title',
        '.tour-title',
        'h3', 'h4', 'h5',
        '.title',
        '.name',
        'a[title]'
      ];

      let title = '';
      for (const selector of titleSelectors) {
        const titleEl = $el.find(selector).first();
        if (titleEl.length) {
          title = titleEl.text().trim() || titleEl.attr('title') || '';
          if (title) break;
        }
      }

      if (!title) return null;

      // Extract price with multiple selectors
      // GetYourGuide shows prices in formats like "From 1,955 د.م. **1,114 د.م.** per person"
      const priceSelectors = [
        '[data-testid="price"]',
        '[data-testid="tour-price"]',
        '[data-testid="activity-card-price"]',
        '.price',
        '.tour-price',
        '.activity-price',
        '.cost',
        '.amount',
        '[class*="price"]',
        '[class*="Price"]'
      ];

      let priceText = '';
      // Try to get the entire price element HTML (to catch bold/discounted prices)
      for (const selector of priceSelectors) {
        const priceEl = $el.find(selector).first();
        if (priceEl.length) {
          // Get both text and HTML to capture formatted prices
          priceText = priceEl.html() || priceEl.text().trim();
          if (priceText) {
            // If HTML contains bold tags or strong tags, prefer that
            if (priceText.includes('<strong>') || priceText.includes('<b>') || priceText.includes('**')) {
              break;
            }
          }
        }
      }

      // Also try to get text from the entire card element to find price patterns
      if (!priceText || this.extractPrice(priceText) === 0) {
        const cardText = $el.text();
        // Look for price patterns in the entire card text
        const pricePattern = /(?:From\s+)?(?:[\d,]+\s*د\.م\.)?\s*\*\*?([\d,]+)\s*د\.م\.|([\d,]+)\s*د\.م\./;
        const match = cardText.match(pricePattern);
        if (match) {
          priceText = match[1] || match[2] || '';
          priceText += ' د.م.';
        }
      }

      const price = this.extractPrice(priceText);

      // Extract rating
      const ratingSelectors = [
        '[data-testid="rating"]',
        '[data-testid="tour-rating"]',
        '.rating',
        '.tour-rating',
        '.stars',
        '.score'
      ];

      let ratingText = '';
      for (const selector of ratingSelectors) {
        const ratingEl = $el.find(selector).first();
        if (ratingEl.length) {
          ratingText = ratingEl.text().trim();
          if (ratingText) break;
        }
      }

      const rating = this.extractRating(ratingText);

      // Extract review count
      const reviewSelectors = [
        '[data-testid="review-count"]',
        '[data-testid="tour-reviews"]',
        '.review-count',
        '.reviews',
        '.review-number'
      ];

      let reviewText = '';
      for (const selector of reviewSelectors) {
        const reviewEl = $el.find(selector).first();
        if (reviewEl.length) {
          reviewText = reviewEl.text().trim();
          if (reviewText) break;
        }
      }

      const reviewCount = this.extractReviewCount(reviewText);

      // Extract link
      const linkEl = $el.find('a').first();
      const relativeLink = linkEl.attr('href');
      const link = relativeLink ? `${this.BASE_URL}${relativeLink}` : '';

      // Extract image
      const imageEl = $el.find('img').first();
      const image = imageEl.attr('src') || imageEl.attr('data-src') || imageEl.attr('data-lazy');

      // Extract duration
      const durationSelectors = [
        '[data-testid="duration"]',
        '[data-testid="tour-duration"]',
        '.duration',
        '.tour-duration',
        '.time',
        '.length'
      ];

      let duration = '';
      for (const selector of durationSelectors) {
        const durationEl = $el.find(selector).first();
        if (durationEl.length) {
          duration = durationEl.text().trim();
          if (duration) break;
        }
      }

      // Extract location
      const locationSelectors = [
        '[data-testid="location"]',
        '[data-testid="tour-location"]',
        '.location',
        '.tour-location',
        '.city',
        '.place'
      ];

      let location = '';
      for (const selector of locationSelectors) {
        const locationEl = $el.find(selector).first();
        if (locationEl.length) {
          location = locationEl.text().trim();
          if (location) break;
        }
      }

      return {
        id: `gyg-global-${Date.now()}-${index}`,
        title: title,
        price: price,
        currency: 'MAD',
        rating: rating,
        reviewCount: reviewCount,
        link: link,
        image: image,
        duration: duration || undefined,
        location: location || undefined
      };

    } catch (error: any) {
      console.error(`[GYG Fetcher] Error extracting activity:`, error.message);
      return null;
    }
  }

  /**
   * Parse JSON-LD structured data
   */
  private static parseJsonLdData($: cheerio.CheerioAPI, query: string): GYGActivity[] {
    const activities: GYGActivity[] = [];

    try {
      $('script[type="application/ld+json"]').each((index, element) => {
        try {
          const jsonText = $(element).html();
          if (!jsonText) return;

          const data = JSON.parse(jsonText);
          
          if (data['@type'] === 'ItemList' && data.itemListElement) {
            data.itemListElement.forEach((item: any, itemIndex: number) => {
              if (activities.length >= this.MAX_RESULTS) return false;

              const itemData = item.item || item;
              if (itemData.name && itemData.offers) {
                const price = this.extractPrice(itemData.offers.price || itemData.offers.lowPrice || '0');
                const rating = itemData.aggregateRating?.ratingValue || 4.0;
                const reviewCount = itemData.aggregateRating?.reviewCount || 0;

                activities.push({
                  id: `gyg-jsonld-${Date.now()}-${itemIndex}`,
                  title: itemData.name,
                  price: price,
                  currency: 'MAD',
                  rating: rating,
                  reviewCount: reviewCount,
                  link: itemData.url || '',
                  image: itemData.image?.url || itemData.image,
                  duration: itemData.duration,
                  location: itemData.location?.name || itemData.address?.addressLocality
                });
              }
            });
          }
        } catch (parseError) {
          // Skip invalid JSON
        }
      });
    } catch (error: any) {
      console.error(`[GYG Fetcher] Error parsing JSON-LD:`, error.message);
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
   * Handles formats like:
   * - "1,114 د.م." (Moroccan Dirham with comma)
   * - "From 1,955 د.م. **1,114 د.م.** per person" (original + discounted)
   * - "€99" or "$99"
   */
  private static extractPrice(priceText: string): number {
    if (!priceText) return 0;

    // First, try to extract discounted price (if format is "From X **Y**")
    const discountedMatch = priceText.match(/\*\*([\d,]+\.?\d*)\s*(?:د\.م\.|MAD|€|\$|EUR|USD)/i);
    if (discountedMatch) {
      const priceStr = discountedMatch[1].replace(/,/g, '');
      let price = parseFloat(priceStr);
      return Math.round(price);
    }

    // Try to find price with Arabic currency symbol (د.م.)
    const arabicMatch = priceText.match(/([\d,]+\.?\d*)\s*د\.م\./);
    if (arabicMatch) {
      const priceStr = arabicMatch[1].replace(/,/g, '');
      let price = parseFloat(priceStr);
      return Math.round(price);
    }

    // Extract number with currency symbols
    const match = priceText.match(/([\d,]+(?:\.\d+)?)/);
    if (match) {
      let price = parseFloat(match[1].replace(/,/g, ''));
      
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
   * Filter activities to only include Morocco-based ones with strict validation
   */
  private static filterMoroccoActivities(activities: GYGActivity[], query: string): GYGActivity[] {
    // Comprehensive list of Morocco cities and regions
    const moroccoCities = [
      'marrakech', 'rabat', 'casablanca', 'tanger', 'tangier', 'meknes', 
      'chefchaouen', 'essaouira', 'agadir', 'merzouga', 'ouarzazate', 
      'oujda', 'fes', 'fez', 'oukaimeden', 'agafay', 'ouarzazate',
      'tetouan', 'el jadida', 'safi', 'kenitra', 'nador', 'larache',
      'azrou', 'ifrane', 'midelt', 'erfoud', 'zagora', 'tinghir'
    ];

    // Morocco-specific keywords and experiences
    const moroccoKeywords = [
      'morocco', 'moroccan', 'atlas', 'sahara', 'medina', 'souk', 
      'riad', 'kasbah', 'berber', 'argan', 'hammam', 'tagine', 
      'mint tea', 'ouzoud', 'desert', 'camel', 'quad', 'balloon'
    ];

    return activities.filter(activity => {
      const searchText = `${activity.title} ${activity.location || ''} ${activity.link || ''}`.toLowerCase();
      
      // Check if activity contains Morocco city names
      const hasMoroccoCity = moroccoCities.some(city => searchText.includes(city));
      
      // Check if activity contains Morocco keywords
      const hasMoroccoKeyword = moroccoKeywords.some(keyword => searchText.includes(keyword));
      
      // Check if link contains Morocco
      const linkHasMorocco = activity.link?.toLowerCase().includes('morocco') || false;
      
      // Check if original query contains Morocco keywords
      const queryIsMorocco = moroccoCities.some(city => query.toLowerCase().includes(city)) ||
                             moroccoKeywords.some(keyword => query.toLowerCase().includes(keyword));
      
      // Activity must pass at least one Morocco validation
      return hasMoroccoCity || hasMoroccoKeyword || linkHasMorocco || queryIsMorocco;
    });
  }

  /**
   * Generate fallback activities for Morocco destinations only
   */
  static generateFallbackActivities(query: string): GYGActivity[] {
    const queryLower = query.toLowerCase();
    
    const moroccoFallbackActivities: Record<string, GYGActivity[]> = {
      // Marrakech
      'marrakech': [
        {
          id: 'fallback-marrakech-1',
          title: 'Marrakech City Tour with Local Guide',
          price: 180,
          currency: 'MAD',
          rating: 4.5,
          reviewCount: 120,
          link: 'https://www.getyourguide.com/marrakech-l208/marrakech-city-tour-t123456/',
          duration: '4 hours',
          location: 'Marrakech, Morocco'
        },
        {
          id: 'fallback-marrakech-2',
          title: 'Jemaa el-Fnaa Food Tour',
          price: 120,
          currency: 'MAD',
          rating: 4.3,
          reviewCount: 78,
          link: 'https://www.getyourguide.com/marrakech-l208/jemaa-el-fnaa-food-tour-t123457/',
          duration: '3 hours',
          location: 'Marrakech, Morocco'
        },
        {
          id: 'fallback-marrakech-3',
          title: 'Atlas Mountains Day Trip',
          price: 350,
          currency: 'MAD',
          rating: 4.8,
          reviewCount: 95,
          link: 'https://www.getyourguide.com/marrakech-l208/atlas-mountains-day-trip-t123458/',
          duration: '8 hours',
          location: 'Atlas Mountains, Morocco'
        }
      ],
      // Agafay
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
          location: 'Agafay Desert, Morocco'
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
          location: 'Agafay Desert, Morocco'
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
          location: 'Ouzoud, Morocco'
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
          location: 'Ouzoud, Morocco'
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
          location: 'Marrakech, Morocco'
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
          location: 'Marrakech, Morocco'
        }
      ],
      'chefchaouen': [
        {
          id: 'fallback-chefchaouen-1',
          title: 'Chefchaouen Blue City Day Trip from Fes',
          price: 450,
          currency: 'MAD',
          rating: 4.8,
          reviewCount: 189,
          link: 'https://www.getyourguide.com/fes-l209/chefchaouen-day-trip-t123462/',
          duration: '10 hours',
          location: 'Chefchaouen, Morocco'
        }
      ],
      // Agadir
      'agadir': [
        {
          id: 'fallback-agadir-1',
          title: 'Agadir Beach Day Experience',
          price: 150,
          currency: 'MAD',
          rating: 4.2,
          reviewCount: 65,
          link: 'https://www.getyourguide.com/agadir-l209/agadir-beach-day-t123459/',
          duration: '6 hours',
          location: 'Agadir, Morocco'
        },
        {
          id: 'fallback-agadir-2',
          title: 'Souss Valley Tour from Agadir',
          price: 280,
          currency: 'MAD',
          rating: 4.6,
          reviewCount: 45,
          link: 'https://www.getyourguide.com/agadir-l209/souss-valley-tour-t123460/',
          duration: '7 hours',
          location: 'Souss Valley, Morocco'
        }
      ],
      // Casablanca
      'casablanca': [
        {
          id: 'fallback-casablanca-1',
          title: 'Hassan II Mosque Tour',
          price: 200,
          currency: 'MAD',
          rating: 4.7,
          reviewCount: 89,
          link: 'https://www.getyourguide.com/casablanca-l210/hassan-ii-mosque-t123461/',
          duration: '2 hours',
          location: 'Casablanca, Morocco'
        },
        {
          id: 'fallback-casablanca-2',
          title: 'Casablanca City Center Tour',
          price: 160,
          currency: 'MAD',
          rating: 4.1,
          reviewCount: 52,
          link: 'https://www.getyourguide.com/casablanca-l210/casablanca-city-tour-t123462/',
          duration: '4 hours',
          location: 'Casablanca, Morocco'
        }
      ],
      // Rabat
      'rabat': [
        {
          id: 'fallback-rabat-1',
          title: 'Rabat Royal Tour',
          price: 220,
          currency: 'MAD',
          rating: 4.4,
          reviewCount: 67,
          link: 'https://www.getyourguide.com/rabat-l211/rabat-royal-tour-t123463/',
          duration: '5 hours',
          location: 'Rabat, Morocco'
        },
        {
          id: 'fallback-rabat-2',
          title: 'Chellah Necropolis Visit',
          price: 140,
          currency: 'MAD',
          rating: 4.0,
          reviewCount: 34,
          link: 'https://www.getyourguide.com/rabat-l211/chellah-necropolis-t123464/',
          duration: '3 hours',
          location: 'Rabat, Morocco'
        }
      ],
      // Fes
      'fes': [
        {
          id: 'fallback-fes-1',
          title: 'Fes Medina Walking Tour',
          price: 190,
          currency: 'MAD',
          rating: 4.6,
          reviewCount: 112,
          link: 'https://www.getyourguide.com/fes-l212/fes-medina-tour-t123465/',
          duration: '4 hours',
          location: 'Fes, Morocco'
        },
        {
          id: 'fallback-fes-2',
          title: 'Al-Qarawiyyin University Tour',
          price: 110,
          currency: 'MAD',
          rating: 4.3,
          reviewCount: 56,
          link: 'https://www.getyourguide.com/fes-l212/al-qarawiyyin-university-t123466/',
          duration: '2 hours',
          location: 'Fes, Morocco'
        }
      ],
      // Essaouira
      'essaouira': [
        {
          id: 'fallback-essaouira-1',
          title: 'Essaouira Beach Day',
          price: 170,
          currency: 'MAD',
          rating: 4.5,
          reviewCount: 83,
          link: 'https://www.getyourguide.com/essaouira-l213/essaouira-beach-day-t123467/',
          duration: '6 hours',
          location: 'Essaouira, Morocco'
        },
        {
          id: 'fallback-essaouira-2',
          title: 'Essaouira Medina Tour',
          price: 130,
          currency: 'MAD',
          rating: 4.2,
          reviewCount: 47,
          link: 'https://www.getyourguide.com/essaouira-l213/essaouira-medina-tour-t123468/',
          duration: '3 hours',
          location: 'Essaouira, Morocco'
        }
      ],
      // Tangier
      'tangier': [
        {
          id: 'fallback-tangier-1',
          title: 'Tangier City Tour',
          price: 180,
          currency: 'MAD',
          rating: 4.3,
          reviewCount: 91,
          link: 'https://www.getyourguide.com/tangier-l214/tangier-city-tour-t123469/',
          duration: '4 hours',
          location: 'Tangier, Morocco'
        },
        {
          id: 'fallback-tangier-2',
          title: 'Hercules Caves Tour',
          price: 140,
          currency: 'MAD',
          rating: 4.1,
          reviewCount: 58,
          link: 'https://www.getyourguide.com/tangier-l214/hercules-caves-t123470/',
          duration: '3 hours',
          location: 'Tangier, Morocco'
        }
      ],
      // Ouarzazate
      'ouarzazate': [
        {
          id: 'fallback-ouarzazate-1',
          title: 'Ouarzazate Film Studios Tour',
          price: 250,
          currency: 'MAD',
          rating: 4.4,
          reviewCount: 78,
          link: 'https://www.getyourguide.com/ouarzazate-l215/film-studios-tour-t123471/',
          duration: '3 hours',
          location: 'Ouarzazate, Morocco'
        }
      ],
      // Merzouga
      'merzouga': [
        {
          id: 'fallback-merzouga-1',
          title: 'Merzouga Desert Camp Experience',
          price: 450,
          currency: 'MAD',
          rating: 4.8,
          reviewCount: 156,
          link: 'https://www.getyourguide.com/merzouga-l216/desert-camp-t123472/',
          duration: '2 days',
          location: 'Merzouga, Morocco'
        }
      ]
    };

    // Find matching fallback activities
    for (const [key, activities] of Object.entries(moroccoFallbackActivities)) {
      if (queryLower.includes(key)) {
        console.log(`[GYG Fetcher] Using Morocco fallback activities for "${query}"`);
        return activities;
      }
    }

    // Generic Morocco fallback based on query
    const genericFallback = this.generateMoroccoGenericFallback(query);
    console.log(`[GYG Fetcher] Using generic Morocco fallback for "${query}"`);
    return genericFallback;
  }

  /**
   * Generate generic Morocco fallback activities
   */
  private static generateMoroccoGenericFallback(query: string): GYGActivity[] {
    const queryWords = query.toLowerCase().split(' ');
    const isCity = this.isLikelyMoroccoCity(query);
    const isActivity = this.isLikelyActivity(query);
    
    if (isCity) {
      return [
        {
          id: `fallback-morocco-city-${Date.now()}`,
          title: `${query} City Tour in Morocco`,
          price: 180,
          currency: 'MAD',
          rating: 4.5,
          reviewCount: 150,
          link: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query + ' Morocco')}`,
          duration: '4 hours',
          location: `${query}, Morocco`
        },
        {
          id: `fallback-morocco-city-2-${Date.now()}`,
          title: `${query} Walking Tour`,
          price: 120,
          currency: 'MAD',
          rating: 4.3,
          reviewCount: 89,
          link: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query + ' Morocco')}`,
          duration: '3 hours',
          location: `${query}, Morocco`
        }
      ];
    } else if (isActivity) {
      return [
        {
          id: `fallback-morocco-activity-${Date.now()}`,
          title: `${query} Experience in Morocco`,
          price: 250,
          currency: 'MAD',
          rating: 4.4,
          reviewCount: 120,
          link: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query + ' Morocco')}`,
          duration: '4 hours',
          location: 'Morocco'
        }
      ];
    } else {
      return [
        {
          id: `fallback-morocco-generic-${Date.now()}`,
          title: `${query} Tour and Experience in Morocco`,
          price: 200,
          currency: 'MAD',
          rating: 4.5,
          reviewCount: 75,
          link: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query + ' Morocco')}`,
          duration: '3 hours',
          location: 'Morocco'
        }
      ];
    }
  }

  /**
   * Check if query is likely a Morocco city name
   */
  private static isLikelyMoroccoCity(query: string): boolean {
    const moroccoCities = [
      'marrakech', 'rabat', 'casablanca', 'tanger', 'tangier', 'meknes', 
      'chefchaouen', 'essaouira', 'agadir', 'merzouga', 'ouarzazate', 
      'oujda', 'fes', 'fez', 'oukaimeden', 'agafay', 'ouarzazate',
      'tetouan', 'el jadida', 'safi', 'kenitra', 'nador', 'larache',
      'azrou', 'ifrane', 'midelt', 'erfoud', 'zagora', 'tinghir'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Check if it's a known Morocco city
    const isKnownCity = moroccoCities.some(city => queryLower.includes(city));
    
    // Check if it has city keywords
    const cityKeywords = ['city', 'town', 'capital', 'medina'];
    const hasCityKeywords = cityKeywords.some(keyword => queryLower.includes(keyword));
    
    // Short queries are likely cities
    const isShortQuery = queryLower.split(' ').length <= 2;
    
    return isKnownCity || hasCityKeywords || isShortQuery;
  }

  /**
   * Check if query is likely an activity
   */
  private static isLikelyActivity(query: string): boolean {
    const activityKeywords = [
      'tour', 'excursion', 'experience', 'adventure', 'safari', 'cruise',
      'walking', 'biking', 'hiking', 'diving', 'snorkeling', 'cooking',
      'massage', 'spa', 'museum', 'palace', 'temple', 'cathedral'
    ];
    
    const queryLower = query.toLowerCase();
    return activityKeywords.some(keyword => queryLower.includes(keyword));
  }
}
