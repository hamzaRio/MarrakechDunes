import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  Camera,
  Share2,
  Star,
  CheckCircle,
  AlertCircle,
  Navigation,
  Wifi,
  Battery,
  Signal
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { BookingType, ActivityType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

interface MobileCustomerAppProps {
  booking: BookingWithActivity;
  onContactGuide: () => void;
  onShareLocation: () => void;
  onTakePhoto: () => void;
}

export default function MobileCustomerApp({
  booking,
  onContactGuide,
  onShareLocation,
  onTakePhoto
}: MobileCustomerAppProps) {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTimeUntilActivity = () => {
    const activityDate = new Date(booking.preferredDate);
    const now = new Date();
    const diffMs = activityDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs < 0) return "Activity completed";
    if (diffHours > 24) return `${Math.floor(diffHours / 24)} days remaining`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m remaining`;
    return `${diffMinutes} minutes remaining`;
  };

  const getActivityStatus = () => {
    const activityDate = new Date(booking.preferredDate);
    const now = new Date();
    const diffMs = activityDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffMs < 0) return { status: 'completed', color: 'bg-green-100 text-green-800' };
    if (diffHours <= 2) return { status: 'starting_soon', color: 'bg-orange-100 text-orange-800' };
    if (diffHours <= 24) return { status: 'tomorrow', color: 'bg-blue-100 text-blue-800' };
    return { status: 'upcoming', color: 'bg-gray-100 text-gray-800' };
  };

  const activityStatus = getActivityStatus();

  return (
    <div className="max-w-sm mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl">
      {/* Mobile Status Bar */}
      <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-xs">
        <span>{formatTime(currentTime)}</span>
        <div className="flex items-center gap-1">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <Battery className="w-4 h-2" />
        </div>
      </div>

      {/* App Header */}
      <div className="bg-moroccan-blue text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">MarrakechDunes</h1>
            <p className="text-sm opacity-90">Your Adventure Awaits</p>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-75">Booking Status</div>
            <Badge className={`${activityStatus.color} text-xs`}>
              {activityStatus.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 p-4 space-y-4">
        {/* Activity Info */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{booking.activity.name}</h3>
                  <p className="text-sm text-gray-600">{booking.activity.category}</p>
                </div>
                <Badge variant="secondary" className="bg-moroccan-gold text-white">
                  {booking.activity.duration}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(booking.preferredDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'person' : 'people'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{booking.totalAmount} MAD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Countdown */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="space-y-2">
              <Clock className="w-8 h-8 mx-auto text-moroccan-blue" />
              <h4 className="font-semibold">Time Until Activity</h4>
              <div className="text-2xl font-bold text-moroccan-red">
                {getTimeUntilActivity()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Point */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Meeting Point
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <p className="text-sm font-medium">54 Riad Zitoun Lakdim</p>
              <p className="text-xs text-gray-600">Marrakech 40000, Morocco</p>
              <Button 
                size="sm" 
                className="w-full bg-moroccan-blue hover:bg-blue-700"
                onClick={onShareLocation}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-1"
            onClick={onContactGuide}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Contact Guide</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-16 flex flex-col gap-1"
            onClick={onTakePhoto}
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">Take Photo</span>
          </Button>
        </div>

        {/* Important Reminders */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-800">Important Reminders</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Arrive 15 minutes early</li>
                  <li>• Bring cash for payment</li>
                  <li>• Wear comfortable shoes</li>
                  <li>• Bring water and sunscreen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {booking.paymentStatus === 'fully_paid' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                <span className="text-sm font-medium">Payment Status</span>
              </div>
              <Badge 
                variant={booking.paymentStatus === 'fully_paid' ? 'default' : 'secondary'}
                className={booking.paymentStatus === 'fully_paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
              >
                {booking.paymentStatus === 'fully_paid' ? 'Paid' : 'Pending'}
              </Badge>
            </div>
            {booking.paymentStatus !== 'fully_paid' && (
              <p className="text-xs text-gray-600 mt-2">
                Cash payment required on arrival
              </p>
            )}
          </CardContent>
        </Card>

        {/* Share Experience */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.open('https://wa.me/?text=Check%20out%20my%20amazing%20Moroccan%20adventure%20with%20MarrakechDunes!', '_blank')}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share My Experience
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t flex justify-around py-2">
        <Button variant="ghost" size="sm" className="flex flex-col gap-1">
          <Home className="w-4 h-4" />
          <span className="text-xs">Home</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col gap-1">
          <Calendar className="w-4 h-4" />
          <span className="text-xs">Bookings</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col gap-1">
          <Star className="w-4 h-4" />
          <span className="text-xs">Reviews</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col gap-1">
          <User className="w-4 h-4" />
          <span className="text-xs">Profile</span>
        </Button>
      </div>
    </div>
  );
}
