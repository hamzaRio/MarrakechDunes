import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Star, Calendar, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Camera, Heart, UtensilsCrossed, Shield, Languages, Car, Wifi } from "lucide-react";
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
  const fallbackImage = getActivityFallbackImage(activity?.name || '');

  // Reset selected image when activity changes
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [activityId]);

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

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const getImageUrl = (image: string) => {
    return image.startsWith('http://') || image.startsWith('https://') ? image : getAssetUrl(image);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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

  const currentImage = galleryImages[selectedImageIndex] || primaryImage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      <SEOHead 
        title={`${activity.name} - MarrakechDunes`}
        description={activity.description || `Book ${activity.name} in Marrakech`}
      />
      
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-moroccan-blue via-blue-700 to-moroccan-blue text-white py-16 shadow-lg">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/activities")}
            className="mb-6 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activities
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-5xl font-bold font-playfair">{activity.name}</h1>
            {activity.category && (
              <Badge className="bg-moroccan-gold text-white text-lg px-4 py-2">
                {activity.category}
              </Badge>
            )}
          </div>
          {activity.rating && (
            <div className="flex items-center gap-2 text-yellow-300">
              <Star className="h-5 w-5 fill-current" />
              <span className="text-lg font-semibold">{activity.rating.toFixed(1)}</span>
              <span className="text-gray-300">/ 5.0</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden shadow-xl border-0">
              <CardContent className="p-0">
                {/* Main Image Display */}
                <div className="relative h-[500px] md:h-[600px] bg-gray-900 overflow-hidden group">
                  <img
                    src={getImageUrl(currentImage)}
                    alt={`${activity.name} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = getImageUrl(fallbackImage);
                      target.src = fallback;
                    }}
                  />
                  
                  {/* Image Counter Overlay */}
                  {galleryImages.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {selectedImageIndex + 1} / {galleryImages.length}
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="lg"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-8 h-8" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {galleryImages.length > 1 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {galleryImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 relative overflow-hidden rounded-lg border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-moroccan-blue ring-2 ring-moroccan-blue ring-offset-2 scale-105'
                              : 'border-gray-300 hover:border-moroccan-blue'
                          }`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`${activity.name} - Thumbnail ${index + 1}`}
                            className="w-24 h-24 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = getImageUrl(fallbackImage);
                            }}
                          />
                          {index === selectedImageIndex && (
                            <div className="absolute inset-0 bg-moroccan-blue/20" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Highlights Section */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Star className="h-8 w-8 text-moroccan-gold fill-current" />
                  Highlights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Camera className="h-6 w-6 text-moroccan-blue" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">Photo Opportunities</div>
                      <div className="text-gray-600">Capture stunning memories at iconic locations</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Heart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">Authentic Experience</div>
                      <div className="text-gray-600">Immerse yourself in local culture and traditions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">Traditional Cuisine</div>
                      <div className="text-gray-600">Enjoy authentic Moroccan meals included</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">Safe & Secure</div>
                      <div className="text-gray-600">Professional guides and safety equipment provided</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Description */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Experience</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                    {activity.description || "No description available."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/50 to-white">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  What's Included
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Professional English-speaking guide</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Transportation (pickup & drop-off)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Traditional Moroccan meal</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">All necessary equipment</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Bottled water</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">Insurance coverage</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Details */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Activity Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activity.duration && (
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
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
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
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
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="p-3 bg-purple-600 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Group Size</div>
                        <div className="text-gray-700">Up to {activity.maxParticipants} people</div>
                      </div>
                    </div>
                  )}

                  {activity.rating && (
                    <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                      <div className="p-3 bg-yellow-500 rounded-lg">
                        <Star className="h-6 w-6 text-white fill-current" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg mb-1">Rating</div>
                        <div className="text-gray-700">{activity.rating.toFixed(1)} / 5.0</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Meeting Point & Important Info */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Important Information</h2>
                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 border-l-4 border-moroccan-blue rounded-lg">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-moroccan-blue" />
                      Meeting Point
                    </div>
                    <p className="text-gray-700">
                      We'll pick you up from your hotel or riad in Marrakech. Please be ready 15 minutes before the scheduled time. 
                      Our guide will contact you via WhatsApp on the day of the activity.
                    </p>
                  </div>
                  <div className="p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-yellow-600" />
                      Cancellation Policy
                    </div>
                    <p className="text-gray-700">
                      Free cancellation up to 24 hours before the activity. Full refund guaranteed. 
                      No cancellation fees for weather-related cancellations.
                    </p>
                  </div>
                  <div className="p-6 bg-green-50 border-l-4 border-green-500 rounded-lg">
                    <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-lg">
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

          {/* Enhanced Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-moroccan-blue mb-2">
                    {Number(activity.price || 0).toLocaleString()} MAD
                  </div>
                  <div className="text-gray-600 font-medium">per person</div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-moroccan-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-6 text-xl transition-all duration-300 transform hover:scale-105 mb-6 shadow-lg"
                  size="lg"
                  onClick={() => setLocation(`/booking?activity=${activity._id || activity.id}`)}
                >
                  <Calendar className="h-6 w-6 mr-2 inline" />
                  Book Now
                </Button>

                <div className="space-y-4">
                  <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-gray-900">Instant Confirmation</span>
                    </div>
                    <p className="text-sm text-gray-600">Receive confirmation immediately after booking</p>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <Calendar className="h-5 w-5 text-moroccan-blue" />
                      <span className="font-medium">Flexible booking dates</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Free cancellation (24h notice)</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <MapPin className="h-5 w-5 text-moroccan-blue" />
                      <span className="font-medium">Hotel pickup included</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <Languages className="h-5 w-5 text-moroccan-blue" />
                      <span className="font-medium">Multi-language guides</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <Car className="h-5 w-5 text-moroccan-blue" />
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
