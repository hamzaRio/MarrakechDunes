import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Clock, Users, Star, Calendar, ArrowRight } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";
import SimplifiedBookingForm from "./simplified-booking-form";
import type { ActivityType } from "marrakechdunes-shared/schema";

interface SimplifiedActivityCardProps {
  activity: ActivityType;
}

export default function SimplifiedActivityCard({ activity }: SimplifiedActivityCardProps) {
  const [, setLocation] = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = activity.imageUrls || [];
  const primaryImage = images[selectedImageIndex] || images[0];

  const handleBookingSuccess = () => {
    setIsBookingOpen(false);
  };

  const handleCardClick = () => {
    // Navigate to booking page with activity ID
    const activityId = activity._id || activity.id;
    if (activityId) {
      setLocation(`/booking?activity=${activityId}`);
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getAssetUrl(primaryImage)}
          alt={activity.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder-activity.jpg';
          }}
        />
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when clicking image dots
                  setSelectedImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-green-600 text-white text-lg px-3 py-1">
            {activity.price} MAD
          </Badge>
        </div>

        {/* Rating Badge */}
        {activity.rating && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-500 text-white flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              {activity.rating.toFixed(1)}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Activity Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {activity.name}
        </h3>

        {/* Key Information */}
        <div className="space-y-2 mb-4">
          {activity.duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{activity.duration}</span>
            </div>
          )}
          
          {activity.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{activity.location}</span>
            </div>
          )}

          {activity.maxParticipants && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Up to {activity.maxParticipants} people</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {activity.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Price Breakdown */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Price per person:</span>
            <span className="font-semibold text-lg">{activity.price} MAD</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            💳 Cash payment on arrival
          </div>
        </div>

        {/* Booking Button */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-moroccan-blue hover:bg-moroccan-blue/90 text-white py-3 text-lg font-semibold group"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking button
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                Book Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Book {activity.name}
              </DialogTitle>
            </DialogHeader>
            <SimplifiedBookingForm
              activityId={activity._id}
              activityName={activity.name}
              activityPrice={Number(activity.price)}
              onSuccess={handleBookingSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Quick Info */}
        <div className="mt-3 text-center text-xs text-gray-500">
          <p>📱 WhatsApp confirmation • 🚗 Free pickup available</p>
        </div>
      </CardContent>
    </Card>
  );
}
