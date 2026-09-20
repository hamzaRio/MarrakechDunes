// Mobile activity card component
import { Link } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, Users, Calendar } from 'lucide-react';
import { getAssetUrl } from '@/lib/utils';
import type { ActivityType } from 'marrakechdunes-shared/schema';

interface MobileActivityCardProps {
  activity: ActivityType;
  onBook?: (activity: ActivityType) => void;
}

export default function MobileActivityCard({ activity, onBook }: MobileActivityCardProps) {
  const handleBook = () => {
    if (onBook) {
      onBook(activity);
    }
  };

  return (
    <Card className="w-full mb-4 shadow-lg border-0 bg-white">
      <div className="relative">
        <img
          src={getAssetUrl(activity.imageUrls?.[0])}
          alt={activity.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <Badge className="absolute top-2 left-2 bg-moroccan-red text-white">
          {activity.category}
        </Badge>
        {activity.rating && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center text-sm">
            <Star className="h-3 w-3 mr-1 fill-yellow-400" />
            {activity.rating}
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {activity.name}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {activity.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Activity Details */}
        <div className="space-y-2 mb-4">
          {activity.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-moroccan-blue" />
              <span className="line-clamp-1">{activity.location}</span>
            </div>
          )}
          
          {activity.duration && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2 text-moroccan-blue" />
              <span>{activity.duration}</span>
            </div>
          )}
          
          {activity.maxParticipants && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-moroccan-blue" />
              <span>Max {activity.maxParticipants} personnes</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-moroccan-blue">
              {Number(activity.price).toLocaleString()} MAD
            </span>
            <span className="text-sm text-gray-500">par personne</span>
          </div>
          
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleBook}
            className="flex-1 bg-moroccan-blue hover:bg-moroccan-blue/90 text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Réserver
          </Button>
          
          <Link href={`/activities/${activity._id}`}>
            <Button variant="outline" className="flex-1">
              Détails
            </Button>
          </Link>
        </div>

        {/* Status Badge */}
        <div className="mt-3 flex justify-center">
          <Badge 
            variant={activity.isActive ? "default" : "secondary"}
            className={activity.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
          >
            {activity.isActive ? "Disponible" : "Indisponible"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
