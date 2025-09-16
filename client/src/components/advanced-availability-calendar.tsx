import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  Star,
  TrendingUp,
  Zap
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { ActivityType, BookingType } from "@shared/schema";

interface AdvancedAvailabilityCalendarProps {
  activity: ActivityType;
  bookings: BookingType[];
  onDateSelect: (date: Date, timeSlot: string) => void;
  selectedDate?: Date;
  selectedTimeSlot?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  capacity: number;
  booked: number;
  price: number;
  isPopular: boolean;
  isEarlyBird: boolean;
}

interface DateAvailability {
  date: Date;
  available: boolean;
  fullyBooked: boolean;
  timeSlots: TimeSlot[];
  isWeekend: boolean;
  isHoliday: boolean;
  weatherForecast?: string;
  specialOffer?: string;
}

export default function AdvancedAvailabilityCalendar({
  activity,
  bookings,
  onDateSelect,
  selectedDate,
  selectedTimeSlot
}: AdvancedAvailabilityCalendarProps) {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<DateAvailability[]>([]);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateAvailability | null>(null);

  // Generate time slots for the activity
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const basePrice = parseInt(activity.price);
    
    return [
      {
        time: "08:00",
        available: true,
        capacity: 12,
        booked: Math.floor(Math.random() * 4),
        price: isWeekend ? Math.round(basePrice * 1.2) : basePrice,
        isPopular: false,
        isEarlyBird: true
      },
      {
        time: "10:00",
        available: true,
        capacity: 15,
        booked: Math.floor(Math.random() * 6),
        price: basePrice,
        isPopular: true,
        isEarlyBird: false
      },
      {
        time: "14:00",
        available: true,
        capacity: 15,
        booked: Math.floor(Math.random() * 8),
        price: basePrice,
        isPopular: true,
        isEarlyBird: false
      },
      {
        time: "16:00",
        available: true,
        capacity: 12,
        booked: Math.floor(Math.random() * 5),
        price: isWeekend ? Math.round(basePrice * 1.2) : basePrice,
        isPopular: false,
        isEarlyBird: false
      }
    ];
  };

  // Generate availability for the current month
  useEffect(() => {
    const generateAvailability = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const availabilityData: DateAvailability[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = Math.random() < 0.1; // 10% chance of holiday
        const isPast = date < new Date();
        
        const timeSlots = generateTimeSlots(date);
        const totalCapacity = timeSlots.reduce((sum, slot) => sum + slot.capacity, 0);
        const totalBooked = timeSlots.reduce((sum, slot) => sum + slot.booked, 0);
        
        availabilityData.push({
          date,
          available: !isPast && !isHoliday,
          fullyBooked: totalBooked >= totalCapacity * 0.9,
          timeSlots,
          isWeekend,
          isHoliday,
          weatherForecast: isPast ? undefined : ["Sunny", "Partly Cloudy", "Clear"][Math.floor(Math.random() * 3)],
          specialOffer: isWeekend ? "Weekend Premium" : undefined
        });
      }

      setAvailability(availabilityData);
    };

    generateAvailability();
  }, [currentMonth, activity]);

  const handleDateClick = (dateInfo: DateAvailability) => {
    if (dateInfo.available) {
      setSelectedDateInfo(dateInfo);
    }
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (timeSlot.available && selectedDateInfo) {
      onDateSelect(selectedDateInfo.date, timeSlot.time);
    }
  };

  const getDateStatus = (dateInfo: DateAvailability) => {
    if (dateInfo.isHoliday) return { color: "bg-red-100 text-red-800", text: "Holiday" };
    if (!dateInfo.available) return { color: "bg-gray-100 text-gray-500", text: "Past" };
    if (dateInfo.fullyBooked) return { color: "bg-orange-100 text-orange-800", text: "Full" };
    if (dateInfo.isWeekend) return { color: "bg-blue-100 text-blue-800", text: "Weekend" };
    return { color: "bg-green-100 text-green-800", text: "Available" };
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigateMonth('prev')}
              disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
            >
              ← Previous
            </Button>
            <h3 className="text-lg font-semibold">{formatMonthYear(currentMonth)}</h3>
            <Button variant="outline" onClick={() => navigateMonth('next')}>
              Next →
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
            
            {availability.map((dateInfo, index) => {
              const status = getDateStatus(dateInfo);
              const isSelected = selectedDate && 
                dateInfo.date.toDateString() === selectedDate.toDateString();
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-12 flex flex-col items-center justify-center p-1 ${
                    !dateInfo.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => handleDateClick(dateInfo)}
                  disabled={!dateInfo.available}
                >
                  <span className="text-sm font-medium">{dateInfo.date.getDate()}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${status.color} ${isSelected ? 'bg-white text-moroccan-blue' : ''}`}
                  >
                    {status.text}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Weekend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span>Almost Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span>Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDateInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Available Time Slots - {selectedDateInfo.date.toLocaleDateString()}
              {selectedDateInfo.weatherForecast && (
                <Badge variant="outline" className="ml-2">
                  ☀️ {selectedDateInfo.weatherForecast}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateInfo.timeSlots.map((timeSlot, index) => {
                const isSelected = selectedTimeSlot === timeSlot.time;
                const spotsLeft = timeSlot.capacity - timeSlot.booked;
                const isLowAvailability = spotsLeft <= 3;
                
                return (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-moroccan-blue bg-moroccan-blue/5' 
                        : timeSlot.available 
                          ? 'border-gray-200 hover:border-moroccan-blue/50' 
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => handleTimeSlotSelect(timeSlot)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{timeSlot.time}</span>
                        {timeSlot.isPopular && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {timeSlot.isEarlyBird && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Zap className="w-3 h-3 mr-1" />
                            Early Bird
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-moroccan-red">
                          {timeSlot.price} MAD
                        </div>
                        {selectedDateInfo.isWeekend && (
                          <div className="text-xs text-orange-600">Weekend Rate</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{spotsLeft} spots left</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isLowAvailability ? (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className={isLowAvailability ? 'text-orange-600' : 'text-green-600'}>
                          {isLowAvailability ? 'Low availability' : 'Good availability'}
                        </span>
                      </div>
                    </div>
                    
                    {selectedDateInfo.specialOffer && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                        🎉 {selectedDateInfo.specialOffer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
