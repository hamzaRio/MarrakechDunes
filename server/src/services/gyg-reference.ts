/**
 * GetYourGuide Reference Search Service
 * Searches GYG's public website for activity references (no API required)
 */

interface GYGReference {
  title: string;
  city: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  reviewsCount?: number;
  provider: 'GetYourGuide';
  providerUrl: string;
}

export class GYGReferenceService {
  private static readonly GYG_SEARCH_URL = 'https://www.getyourguide.com/s/?q=';
  private static readonly GYG_MOROCCO_URL = 'https://www.getyourguide.com/morocco/';

  /**
   * Search for activities on GYG's public website (reference only)
   */
  static async searchReferences(query: string, city?: string): Promise<GYGReference[]> {
    try {
      console.log(`[GYG-REF] Searching for: "${query}" in ${city || 'Morocco'}`);
      
      // For now, return mock data that represents what you'd find on GYG
      // This simulates searching GYG's public website
      const mockResults = this.generateMockReferences(query, city);
      
      console.log(`[GYG-REF] Found ${mockResults.length} reference activities`);
      return mockResults;
      
    } catch (error) {
      console.error('[GYG-REF] Search error:', error);
      return [];
    }
  }

  /**
   * Generate realistic mock data based on common Morocco activities
   */
  private static generateMockReferences(query: string, city?: string): GYGReference[] {
    const searchTerm = query.toLowerCase();
    const targetCity = city?.toLowerCase() || 'marrakech';
    
    // Common Morocco activities that would appear on GYG
    const activities = [
      {
        title: 'Hot Air Balloon Ride over Marrakech',
        city: 'Marrakech',
        priceMAD: 1250,
        durationText: '3-4 hours',
        rating: 4.8,
        reviewsCount: 1247,
        searchTerms: ['hot air balloon', 'balloon', 'marrakech', 'sky']
      },
      {
        title: 'Atlas Mountains Day Trip from Marrakech',
        city: 'Marrakech',
        priceMAD: 450,
        durationText: '8-10 hours',
        rating: 4.7,
        reviewsCount: 892,
        searchTerms: ['atlas', 'mountains', 'day trip', 'hiking', 'berber']
      },
      {
        title: 'Essaouira Day Trip from Marrakech',
        city: 'Essaouira',
        priceMAD: 380,
        durationText: '10-12 hours',
        rating: 4.6,
        reviewsCount: 654,
        searchTerms: ['essaouira', 'coastal', 'day trip', 'atlantic']
      },
      {
        title: 'Desert Safari from Marrakech',
        city: 'Merzouga',
        priceMAD: 850,
        durationText: '2-3 days',
        rating: 4.9,
        reviewsCount: 2156,
        searchTerms: ['desert', 'sahara', 'camel', 'camping', 'merzouga']
      },
      {
        title: 'Cooking Class in Marrakech',
        city: 'Marrakech',
        priceMAD: 320,
        durationText: '4-5 hours',
        rating: 4.8,
        reviewsCount: 743,
        searchTerms: ['cooking', 'class', 'moroccan', 'food', 'tagine']
      },
      {
        title: 'Fez Day Trip from Marrakech',
        city: 'Fez',
        priceMAD: 520,
        durationText: '12-14 hours',
        rating: 4.5,
        reviewsCount: 432,
        searchTerms: ['fez', 'fes', 'imperial', 'city', 'medina']
      },
      {
        title: 'Ouzoud Waterfalls Day Trip',
        city: 'Ouzoud',
        priceMAD: 280,
        durationText: '8-10 hours',
        rating: 4.7,
        reviewsCount: 567,
        searchTerms: ['ouzoud', 'waterfalls', 'nature', 'hiking']
      },
      {
        title: 'Agafay Desert Day Trip',
        city: 'Agafay',
        priceMAD: 350,
        durationText: '6-8 hours',
        rating: 4.6,
        reviewsCount: 389,
        searchTerms: ['agafay', 'desert', 'day trip', 'camel']
      }
    ];

    // Filter activities based on search query
    const filteredActivities = activities.filter(activity => {
      const searchWords = searchTerm.split(' ').filter(word => word.length > 2);
      const activityText = `${activity.title} ${activity.city} ${activity.searchTerms.join(' ')}`.toLowerCase();
      
      return searchWords.some(word => activityText.includes(word)) ||
             activity.city.toLowerCase().includes(targetCity) ||
             activity.title.toLowerCase().includes(searchTerm);
    });

    // Convert to GYGReference format
    return filteredActivities.map(activity => ({
      title: activity.title,
      city: activity.city,
      priceMAD: activity.priceMAD,
      durationText: activity.durationText,
      rating: activity.rating,
      reviewsCount: activity.reviewsCount,
      provider: 'GetYourGuide' as const,
      providerUrl: `https://www.getyourguide.com/morocco/${activity.city.toLowerCase()}/`
    }));
  }

  /**
   * Get popular activities for a specific city
   */
  static async getPopularActivities(city: string): Promise<GYGReference[]> {
    const cityActivities = this.generateMockReferences('', city);
    return cityActivities.slice(0, 6); // Return top 6 activities
  }

  /**
   * Get activity suggestions based on search
   */
  static async getSuggestions(query: string): Promise<string[]> {
    const suggestions = [
      'Hot Air Balloon Marrakech',
      'Atlas Mountains Hiking',
      'Desert Safari Merzouga',
      'Essaouira Coastal Tour',
      'Fez Imperial City',
      'Cooking Class Marrakech',
      'Ouzoud Waterfalls',
      'Agafay Desert Day Trip'
    ];

    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }
}
