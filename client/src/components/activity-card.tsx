import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/use-auth";
import ActivityRating from "./activity-rating";
import ActivityPreview from "./activity-preview";
import { getAssetUrl, getActivityFallbackImage } from '@/lib/image-utils';
import type { ActivityType } from "@shared/schema";

interface ActivityCardProps {
  activity: ActivityType;
  showDescription?: boolean;
}

export default function ActivityCard({ activity, showDescription = false }: ActivityCardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  
  // Only show admin features to authenticated admins
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
  

  
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
      <div className="relative overflow-hidden">
        <img
          key={activity._id + Date.now()}
          src={activity.image + '?v=' + Date.now() + '&bust=' + Math.random()}
          alt={activity.name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
          style={{ objectPosition: 'center' }}
          onError={(e) => {
            // Force complete reload
            setTimeout(() => {
              e.currentTarget.src = activity.image + '?reload=' + Math.random();
            }, 100);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-moroccan-gold text-white">
            {activity.category}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <div className="text-3xl font-black text-white drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)' }}>
            {activity.price} MAD
          </div>
          {isAdmin && (
            <div className="text-xs bg-green-600 bg-opacity-90 px-2 py-1 rounded-full mt-1">
              Save {((activity.getyourguidePrice || Number(activity.price) + 150) - Number(activity.price))} MAD vs GetYourGuide
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-6">
        <h3 className="font-playfair text-xl font-bold text-moroccan-blue mb-2">
          {activity.name}
        </h3>
        
        {showDescription && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {activity.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{activity.duration || 'Full day'}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Marrakech</span>
          </div>
        </div>
        
        {/* Price Comparison Summary - Admin Only */}
        {isAdmin && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
            <div className="text-sm font-medium text-moroccan-blue mb-2">Price Comparison</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-green-700 font-medium">Our Price</div>
                <div className="text-lg font-bold text-green-600">{activity.price} MAD</div>
              </div>
              <div>
                <div className="text-orange-700 font-medium">GetYourGuide</div>
                <div className="text-lg font-bold text-orange-600">{activity.getyourguidePrice || Number(activity.price) + 150} MAD</div>
              </div>
            </div>
            <div className="text-center mt-2 text-xs text-green-600 font-medium">
              You Save: {((activity.getyourguidePrice || Number(activity.price) + 150) - Number(activity.price))} MAD per person
            </div>
          </div>
        )}
        
        <Button 
          className="w-full bg-moroccan-red hover:bg-red-600 text-white transition-all duration-300 transform hover:scale-105"
          onClick={() => setShowPreview(true)}
        >
          View Details & Book
        </Button>
        
        <ActivityPreview
          activity={activity}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onBookNow={() => {
            // Navigate to booking page with activity ID as URL parameter
            window.location.href = `/booking?activity=${activity.id || activity._id}`;
          }}
        />
      </CardContent>
    </Card>
  );
}