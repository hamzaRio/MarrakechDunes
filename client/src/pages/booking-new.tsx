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
import { useLanguage } from "@/hooks/use-language";

const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Full name is required (minimum 2 characters)").regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens"),
  customerPhone: z.string().min(8, "Phone number is required").regex(/^\+\d{8,15}$/, "Please enter a valid international phone number"),
  customerEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  activityId: z.string().min(1, "Activity is required"),
  numberOfPeople: z.number().min(1, "At least 1 person required").max(20, "Maximum 20 people per booking"),
  preferredDate: z.string().min(1, "Date is required"),
  participantNames: z.array(z.string().min(2, "Full name is required (minimum 2 characters)").regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens")),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function Booking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);
  const [currentActivity, setCurrentActivity] = useState<ActivityType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'activity' | 'date' | 'details' | 'confirmation'>('activity');

  const { data: activities = [], isLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      activityId: "",
      numberOfPeople: 1,
      preferredDate: "",
      participantNames: [""],
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
  const totalAmount = watchedActivity ? Number(watchedActivity.price) * form.watch("numberOfPeople") : 0;

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-playfair text-moroccan-blue">
                    {t('bookingDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Step Indicator */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      {([
                        { key: 'activity', label: 'Select Activity', icon: MapPin },
                        { key: 'date', label: 'Select Date', icon: Calendar },
                        { key: 'details', label: 'Your Details', icon: User },
                        { key: 'confirmation', label: 'Confirmation', icon: CheckCircle }
                      ] as const).map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.key;
                        const isCompleted = ['activity', 'date', 'details', 'confirmation'].indexOf(currentStep) > index;
                        const stepOrder = ['activity', 'date', 'details', 'confirmation'];
                        const currentStepIndex = stepOrder.indexOf(currentStep);
                        const canNavigate = index <= currentStepIndex || isCompleted;
                        
                        const handleStepClick = () => {
                          if (!canNavigate) return;
                          
                          // Validate navigation requirements
                          if (step.key === 'date' && !currentActivity) {
                            toast({
                              title: "Please select an activity first",
                              description: "You need to choose an activity before selecting a date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (step.key === 'details' && !selectedDate) {
                            toast({
                              title: "Please select a date first",
                              description: "You need to choose a date before entering your details.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (step.key === 'confirmation' && (!form.watch('customerName') || !form.watch('customerPhone'))) {
                            toast({
                              title: "Please complete your details",
                              description: "Name and phone number are required to proceed.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setCurrentStep(step.key);
                        };
                        
                        return (
                          <div key={step.key} className="flex items-center">
                            <div 
                              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 cursor-pointer transition-colors ${
                                isActive ? 'bg-moroccan-blue text-white border-moroccan-blue' : 
                                isCompleted ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : 
                                canNavigate ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' :
                                'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                              }`}
                              onClick={handleStepClick}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span 
                              className={`ml-2 text-sm font-medium cursor-pointer transition-colors ${
                                isActive ? 'text-moroccan-blue' : 
                                isCompleted ? 'text-green-600 hover:text-green-700' : 
                                canNavigate ? 'text-gray-600 hover:text-gray-800' :
                                'text-gray-400'
                              }`}
                              onClick={handleStepClick}
                            >
                              {step.label}
                            </span>
                            {index < 3 && (
                              <div className={`mx-4 h-0.5 w-8 transition-colors ${
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
                                  const activity = activities.find(a => (a._id || a.id) === value);
                                  if (activity) {
                                    setCurrentActivity(activity);
                                    setCurrentStep('date');
                                  }
                                }}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose an activity" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-80 z-50 w-full min-w-[400px]">
                                    {activities.map((activity) => (
                                      <SelectItem 
                                        key={activity._id || activity.id} 
                                        value={activity._id || activity.id || ''}
                                        className="block w-full min-w-[400px] py-2 px-4 cursor-pointer hover:bg-moroccan-sand/20 focus:bg-moroccan-sand/20 text-sm"
                                        style={{
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          display: 'block',
                                          width: '100%'
                                        }}
                                      >
                                        {`${activity.name} – ${activity.duration || '8h'} – ${activity.price} ${activity.currency || 'MAD'}`}
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
                      {currentStep === 'date' && currentActivity && (
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
                            activityId={currentActivity.id!}
                            activityName={currentActivity.name}
                            basePrice={Number(currentActivity.price)}
                            selectedDate={selectedDate}
                            selectedTimeSlot={selectedTimeSlot}
                            onDateTimeSelect={(date, timeSlot) => {
                              setSelectedDate(date);
                              setSelectedTimeSlot(timeSlot);
                              form.setValue("preferredDate", date.toISOString().split('T')[0]);
                              form.setValue("preferredTime" as any, timeSlot.time);
                              form.setValue("slotId" as any, timeSlot.id);
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
                              onClick={() => setCurrentStep('date')}
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
                                      onChange={(value) => {
                                        const formattedValue = '+' + value;
                                        field.onChange(formattedValue);
                                      }}
                                      enableSearch={true}
                                      searchPlaceholder="Search countries"
                                      preferredCountries={['ma', 'fr', 'es', 'us', 'gb']}
                                      inputProps={{
                                        name: 'customerPhone',
                                        required: true,
                                        placeholder: 'Enter phone number',
                                        style: {
                                          width: '100%',
                                          height: '40px',
                                          fontSize: '14px',
                                          paddingLeft: '50px',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: '0 6px 6px 0',
                                          borderLeft: 'none',
                                          outline: 'none',
                                          backgroundColor: 'white'
                                        }
                                      }}
                                      buttonStyle={{
                                        border: '1px solid #e2e8f0',
                                        borderRight: 'none',
                                        borderRadius: '6px 0 0 6px',
                                        backgroundColor: 'white',
                                        height: '40px',
                                        width: '50px'
                                      }}
                                      dropdownStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                                        zIndex: 1000,
                                        maxHeight: '200px',
                                        overflow: 'auto'
                                      }}
                                      containerStyle={{
                                        width: '100%'
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customerEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="email"
                                      placeholder="your.email@example.com" 
                                      {...field}
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
                        <div className="space-y-8">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-moroccan-blue">Confirm Your Booking</h3>
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

                          {/* Customer Details Section */}
                          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-moroccan-blue mb-4 text-lg">Customer Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Full Name:</span>
                                <p className="text-gray-900 font-medium">{form.watch("customerName")}</p>
                              </div>
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Phone Number:</span>
                                <p className="text-gray-900 font-medium">{form.watch("customerPhone")}</p>
                              </div>
                              <div className="space-y-2">
                                <span className="text-sm font-medium text-gray-700">Number of People:</span>
                                <p className="text-gray-900 font-medium">{form.watch("numberOfPeople")} {form.watch("numberOfPeople") === 1 ? 'person' : 'people'}</p>
                              </div>
                              {form.watch("notes") && (
                                <div className="space-y-2 md:col-span-2">
                                  <span className="text-sm font-medium text-gray-700">Additional Notes:</span>
                                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{form.watch("notes")}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Activity & Schedule Section */}
                          {currentActivity && selectedDate && selectedTimeSlot && (
                            <div className="bg-moroccan-sand/20 p-6 rounded-lg border border-moroccan-gold/30">
                              <h4 className="font-semibold text-moroccan-blue mb-4 text-lg">Activity & Schedule</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Activity:</span>
                                    <p className="text-gray-900 font-medium text-lg">{currentActivity.name}</p>
                                    <p className="text-sm text-gray-600">{currentActivity.category}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                                    <p className="text-gray-900 font-medium">{currentActivity.duration}</p>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Date:</span>
                                    <p className="text-gray-900 font-medium text-lg">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Time:</span>
                                    <p className="text-gray-900 font-medium text-lg">{selectedTimeSlot.label}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pricing Summary */}
                          <div className="bg-gradient-to-r from-moroccan-blue/5 to-moroccan-red/5 p-6 rounded-lg border border-moroccan-blue/20">
                            <h4 className="font-semibold text-moroccan-blue mb-4 text-lg">Pricing Summary</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Price per person:</span>
                                <span className="font-medium text-gray-900">{selectedTimeSlot?.price || 0} MAD</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">Number of people:</span>
                                <span className="font-medium text-gray-900">{form.watch("numberOfPeople")}</span>
                              </div>
                              <div className="border-t pt-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold text-moroccan-blue">Total Amount:</span>
                                  <span className="text-2xl font-bold text-moroccan-red">{totalAmount} MAD</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment Info */}
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="font-medium text-green-800">Cash Payment Only</span>
                            </div>
                            <p className="text-sm text-green-700">
                              Payment is made in cash at the meeting point. No online payment required.
                            </p>
                          </div>

                          {/* Confirm Button */}
                          <Button
                            type="submit"
                            className="w-full bg-moroccan-red hover:bg-red-600 text-white py-3 text-lg font-semibold"
                            disabled={createBookingMutation.isPending}
                          >
                            {createBookingMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                Processing...
                              </>
                            ) : (
                              "Confirm Booking"
                            )}
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
              <div className="sticky top-8">
                <Card className="shadow-lg">
                  <CardHeader className="bg-moroccan-blue/5 border-b border-moroccan-blue/10">
                    <CardTitle className="text-xl font-playfair text-moroccan-blue flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Booking Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {watchedActivity ? (
                      <div className="space-y-6">
                        {/* Activity Info */}
                        <div className="pb-4 border-b border-gray-100">
                          <h4 className="font-semibold text-moroccan-blue text-lg mb-2">{watchedActivity.name}</h4>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {watchedActivity.category}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {watchedActivity.duration}
                            </p>
                          </div>
                        </div>
                        
                        {/* Date & Time */}
                        {selectedDate && selectedTimeSlot && (
                          <div className="pb-4 border-b border-gray-100">
                            <h5 className="font-medium text-moroccan-blue mb-3">Schedule</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Date:</span>
                                <span className="font-medium">{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Time:</span>
                                <span className="font-medium">{selectedTimeSlot.label}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Pricing */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-moroccan-blue">Pricing</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Price per person:</span>
                              <span className="font-medium">{selectedTimeSlot ? selectedTimeSlot.price : watchedActivity.price} MAD</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Number of people:</span>
                              <span className="font-medium">{form.watch("numberOfPeople")}</span>
                            </div>
                            <div className="flex justify-between items-center font-bold text-lg border-t pt-3 border-moroccan-blue/20">
                              <span className="text-moroccan-blue">Total:</span>
                              <span className="text-moroccan-red text-xl">{totalAmount} MAD</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm font-medium text-green-800">Cash Payment Only</span>
                          </div>
                          <p className="text-xs text-green-700">
                            Payment is made in cash at the meeting point. No online payment required.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Select an activity</p>
                        <p className="text-sm text-gray-400 mt-1">to see pricing details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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