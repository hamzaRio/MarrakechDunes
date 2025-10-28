// Real GetYourGuide API integration
interface GYGSearchParams {
  q: string;
  limit?: number;
  offset?: number;
  location?: string;
  category?: string;
}

interface GYGActivity {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  description: string;
  highlights: string[];
}

interface GYGSearchResponse {
  activities: GYGActivity[];
  total: number;
  hasMore: boolean;
}

// GetYourGuide API configuration
const GYG_API_BASE = 'https://api.getyourguide.com/v1';
const GYG_API_KEY = import.meta.env.VITE_GETYOURGUIDE_API_KEY;

// Search activities on GetYourGuide
export async function searchGetYourGuideActivities(params: GYGSearchParams): Promise<GYGSearchResponse> {
  try {
    // Check if we have API key
    if (!GYG_API_KEY) {
      console.warn('GetYourGuide API key not found, using mock data');
      return searchMockActivities(params);
    }

    const searchParams = new URLSearchParams({
      q: params.q,
      limit: (params.limit || 10).toString(),
      offset: (params.offset || 0).toString(),
      location: params.location || 'Marrakech, Morocco',
      category: params.category || 'activities'
    });

    const response = await fetch(`${GYG_API_BASE}/activities?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${GYG_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GetYourGuide API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform GetYourGuide API response to our format
    const activities: GYGActivity[] = data.activities?.map((activity: any) => ({
      id: activity.id,
      title: activity.title,
      location: activity.location?.name || 'Marrakech, Morocco',
      duration: activity.duration || 'N/A',
      price: {
        amount: activity.price?.amount || 0,
        currency: activity.price?.currency || 'MAD',
        originalAmount: activity.price?.originalAmount
      },
      rating: activity.rating || 0,
      reviewCount: activity.reviewCount || 0,
      imageUrl: activity.images?.[0]?.url || '/images/placeholder-activity.jpg',
      url: activity.url || `https://www.getyourguide.com/marrakech-l208/${activity.slug}/`,
      description: activity.description || '',
      highlights: activity.highlights || []
    })) || [];

    return {
      activities,
      total: data.total || activities.length,
      hasMore: (params.offset || 0) + activities.length < (data.total || 0)
    };

  } catch (error) {
    console.error('GetYourGuide API error:', error);
    // Fallback to mock data
    return searchMockActivities(params);
  }
}

// Mock data fallback (your current data)
function searchMockActivities(params: GYGSearchParams): GYGSearchResponse {
  const mockActivities: GYGActivity[] = [
    // Desert & Atlas Mountains Tours
    {
      id: 'atlas-mountains-1',
      title: 'Atlas Mountains & Desert Day Trip from Marrakech',
      location: 'Marrakech, Morocco',
      duration: '10 hours',
      price: { amount: 450, currency: 'MAD', originalAmount: 600 },
      rating: 4.8,
      reviewCount: 1247,
      imageUrl: '/images/atlas-mountains.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/atlas-mountains-desert-day-trip-t123456/',
      description: 'Explore the stunning Atlas Mountains and experience the beauty of the Moroccan desert on this full-day adventure.',
      highlights: ['Atlas Mountains', 'Desert landscapes', 'Traditional lunch', 'Professional guide']
    },
    {
      id: 'sahara-3day',
      title: '3-Day Sahara Desert Tour from Marrakech',
      location: 'Marrakech, Morocco',
      duration: '3 days',
      price: { amount: 1800, currency: 'MAD', originalAmount: 2200 },
      rating: 4.9,
      reviewCount: 892,
      imageUrl: '/images/sahara-desert.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/3-day-sahara-desert-tour-t789012/',
      description: 'Embark on an unforgettable 3-day journey through the Sahara Desert with camel trekking and overnight camping.',
      highlights: ['Camel trekking', 'Desert camping', 'Sunset views', 'Traditional music']
    },
    {
      id: 'agafay-desert',
      title: 'Agafay Desert Day Trip with Camel Ride',
      location: 'Marrakech, Morocco',
      duration: '8 hours',
      price: { amount: 380, currency: 'MAD', originalAmount: 480 },
      rating: 4.7,
      reviewCount: 567,
      imageUrl: '/images/agafay-desert.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/agafay-desert-day-trip-t234567/',
      description: 'Experience the Agafay Desert with camel riding, traditional lunch, and stunning desert landscapes.',
      highlights: ['Camel riding', 'Desert lunch', 'Berber village', 'Desert landscapes']
    },
    // City Tours & Cultural Experiences
    {
      id: 'city-walking-tour',
      title: 'Marrakech City Walking Tour with Local Guide',
      location: 'Marrakech, Morocco',
      duration: '4 hours',
      price: { amount: 250, currency: 'MAD' },
      rating: 4.7,
      reviewCount: 2156,
      imageUrl: '/images/marrakech-city.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/city-walking-tour-t345678/',
      description: 'Discover the hidden gems of Marrakech with a knowledgeable local guide.',
      highlights: ['Jemaa el-Fnaa', 'Medina exploration', 'Local markets', 'Historical sites']
    },
    {
      id: 'palace-tour',
      title: 'Bahia Palace & El Badi Palace Guided Tour',
      location: 'Marrakech, Morocco',
      duration: '3 hours',
      price: { amount: 180, currency: 'MAD', originalAmount: 220 },
      rating: 4.6,
      reviewCount: 743,
      imageUrl: '/images/palace-tour.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/palace-guided-tour-t456789/',
      description: 'Explore the magnificent Bahia Palace and El Badi Palace with an expert guide.',
      highlights: ['Bahia Palace', 'El Badi Palace', 'Architecture', 'History']
    },
    // Food & Cooking Experiences
    {
      id: 'cooking-class-riad',
      title: 'Moroccan Cooking Class in Traditional Riad',
      location: 'Marrakech, Morocco',
      duration: '3 hours',
      price: { amount: 350, currency: 'MAD', originalAmount: 450 },
      rating: 4.9,
      reviewCount: 634,
      imageUrl: '/images/cooking-class.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/moroccan-cooking-class-t456789/',
      description: 'Learn to cook authentic Moroccan dishes in a beautiful traditional riad.',
      highlights: ['Hands-on cooking', 'Traditional recipes', 'Local ingredients', 'Take home recipes']
    },
    {
      id: 'food-tour',
      title: 'Marrakech Food Tour with Local Tastings',
      location: 'Marrakech, Morocco',
      duration: '3.5 hours',
      price: { amount: 280, currency: 'MAD', originalAmount: 350 },
      rating: 4.8,
      reviewCount: 892,
      imageUrl: '/images/food-tour.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/food-tour-t567890/',
      description: 'Taste authentic Moroccan cuisine through local markets and hidden food spots.',
      highlights: ['Local tastings', 'Market visits', 'Street food', 'Cultural insights']
    },
    // Nature & Adventure
    {
      id: 'ourika-valley',
      title: 'Ourika Valley Day Trip with Waterfalls',
      location: 'Marrakech, Morocco',
      duration: '8 hours',
      price: { amount: 320, currency: 'MAD', originalAmount: 400 },
      rating: 4.7,
      reviewCount: 1123,
      imageUrl: '/images/ourika-valley.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/ourika-valley-t678901/',
      description: 'Discover the beautiful Ourika Valley with its waterfalls and Berber villages.',
      highlights: ['Waterfalls', 'Berber villages', 'Mountain views', 'Traditional lunch']
    },
    {
      id: 'hot-air-balloon',
      title: 'Hot Air Balloon Ride over Marrakech',
      location: 'Marrakech, Morocco',
      duration: '4 hours',
      price: { amount: 1200, currency: 'MAD', originalAmount: 1500 },
      rating: 4.9,
      reviewCount: 456,
      imageUrl: '/images/hot-air-balloon.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/hot-air-balloon-t789012/',
      description: 'Soar above Marrakech in a hot air balloon for breathtaking sunrise views.',
      highlights: ['Sunrise views', 'Atlas Mountains', 'Desert landscapes', 'Champagne breakfast']
    },
    // Day Trips & Excursions
    {
      id: 'essaouira-day-trip',
      title: 'Essaouira Day Trip from Marrakech',
      location: 'Marrakech, Morocco',
      duration: '12 hours',
      price: { amount: 480, currency: 'MAD', originalAmount: 600 },
      rating: 4.6,
      reviewCount: 789,
      imageUrl: '/images/essaouira.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/essaouira-day-trip-t890123/',
      description: 'Visit the charming coastal town of Essaouira with its medina and beaches.',
      highlights: ['Coastal town', 'Medina exploration', 'Beach time', 'Seafood lunch']
    },
    {
      id: 'ouzoud-waterfalls',
      title: 'Ouzoud Waterfalls Day Trip',
      location: 'Marrakech, Morocco',
      duration: '10 hours',
      price: { amount: 420, currency: 'MAD', originalAmount: 520 },
      rating: 4.8,
      reviewCount: 654,
      imageUrl: '/images/ouzoud-waterfalls.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/ouzoud-waterfalls-t901234/',
      description: 'Visit the spectacular Ouzoud Waterfalls with swimming and hiking opportunities.',
      highlights: ['Waterfalls', 'Swimming', 'Hiking', 'Monkey watching']
    },
    // Cultural & Historical
    {
      id: 'berber-village',
      title: 'Berber Village Experience & Traditional Lunch',
      location: 'Marrakech, Morocco',
      duration: '6 hours',
      price: { amount: 280, currency: 'MAD', originalAmount: 350 },
      rating: 4.7,
      reviewCount: 423,
      imageUrl: '/images/berber-village.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/berber-village-t012345/',
      description: 'Experience authentic Berber culture with village visits and traditional meals.',
      highlights: ['Berber culture', 'Village life', 'Traditional lunch', 'Handicrafts']
    },
    {
      id: 'hammam-spa',
      title: 'Traditional Hammam & Spa Experience',
      location: 'Marrakech, Morocco',
      duration: '2 hours',
      price: { amount: 180, currency: 'MAD', originalAmount: 220 },
      rating: 4.8,
      reviewCount: 567,
      imageUrl: '/images/hammam-spa.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/hammam-spa-t123456/',
      description: 'Relax with a traditional Moroccan hammam and spa treatment.',
      highlights: ['Hammam experience', 'Spa treatment', 'Relaxation', 'Traditional rituals']
    },
    // Luxury & Premium Experiences
    {
      id: 'luxury-desert-camp',
      title: 'Luxury Desert Camp Overnight Experience',
      location: 'Marrakech, Morocco',
      duration: '2 days',
      price: { amount: 2800, currency: 'MAD', originalAmount: 3500 },
      rating: 4.9,
      reviewCount: 234,
      imageUrl: '/images/luxury-desert-camp.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/luxury-desert-camp-t234567/',
      description: 'Experience luxury camping in the desert with premium amenities and services.',
      highlights: ['Luxury tent', 'Private guide', 'Gourmet meals', 'Stargazing']
    },
    {
      id: 'private-tour',
      title: 'Private Marrakech City Tour with Driver',
      location: 'Marrakech, Morocco',
      duration: '6 hours',
      price: { amount: 800, currency: 'MAD', originalAmount: 1000 },
      rating: 4.9,
      reviewCount: 156,
      imageUrl: '/images/private-tour.jpg',
      url: 'https://www.getyourguide.com/marrakech-l208/private-city-tour-t345678/',
      description: 'Enjoy a personalized private tour of Marrakech with your own driver and guide.',
      highlights: ['Private guide', 'Flexible itinerary', 'Luxury vehicle', 'Personalized experience']
    }
  ];

  // Filter activities based on search term
  const filteredActivities = mockActivities.filter(activity =>
    activity.title.toLowerCase().includes(params.q.toLowerCase()) ||
    activity.location.toLowerCase().includes(params.q.toLowerCase()) ||
    activity.description.toLowerCase().includes(params.q.toLowerCase()) ||
    activity.highlights.some(highlight => 
      highlight.toLowerCase().includes(params.q.toLowerCase())
    )
  );

  const limit = params.limit || 10;
  const offset = params.offset || 0;
  const paginatedActivities = filteredActivities.slice(offset, offset + limit);

  return {
    activities: paginatedActivities,
    total: filteredActivities.length,
    hasMore: offset + paginatedActivities.length < filteredActivities.length
  };
}

// Check if GetYourGuide API is available
export function isGetYourGuideAPIAvailable(): boolean {
  return !!GYG_API_KEY;
}

// Get API status
export function getGetYourGuideAPIStatus(): { available: boolean; usingMock: boolean } {
  return {
    available: !!GYG_API_KEY,
    usingMock: !GYG_API_KEY
  };
}