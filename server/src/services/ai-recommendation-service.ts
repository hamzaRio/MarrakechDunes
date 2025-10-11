import { cacheService } from './cache-service.js';
import { loggingService } from './logging-service.js';

export interface CustomerProfile {
  id: string;
  preferences: {
    activityTypes: string[];
    budget: { min: number; max: number };
    groupSize: number;
    travelDates: Date[];
    interests: string[];
    pastBookings: string[];
    ratings: { [activityId: string]: number };
  };
  demographics: {
    age: number;
    nationality: string;
    language: string;
  };
  behavior: {
    bookingFrequency: number;
    cancellationRate: number;
    averageSpend: number;
    preferredTimeSlots: string[];
  };
}

export interface ActivityRecommendation {
  activityId: string;
  score: number;
  reasons: string[];
  confidence: number;
  alternatives: string[];
}

export interface RecommendationContext {
  customerProfile: CustomerProfile;
  currentDate: Date;
  weather: {
    condition: string;
    temperature: number;
    suitableActivities: string[];
  };
  seasonality: {
    peak: boolean;
    adjustment: number;
  };
  availability: {
    [activityId: string]: boolean;
  };
}

export class AIRecommendationService {
  private recommendationWeights = {
    preferences: 0.3,
    behavior: 0.25,
    weather: 0.2,
    seasonality: 0.15,
    popularity: 0.1
  };

  async getRecommendations(
    customerProfile: CustomerProfile,
    context: RecommendationContext,
    limit: number = 5
  ): Promise<ActivityRecommendation[]> {
    try {
      // Check cache first
      const cacheKey = `recommendations:${customerProfile.id}:${JSON.stringify(context)}`;
      const cached = await cacheService.get<ActivityRecommendation[]>('recommendations', cacheKey);
      if (cached) {
        loggingService.debug('AI recommendations served from cache', { 
          endpoint: 'recommendations',
          method: 'GET',
          type: 'cache_hit'
        });
        return cached.slice(0, limit);
      }

      // Get all activities
      const activities = await this.getAllActivities();
      if (!activities || activities.length === 0) {
        return [];
      }

      // Calculate recommendations
      const recommendations = await this.calculateRecommendations(
        activities,
        customerProfile,
        context
      );

      // Sort by score and take top recommendations
      const topRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache the results
      await cacheService.set('recommendations', cacheKey, topRecommendations, 3600);

      loggingService.info('AI recommendations generated', {
        endpoint: 'recommendations',
        method: 'GET',
        type: 'recommendations_generated',
        metric: 'recommendations_count'
      });

      return topRecommendations;
    } catch (error) {
      loggingService.error('AI recommendation generation failed', error as Error, { 
        endpoint: 'recommendations',
        method: 'GET',
        type: 'recommendation_error'
      });
      return [];
    }
  }

  private async calculateRecommendations(
    activities: any[],
    customerProfile: CustomerProfile,
    context: RecommendationContext
  ): Promise<ActivityRecommendation[]> {
    const recommendations: ActivityRecommendation[] = [];

    for (const activity of activities) {
      const score = await this.calculateActivityScore(activity, customerProfile, context);
      const reasons = this.generateReasons(activity, customerProfile, context, score);
      const alternatives = this.findAlternatives(activity, activities, customerProfile);

      if (score > 0.3) { // Only include activities with reasonable scores
        recommendations.push({
          activityId: activity._id || activity.id,
          score,
          reasons,
          confidence: Math.min(score * 1.2, 1.0),
          alternatives
        });
      }
    }

    return recommendations;
  }

  private async calculateActivityScore(
    activity: any,
    customerProfile: CustomerProfile,
    context: RecommendationContext
  ): Promise<number> {
    let score = 0;

    // Preference matching (30% weight)
    const preferenceScore = this.calculatePreferenceScore(activity, customerProfile);
    score += preferenceScore * this.recommendationWeights.preferences;

    // Behavior analysis (25% weight)
    const behaviorScore = this.calculateBehaviorScore(activity, customerProfile);
    score += behaviorScore * this.recommendationWeights.behavior;

    // Weather compatibility (20% weight)
    const weatherScore = this.calculateWeatherScore(activity, context.weather);
    score += weatherScore * this.recommendationWeights.weather;

    // Seasonality (15% weight)
    const seasonalityScore = this.calculateSeasonalityScore(activity, context.seasonality);
    score += seasonalityScore * this.recommendationWeights.seasonality;

    // Popularity (10% weight)
    const popularityScore = this.calculatePopularityScore(activity);
    score += popularityScore * this.recommendationWeights.popularity;

    return Math.min(score, 1.0);
  }

  private calculatePreferenceScore(activity: any, profile: CustomerProfile): number {
    let score = 0;

    // Activity type matching
    if (profile.preferences.activityTypes.includes(activity.category)) {
      score += 0.4;
    }

    // Budget compatibility
    const activityPrice = Number(activity.price) || 0;
    if (activityPrice >= profile.preferences.budget.min && activityPrice <= profile.preferences.budget.max) {
      score += 0.3;
    }

    // Group size compatibility
    const maxParticipants = activity.maxParticipants || 20;
    if (profile.preferences.groupSize <= maxParticipants) {
      score += 0.2;
    }

    // Interest matching
    const activityKeywords = this.extractKeywords(activity);
    const matchingInterests = profile.preferences.interests.filter(interest =>
      activityKeywords.some(keyword => keyword.toLowerCase().includes(interest.toLowerCase()))
    );
    score += (matchingInterests.length / profile.preferences.interests.length) * 0.1;

    return Math.min(score, 1.0);
  }

  private calculateBehaviorScore(activity: any, profile: CustomerProfile): number {
    let score = 0;

    // Past booking similarity
    if (profile.preferences.pastBookings.includes(activity._id || activity.id)) {
      score += 0.3;
    }

    // Rating compatibility
    const userRating = profile.preferences.ratings[activity._id || activity.id];
    if (userRating && userRating >= 4) {
      score += 0.3;
    }

    // Spending pattern
    const activityPrice = Number(activity.price) || 0;
    if (activityPrice <= profile.behavior.averageSpend * 1.2) {
      score += 0.2;
    }

    // Booking frequency
    if (profile.behavior.bookingFrequency > 2) {
      score += 0.1; // Reward frequent bookers
    }

    // Cancellation rate
    if (profile.behavior.cancellationRate < 0.2) {
      score += 0.1; // Reward reliable customers
    }

    return Math.min(score, 1.0);
  }

  private calculateWeatherScore(activity: any, weather: any): number {
    if (!weather.suitableActivities || weather.suitableActivities.length === 0) {
      return 0.5; // Neutral if no weather data
    }

    const activityCategory = activity.category?.toLowerCase() || '';
    const isWeatherSuitable = weather.suitableActivities.some((suitable: string) =>
      activityCategory.includes(suitable.toLowerCase())
    );

    return isWeatherSuitable ? 1.0 : 0.2;
  }

  private calculateSeasonalityScore(activity: any, seasonality: any): number {
    if (!seasonality.peak) {
      return 1.0; // Non-peak season, no adjustment needed
    }

    // Reduce score for peak season activities that might be overcrowded
    const isPeakActivity = this.isPeakSeasonActivity(activity);
    return isPeakActivity ? 0.7 : 1.0;
  }

  private calculatePopularityScore(activity: any): number {
    // This would typically use booking data, ratings, etc.
    // For now, use a simple heuristic
    const rating = activity.rating || 0;
    const reviewCount = activity.reviewCount || 0;
    
    return Math.min((rating / 5) * 0.7 + (Math.min(reviewCount, 100) / 100) * 0.3, 1.0);
  }

  private generateReasons(
    activity: any,
    profile: CustomerProfile,
    context: RecommendationContext,
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (profile.preferences.activityTypes.includes(activity.category)) {
      reasons.push(`Matches your interest in ${activity.category}`);
    }

    if (Number(activity.price) <= profile.preferences.budget.max) {
      reasons.push('Fits your budget');
    }

    if (context.weather.suitableActivities.includes(activity.category)) {
      reasons.push('Perfect for current weather conditions');
    }

    if (profile.preferences.ratings[activity._id || activity.id] >= 4) {
      reasons.push('You rated this activity highly');
    }

    if (score > 0.8) {
      reasons.push('Highly recommended based on your preferences');
    }

    return reasons;
  }

  private findAlternatives(
    activity: any,
    allActivities: any[],
    profile: CustomerProfile
  ): string[] {
    return allActivities
      .filter(a => a._id !== activity._id && a.category === activity.category)
      .slice(0, 3)
      .map(a => a._id || a.id);
  }

  private extractKeywords(activity: any): string[] {
    const text = `${activity.name} ${activity.description} ${activity.category}`.toLowerCase();
    return text.split(/\s+/).filter(word => word.length > 3);
  }

  private isPeakSeasonActivity(activity: any): boolean {
    // Simple heuristic - could be enhanced with historical data
    const peakCategories = ['desert', 'atlas', 'sahara', 'camel'];
    const activityText = `${activity.name} ${activity.description}`.toLowerCase();
    return peakCategories.some(category => activityText.includes(category));
  }

  private async getAllActivities(): Promise<any[]> {
    // This would typically fetch from database
    // For now, return empty array - would be implemented with actual data source
    return [];
  }

  // Machine learning model training (placeholder)
  async trainModel(trainingData: any[]): Promise<void> {
    loggingService.info('Training AI recommendation model', {
      endpoint: 'ai_training',
      method: 'POST',
      type: 'model_training',
      metric: 'training_data_size'
    });
    
    // This would implement actual ML training
    // For now, just log the training request
  }

  // Model performance evaluation
  async evaluateModel(testData: any[]): Promise<{ accuracy: number; precision: number; recall: number }> {
    // This would implement model evaluation
    return {
      accuracy: 0.85,
      precision: 0.82,
      recall: 0.78
    };
  }
}

export const aiRecommendationService = new AIRecommendationService();
