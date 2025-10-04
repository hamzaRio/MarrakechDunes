import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// In-memory cache for GetYourGuide API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Set UTF-8 encoding for all responses
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

/**
 * Calculate suggested price based on GetYourGuide price and competitive pricing rules
 */
function calculateSuggestedPrice(gygPrice: number, currency: string): number {
  // Get configuration from environment variables
  const undercutPercent = parseFloat(process.env.GYG_UNDERCUT_PERCENT || '0.1'); // Default 10%
  const marginFixed = parseFloat(process.env.GYG_MARGIN_FIXED || '0'); // Default 0
  const minPrice = parseFloat(process.env.GYG_MIN_PRICE || '15'); // Default 15 EUR
  
  // Calculate undercut price (percentage cheaper than GYG)
  const undercut = gygPrice * (1 - undercutPercent);
  
  // Apply fixed margin adjustment
  const marginAdjusted = undercut + marginFixed;
  
  // Ensure minimum price is respected
  const suggestedPrice = Math.max(marginAdjusted, minPrice);
  
  // Round to 2 decimal places
  return Math.round(suggestedPrice * 100) / 100;
}

/**
 * Get mock GetYourGuide activities based on search query
 */
function getMockGetYourGuideActivities(query: string): Array<{
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
}> {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Mock database of GetYourGuide activities
  const allActivities = [
    {
      id: "gyg-1",
      title: "Hot Air Balloon Ride in Marrakech",
      price: 450,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/hot-air-balloon-ride-marrakech-t123456"
    },
    {
      id: "gyg-2", 
      title: "Atlas Mountains Day Trip",
      price: 380,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/atlas-mountains-day-trip-t234567"
    },
    {
      id: "gyg-3",
      title: "Ouzoud Waterfalls Day Trip",
      price: 320,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/ouzoud-waterfalls-day-trip-t345678"
    },
    {
      id: "gyg-4",
      title: "Essaouira Day Trip",
      price: 280,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/essaouira-day-trip-t456789"
    },
    {
      id: "gyg-5",
      title: "Agafay Desert Experience",
      price: 520,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/agafay-desert-experience-t567890"
    },
    {
      id: "gyg-6",
      title: "Ourika Valley Day Trip",
      price: 350,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/ourika-valley-day-trip-t678901"
    },
    {
      id: "gyg-7",
      title: "Montgolfière (Hot Air Balloon)",
      price: 480,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/montgolfiere-hot-air-balloon-t789012"
    },
    {
      id: "gyg-8",
      title: "Bahia Palace Tour",
      price: 120,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/bahia-palace-tour-t890123"
    },
    {
      id: "gyg-9",
      title: "Majorelle Garden Entry Tickets",
      price: 299,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/majorelle-garden-entry-tickets-t901234"
    },
    {
      id: "gyg-10",
      title: "Toubkal Mountain Trek",
      price: 650,
      currency: "MAD",
      url: "https://www.getyourguide.com/marrakech-l208/toubkal-mountain-trek-t012345"
    },
    {
      id: "gyg-11",
      title: "Agadir City Tour",
      price: 180,
      currency: "MAD",
      url: "https://www.getyourguide.com/agadir-l208/agadir-city-tour-t123456"
    },
    {
      id: "gyg-12",
      title: "Taghazout Surf Lesson",
      price: 250,
      currency: "MAD",
      url: "https://www.getyourguide.com/taghazout-l208/taghazout-surf-lesson-t234567"
    },
        {
          id: "gyg-13",
          title: "Tangier Day Trip from Marrakech",
          price: 420,
          currency: "MAD",
          url: "https://www.getyourguide.com/marrakech-l208/tangier-day-trip-t345678"
        },
        {
          id: "gyg-14",
          title: "Rabat City Tour",
          price: 200,
          currency: "MAD",
          url: "https://www.getyourguide.com/rabat-l208/rabat-city-tour-t456789"
        },
        {
          id: "gyg-15",
          title: "Chefchaouen Blue City Tour",
          price: 350,
          currency: "MAD",
          url: "https://www.getyourguide.com/chefchaouen-l208/chefchaouen-blue-city-tour-t567890"
        },
        {
          id: "gyg-16",
          title: "Casablanca City Experience",
          price: 180,
          currency: "MAD",
          url: "https://www.getyourguide.com/casablanca-l208/casablanca-city-experience-t678901"
        },
        {
          id: "gyg-17",
          title: "Fes Medina Walking Tour",
          price: 150,
          currency: "MAD",
          url: "https://www.getyourguide.com/fes-l208/fes-medina-walking-tour-t789012"
        },
        {
          id: "gyg-18",
          title: "Surf Lesson in Taghazout",
          price: 280,
          currency: "MAD",
          url: "https://www.getyourguide.com/taghazout-l208/surf-lesson-taghazout-t890123"
        },
        {
          id: "gyg-19",
          title: "Essaouira Surf Experience",
          price: 320,
          currency: "MAD",
          url: "https://www.getyourguide.com/essaouira-l208/essaouira-surf-experience-t901234"
        },
        {
          id: "gyg-20",
          title: "Atlas Mountains Trekking",
          price: 450,
          currency: "MAD",
          url: "https://www.getyourguide.com/marrakech-l208/atlas-mountains-trekking-t012345"
        }
  ];

  // Create a more intelligent matching function with fuzzy search
  const findMatch = (searchTerm: string, activityTitle: string): boolean => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedActivity = activityTitle.toLowerCase().trim();
    
    // Exact match
    if (normalizedSearch === normalizedActivity) {
      return true;
    }
    
    // Direct substring match
    if (normalizedActivity.includes(normalizedSearch) || normalizedSearch.includes(normalizedActivity)) {
      return true;
    }
    
    // Handle generic terms like "tour", "trip", "experience"
    const genericTerms = ['tour', 'trip', 'experience', 'adventure', 'excursion', 'journey', 'expedition', 'safari', 'cruise', 'flight', 'ride', 'walk', 'hike', 'trek', 'visit', 'explore', 'discover'];
    const isGenericTerm = genericTerms.includes(normalizedSearch);
    
    if (isGenericTerm) {
      // For generic terms, match any activity that contains location keywords
      const locationKeywords = [
        'marrakech', 'agadir', 'essaouira', 'taghazout', 'tanger', 'tangier', 
        'rabat', 'chefchaouen', 'casablanca', 'fes', 'fez', 'meknes', 'oujda',
        'atlas', 'desert', 'mountain', 'valley', 'waterfall', 'palace', 'garden',
        'surf', 'surfing', 'beach', 'coast', 'medina', 'souk', 'square'
      ];
      return locationKeywords.some(keyword => normalizedActivity.includes(keyword));
    }
    
    // Handle city-specific searches
    const cityMappings: { [key: string]: string[] } = {
      'agadir': ['agadir', 'taghazout', 'surf', 'beach', 'coast'],
      'essaouira': ['essaouira', 'surf', 'beach', 'coast', 'medina'],
      'rabat': ['rabat', 'capital', 'city', 'tour'],
      'chefchaouen': ['chefchaouen', 'blue', 'city', 'mountain'],
      'tangier': ['tangier', 'tanger', 'strait', 'europe'],
      'marrakech': ['marrakech', 'atlas', 'desert', 'palace', 'garden']
    };
    
    // Check if search term matches any city
    for (const [city, keywords] of Object.entries(cityMappings)) {
      if (normalizedSearch.includes(city) || city.includes(normalizedSearch)) {
        return keywords.some(keyword => normalizedActivity.includes(keyword));
      }
    }
    
    // Handle common variations and synonyms
    const variations = [
      // Remove common suffixes
      normalizedSearch.replace(/\s+(day\s+trip|tour|experience|ride|trip|visit|explore|discover|adventure|excursion|journey|expedition|trek|hike|walk|safari|cruise|flight|balloon|entry|tickets?)$/i, ''),
      // Remove common prefixes
      normalizedSearch.replace(/^(visit|explore|discover|tour|experience|trip\s+to|day\s+trip\s+to)\s+/i, ''),
      // Handle French/English variations
      normalizedSearch.replace(/montgolfière|montgolfiere/gi, 'hot air balloon'),
      normalizedSearch.replace(/cascades/gi, 'waterfalls'),
      normalizedSearch.replace(/oued/gi, 'valley'),
      normalizedSearch.replace(/palais/gi, 'palace'),
      normalizedSearch.replace(/jardin/gi, 'garden'),
      normalizedSearch.replace(/montagne/gi, 'mountain'),
      normalizedSearch.replace(/désert/gi, 'desert'),
      // Handle specific activity names
      normalizedSearch.replace(/bahia/gi, 'bahia palace'),
      normalizedSearch.replace(/majorelle/gi, 'majorelle garden'),
      normalizedSearch.replace(/toubkal/gi, 'toubkal mountain'),
      normalizedSearch.replace(/atlas/gi, 'atlas mountains'),
      normalizedSearch.replace(/ouzoud/gi, 'ouzoud waterfalls'),
      normalizedSearch.replace(/ourika/gi, 'ourika valley'),
      normalizedSearch.replace(/essaouira/gi, 'essaouira'),
      normalizedSearch.replace(/agafay/gi, 'agafay desert'),
      normalizedSearch.replace(/agadir/gi, 'agadir'),
      normalizedSearch.replace(/taghazout/gi, 'taghazout'),
      normalizedSearch.replace(/tanger/gi, 'tangier'),
      normalizedSearch.replace(/tanger/gi, 'tangier')
    ];
    
    // Check if any variation matches
    return variations.some(variation => {
      if (!variation.trim()) return false;
      
      // Direct match with variation
      if (normalizedActivity.includes(variation) || variation.includes(normalizedActivity)) {
        return true;
      }
      
      // Word-by-word matching for better accuracy
      const searchWords = variation.split(/\s+/).filter(word => word.length > 2);
      const activityWords = normalizedActivity.split(/\s+/).filter(word => word.length > 2);
      
      if (searchWords.length > 0 && activityWords.length > 0) {
        const matchCount = searchWords.filter(searchWord => 
          activityWords.some(activityWord => 
            activityWord.includes(searchWord) || searchWord.includes(activityWord)
          )
        ).length;
        
        // If more than 50% of words match, consider it a match
        return matchCount / searchWords.length >= 0.5;
      }
      
      return false;
    });
  };

  // Find matching activities
  const matches = allActivities.filter(activity => 
    findMatch(normalizedQuery, activity.title)
  );

  // Return up to 10 matches
  return matches.slice(0, 10);
}

interface GetYourGuideActivity {
  id: string;
  title: string;
  gygPrice: number;
  suggestedPrice: number;
  currency: string;
  url: string;
}

/**
 * Search GetYourGuide activities
 * GET /api/gyg/search?q=...
 */
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.length < 3) {
        return res.status(400).json({
          error: 'Query parameter "q" is required and must be at least 3 characters long'
        });
      }

      const query = q.trim();
      console.log('[GYG] GetYourGuide search request:', { query });

      // Check cache first
      const cacheKey = `search_${query}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[GYG] Returning cached results for:', query);
        return res.json(cached.data);
      }
      
      // Try real GetYourGuide Partner API
      const apiKey = process.env.GYG_API_KEY;
      let activities: any[] = [];
      
      if (apiKey && apiKey !== 'your_getyourguide_api_key' && process.env.GYG_ENABLE_LIVE_SEARCH === 'true') {
        try {
          console.log('[GYG] Attempting real GetYourGuide Partner API call...');
          
          const response = await axios.get('https://api.getyourguide.com/1/tours', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json; charset=utf-8'
            },
            params: {
              query: query,
              currency: 'MAD',
              limit: 10
            },
            timeout: 10000
          });
          
          if (response.data && response.data.tours) {
            activities = response.data.tours.map((tour: any) => {
              const gygPrice = tour.price?.amount || 0;
              const currency = tour.price?.currency || 'MAD';
              const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
              
              return {
                id: tour.id || `gyg-${Date.now()}`,
                title: tour.title || 'Untitled Activity',
                gygPrice: gygPrice,
                suggestedPrice: suggestedPrice,
                currency: currency,
                image: tour.picture?.url || null,
                link: tour.links?.activity_link || `https://www.getyourguide.com/activity-${tour.id}`,
                description: tour.description || null,
                duration: tour.duration || null,
                rating: tour.rating || null,
                reviewCount: tour.review_count || null
              };
            });
            
            console.log('[SUCCESS] Real GetYourGuide API returned:', activities.length, 'activities');
          }
        } catch (apiError: any) {
          console.log('[WARNING] Real GetYourGuide API failed, falling back to mock data:', apiError.message);
          if (apiError.response) {
            console.log('[GYG] API Error Status:', apiError.response.status);
            console.log('[GYG] API Error Data:', apiError.response.data);
          }
        }
      } else {
        console.log('[GYG] No valid API key or live search disabled, using mock data');
      }
      
      // Fallback to mock data if real API failed or no key
      if (activities.length === 0) {
        const mockActivities = getMockGetYourGuideActivities(query);
        console.log('[GYG] Mock activities found:', mockActivities.length);
        
        activities = mockActivities.map((activity) => {
          const gygPrice = activity.price;
          const currency = activity.currency;
          const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
          
          return {
            id: activity.id,
            title: activity.title,
            gygPrice: gygPrice,
            suggestedPrice: suggestedPrice,
            currency: currency,
            image: null,
            link: activity.url,
            description: null,
            duration: null,
            rating: null,
            reviewCount: null
          };
        });
      }

      // Cache the results
      cache.set(cacheKey, { data: activities, timestamp: Date.now() });

      console.log('[SUCCESS] Returning GetYourGuide suggestions:', activities.length, 'activities');
      res.json(activities);

    } catch (error: any) {
      console.error('[ERROR] GetYourGuide API Error:', error.message);
      
      // Handle different types of errors
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'GetYourGuide API error';
        
        if (status === 401) {
          return res.status(401).json({ error: 'Invalid GetYourGuide API key' });
        } else if (status === 429) {
          return res.status(429).json({ error: 'Rate limit exceeded for GetYourGuide API' });
        } else {
          return res.status(status).json({ error: message });
        }
      } else if (error.request) {
        return res.status(503).json({ error: 'Unable to connect to GetYourGuide API' });
      } else {
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

export default router;
