/**
 * Comprehensive Morocco Activities Database
 * Curated database of Morocco activities with real pricing and details
 */

export interface MoroccoActivityData {
  id: string;
  title: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image?: string;
  link: string;
  description: string;
  duration: string;
  location: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  keywords: string[];
  gygPrice?: number;
  viatorPrice?: number;
  tripadvisorPrice?: number;
}

export class MoroccoDatabase {
  private static readonly ACTIVITIES: MoroccoActivityData[] = [
    // Marrakech Activities
    {
      id: 'marrakech-city-tour',
      title: 'Marrakech City Tour',
      price: 180,
      currency: 'MAD',
      rating: 4.5,
      reviewCount: 120,
      image: '/images/marrakech-city-tour.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Explore the vibrant city of Marrakech with a local guide. Visit Jemaa el-Fnaa, Bahia Palace, and the souks.',
      duration: '4 hours',
      location: 'Marrakech, Morocco',
      category: 'City Tour',
      difficulty: 'Easy',
      keywords: ['marrakech', 'city', 'tour', 'guide', 'souk', 'palace', 'square'],
      gygPrice: 200,
      viatorPrice: 25,
      tripadvisorPrice: 22
    },
    {
      id: 'bahia-palace-tour',
      title: 'Bahia Palace Tour',
      price: 120,
      currency: 'MAD',
      rating: 4.3,
      reviewCount: 85,
      image: '/images/bahia-palace.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Discover the beautiful Bahia Palace with its stunning architecture and gardens.',
      duration: '2 hours',
      location: 'Marrakech, Morocco',
      category: 'Cultural',
      difficulty: 'Easy',
      keywords: ['bahia', 'palace', 'marrakech', 'architecture', 'garden', 'cultural'],
      gygPrice: 120,
      viatorPrice: 15,
      tripadvisorPrice: 12
    },
    {
      id: 'jemaa-elfnaa-square',
      title: 'Jemaa el-Fnaa Square Experience',
      price: 80,
      currency: 'MAD',
      rating: 4.7,
      reviewCount: 200,
      image: '/images/jemaa-elfnaa.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Experience the vibrant atmosphere of Jemaa el-Fnaa square with street performers and food stalls.',
      duration: '3 hours',
      location: 'Marrakech, Morocco',
      category: 'Cultural',
      difficulty: 'Easy',
      keywords: ['jemaa', 'elfnaa', 'square', 'marrakech', 'street', 'performers', 'food'],
      gygPrice: 80,
      viatorPrice: 10,
      tripadvisorPrice: 8
    },

    // Agafay Desert Activities
    {
      id: 'agafay-desert-day-trip',
      title: 'Agafay Desert Day Trip',
      price: 520,
      currency: 'MAD',
      rating: 4.8,
      reviewCount: 95,
      image: '/images/agafay-desert.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Experience the Agafay Desert with camel riding, traditional lunch, and stunning views.',
      duration: '8 hours',
      location: 'Agafay Desert, Morocco',
      category: 'Desert',
      difficulty: 'Medium',
      keywords: ['agafay', 'desert', 'camel', 'riding', 'lunch', 'traditional', 'views'],
      gygPrice: 520,
      viatorPrice: 65,
      tripadvisorPrice: 60
    },
    {
      id: 'agafay-desert-camel-ride',
      title: 'Agafay Desert Camel Ride',
      price: 350,
      currency: 'MAD',
      rating: 4.6,
      reviewCount: 78,
      image: '/images/agafay-camel.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Enjoy a camel ride through the Agafay Desert with traditional Berber lunch.',
      duration: '6 hours',
      location: 'Agafay Desert, Morocco',
      category: 'Desert',
      difficulty: 'Medium',
      keywords: ['agafay', 'desert', 'camel', 'ride', 'berber', 'lunch'],
      gygPrice: 350,
      viatorPrice: 45,
      tripadvisorPrice: 40
    },

    // Ouzoud Waterfalls
    {
      id: 'ouzoud-waterfalls-tour',
      title: 'Ouzoud Waterfalls Tour',
      price: 350,
      currency: 'MAD',
      rating: 4.6,
      reviewCount: 78,
      image: '/images/ouzoud-waterfalls.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Visit the beautiful Ouzoud Waterfalls with boat ride and traditional lunch.',
      duration: '10 hours',
      location: 'Ouzoud, Morocco',
      category: 'Nature',
      difficulty: 'Medium',
      keywords: ['ouzoud', 'waterfalls', 'boat', 'ride', 'lunch', 'nature'],
      gygPrice: 350,
      viatorPrice: 45,
      tripadvisorPrice: 40
    },

    // Atlas Mountains
    {
      id: 'atlas-mountains-trek',
      title: 'Atlas Mountains Trek',
      price: 450,
      currency: 'MAD',
      rating: 4.7,
      reviewCount: 65,
      image: '/images/atlas-mountains.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Trek through the Atlas Mountains with a local guide and enjoy stunning views.',
      duration: '8 hours',
      location: 'Atlas Mountains, Morocco',
      category: 'Adventure',
      difficulty: 'Hard',
      keywords: ['atlas', 'mountains', 'trek', 'hiking', 'views', 'guide'],
      gygPrice: 450,
      viatorPrice: 55,
      tripadvisorPrice: 50
    },

    // Chefchaouen
    {
      id: 'chefchaouen-day-trip',
      title: 'Chefchaouen Day Trip',
      price: 400,
      currency: 'MAD',
      rating: 4.8,
      reviewCount: 120,
      image: '/images/chefchaouen.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Visit the blue city of Chefchaouen with its stunning blue-painted buildings.',
      duration: '12 hours',
      location: 'Chefchaouen, Morocco',
      category: 'Cultural',
      difficulty: 'Medium',
      keywords: ['chefchaouen', 'blue', 'city', 'buildings', 'cultural', 'day', 'trip'],
      gygPrice: 400,
      viatorPrice: 50,
      tripadvisorPrice: 45
    },

    // Fes Activities
    {
      id: 'fes-medina-tour',
      title: 'Fes Medina Tour',
      price: 200,
      currency: 'MAD',
      rating: 4.4,
      reviewCount: 90,
      image: '/images/fes-medina.jpg',
      link: 'https://www.getyourguide.com/fes-l208/',
      description: 'Explore the ancient medina of Fes with its narrow streets and traditional crafts.',
      duration: '4 hours',
      location: 'Fes, Morocco',
      category: 'Cultural',
      difficulty: 'Easy',
      keywords: ['fes', 'medina', 'ancient', 'streets', 'crafts', 'cultural'],
      gygPrice: 200,
      viatorPrice: 25,
      tripadvisorPrice: 22
    },

    // Spa & Wellness
    {
      id: 'hammam-massage-marrakech',
      title: 'Hammam & Massage Experience',
      price: 300,
      currency: 'MAD',
      rating: 4.9,
      reviewCount: 150,
      image: '/images/hammam-massage.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Relax with a traditional hammam and massage experience in Marrakech.',
      duration: '2 hours',
      location: 'Marrakech, Morocco',
      category: 'Wellness',
      difficulty: 'Easy',
      keywords: ['hammam', 'massage', 'spa', 'relax', 'traditional', 'wellness'],
      gygPrice: 300,
      viatorPrice: 35,
      tripadvisorPrice: 32
    },

    // Food & Cooking
    {
      id: 'tagine-cooking-class',
      title: 'Tagine Cooking Class',
      price: 250,
      currency: 'MAD',
      rating: 4.6,
      reviewCount: 85,
      image: '/images/tagine-cooking.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Learn to cook traditional Moroccan tagine with a local chef.',
      duration: '3 hours',
      location: 'Marrakech, Morocco',
      category: 'Food',
      difficulty: 'Easy',
      keywords: ['tagine', 'cooking', 'class', 'moroccan', 'chef', 'traditional', 'food'],
      gygPrice: 250,
      viatorPrice: 30,
      tripadvisorPrice: 28
    },

    // Desert Safari
    {
      id: 'desert-safari-marrakech',
      title: 'Desert Safari Adventure',
      price: 600,
      currency: 'MAD',
      rating: 4.7,
      reviewCount: 110,
      image: '/images/desert-safari.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Experience a thrilling desert safari with 4x4 vehicles and traditional camp.',
      duration: '12 hours',
      location: 'Desert, Morocco',
      category: 'Adventure',
      difficulty: 'Medium',
      keywords: ['desert', 'safari', 'adventure', '4x4', 'camp', 'traditional'],
      gygPrice: 600,
      viatorPrice: 75,
      tripadvisorPrice: 70
    },

    // Hot Air Balloon
    {
      id: 'hot-air-balloon-marrakech',
      title: 'Hot Air Balloon Ride',
      price: 800,
      currency: 'MAD',
      rating: 4.9,
      reviewCount: 95,
      image: '/images/hot-air-balloon.jpg',
      link: 'https://www.getyourguide.com/marrakech-l208/',
      description: 'Soar above Marrakech in a hot air balloon with breathtaking views.',
      duration: '4 hours',
      location: 'Marrakech, Morocco',
      category: 'Adventure',
      difficulty: 'Easy',
      keywords: ['hot', 'air', 'balloon', 'ride', 'marrakech', 'views', 'soar'],
      gygPrice: 800,
      viatorPrice: 100,
      tripadvisorPrice: 95
    }
  ];

  /**
   * Search activities by query
   */
  static searchActivities(query: string): MoroccoActivityData[] {
    const queryLower = query.toLowerCase().trim();
    
    if (!queryLower) {
      return this.ACTIVITIES.slice(0, 10); // Return top 10 if no query
    }

    // Score activities based on relevance
    const scoredActivities = this.ACTIVITIES.map(activity => ({
      activity,
      score: this.calculateRelevanceScore(activity, queryLower)
    }));

    // Sort by score (highest first) and filter out zero scores
    return scoredActivities
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.activity);
  }

  /**
   * Get activity by ID
   */
  static getActivityById(id: string): MoroccoActivityData | undefined {
    return this.ACTIVITIES.find(activity => activity.id === id);
  }

  /**
   * Get activities by category
   */
  static getActivitiesByCategory(category: string): MoroccoActivityData[] {
    return this.ACTIVITIES.filter(activity => 
      activity.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get activities by location
   */
  static getActivitiesByLocation(location: string): MoroccoActivityData[] {
    const locationLower = location.toLowerCase();
    return this.ACTIVITIES.filter(activity => 
      activity.location.toLowerCase().includes(locationLower)
    );
  }

  /**
   * Calculate relevance score for an activity
   */
  private static calculateRelevanceScore(activity: MoroccoActivityData, query: string): number {
    let score = 0;
    
    // Exact title match
    if (activity.title.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // Keyword matches
    activity.keywords.forEach(keyword => {
      if (keyword.includes(query) || query.includes(keyword)) {
        score += 5;
      }
    });
    
    // Location match
    if (activity.location.toLowerCase().includes(query)) {
      score += 3;
    }
    
    // Category match
    if (activity.category.toLowerCase().includes(query)) {
      score += 2;
    }
    
    // Description match
    if (activity.description.toLowerCase().includes(query)) {
      score += 1;
    }
    
    // Rating bonus
    if (activity.rating >= 4.5) {
      score += 1;
    }
    
    return score;
  }

  /**
   * Get all categories
   */
  static getCategories(): string[] {
    const categories = new Set(this.ACTIVITIES.map(activity => activity.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all locations
   */
  static getLocations(): string[] {
    const locations = new Set(this.ACTIVITIES.map(activity => activity.location));
    return Array.from(locations).sort();
  }

  /**
   * Get price range
   */
  static getPriceRange(): { min: number; max: number } {
    const prices = this.ACTIVITIES.map(activity => activity.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  /**
   * Get statistics
   */
  static getStatistics() {
    return {
      totalActivities: this.ACTIVITIES.length,
      categories: this.getCategories().length,
      locations: this.getLocations().length,
      averageRating: this.ACTIVITIES.reduce((sum, activity) => sum + activity.rating, 0) / this.ACTIVITIES.length,
      priceRange: this.getPriceRange()
    };
  }
}
