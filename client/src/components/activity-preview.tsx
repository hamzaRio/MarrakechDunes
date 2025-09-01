import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import ActivityRating from './activity-rating';

import { getAssetUrl } from '@/lib/utils';
import type { ActivityType } from '@shared/schema';

interface ActivityPreviewProps {
  activity: ActivityType | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: () => void;
}

export default function ActivityPreview({ activity, isOpen, onClose, onBookNow }: ActivityPreviewProps) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!activity) return null;

  const images = activity.photos && activity.photos.length > 0 
    ? activity.photos.map(photo => getAssetUrl(photo))
    : [getAssetUrl(activity.image)];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-moroccan-gold/30 shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-playfair text-2xl text-moroccan-blue">
            {activity.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={images[currentImageIndex]}
                alt={`${activity.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                }}
              />
            </div>
            
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Price overlay */}
            <div className="absolute top-4 right-4 bg-moroccan-red text-white px-4 py-2 rounded-lg">
              <div className="text-2xl font-black" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                {activity.price} MAD
              </div>
            </div>

            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-moroccan-gold text-white">
                {activity.category}
              </Badge>
            </div>
          </div>

          {/* Activity Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-playfair text-xl font-bold text-moroccan-blue mb-3">
                  {t('description')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {activity.description}
                </p>
              </div>

              {/* Activity highlights based on type */}
              <div>
                <h3 className="font-playfair text-lg font-bold text-moroccan-blue mb-3">
                  What's Included
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {activity.name.toLowerCase().includes('agafay') && (
                    <>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Camel trekking experience in Agafay Desert
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Quad biking adventure across desert terrain
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Traditional Moroccan dinner under the stars
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Berber music and entertainment
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Hotel pickup and drop-off
                      </li>
                    </>
                  )}
                  {activity.name.toLowerCase().includes('balloon') && (
                    <>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Sunrise hot air balloon flight
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Traditional Berber breakfast
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Flight certificate
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Hotel transfers included
                      </li>
                    </>
                  )}
                  {activity.name.toLowerCase().includes('ourika') && (
                    <>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Scenic Atlas Mountains drive through traditional villages
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Visit authentic Berber homes and local crafts
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Explore flowing mountain streams and waterfalls
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Traditional mint tea in mountain cafes
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Expert local guide and comfortable transport
                      </li>
                    </>
                  )}
                  {!activity.name.toLowerCase().includes('agafay') && !activity.name.toLowerCase().includes('balloon') && !activity.name.toLowerCase().includes('ourika') && (
                    <>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Professional local guide
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Transportation included
                      </li>
                      <li className="flex items-center">
                        <Star className="h-4 w-4 text-moroccan-gold mr-2" />
                        Small group experience
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Booking Information */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-moroccan-blue mb-3">Quick Details</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <span className="font-medium">{activity.duration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">Location</span>
                    </div>
                    <span className="font-medium">Marrakech</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">Group Size</span>
                    </div>
                    <span className="font-medium">Small groups</span>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-moroccan-blue mb-3">Customer Reviews</h3>
                <ActivityRating activityId={activity.id || activity._id} />
              </div>

              {/* Price Comparison */}
              {/* Price comparison section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-moroccan-blue mb-3">Price Comparison</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-green-700 font-medium">Our Price</div>
                    <div className="text-lg font-bold text-green-600">{activity.price} MAD</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-orange-700 font-medium">GetYourGuide</div>
                    <div className="text-lg font-bold text-orange-600">{activity.getyourguidePrice || parseInt(activity.price) + 150} MAD</div>
                  </div>
                </div>
              </div>

              {/* Final Book Now Button */}
              <Button 
                className="w-full bg-moroccan-red hover:bg-red-600 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105"
                onClick={onBookNow}
                size="lg"
              >
                {t('bookNow')} - Best Price Guaranteed
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                Cash payment on meeting point • No hidden fees
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}