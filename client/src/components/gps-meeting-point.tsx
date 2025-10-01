import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Phone, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MeetingPoint {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  instructions: string;
  contactPhone: string;
  meetingTime: string;
}

interface GPSMeetingPointProps {
  activityId: string;
  bookingId?: string;
}

export default function GPSMeetingPoint({ 
  activityId, 
  bookingId 
}: GPSMeetingPointProps) {
  const [meetingPoint, setMeetingPoint] = useState<MeetingPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Mock meeting point data - in real app, this would come from API
    const mockMeetingPoint: MeetingPoint = {
      name: "MarrakechDunes Meeting Point",
      address: "Place Jemaa el-Fnaa, Marrakech 40000, Morocco",
      coordinates: {
        lat: 31.6258,
        lng: -7.9891
      },
      instructions: "Meet at the main entrance of Place Jemaa el-Fnaa. Look for our MarrakechDunes guide with a blue flag.",
      contactPhone: "+212 6XX-XXXXXX",
      meetingTime: "30 minutes before activity start"
    };
    
    setMeetingPoint(mockMeetingPoint);
    setIsLoading(false);
  }, [activityId]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          if (meetingPoint) {
            const dist = calculateDistance(
              latitude,
              longitude,
              meetingPoint.coordinates.lat,
              meetingPoint.coordinates.lng
            );
            setDistance(dist);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Access Denied",
            description: "Please enable location access to get directions to the meeting point.",
            variant: "destructive",
          });
        }
      );
    }
  }, [meetingPoint, toast]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const openInMaps = () => {
    if (!meetingPoint) return;
    
    const { lat, lng } = meetingPoint.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = () => {
    if (!meetingPoint) return;
    
    const { lat, lng } = meetingPoint.coordinates;
    const url = `http://maps.apple.com/?daddr=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const shareLocation = async () => {
    if (!meetingPoint) return;

    const shareData = {
      title: 'MarrakechDunes Meeting Point',
      text: `Meeting point: ${meetingPoint.name}\nAddress: ${meetingPoint.address}\nTime: ${meetingPoint.meetingTime}`,
      url: `https://maps.google.com/?q=${meetingPoint.coordinates.lat},${meetingPoint.coordinates.lng}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast({
          title: "Location Copied",
          description: "Meeting point details copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading meeting point...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meetingPoint) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No meeting point information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Meeting Point
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{meetingPoint.name}</h3>
          <p className="text-gray-600">{meetingPoint.address}</p>
        </div>

        {distance !== null && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              {distance.toFixed(1)} km away
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Meeting time: {meetingPoint.meetingTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>Contact: {meetingPoint.contactPhone}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm text-blue-800">{meetingPoint.instructions}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={openInMaps} className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Google Maps
          </Button>
          <Button variant="outline" onClick={openInAppleMaps} className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Apple Maps
          </Button>
          <Button variant="outline" onClick={shareLocation} className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Share Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
