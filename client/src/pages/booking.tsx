import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActivityType, insertBookingSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppBooking } from "@/lib/whatsapp";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CashPaymentConfirmation from "@/components/cash-payment-confirmation";
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
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);

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
        form.setValue('activityId', activity.id);
        localStorage.removeItem('selectedActivity'); // Clean up
      } catch (error) {
        console.error('Error parsing stored activity:', error);
      }
    }
  }, [form]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const bookingData = {
        ...data,
        preferredDate: new Date(data.preferredDate),
        totalAmount: "0", // Will be calculated on the server
      };
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: async (response) => {
      const booking = await response.json();
      const bookingActivity = activities.find(a => a.id === booking.activityId);
      
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

  const currentSelectedActivity = selectedActivity || activities.find(a => a.id === form.watch("activityId"));
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
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                  inputStyle={{
                                    width: '100%',
                                    height: '40px',
                                    fontSize: '14px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    paddingLeft: '48px'
                                  }}
                                  buttonStyle={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px 0 0 6px'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="activityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('selectActivity')}</FormLabel>
                            {selectedActivity ? (
                              <div className="border rounded-lg p-4 bg-gray-50">
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
                                          field.onChange(0);
                                        }}
                                      >
                                        {t('change')}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <Select
                                onValueChange={(value) => {
                                  const activityId = parseInt(value);
                                  field.onChange(activityId);
                                  const activity = activities.find(a => a.id === activityId);
                                  if (activity) setSelectedActivity(activity);
                                }}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('chooseActivity')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {activities.map((activity) => (
                                    <SelectItem key={activity.id} value={activity.id.toString()}>
                                      {activity.name} - {activity.price} {activity.currency}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="preferredDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {t('preferredDate')}
                              </FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
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
                              <FormLabel className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {t('numberOfPeople')}
                              </FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num} {num === 1 ? t('person') : t('people')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('notes')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('notesPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-moroccan-gold hover:bg-moroccan-gold text-white"
                        disabled={isSubmitting || isLoading}
                      >
                        {isSubmitting ? t('submitting') : t('submit')}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-playfair text-moroccan-blue">
                    {t('bookingSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSelectedActivity ? (
                    <>
                      {/* Activity Image */}
                      <div className="mb-4">
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
                    <p className="text-gray-500">{t('selectActivity')}</p>
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
