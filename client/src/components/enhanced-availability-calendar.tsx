import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, Banknote } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import type { ActivityType } from "@shared/schema";

interface AvailabilityData {
  date: string;
  availableSlots: number;
  maxCapacity: number;
  bookings: number;
  status: 'available' | 'limited' | 'full';
  timeSlots: Array<{
    time: string;
    available: boolean;
    spots: number;
  }>;
}

interface EnhancedAvailabilityCalendarProps {
  activity: ActivityType;
  onDateSelect: (date: Date, timeSlot?: string) => void;
  selectedDate?: Date;
}

export default function EnhancedAvailabilityCalendar({
  activity,
  onDateSelect,
  selectedDate
}: EnhancedAvailabilityCalendarProps) {
  const { t } = useLanguage();
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  // Fetch availability data for the activity
  const { data: availability = [] } = useQuery<AvailabilityData[]>({
    queryKey: ["/activities", activity._id, "availability"],
    queryFn: async () => {
      // Mock data for now - in real implementation, this would fetch from backend
      const today = new Date();
      const availabilityData: AvailabilityData[] = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Simulate availability based on day of week
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const maxCapacity = isWeekend ? 20 : 15;
        const bookings = Math.floor(Math.random() * maxCapacity);
        const availableSlots = maxCapacity - bookings;
        
        let status: 'available' | 'limited' | 'full' = 'available';
        if (availableSlots === 0) status = 'full';
        else if (availableSlots <= 3) status = 'limited';
        
        availabilityData.push({
          date: date.toISOString().split('T')[0],
          availableSlots,
          maxCapacity,
          bookings,
          status,
          timeSlots: [
            { time: "09:00", available: availableSlots > 0, spots: Math.max(0, availableSlots - 5) },
            { time: "14:00", available: availableSlots > 5, spots: Math.max(0, availableSlots - 10) },
            { time: "16:00", available: availableSlots > 10, spots: availableSlots }
          ]
        });
      }
      
      return availabilityData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getAvailabilityForDate = (date: Date): AvailabilityData | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.date === dateStr);
  };

  const getDateClassName = (date: Date): string => {
    const avail = getAvailabilityForDate(date);
    if (!avail) return "";
    
    switch (avail.status) {
      case 'full': return "bg-red-100 text-red-800 line-through";
      case 'limited': return "bg-yellow-100 text-yellow-800";
      case 'available': return "bg-green-100 text-green-800";
      default: return "";
    }
  };

  const handleDateSelect = (date: Date) => {
    const avail = getAvailabilityForDate(date);
    if (avail && avail.status !== 'full') {
      onDateSelect(date);
    }
  };

  const handleTimeSelect = (timeSlot: string) => {
    if (selectedDate) {
      setSelectedTime(timeSlot);
      onDateSelect(selectedDate, timeSlot);
    }
  };

  const selectedDateAvailability = selectedDate ? getAvailabilityForDate(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* Cash Payment Reminder */}
      <Card className="border-moroccan-gold bg-moroccan-gold/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-5 h-5 text-moroccan-red" />
            <span className="font-semibold text-moroccan-red">{t('payment.cashOnly')}</span>
          </div>
          <p className="text-sm text-gray-700">{t('payment.cashOnlyDescription')}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('calendar.selectDateTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && handleDateSelect(date)}
              disabled={(date) => {
                const avail = getAvailabilityForDate(date);
                return date < new Date() || (avail && avail.status === 'full');
              }}
              modifiers={{
                available: (date) => {
                  const avail = getAvailabilityForDate(date);
                  return avail?.status === 'available';
                },
                limited: (date) => {
                  const avail = getAvailabilityForDate(date);
                  return avail?.status === 'limited';
                },
                full: (date) => {
                  const avail = getAvailabilityForDate(date);
                  return avail?.status === 'full';
                }
              }}
              modifiersClassNames={{
                available: "bg-green-100 text-green-800",
                limited: "bg-yellow-100 text-yellow-800", 
                full: "bg-red-100 text-red-800 line-through"
              }}
              className="mx-auto"
            />
            
            {/* Legend */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>{t('calendar.available')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>{t('calendar.limited')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded line-through"></div>
                <span>{t('calendar.unavailable')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots & Availability Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Available Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && selectedDateAvailability ? (
              <div className="space-y-4">
                <div className="bg-moroccan-sand/20 p-3 rounded-lg">
                  <h4 className="font-medium text-moroccan-blue mb-2">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{selectedDateAvailability.availableSlots} spots available</span>
                    </div>
                    <Badge 
                      variant={selectedDateAvailability.status === 'available' ? 'default' : 
                               selectedDateAvailability.status === 'limited' ? 'secondary' : 'destructive'}
                    >
                      {selectedDateAvailability.status}
                    </Badge>
                  </div>
                </div>

                {/* Time Slots */}
                <div className="space-y-2">
                  <h5 className="font-medium">Available Times:</h5>
                  {selectedDateAvailability.timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      className="w-full justify-between"
                      disabled={!slot.available}
                      onClick={() => handleTimeSelect(slot.time)}
                    >
                      <span>{slot.time}</span>
                      <div className="flex items-center gap-2">
                        {slot.available ? (
                          <>
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{slot.spots} spots</span>
                          </>
                        ) : (
                          <span className="text-sm text-red-500">Full</span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Cash Payment Reminder */}
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Payment Method</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Cash only - {parseInt(activity.price) * 1} MAD per person
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('calendar.selectDatePrompt')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
