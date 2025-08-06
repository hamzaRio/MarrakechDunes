import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Star, CheckCircle, AlertCircle } from "lucide-react";

interface TimeSlot {
  id: string;
  time: string;
  available: number;
  capacity: number;
  price: number;
  status: 'available' | 'limited' | 'full';
}

interface ActivityAvailability {
  activityId: string;
  activityName: string;
  date: string;
  timeSlots: TimeSlot[];
  weatherCondition: 'excellent' | 'good' | 'fair' | 'poor';
  specialNotes?: string;
}

export default function RealTimeAvailability() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedActivity, setSelectedActivity] = useState<string>('1');
  const [availability, setAvailability] = useState<ActivityAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activities = [
    { id: '1', name: 'Hot Air Balloon Ride', category: 'Adventure' },
    { id: '2', name: '3-Day Desert Experience', category: 'Multi-day' },
    { id: '3', name: 'Essaouira Day Trip', category: 'Day Trip' },
    { id: '4', name: 'Ourika Valley Adventure', category: 'Day Trip' },
    { id: '5', name: 'Ouzoud Waterfalls Tour', category: 'Day Trip' }
  ];

  useEffect(() => {
    loadAvailability();
  }, [selectedDate, selectedActivity]);

  const loadAvailability = async () => {
    setIsLoading(true);
    
    // Simulate real-time availability API call
    setTimeout(() => {
      const mockAvailability: ActivityAvailability[] = [
        {
          activityId: '1',
          activityName: 'Hot Air Balloon Ride',
          date: selectedDate,
          weatherCondition: 'excellent',
          timeSlots: [
            {
              id: '1-1',
              time: '06:00',
              available: 2,
              capacity: 8,
              price: 2000,
              status: 'limited'
            },
            {
              id: '1-2', 
              time: '06:30',
              available: 6,
              capacity: 8,
              price: 2000,
              status: 'available'
            }
          ],
          specialNotes: 'Perfect weather conditions for flying. Clear skies expected.'
        },
        {
          activityId: '2',
          activityName: '3-Day Desert Experience',
          date: selectedDate,
          weatherCondition: 'good',
          timeSlots: [
            {
              id: '2-1',
              time: '09:00',
              available: 4,
              capacity: 12,
              price: 5000,
              status: 'available'
            },
            {
              id: '2-2',
              time: '14:00', 
              available: 8,
              capacity: 12,
              price: 5000,
              status: 'available'
            }
          ]
        },
        {
          activityId: '3',
          activityName: 'Essaouira Day Trip',
          date: selectedDate,
          weatherCondition: 'excellent',
          timeSlots: [
            {
              id: '3-1',
              time: '08:00',
              available: 0,
              capacity: 15,
              price: 1500,
              status: 'full'
            },
            {
              id: '3-2',
              time: '08:30',
              available: 3,
              capacity: 15,
              price: 1500,
              status: 'limited'
            }
          ],
          specialNotes: 'Coastal weather perfect for sightseeing. Light Atlantic breeze.'
        }
      ];

      setAvailability(mockAvailability);
      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'limited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'full': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'excellent': return '☀️';
      case 'good': return '⛅';
      case 'fair': return '🌤️';
      case 'poor': return '🌧️';
      default: return '☀️';
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const bookTimeSlot = (timeSlot: TimeSlot, activityName: string) => {
    if (timeSlot.status === 'full') return;
    
    alert(`Redirecting to booking page for ${activityName} at ${timeSlot.time} on ${selectedDate}. Price: ${timeSlot.price} MAD per person.`);
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const selectedAvailability = availability.find(a => a.activityId === selectedActivity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Real-Time Availability</h2>
        <Badge className="bg-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Live Updates
        </Badge>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Activity</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
              >
                {activities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} ({activity.category})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Select Date</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                {generateDateOptions().map(date => {
                  const dateObj = new Date(date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  return (
                    <option key={date} value={date}>
                      {dateObj.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })} {isToday ? '(Today)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading real-time availability...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Display */}
      {!isLoading && selectedAvailability && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {selectedAvailability.activityName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getWeatherIcon(selectedAvailability.weatherCondition)}</span>
                <span className={`font-medium capitalize ${getWeatherColor(selectedAvailability.weatherCondition)}`}>
                  {selectedAvailability.weatherCondition} Weather
                </span>
              </div>
            </div>
            <p className="text-gray-600">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardHeader>
          
          <CardContent>
            {selectedAvailability.specialNotes && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Weather Update</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">{selectedAvailability.specialNotes}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedAvailability.timeSlots.map((slot) => (
                <div key={slot.id} className={`p-4 border-2 rounded-lg ${getStatusColor(slot.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold text-lg">{slot.time}</span>
                    </div>
                    <Badge className={getStatusColor(slot.status)}>
                      {slot.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Available
                      </span>
                      <span className="font-medium">
                        {slot.available}/{slot.capacity} spots
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          slot.status === 'available' ? 'bg-green-500' :
                          slot.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(slot.available / slot.capacity) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">
                        {slot.price.toLocaleString()} MAD
                      </span>
                      <span className="text-sm text-gray-600"> per person</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={slot.status === 'full'}
                    onClick={() => bookTimeSlot(slot, selectedAvailability.activityName)}
                  >
                    {slot.status === 'full' ? 'Fully Booked' : 'Book Now'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Today</p>
                <p className="text-2xl font-bold text-green-600">47</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Limited Spots</p>
                <p className="text-2xl font-bold text-yellow-600">12</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fully Booked</p>
                <p className="text-2xl font-bold text-red-600">8</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weather Score</p>
                <p className="text-2xl font-bold text-blue-600">9.2/10</p>
              </div>
              <Star className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Booking Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Best Booking Times</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Hot Air Balloon: 6:00-6:30 AM for optimal weather</li>
                <li>• Desert Tours: Flexible departure, early morning recommended</li>
                <li>• Day Trips: 8:00 AM departure for full experience</li>
                <li>• Book 24-48 hours in advance for guaranteed spots</li>
                <li>• Weather conditions updated every 6 hours</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Live Updates</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Availability refreshes every 5 minutes</li>
                <li>• Instant notifications for last-minute cancellations</li>
                <li>• Weather alerts sent 24 hours before activity</li>
                <li>• Priority booking for loyalty program members</li>
                <li>• Group discounts automatically applied at checkout</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}