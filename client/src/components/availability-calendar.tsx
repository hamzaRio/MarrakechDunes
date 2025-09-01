import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  DollarSign,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Check,
  X
} from "lucide-react";
import { format, addDays, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { useLanguage } from "@/hooks/useLanguage";

interface TimeSlot {
  id: string;
  time: string;
  label: string;
  capacity: number;
  booked: number;
  price: number;
  icon: React.ReactNode;
  available: boolean;
}

interface DayAvailability {
  date: Date;
  available: boolean;
  timeSlots: TimeSlot[];
  weather?: {
    condition: string;
    temperature: number;
    suitable: boolean;
  };
}

interface AvailabilityCalendarProps {
  activityId: string;
  activityName: string;
  basePrice: number;
  onDateTimeSelect: (date: Date, timeSlot: TimeSlot) => void;
  selectedDate?: Date;
  selectedTimeSlot?: TimeSlot;
}

export default function AvailabilityCalendar({
  activityId,
  activityName,
  basePrice,
  onDateTimeSelect,
  selectedDate,
  selectedTimeSlot
}: AvailabilityCalendarProps) {
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(selectedDate);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Generate mock availability data (in real app, this would come from API)
  const generateAvailability = (date: Date): DayAvailability => {
    const today = startOfDay(new Date());
    const isToday = isSameDay(date, today);
    const isPast = isBefore(date, today);
    const isFarFuture = isAfter(date, addDays(today, 90));

    // Generate time slots based on activity type
    let timeSlots: TimeSlot[] = [];
    
    if (activityName.toLowerCase().includes('balloon')) {
      // Hot air balloon - early morning only
      timeSlots = [
        {
          id: 'sunrise',
          time: '05:30',
          label: 'Sunrise Flight',
          capacity: 16,
          booked: Math.floor(Math.random() * 12),
          price: basePrice + (isToday ? 50 : 0),
          icon: <Sunrise className="h-4 w-4" />,
          available: !isPast && !isFarFuture
        }
      ];
    } else if (activityName.toLowerCase().includes('desert')) {
      // Desert tours - multiple slots
      timeSlots = [
        {
          id: 'morning',
          time: '08:00',
          label: 'Morning Departure',
          capacity: 20,
          booked: Math.floor(Math.random() * 15),
          price: basePrice,
          icon: <Sun className="h-4 w-4" />,
          available: !isPast && !isFarFuture
        },
        {
          id: 'afternoon',
          time: '14:00',
          label: 'Afternoon Adventure',
          capacity: 20,
          booked: Math.floor(Math.random() * 15),
          price: basePrice + 25,
          icon: <Sunset className="h-4 w-4" />,
          available: !isPast && !isFarFuture
        },
        {
          id: 'sunset',
          time: '17:30',
          label: 'Sunset Experience',
          capacity: 24,
          booked: Math.floor(Math.random() * 18),
          price: basePrice + 50,
          icon: <Moon className="h-4 w-4" />,
          available: !isPast && !isFarFuture
        }
      ];
    } else {
      // Other activities - standard slots
      timeSlots = [
        {
          id: 'morning',
          time: '09:00',
          label: 'Morning Tour',
          capacity: 15,
          booked: Math.floor(Math.random() * 10),
          price: basePrice,
          icon: <Sun className="h-4 w-4" />,
          available: !isPast && !isFarFuture
        },
        {
          id: 'afternoon',
          time: '15:00',
          label: 'Afternoon Tour',
          capacity: 15,
          booked: Math.floor(Math.random() * 10),
          price: basePrice + 20,
          icon: <Sunset className="h-4 w-4" />,
          available: !isPast && !isFarFuture
        }
      ];
    }

    // Update availability based on capacity
    timeSlots = timeSlots.map(slot => ({
      ...slot,
      available: slot.available && slot.booked < slot.capacity
    }));

    return {
      date,
      available: timeSlots.some(slot => slot.available),
      timeSlots,
      weather: {
        condition: ['sunny', 'partly-cloudy', 'clear'][Math.floor(Math.random() * 3)],
        temperature: 20 + Math.floor(Math.random() * 15),
        suitable: Math.random() > 0.1 // 90% suitable weather
      }
    };
  };

  const { data: availability } = useQuery({
    queryKey: [`/api/activities/${activityId}/availability`, currentMonth],
    queryFn: () => {
      // Generate availability for the current month
      const days: DayAvailability[] = [];
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        days.push(generateAvailability(new Date(date)));
      }
      
      return days;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getDayAvailability = (date: Date) => {
    return availability?.find(day => isSameDay(day.date, date));
  };

  const getAvailableSpots = (timeSlot: TimeSlot) => {
    return timeSlot.capacity - timeSlot.booked;
  };

  const getAvailabilityStatus = (timeSlot: TimeSlot) => {
    const available = getAvailableSpots(timeSlot);
    if (available === 0) return { label: 'Sold Out', color: 'bg-red-100 text-red-800' };
    if (available <= 3) return { label: `${available} left`, color: 'bg-orange-100 text-orange-800' };
    return { label: 'Available', color: 'bg-green-100 text-green-800' };
  };

  const selectedDayData = selectedDay ? getDayAvailability(selectedDay) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-moroccan-blue" />
          <h3 className="text-lg font-semibold text-moroccan-blue">
            Select Date & Time
          </h3>
        </div>
        <Select value={viewMode} onValueChange={(value: 'calendar' | 'list') => setViewMode(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="calendar">Calendar</SelectItem>
            <SelectItem value="list">List View</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Available Dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={setSelectedDay}
              onMonthChange={setCurrentMonth}
              disabled={(date) => {
                const dayData = getDayAvailability(date);
                return !dayData?.available || isBefore(date, startOfDay(new Date()));
              }}
              modifiers={{
                available: (date) => {
                  const dayData = getDayAvailability(date);
                  return dayData?.available || false;
                },
                booked: (date) => {
                  const dayData = getDayAvailability(date);
                  return dayData?.timeSlots.some(slot => slot.booked > slot.capacity * 0.8) || false;
                }
              }}
              modifiersStyles={{
                available: { 
                  backgroundColor: 'rgb(34, 197, 94)',
                  color: 'white',
                  fontWeight: 'bold'
                },
                booked: {
                  backgroundColor: 'rgb(249, 115, 22)',
                  color: 'white'
                }
              }}
              className="rounded-md border"
            />
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Limited</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>
                {selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'Select a Date'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayData ? (
              <div className="space-y-4">
                {selectedDayData.weather && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Weather Forecast</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedDayData.weather.suitable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDayData.weather.suitable ? 'Perfect Conditions' : 'Check Weather'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {selectedDayData.weather.condition.charAt(0).toUpperCase() + selectedDayData.weather.condition.slice(1)}, {selectedDayData.weather.temperature}°C
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedDayData.timeSlots.map((slot) => {
                    const status = getAvailabilityStatus(slot);
                    const isSelected = selectedTimeSlot?.id === slot.id;
                    
                    return (
                      <div
                        key={slot.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-moroccan-blue bg-blue-50' 
                            : slot.available 
                              ? 'border-gray-200 hover:border-moroccan-blue hover:bg-gray-50' 
                              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => {
                          if (slot.available && selectedDay) {
                            onDateTimeSelect(selectedDay, slot);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-moroccan-blue">
                              {slot.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {slot.time} - {slot.label}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center space-x-2">
                                <Users className="h-3 w-3" />
                                <span>{getAvailableSpots(slot)} of {slot.capacity} spots available</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="font-bold text-lg text-moroccan-blue">
                                {slot.price} MAD
                              </div>
                              {slot.price !== basePrice && (
                                <div className="text-xs text-gray-500">
                                  +{slot.price - basePrice} MAD
                                </div>
                              )}
                            </div>
                            
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            
                            {slot.available ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedDayData.timeSlots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No time slots available for this date
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Please select a date to view available time slots
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selection Summary */}
      {selectedDay && selectedTimeSlot && (
        <Card className="bg-gradient-to-r from-moroccan-blue to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold mb-2">Selected Booking</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{format(selectedDay, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{selectedTimeSlot.time} - {selectedTimeSlot.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{selectedTimeSlot.price} MAD per person</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {selectedTimeSlot.price} MAD
                </div>
                <div className="text-blue-100 text-sm">
                  per person
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}