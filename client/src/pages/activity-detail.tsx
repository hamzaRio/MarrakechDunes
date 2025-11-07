import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Star, Calendar, ArrowLeft, CheckCircle2, Shield, Heart, Camera, UtensilsCrossed, Wifi, Car, Languages } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SEOHead from "@/components/seo-head";
import { getActivityFallbackImage, handleImageError, getActivityImages } from "@/lib/image-utils";
import { ensureArray } from "@/lib/ensureArray";
import type { ActivityType } from "marrakechdunes-shared/schema";

export default function ActivityDetail() {
  const [, params] = useRoute("/activity/:id");
  const [, setLocation] = useLocation();
  const activityId = params?.id;

  const { data: activity, isLoading, error } = useQuery<ActivityType>({
    queryKey: ["/activities", activityId],
    queryFn: async () => {
      if (!activityId) throw new Error("Activity ID is required");
      const response = await apiFetch(`/activities/${activityId}`);
      if (!response.ok) {
        if (response.status === 404 || response.status === 0) {
          throw new Error("Activity not found");
        }
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }
      
      // Parse JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (import.meta.env.DEV) {
          console.error('[ActivityDetail] Failed to parse JSON response:', jsonError);
        }
        throw new Error("Invalid response from server");
      }
      
      // Validate that we have activity data with an ID
      if (!data || (!data._id && !data.id)) {
        if (import.meta.env.DEV) {
          console.error('[ActivityDetail] Invalid activity data received:', data);
        }
        throw new Error("Activity not found");
      }
      if (import.meta.env.DEV) {
        console.log('[ActivityDetail] Activity loaded successfully:', { id: data._id || data.id, name: data.name });
      }
      return data;
    },
    enabled: !!activityId,
    retry: (failureCount, error) => {
      // Don't retry if activity not found (404) or after 2 attempts
      if (failureCount >= 2) return false;
      if (error instanceof Error && error.message.includes("not found")) return false;
      return true;
    },
  });

  const images = ensureArray(activity?.imageUrls || []);
  const galleryImages = getActivityImages(images, activity?.name || '');
  const primaryImage = galleryImages[0] || getActivityFallbackImage(activity?.name || '');

  // Auto-redirect to activities page if activity not found (only on actual error, not during loading)
  useEffect(() => {
    // Only redirect if we're not loading AND there's an actual error
    // Don't redirect if we're still loading or if activity is just undefined during initial load
    if (!isLoading && error) {
      // Redirect after a short delay to show error message briefly
      const timer = setTimeout(() => {
        setLocation("/activities");
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-blue"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Only show error if we're not loading and there's an actual error
  // Don't show error during initial load when activity is undefined
  if (!isLoading && error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <SEOHead title="Activity Not Found - MarrakechDunes" />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Activity Not Found</h2>
              <p className="text-gray-600 mb-4">The activity you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => setLocation("/activities")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Activities
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // If still loading, show loading state (already handled above, but keep for safety)
  if (isLoading || !activity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-blue"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <SEOHead 
        title={`${activity.name} - MarrakechDunes`}
        description={activity.description || `Book ${activity.name} in Marrakech`}
      />
      
      {/* Header */}
      <div className="bg-moroccan-blue text-white py-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/activities")}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activities
          </Button>
          <h1 className="text-4xl font-bold mb-4">{activity.name}</h1>
          {activity.category && (
            <Badge className="bg-moroccan-gold text-white">
              {activity.category}
            </Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Image */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[500px] overflow-hidden">
                  <img
                    src={primaryImage.startsWith('http://') || primaryImage.startsWith('https://') ? primaryImage : getAssetUrl(primaryImage)}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = getActivityFallbackImage(activity.name);
                      target.src = fallback.startsWith('http://') || fallback.startsWith('https://') ? fallback : getAssetUrl(fallback);
                    }}
                  />
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                      {galleryImages.map((image, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'} cursor-pointer hover:bg-white transition-colors`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {galleryImages.length > 1 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto">
                      {galleryImages.slice(1, 5).map((image, index) => (
                        <img
                          key={index + 1}
                          src={image.startsWith('http://') || image.startsWith('https://') ? image : getAssetUrl(image)}
                          alt={`${activity.name} - Gallery ${index + 2}`}
                          className="h-20 w-20 object-cover rounded-lg border-2 border-transparent hover:border-moroccan-blue cursor-pointer transition-all"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallback = getActivityFallbackImage(activity.name);
                            target.src = fallback.startsWith('http://') || fallback.startsWith('https://') ? fallback : getAssetUrl(fallback);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Highlights */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-6 w-6 text-moroccan-gold fill-current" />
                  Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Camera className="h-5 w-5 text-moroccan-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Photo Opportunities</div>
                      <div className="text-sm text-gray-600">Capture stunning memories at iconic locations</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Heart className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Authentic Experience</div>
                      <div className="text-sm text-gray-600">Immerse yourself in local culture and traditions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <UtensilsCrossed className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Traditional Cuisine</div>
                      <div className="text-sm text-gray-600">Enjoy authentic Moroccan meals included</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Safe & Secure</div>
                      <div className="text-sm text-gray-600">Professional guides and safety equipment provided</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Experience</h2>
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                  {activity.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  What's Included
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Professional English-speaking guide</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Transportation (pickup & drop-off)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Traditional Moroccan meal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">All necessary equipment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Bottled water</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Insurance coverage</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Details */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activity.duration && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="p-3 bg-moroccan-blue rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Duration</div>
                        <div className="text-gray-700">{activity.duration}</div>
                      </div>
                    </div>
                  )}
                  
                  {activity.location && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="p-3 bg-green-600 rounded-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Location</div>
                        <div className="text-gray-700">{activity.location || "Marrakech & Surroundings"}</div>
                      </div>
                    </div>
                  )}

                  {activity.maxParticipants && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Group Size</div>
                        <div className="text-gray-700">Up to {activity.maxParticipants} people</div>
                      </div>
                    </div>
                  )}

                  {activity.difficulty && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <div className="p-3 bg-orange-600 rounded-lg">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Difficulty Level</div>
                        <div className="text-gray-700 capitalize">{activity.difficulty}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Meeting Point & Important Info */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Meeting Point & Important Information</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border-l-4 border-moroccan-blue rounded">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-moroccan-blue" />
                      Meeting Point
                    </div>
                    <p className="text-gray-700">
                      We'll pick you up from your hotel or riad in Marrakech. Please be ready 15 minutes before the scheduled time. 
                      Our guide will contact you via WhatsApp on the day of the activity.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      Cancellation Policy
                    </div>
                    <p className="text-gray-700">
                      Free cancellation up to 24 hours before the activity. Full refund guaranteed. 
                      No cancellation fees for weather-related cancellations.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Languages className="h-5 w-5 text-green-600" />
                      Languages
                    </div>
                    <p className="text-gray-700">
                      Our guides speak English, French, Arabic, and Spanish. Please let us know your preferred language when booking.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-moroccan-blue mb-2">
                    {Number(activity.price || 0).toLocaleString()} MAD
                  </div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>

                <Button
                  className="w-full bg-moroccan-red hover:bg-red-600 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 mb-4"
                  size="lg"
                  onClick={() => setLocation(`/booking?activity=${activity._id || activity.id}`)}
                >
                  <Calendar className="h-5 w-5 mr-2 inline" />
                  Book Now
                </Button>

                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Instant Confirmation</span>
                    </div>
                    <p className="text-sm text-gray-600">Receive confirmation immediately after booking</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4 text-moroccan-blue" />
                      <span className="font-medium">Flexible booking dates</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Free cancellation (24h notice)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-moroccan-blue" />
                      <span className="font-medium">Hotel pickup included</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Languages className="h-4 w-4 text-moroccan-blue" />
                      <span className="font-medium">Multi-language guides</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Car className="h-4 w-4 text-moroccan-blue" />
                      <span className="font-medium">Air-conditioned transport</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
