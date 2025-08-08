import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActivityType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppBooking } from "@/lib/whatsapp";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PriceComparison from "@/components/price-comparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Phone, User, CreditCard } from "lucide-react";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useLanguage } from "@/hooks/useLanguage";

const bookingFormSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerPhone: z.string().min(1, "Phone is required"),
  activityId: z.string().min(1, "Activity is required"),
  numberOfPeople: z.number().min(1, "At least 1 person required"),
  preferredDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function Booking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
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
      notes: "",
    },
  });

  // Check for pre-selected activity from localStorage
  useEffect(() => {
    const storedActivity = localStorage.getItem('selectedActivity');
    if (storedActivity) {
      try {
        const activity = JSON.parse(storedActivity);
        setSelectedActivity(activity);
        form.setValue('activityId', activity._id || activity.id);
        localStorage.removeItem('selectedActivity'); // Clean up
      } catch (error) {
        console.error('Error parsing stored activity:', error);
      }
    }
  }, [form]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const bookingData = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        activityId: data.activityId,
        numberOfPeople: data.numberOfPeople,
        preferredDate: new Date(data.preferredDate),
        totalAmount: "0", // Will be calculated on the server
        notes: data.notes || "",
        status: "pending",
        paymentStatus: "unpaid" as const,
        paidAmount: 0,
      };
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: async (response) => {
      const booking = await response.json();
      const bookingActivity = activities.find(a => a._id === booking.activityId || a.id === booking.activityId);
      
      if (bookingActivity) {
        // Send WhatsApp notifications
        await sendWhatsAppBooking(booking, bookingActivity);
      }
      
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been submitted. We'll contact you via WhatsApp shortly.",
      });
      
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    createBookingMutation.mutate(data);
  };

  const currentSelectedActivity = selectedActivity || activities.find(a => a._id === form.watch("activityId") || a.id === form.watch("activityId"));
  const totalAmount = currentSelectedActivity ? parseFloat(currentSelectedActivity.price) * form.watch("numberOfPeople") : 0;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="order-2 lg:order-1">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-moroccan-blue to-blue-600 text-white">
                  <CardTitle className="text-2xl font-playfair flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white text-moroccan-blue flex items-center justify-center mr-3 text-lg font-bold">
                      1
                    </div>
                    {t('bookingDetails') || 'Booking Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Personal Information Section */}
                      <div className="space-y-6">
                        <div className="flex items-center text-moroccan-blue mb-4">
                          <div className="w-8 h-8 rounded-full bg-moroccan-blue text-white flex items-center justify-center mr-3 text-sm font-bold">
                            1
                          </div>
                          <h3 className="text-lg font-semibold">Personal Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center text-base font-medium text-gray-700">
                                  <User className="w-4 h-4 mr-2" />
                                  {t('customerName') || 'Full Name'}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={String(t('customerName') as string)}
                                    {...field}
                                    className="h-12 text-base border-2 border-gray-200 hover:border-moroccan-gold focus:border-moroccan-gold"
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
                                <FormLabel className="flex items-center text-base font-medium text-gray-700">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {t('customerPhone') || 'Phone Number'}
                                </FormLabel>
                                <FormControl>
                                  <PhoneInput
                                    country={'ma'}
                                    value={field.value}
                                    onChange={field.onChange}
                                    inputStyle={{
                                      width: '100%',
                                      height: '48px',
                                      fontSize: '16px',
                                      borderRadius: '6px',
                                      border: '2px solid #e2e8f0',
                                      paddingLeft: '48px'
                                    }}
                                    buttonStyle={{
                                      border: '2px solid #e2e8f0',
                                      borderRadius: '6px 0 0 6px',
                                      height: '48px'
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Activity Selection Section */}
                      <div className="space-y-6">
                        <div className="flex items-center text-moroccan-blue mb-4">
                          <div className="w-8 h-8 rounded-full bg-moroccan-blue text-white flex items-center justify-center mr-3 text-sm font-bold">
                            2
                          </div>
                          <h3 className="text-lg font-semibold">Select Your Experience</h3>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="activityId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium text-gray-700">{t('selectActivity') || 'Choose Activity'}</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    const activity = activities.find(a => (a._id || a.id) === value);
                                    if (activity) setSelectedActivity(activity);
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger className="h-12 text-base border-2 border-gray-200 hover:border-moroccan-gold focus:border-moroccan-gold w-full">
                                    <SelectValue placeholder={t('chooseActivity') || 'Select an activity...'} />
                                  </SelectTrigger>
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
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Selected Activity Display */}
                        {selectedActivity && (
                          <div className="border rounded-lg p-4 bg-gray-50 mt-4">
                            <div className="flex items-start space-x-4">
                              <img
                                src={selectedActivity.image}
                                alt={selectedActivity.name}
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                  const fallbackImages: { [key: string]: string } = {
                                    'Hot Air Balloon': '/assets/montgolfiere-1.jpg',
                                    'Balloon': '/assets/hot-air-balloon1.jpg',
                                    'Agafay': '/assets/agafay-1.jpg',
                                    'Essaouira': '/assets/essaouira-1.jpg',
                                    'Ourika': '/assets/ourika-valley-1.jpg',
                                    'Ouzoud': '/assets/ouzoud-1.jpg'
                                  };
                                  
                                  const activityName = selectedActivity.name;
                                  const fallbackImage = Object.keys(fallbackImages).find(key => 
                                    activityName.toLowerCase().includes(key.toLowerCase())
                                  );
                                  
                                  if (fallbackImage && !e.currentTarget.src.includes(fallbackImages[fallbackImage])) {
                                    e.currentTarget.src = fallbackImages[fallbackImage];
                                  } else if (!e.currentTarget.src.includes('unsplash')) {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200";
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-moroccan-blue">{selectedActivity.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{selectedActivity.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-lg font-bold text-moroccan-red">
                                    {selectedActivity.price} {selectedActivity.currency || 'MAD'}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedActivity(null);
                                      form.setValue('activityId', '');
                                    }}
                                  >
                                    Change
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Booking Details Section */}
                      <div className="space-y-6">
                        <div className="flex items-center text-moroccan-blue mb-4">
                          <div className="w-8 h-8 rounded-full bg-moroccan-blue text-white flex items-center justify-center mr-3 text-sm font-bold">
                            3
                          </div>
                          <h3 className="text-lg font-semibold">Booking Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="preferredDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center text-base font-medium text-gray-700">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {t('preferredDate') || 'Preferred Date'}
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    className="h-12 text-base border-2 border-gray-200 hover:border-moroccan-gold focus:border-moroccan-gold"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="numberOfPeople"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center text-base font-medium text-gray-700">
                                  <Users className="w-4 h-4 mr-2" />
                                  {t('numberOfPeople') || 'Number of People'}
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-12 text-base border-2 border-gray-200 hover:border-moroccan-gold focus:border-moroccan-gold">
                                      <SelectValue placeholder={t('selectNumberOfPeople') || 'Select number of people'} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                      <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? (t('person') || 'person') : (t('people') || 'people')}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Additional Notes Section */}
                      <div className="space-y-6">
                        <div className="flex items-center text-moroccan-blue mb-4">
                          <div className="w-8 h-8 rounded-full bg-moroccan-blue text-white flex items-center justify-center mr-3 text-sm font-bold">
                            4
                          </div>
                          <h3 className="text-lg font-semibold">Additional Information</h3>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-medium text-gray-700">
                                {t('notes') || 'Special Requests or Notes'}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder={t('notesPlaceholder') || 'Any special requests, dietary requirements, or additional information...'}
                                  {...field}
                                  className="min-h-[100px] text-base border-2 border-gray-200 hover:border-moroccan-gold focus:border-moroccan-gold resize-none"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-6 border-t border-gray-200">
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-moroccan-gold to-yellow-500 hover:from-moroccan-gold hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={isSubmitting || isLoading}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              {t('submitting') || 'Submitting...'}
                            </>
                          ) : (
                            t('submit') || 'Complete Booking'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="order-1 lg:order-2">
              <Card className="shadow-lg border-0 sticky top-8">
                <CardHeader className="bg-gradient-to-r from-moroccan-gold to-yellow-500 text-white">
                  <CardTitle className="text-xl font-playfair flex items-center">
                    <div className="w-8 h-8 rounded-full bg-white text-moroccan-gold flex items-center justify-center mr-3 text-lg font-bold">
                      2
                    </div>
                    {t('bookingSummary') || 'Booking Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {currentSelectedActivity ? (
                    <>
                      {/* Activity Image */}
                      <div className="mb-6">
                        <img
                          src={currentSelectedActivity.image || currentSelectedActivity.photos?.[0] || "/assets/agafay-1.jpg"}
                          alt={currentSelectedActivity.name}
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            const fallbackImages: { [key: string]: string } = {
                              'Hot Air Balloon': '/assets/montgolfiere-1.jpg',
                              'Balloon': '/assets/hot-air-balloon1.jpg',
                              'Agafay': '/assets/agafay-1.jpg',
                              'Essaouira': '/assets/essaouira-1.jpg',
                              'Ourika': '/assets/ourika-valley-1.jpg',
                              'Ouzoud': '/assets/ouzoud-1.jpg'
                            };
                            
                            const activityName = currentSelectedActivity.name;
                            const fallbackImage = Object.keys(fallbackImages).find(key => 
                              activityName.toLowerCase().includes(key.toLowerCase())
                            );
                            
                            if (fallbackImage && !e.currentTarget.src.includes(fallbackImages[fallbackImage])) {
                              e.currentTarget.src = fallbackImages[fallbackImage];
                            } else if (!e.currentTarget.src.includes('unsplash')) {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg text-moroccan-blue">{currentSelectedActivity.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-moroccan-gold/10 text-moroccan-gold">
                            {currentSelectedActivity.category}
                          </span>
                          <span className="text-sm text-gray-500">
                            {currentSelectedActivity.duration}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">{currentSelectedActivity.description}</p>
                      </div>
                      
                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('pricePerPerson')}:</span>
                          <span className="font-semibold text-moroccan-red">{currentSelectedActivity.price} MAD</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('numberOfPeople')}:</span>
                          <span className="font-semibold">{form.watch("numberOfPeople")}</span>
                        </div>
                        {form.watch("preferredDate") && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t('preferredDate')}:</span>
                            <span className="font-semibold">{new Date(form.watch("preferredDate")).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold">{t('totalAmount')}:</span>
                            <span className="text-xl font-bold text-moroccan-red">{totalAmount} MAD</span>
                          </div>
                        </div>
                        <div className="bg-moroccan-sand/30 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">{t('paymentInfo')}</p>
                          <p className="text-xs text-gray-600">{t('cancellationPolicy')}</p>
                        </div>
                      </div>

                      {/* Price Comparison */}
                      <div className="border-t pt-4">
                        <PriceComparison activity={currentSelectedActivity} className="shadow-sm" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {t('selectActivityTitle') || 'Select an activity to see pricing details'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {t('selectActivityDescription') || 'Choose from our amazing Moroccan experiences below'}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span className="font-medium">{t('paymentInfo')}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('cancellationPolicy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
