import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActivityType } from "marrakechdunes-shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ensureArray } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CashPaymentConfirmation from "@/components/cash-payment-confirmation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Phone, User, MapPin, CheckCircle, ArrowLeft, ArrowRight, CalendarDays, Banknote } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import SEOHead, { seoConfigs } from "@/components/seo-head";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const namePattern = /^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\s'-]+$/u;

const createBookingFormSchema = (t: (key: string, options?: Record<string, unknown>) => string) =>
  z.object({
    customerName: z
      .string()
      .min(2, t('errors.customerNameRequired'))
      .regex(namePattern, t('errors.nameInvalidChars')),
    customerPhone: z
      .string()
      .min(8, t('errors.validPhoneRequired'))
      .regex(/^\+\d{8,15}$/, t('errors.phoneInvalid')),
    customerEmail: z
      .string()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.emailInvalid')),
    activityId: z
      .string()
      .min(1, t('errors.activitySelectionRequired')),
    numberOfPeople: z
      .number()
      .min(1, t('errors.atLeastOnePerson'))
      .max(20, t('errors.maximumTwentyPeople')),
    preferredDate: z
      .string()
      .min(1, t('errors.dateRequired')),
    participantNames: z.array(
      z
        .string()
        .min(2, t('errors.customerNameRequired'))
        .regex(namePattern, t('errors.nameInvalidChars')),
    ),
    notes: z
      .string()
      .max(500, t('errors.notesTooLong'))
      .optional(),
  });

type BookingFormSchema = ReturnType<typeof createBookingFormSchema>;
type BookingFormData = z.infer<BookingFormSchema>;


export default function BookingFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const seoConfig = seoConfigs.booking(language);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);
  const [currentActivity, setCurrentActivity] = useState<ActivityType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentStep, setCurrentStep] = useState<'activity' | 'date' | 'details' | 'confirmation'>('activity');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const { data: activities = [], isLoading, error } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
    retry: (failureCount, error) => {
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const activityList = ensureArray(activities);

  const bookingFormSchema = useMemo(() => createBookingFormSchema(t), [t]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      activityId: "",
      numberOfPeople: 1,
      preferredDate: new Date(),
      participantNames: [""],
      notes: "",
    },
    mode: "onChange",
  });

  // Phone number validation helper for international numbers
  const handlePhoneChange = (value: string, countryData: any) => {
    const formattedValue = '+' + value;
    form.setValue("customerPhone", formattedValue);
  };

  // Check for pre-selected activity from localStorage or URL params
  useEffect(() => {
    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const activityId = urlParams.get('activity');
    
    if (activityId && activityList.length > 0) {
      const activity = activityList.find(a => a.id === activityId || a._id === activityId);
      if (activity) {
        setCurrentActivity(activity);
        form.setValue("activityId", activity.id || activity._id);
        setCurrentStep('date');
        return;
      }
    }

    // Fallback to localStorage
    const selectedActivity = localStorage.getItem('selectedActivity');
    if (selectedActivity && activityList.length > 0) {
      try {
        const activity = JSON.parse(selectedActivity) as ActivityType;
        // Find the activity in the current activities list to ensure it's still valid
        const validActivity = activityList.find(a => a.id === activity.id || a._id === activity._id);
        if (validActivity) {
          setCurrentActivity(validActivity);
          form.setValue("activityId", validActivity.id || validActivity._id);
          setCurrentStep('date');
        }
        // Clear the localStorage after using it
        localStorage.removeItem('selectedActivity');
      } catch (error) {
        console.error('Error parsing selected activity:', error);
      }
    }
  }, [activityList.length]);

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "participantNames",
  });

  // Get watched activity first
  const watchedActivityId = form.watch("activityId");
  const watchedActivity = useMemo(() => 
    activityList.find(a => a.id === watchedActivityId || a._id === watchedActivityId),
    [activityList, watchedActivityId]
  );

  // Memoize expensive calculations
  const numberOfPeopleValue = form.watch("numberOfPeople");
  
  useEffect(() => {
    const names = Array(numberOfPeopleValue).fill("").map((_, i) => {
      const currentValue = form.getValues(`participantNames.${i}`);
      return currentValue || "";
    });
    replace(names);
  }, [numberOfPeopleValue, replace, form]);
  const totalAmount = useMemo(() => {
    return watchedActivity ? parseInt(watchedActivity.price) * numberOfPeopleValue : 0;
  }, [watchedActivity, numberOfPeopleValue]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/bookings"] });
      
      // Store booking data for confirmation page
      const bookingData = {
        activity: currentActivity!,
        numberOfPeople: form.getValues('numberOfPeople'),
        customerName: form.getValues('customerName'),
        customerPhone: form.getValues('customerPhone'),
        customerEmail: form.getValues('customerEmail'),
        preferredDate: form.getValues('preferredDate'),
        paymentType: data.paymentType || 'deposit',
        totalAmount: currentActivity!.price * form.getValues('numberOfPeople'),
        depositAmount: Math.round(currentActivity!.price * form.getValues('numberOfPeople') * 0.3),
        remainingAmount: Math.round(currentActivity!.price * form.getValues('numberOfPeople') * 0.7)
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      
      toast({
        title: "Booking Submitted!",
        description: "Redirecting to confirmation page...",
      });
      
      setShowPaymentConfirmation(false);
      setPendingBookingData(null);
      
      // Navigate to confirmation page
      window.location.href = '/confirmation-and-pay';
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
    // Ensure preferredDate is properly formatted as string
    const formattedData = {
      ...data,
      preferredDate: data.preferredDate instanceof Date 
        ? data.preferredDate.toISOString().split('T')[0]
        : data.preferredDate
    };
    setPendingBookingData(formattedData);
    setShowPaymentConfirmation(true);
  };

  const handlePaymentConfirm = (paymentType: 'full' | 'deposit') => {
    if (pendingBookingData) {
      // Always create booking as PENDING with unpaid status
      // Admin will confirm and set payment status later
      const bookingData = {
        ...pendingBookingData,
        paymentType,
        // Always start as unpaid - admin will confirm payment
        paymentStatus: 'unpaid'
      };
      createBookingMutation.mutate(bookingData);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentConfirmation(false);
    setPendingBookingData(null);
  };

  // Optimized validation function to prevent performance issues
  const handleContinueToConfirmation = useCallback(() => {
    const customerName = form.getValues("customerName");
    const customerPhone = form.getValues("customerPhone");
    const customerEmail = form.getValues("customerEmail");
    const participantNames = form.getValues("participantNames");
    
    // Quick validation checks
    if (!customerName || customerName.length < 2) {
      toast({
        title: "Name Required",
        description: "Please enter your full name (minimum 2 characters)",
        variant: "destructive",
      });
      return;
    }
    
    if (!/^[a-zA-Z\u00C0-\u00FF\s'-]+$/.test(customerName)) {
      toast({
        title: "Invalid Name Format",
        description: "Name can only contain letters, spaces, apostrophes, and hyphens",
        variant: "destructive",
      });
      return;
    }
    
    if (!customerPhone || !customerPhone.match(/^\+\d{8,15}$/)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please select your country and enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    
    if (customerEmail && customerEmail.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    const emptyNames = participantNames.filter(name => !name || name.length < 2);
    if (emptyNames.length > 0) {
      toast({
        title: "Participant Names Required",
        description: "Please enter the full name for all participants (minimum 2 characters)",
        variant: "destructive",
      });
      return;
    }
    
    const invalidNames = participantNames.filter(name => !/^[a-zA-Z\u00C0-\u00FF\s'-]+$/.test(name));
    if (invalidNames.length > 0) {
      toast({
        title: "Invalid Name Format",
        description: "All names can only contain letters, spaces, apostrophes, and hyphens",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep('confirmation');
  }, [form, toast]);
  
  const bookingSteps = useMemo(() => [
    { key: 'activity' as const, label: t('booking.steps.selectActivity'), icon: MapPin },
    { key: 'date' as const, label: t('booking.steps.selectDate'), icon: Calendar },
    { key: 'details' as const, label: t('booking.steps.details'), icon: User },
    { key: 'confirmation' as const, label: t('booking.steps.confirmation'), icon: CheckCircle },
  ], [t]);
  const stepOrder = useMemo(() => bookingSteps.map((step) => step.key), [bookingSteps]);

  // Handle activity selection
  const handleActivitySelect = (activityId: string) => {
    const selectedActivity = activityList.find(a => a.id === activityId || a._id === activityId);
    setCurrentActivity(selectedActivity || null);
    form.setValue("activityId", activityId);
    setCurrentStep('date');
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    form.setValue("preferredDate", date.toISOString().split('T')[0]);
    setCurrentStep('details');
  };



  if (error) {
    return (
      <div className="min-h-screen bg-moroccan-sand flex items-center justify-center">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-4 text-center">Server Error</h3>
          <p className="text-red-700 mb-6 text-center">
            We're having trouble loading our booking system. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-moroccan-sand flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-moroccan-sand">
      <SEOHead 
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
      />
      <Navbar />
      
      {/* Header */}
      <section className="bg-moroccan-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            {t('booking.title')}
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
              <Card className="shadow-xl bg-white/95 backdrop-blur-sm border-2 border-gray-200">
                <CardHeader className="bg-moroccan-blue/5 border-b border-moroccan-blue/20">
                  <CardTitle className="text-2xl font-playfair text-moroccan-blue">
                    {t('booking.bookingDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white/98">
                  {/* Step Indicator */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      {bookingSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.key;
                        const isCompleted = stepOrder.indexOf(currentStep) > index;
                        
                        return (
                          <div key={step.key} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                              isActive ? 'bg-moroccan-blue text-white border-moroccan-blue' : 
                              isCompleted ? 'bg-green-500 text-white border-green-500' : 
                              'bg-gray-200 text-gray-500 border-gray-300'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className={`ml-2 text-sm font-medium ${
                              isActive ? 'text-moroccan-blue' : 
                              isCompleted ? 'text-green-600' : 
                              'text-gray-500'
                            }`}>
                              {step.label}
                            </span>
                            {index < 3 && (
                              <div className={`w-12 h-0.5 mx-4 ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
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
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-playfair font-bold text-moroccan-blue mb-2">
                              {t('booking.activitySelection.title')}
                            </h3>
                            <p className="text-gray-600">
                              {t('booking.activitySelection.subtitle')}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {activityList.map((activity) => (
                              <div
                                key={activity.id || activity._id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                  currentActivity?.id === activity.id || currentActivity?._id === activity._id
                                    ? 'border-moroccan-blue bg-moroccan-blue/5'
                                    : 'border-gray-200 hover:border-moroccan-blue/50'
                                }`}
                                onClick={() => handleActivitySelect(activity.id || activity._id)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold text-moroccan-blue">{activity.name}</h4>
                                    <p className="text-sm text-gray-600">{activity.duration}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-moroccan-red">{activity.price} MAD</p>
                                    <p className="text-xs text-gray-500">per person</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 2: Date Selection */}
                      {currentStep === 'date' && (
                        <div className="space-y-6">
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-playfair font-bold text-moroccan-blue mb-2">
                              {t('booking.dateSelection.title')}
                            </h3>
                            <p className="text-gray-600">
                              {t('booking.dateSelection.subtitle')}
                            </p>
                          </div>
                          <div className="flex justify-end mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep('activity')}
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              {t('booking.previous')}
                            </Button>
                          </div>

                          {currentActivity && (
                            <div className="bg-moroccan-blue/5 p-4 rounded-lg">
                              <h4 className="font-medium text-moroccan-blue">{currentActivity.name}</h4>
                              <p className="text-sm text-gray-600">{currentActivity.duration} &bull; {currentActivity.price} MAD per person</p>
                            </div>
                          )}

                          <div className="flex justify-center">
                            <div className="bg-white p-6 rounded-lg border shadow-sm">
                              <DayPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  if (date) {
                                    handleDateSelect(date);
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                                modifiers={{
                                  selected: selectedDate,
                                }}
                                modifiersStyles={{
                                  selected: {
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                  },
                                }}
                                style={{
                                  '--rdp-cell-size': '50px',
                                  '--rdp-accent-color': '#1e40af',
                                  '--rdp-background-color': '#1e40af',
                                  '--rdp-accent-color-dark': '#1d4ed8',
                                  '--rdp-background-color-dark': '#1d4ed8',
                                  '--rdp-outline': '2px solid #1e40af',
                                  '--rdp-outline-selected': '2px solid #1e40af',
                                  '--rdp-selected-color': 'white',
                                } as React.CSSProperties}
                                className="rdp-custom morocco-calendar"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Details */}
                      {currentStep === 'details' && (
                        <div className="space-y-6">
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-playfair font-bold text-moroccan-blue mb-2">
                              {t('booking.customerDetailsForm.title')}
                            </h3>
                            <p className="text-gray-600">
                              {t('booking.customerDetailsForm.subtitle')}
                            </p>
                          </div>
                          <div className="flex justify-end mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep('date')}
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Back
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="customerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your full name (minimum 2 characters)" 
                                      {...field}
                                      required
                                    />
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
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <PhoneInput
                                      country={'ma'}
                                      value={field.value}
                                      onChange={(value, countryData) => handlePhoneChange(value, countryData)}
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
                                  <FormLabel>Email Address (Required for confirmation)</FormLabel>
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
                                <FormLabel>Number of People</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select number of people" />
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

                          {/* Participant Names */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-moroccan-blue">Participant Names</h4>
                            {fields.map((field, index) => (
                              <FormField
                                key={field.id}
                                control={form.control}
                                name={`participantNames.${index}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name of Person {index + 1} *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Enter full name (minimum 2 characters)" 
                                        {...field}
                                        required
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Additional Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Write any special requests or information here"
                                    className="min-h-[100px]"
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
                              onClick={handleContinueToConfirmation}
                              className="bg-moroccan-blue hover:bg-blue-700"
                            >
                              Continue to Review
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Confirmation */}
                      {currentStep === 'confirmation' && (
                        <div className="space-y-6">
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-playfair font-bold text-moroccan-blue mb-2">
                              {t('booking.confirmationStep.title')}
                            </h3>
                            <p className="text-gray-600">
                              {t('booking.confirmationStep.subtitle')}
                            </p>
                          </div>
                          <div className="flex justify-end mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCurrentStep('details')}
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              {t('booking.previous')}
                            </Button>
                          </div>

                          {/* Cash-Only Payment Notice */}
                          <div className="bg-moroccan-gold/20 border border-moroccan-gold p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Banknote className="w-5 h-5 text-moroccan-red" />
                              <h4 className="font-semibold text-moroccan-red">{t('payment.cashOnly')}</h4>
                            </div>
                            <p className="text-sm text-gray-700">
                              &bull; {t('payment.cashOnlyDescription')} {t('payment.exactChangePreferred')}.
                            </p>
                          </div>

                          <div className="bg-gray-50 p-6 rounded-lg border">
                            <h4 className="font-semibold text-moroccan-blue mb-4 text-lg">
                              {t('booking.confirmationStep.bookingSummary')}
                            </h4>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="font-medium">Activity:</span>
                                <span>{currentActivity?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Date:</span>
                                <span>{selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Number of People:</span>
                                <span>{form.watch("numberOfPeople")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Participants:</span>
                                <div className="text-right">
                                  {form.watch("participantNames").map((name, i) => (
                                    <div key={i}>{name}</div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Customer Name:</span>
                                <span>{form.watch("customerName")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Phone:</span>
                                <span>{form.watch("customerPhone")}</span>
                              </div>
                              {form.watch("customerEmail") && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Email:</span>
                                  <span>{form.watch("customerEmail")}</span>
                                </div>
                              )}
                              <div className="border-t pt-3">
                                <div className="flex justify-between text-lg font-bold">
                                  <span>Total Amount:</span>
                                  <span className="text-moroccan-red">{totalAmount} MAD</span>
                                </div>
                              </div>
                            </div>
                          </div>

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
              <div className="sticky top-8">
                <Card className="shadow-xl bg-white/95 backdrop-blur-sm border-2 border-gray-200">
                  <CardHeader className="bg-moroccan-blue/5 border-b border-moroccan-blue/20">
                    <CardTitle className="text-xl font-playfair text-moroccan-blue">
                      Booking Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-white/98">
                    {watchedActivity ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-moroccan-blue">{watchedActivity.name}</h4>
                          <p className="text-sm text-gray-600">{watchedActivity.category}</p>
                          <p className="text-sm text-gray-600">{watchedActivity.duration}</p>
                        </div>
                        
                        {selectedDate && (
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm">Selected Date:</span>
                              <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Price per person:</span>
                            <span className="font-medium">{watchedActivity.price} MAD</span>
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
                          <p className="text-sm text-green-800 font-medium">&bull; Cash Payment Only</p>
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
