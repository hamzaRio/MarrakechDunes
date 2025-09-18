import { useState } from 'react';

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Clock, MapPin } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

import ActivityPreview from "./activity-preview";

import { getActivityFallbackImage } from "@/lib/image-utils";

import { ensureArray, getAssetUrl } from "@/lib/utils";

import type { ActivityType } from "@shared/schema";



interface ActivityCardProps {

  activity: ActivityType;

  showDescription?: boolean;

}



export default function ActivityCard({ activity, showDescription = false }: ActivityCardProps) {

  const { user } = useAuth();

  const [showPreview, setShowPreview] = useState(false);



  // Only show admin features to authenticated admins

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');



  const resolveImageSrc = (source: string) => {

    if (!source) {

      return getActivityFallbackImage(activity.name);

    }



    try {

      return getAssetUrl(source);

    } catch {

      return getActivityFallbackImage(activity.name);

    }

  };



  const imageSources = ensureArray(activity.imageUrls);

  const legacyPhotos = ensureArray((activity as any).photos);

  if (imageSources.length === 0 && legacyPhotos.length > 0) {

    imageSources.push(...legacyPhotos);

  }

  const legacyImage = (activity as any).image;

  if (imageSources.length === 0 && typeof legacyImage === 'string' && legacyImage) {

    imageSources.push(legacyImage);

  }



  const galleryImages = imageSources.length > 0

    ? imageSources.map((src) => ({

        original: src,

        resolved: resolveImageSrc(src),

      }))

    : [{

        original: '',

        resolved: getActivityFallbackImage(activity.name),

      }];



  const primarySource = galleryImages[0]?.original ?? '';

  const primaryImage = galleryImages[0]?.resolved ?? getActivityFallbackImage(activity.name);



  return (

    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">

      <div className="relative overflow-hidden">

        <img

          src={primaryImage}

          alt={activity.name}

          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"

          style={{ objectPosition: 'center' }}

          loading="lazy"

          onError={(e) => {

            const img = e.currentTarget;

            if (process.env.NODE_ENV === 'development') {

              console.warn('Image failed to load:', primarySource, '-> using activity-specific fallback');

            }

            img.src = getActivityFallbackImage(activity.name);

            img.onerror = null; // Prevent infinite loops

          }}

          onLoad={() => {

            if (process.env.NODE_ENV === 'development') {

              console.log('Image loaded successfully:', primarySource);

            }

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



        {galleryImages.length > 1 && (

          <div className="flex gap-2 overflow-x-auto py-3">

            {galleryImages.map((image, index) => (

              <img

                key={`${activity._id || activity.id || 'activity'}-image-${index}`}

                src={image.resolved}

                alt={`${activity.name} image ${index + 1}`}

                className="h-16 w-16 object-cover rounded-md border border-white/40 shadow-sm"

                loading="lazy"

              />

            ))}

          </div>

        )}



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

            window.location.href = `/booking?activity=${activity.id || activity._id}`;

          }}

        />

      </CardContent>

    </Card>

  );

}



