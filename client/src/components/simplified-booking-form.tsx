import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, Clock, Users, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface SimplifiedBookingFormProps {
  activityId: string;
  activityName: string;
  activityPrice: number;
  onSuccess?: () => void;
}

export default function SimplifiedBookingForm({ 
  activityId, 
  activityName, 
  activityPrice, 
  onSuccess 
}: SimplifiedBookingFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    numberOfPeople: 1,
    preferredDate: new Date()
  });

  // Fetch activity details
  const { data: activity } = useQuery({
    queryKey: ["/activities", activityId],
    queryFn: () => apiFetch(`/activities/${activityId}`),
  });

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiFetch("/bookings", {
        method: "POST",
        data: bookingData
      });
    },
    onSuccess: () => {
      toast({
        title: "Booking Successful! 🎉",
        description: "Your booking has been confirmed. We'll contact you via WhatsApp shortly.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = formData.numberOfPeople * activityPrice;
    
    bookingMutation.mutate({
      activityId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      numberOfPeople: formData.numberOfPeople,
      preferredDate: format(formData.preferredDate, 'yyyy-MM-dd'),
      totalAmount: totalAmount.toString(),
      paymentMethod: 'cash',
      status: 'pending'
    });
  };

  const totalAmount = formData.numberOfPeople * activityPrice;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-moroccan-blue">
          Book {activityName}
        </CardTitle>
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
          <span>{activityPrice} MAD</span>
          <span className="text-gray-500">per person</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field 1: Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Name *
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Enter your full name"
              required
              className="w-full"
            />
          </div>

          {/* Field 2: Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="+212 6XX XXX XXX"
              required
              className="w-full"
            />
          </div>

          {/* Field 3: Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (Optional)
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="your.email@example.com"
              className="w-full"
            />
          </div>

          {/* Field 4: Number of People */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPeople" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of People
            </Label>
            <Select 
              value={formData.numberOfPeople.toString()} 
              onValueChange={(value) => setFormData({ ...formData, numberOfPeople: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field 5: Preferred Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Preferred Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.preferredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.preferredDate ? format(formData.preferredDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.preferredDate}
                  onSelect={(date) => date && setFormData({ ...formData, preferredDate: date })}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Price per person:</span>
              <span className="font-semibold">{activityPrice} MAD</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Number of people:</span>
              <span className="font-semibold">{formData.numberOfPeople}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">{totalAmount} MAD</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-moroccan-blue hover:bg-moroccan-blue/90 text-white py-3 text-lg font-semibold"
            disabled={bookingMutation.isPending}
          >
            {bookingMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Book Now - {totalAmount} MAD
              </div>
            )}
          </Button>

          {/* Payment Info */}
          <div className="text-center text-sm text-gray-600">
            <p>💳 Payment: Cash on arrival</p>
            <p>📱 Confirmation: WhatsApp message</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
