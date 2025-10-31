import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Star, Calendar, ArrowLeft } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";
import SimplifiedBookingForm from "@/components/simplified-booking-form";
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
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }
      return await response.json();
    },
    enabled: !!activityId,
    retry: 2,
  });

  const images = ensureArray(activity?.imageUrls || []);
  const galleryImages = getActivityImages(images, activity?.name || '');
  const primaryImage = galleryImages[0] || getActivityFallbackImage(activity?.name || '');

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

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <SEOHead title="Activity Not Found - MarrakechDunes" />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Activity Not Found</h2>
              <p className="text-gray-600 mb-4">The activity you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => setLocation("/activities-simple")} variant="outline">
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
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 overflow-hidden rounded-t-lg">
                  <img
                    src={getAssetUrl(primaryImage)}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getActivityFallbackImage(activity.name);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {activity.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.duration && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-moroccan-blue" />
                      <div>
                        <div className="font-semibold text-gray-900">Duration</div>
                        <div className="text-gray-600">{activity.duration}</div>
                      </div>
                    </div>
                  )}
                  
                  {activity.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-moroccan-blue" />
                      <div>
                        <div className="font-semibold text-gray-900">Location</div>
                        <div className="text-gray-600">{activity.location}</div>
                      </div>
                    </div>
                  )}

                  {activity.maxParticipants && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-moroccan-blue" />
                      <div>
                        <div className="font-semibold text-gray-900">Group Size</div>
                        <div className="text-gray-600">Up to {activity.maxParticipants} people</div>
                      </div>
                    </div>
                  )}

                  {activity.rating && (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <div>
                        <div className="font-semibold text-gray-900">Rating</div>
                        <div className="text-gray-600">{activity.rating.toFixed(1)} / 5.0</div>
                      </div>
                    </div>
                  )}
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
                
                <SimplifiedBookingForm
                  activityId={activity._id || activity.id || ''}
                  activityName={activity.name}
                  activityPrice={Number(activity.price || 0)}
                />

                <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Flexible booking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Free cancellation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Pickup available</span>
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
