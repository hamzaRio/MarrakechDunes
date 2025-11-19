import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  Users, 
  Banknote, 
  User, 
  Mail,
  MessageCircle,
  ArrowLeft,
  Home
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { ActivityType } from "marrakechdunes-shared/schema";

interface BookingConfirmationData {
  activity: ActivityType;
  numberOfPeople: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  preferredDate: string;
  paymentType: 'full' | 'deposit';
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
}

export default function BookingConfirmationPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [bookingData, setBookingData] = useState<BookingConfirmationData | null>(null);

  useEffect(() => {
    // Get booking data from localStorage
    const data = JSON.parse(localStorage.getItem('pendingBooking') || 'null');
    if (data) {
      setBookingData(data);
    } else {
      // Redirect to booking form if no data
      setLocation('/booking');
    }
  }, [setLocation]);

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-moroccan-sand flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-moroccan-blue" />
          <p className="text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  const handleBackToBooking = () => {
    setLocation('/booking');
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-moroccan-sand">
      {/* Header */}
      <section className="bg-moroccan-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-300" />
            <h1 className="font-playfair text-4xl md:text-5xl font-bold">
              Booking Submitted
            </h1>
          </div>
          <p className="text-xl text-blue-100">
            Your reservation is pending confirmation
          </p>
        </div>
      </section>

      {/* Booking Details */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white shadow-xl border-2 border-moroccan-blue/20">
            <CardHeader className="bg-gradient-to-r from-moroccan-blue to-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Activity Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-moroccan-blue" />
                    <div>
                      <h3 className="font-semibold text-lg">{bookingData.activity.name}</h3>
                      <p className="text-gray-600">{bookingData.activity.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-moroccan-blue" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-gray-600">{new Date(bookingData.preferredDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-moroccan-blue" />
                    <div>
                      <p className="font-medium">Number of People</p>
                      <p className="text-gray-600">{bookingData.numberOfPeople} {bookingData.numberOfPeople === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-moroccan-blue" />
                    <div>
                      <p className="font-medium">Customer</p>
                      <p className="text-gray-600">{bookingData.customerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-moroccan-blue" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{bookingData.customerPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-moroccan-blue" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">{bookingData.customerEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-moroccan-blue" />
                  Payment Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-moroccan-blue">{bookingData.totalAmount} MAD</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <p className="text-sm text-gray-600 mb-1">Payment Type</p>
                    <Badge variant={bookingData.paymentType === 'full' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                      {bookingData.paymentType === 'full' ? 'Full Payment' : 'Deposit Only'}
                    </Badge>
                  </div>
                  
                  {bookingData.paymentType === 'deposit' && (
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <p className="text-sm text-gray-600 mb-1">Remaining</p>
                      <p className="text-xl font-bold text-orange-600">{bookingData.remainingAmount} MAD</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-blue-900 mb-2">Booking Status</h3>
                    <p className="text-blue-800 mb-4">
                      Your booking has been submitted and is pending confirmation by our team. 
                      We will contact you shortly to confirm the details and provide pickup information.
                    </p>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        <strong>What happens next:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1 ml-4">
                        <li>• Our team will review your booking within 24 hours</li>
                        <li>• You'll receive a confirmation via WhatsApp or email</li>
                        <li>• We'll provide pickup details and final instructions</li>
                        <li>• Payment will be collected in cash at the meeting point</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-green-900 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    How We'll Contact You
                  </h3>
                  <p className="text-sm text-green-900/80">
                    You will receive an update by WhatsApp first, then by email if we cannot reach you. 
                    You can also contact our agency directly using the details below.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { name: "Ahmed", role: "Desert Specialist", phone: "+212600623630" },
                    { name: "Yahia", role: "Mountain Guide", phone: "+212693323368" },
                    { name: "Nadia", role: "Guest Experience", phone: "+212654497354" },
                  ].map((contact) => {
                    const message = encodeURIComponent(
                      `Hello ${contact.name}, I just booked ${bookingData.activity?.name || 'an activity'} on MarrakechDunes.`
                    );
                    const whatsappLink = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${message}`;
                    return (
                      <div key={contact.phone} className="p-4 bg-white rounded-lg border flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-600">{contact.role}</p>
                            <p className="text-sm text-gray-700">{contact.phone}</p>
                          </div>
                        </div>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-green-700 hover:text-green-900 underline"
                        >
                          Chat on WhatsApp
                        </a>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border flex items-center gap-3">
                    <Mail className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Agency Email</p>
                      <a
                        href="mailto:contact@marrakechdunes.com"
                        className="text-sm text-green-700 hover:text-green-900 underline"
                      >
                        contact@marrakechdunes.com
                      </a>
                      <p className="text-xs text-gray-500">We respond within the same day.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Office Hours</p>
                      <p className="text-sm text-gray-600">Every day • 08:00 – 20:00</p>
                      <p className="text-xs text-gray-500">Call or visit us for any assistance.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-2 mb-2 text-moroccan-blue">
                    <MapPin className="w-5 h-5" />
                    <p className="font-semibold">Where to meet & pay</p>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Agency & Payment Center:</strong> 54 Riad Zitoun Lakdim, Marrakech 40000. You can visit this office to ask questions or pay your deposit in cash before the activity.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <strong>Activity Meeting Point:</strong> {bookingData.activity?.location || "Confirmed by our team during the follow-up call"}.
                    Cash payments are collected at the meeting/drop-off point on the day of the experience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button
              onClick={handleBackToBooking}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Booking
            </Button>
            
            <Button
              onClick={handleGoHome}
              className="flex items-center gap-2 px-6 py-3 bg-moroccan-blue hover:bg-moroccan-blue/90"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

