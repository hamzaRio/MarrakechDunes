import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActivityType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CashPaymentConfirmation from "@/components/cash-payment-confirmation";
import AvailabilityCalendar from "@/components/availability-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Phone, User, Clock, MapPin, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useLanguage } from "@/hooks/useLanguage";

const bookingFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  activityId: z.string().min(1, "Activity is required"),
  numberOfPeople: z.number().min(1, "At least 1 person required"),
  preferredDate: z.string().min(1, "Date is required"),
  preferredTime: z.string().optional(),
  slotId: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

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

export default function Booking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);
  const [currentActivity, setCurrentActivity] = useState<ActivityType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | undefined>();
  const [currentStep, setCurrentStep] = useState<'activity' | 'datetime' | 'details' | 'confirmation'>('activity');

  const { data: activities = [], isLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      activityId: "",
      numberOfPeople: 1,
      preferredDate: "",
      preferredTime: "",
      slotId: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const activity = activities.find(a => a.id === data.activityId);
      if (!activity) throw new Error("Activity not found");
      
      const bookingData = {
        ...data,
        totalAmount: totalAmount,
        status: "pending" as const,
      };
      
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your booking has been successfully created!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      form.reset();
      setShowPaymentConfirmation(false);
      setPendingBookingData(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    setPendingBookingData(data);
    setShowPaymentConfirmation(true);
  };

  const handlePaymentConfirm = () => {
    if (pendingBookingData) {
      createBookingMutation.mutate(pendingBookingData);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentConfirmation(false);
    setPendingBookingData(null);
  };

  const watchedActivityId = form.watch("activityId");
  const watchedActivity = activities.find(a => a.id === watchedActivityId);
  const totalAmount = selectedTimeSlot ? selectedTimeSlot.price * form.watch("numberOfPeople") : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-moroccan-sand flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-moroccan-sand">
      <Navbar />
      
      {/* Header */}
      <section className="bg-moroccan-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            {t('bookAdventure')}
          </h1>
          <p className="text-xl text-blue-100">
            {t('bookingSubtitle')}
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-playfair text-moroccan-blue">
                    {t('bookingDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Step Indicator */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      {[
                        { key: 'activity', label: 'Select Activity', icon: MapPin },
                        { key: 'datetime', label: 'Date & Time', icon: Calendar },
                        { key: 'details', label: 'Your Details', icon: User },
                        { key: 'confirmation', label: 'Confirmation', icon: CheckCircle }
                      ].map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.key;
                        const isCompleted = ['activity', 'datetime', 'details', 'confirmation'].indexOf(currentStep) > index;
                        
                        return (
                          <div key={step.key} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                              isActive ? 'bg-moroccan-blue text-white border-moroccan-blue' : 
                              isCompleted ? 'bg-green-500 text-white border-green-500' : 
                              'bg-gray-100 text-gray-400 border-gray-300'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className={`ml-2 text-sm font-medium ${
                              isActive ? 'text-moroccan-blue' : 
                              isCompleted ? 'text-green-600' : 
                              'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                            {index < 3 && (
                              <div className={`mx-4 h-0.5 w-8 ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      {/* Step 1: Activity Selection */}
                      {currentStep === 'activity' && (
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-moroccan-blue">Choose Your Adventure</h3>
                          <FormField
                            control={form.control}
                            name="activityId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Activity</FormLabel>
                                <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  const activity = activities.find(a => a.id === value);
                                  if (activity) {
                                    setCurrentActivity(activity);
                                    setCurrentStep('datetime');
                                  }
                                }}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose an activity" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      {activities.map((activity) => (
                                        <SelectItem key={activity.id} value={activity.id ?? ''}>
                                          <div className="flex items-center space-x-3">
                                            <div>
                                              <p className="font-medium">{activity.name}</p>
                                              <p className="text-sm text-gray-600">{activity.duration} • {activity.price} MAD</p>
                                            </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Step 2: Date & Time Selection */}
                      {currentStep === 'datetime' && currentActivity && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-moroccan-blue">Select Date & Time</h3>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep('activity')}
                              className="text-sm"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Back
                            </Button>
                          </div>
                          
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-medium text-moroccan-blue mb-2">{currentActivity.name}</h4>
                            <p className="text-sm text-gray-600">{currentActivity.description}</p>
                          </div>

                          <AvailabilityCalendar
                            activityId={currentActivity.id ?? ''}
                            activityName={currentActivity.name}
                            basePrice={Number(currentActivity.price)}
                            selectedDate={selectedDate}
                            selectedTimeSlot={selectedTimeSlot}
                            onDateTimeSelect={(date, timeSlot) => {
                              setSelectedDate(date);
                              setSelectedTimeSlot(timeSlot);
                              form.setValue("preferredDate", date.toISOString().split('T')[0]);
                              form.setValue("preferredTime", timeSlot.time);
                              form.setValue("slotId", timeSlot.id);
                            }}
                          />

                          {selectedDate && selectedTimeSlot && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                onClick={() => setCurrentStep('details')}
                                className="bg-moroccan-blue hover:bg-blue-700"
                              >
                                Continue to Details
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 3: Customer Details */}
                      {currentStep === 'details' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-moroccan-blue">Your Details</h3>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep('datetime')}
                              className="text-sm"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Back
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="customerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <User className="w-4 h-4 mr-2" />
                                    {t('customerName')}
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder={t('customerName')} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="customerPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {t('customerPhone')}
                                  </FormLabel>
                                  <FormControl>
                                    <PhoneInput
                                      country={'ma'}
                                      value={field.value}
                                      onChange={field.onChange}
                                      inputClass="w-full"
                                      containerClass="w-full"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="numberOfPeople"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  {t('numberOfPeople')}
                                </FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('numberOfPeople')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                      <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? 'person' : 'people'}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('additionalNotes')}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t('additionalNotesPlaceholder')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() => setCurrentStep('confirmation')}
                              className="bg-moroccan-blue hover:bg-blue-700"
                            >
                              Review Booking
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Confirmation */}
                      {currentStep === 'confirmation' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-moroccan-blue">Confirm Your Booking</h3>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep('details')}
                              className="text-sm"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Back
                            </Button>
                          </div>

                          {currentActivity && selectedDate && selectedTimeSlot && (
                            <div className="bg-gray-50 p-6 rounded-lg border">
                              <h4 className="font-semibold text-moroccan-blue mb-4">Booking Summary</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Activity:</span>
                                  <p className="text-gray-600">{currentActivity.name}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span>
                                  <p className="text-gray-600">{selectedDate.toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Time:</span>
                                  <p className="text-gray-600">{selectedTimeSlot.label}</p>
                                </div>
                                <div>
                                  <span className="font-medium">People:</span>
                                  <p className="text-gray-600">{form.watch("numberOfPeople")}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Price per person:</span>
                                  <p className="text-gray-600">{selectedTimeSlot.price} MAD</p>
                                </div>
                                <div>
                                  <span className="font-medium">Total:</span>
                                  <p className="text-lg font-bold text-moroccan-red">{totalAmount} MAD</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-moroccan-red hover:bg-red-600 text-white"
                            disabled={createBookingMutation.isPending}
                          >
                            {createBookingMutation.isPending ? "Processing..." : "Confirm Booking"}
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-playfair text-moroccan-blue">
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {watchedActivity ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-moroccan-blue">{watchedActivity.name}</h4>
                        <p className="text-sm text-gray-600">{watchedActivity.category}</p>
                        <p className="text-sm text-gray-600">{watchedActivity.duration}</p>
                      </div>
                      
                      {selectedDate && selectedTimeSlot && (
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Selected Date:</span>
                            <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Selected Time:</span>
                            <span className="font-medium">{selectedTimeSlot.label}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Price per person:</span>
                          <span className="font-medium">{selectedTimeSlot ? selectedTimeSlot.price : watchedActivity.price} MAD</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Number of people:</span>
                          <span className="font-medium">{form.watch("numberOfPeople")}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span className="text-moroccan-red">{totalAmount} MAD</span>
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-medium">💰 Cash Payment Only</p>
                        <p className="text-xs text-green-700 mt-1">
                          Payment is made in cash at the meeting point. No online payment required.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Select an activity to see pricing details</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Cash Payment Confirmation Modal */}
      {showPaymentConfirmation && watchedActivity && pendingBookingData && (
        <CashPaymentConfirmation
          activity={watchedActivity}
          numberOfPeople={pendingBookingData.numberOfPeople}
          customerName={pendingBookingData.customerName}
          customerPhone={pendingBookingData.customerPhone}
          preferredDate={pendingBookingData.preferredDate}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      )}

      <Footer />
    </div>
  );
}