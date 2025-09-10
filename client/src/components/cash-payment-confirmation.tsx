import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, MapPin, Phone, Calendar, Users, Banknote, User } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { ActivityType } from "@shared/schema";

interface CashPaymentConfirmationProps {
  activity: ActivityType;
  numberOfPeople: number;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CashPaymentConfirmation({
  activity,
  numberOfPeople,
  customerName,
  customerPhone,
  preferredDate,
  onConfirm,
  onCancel
}: CashPaymentConfirmationProps) {
  const { t } = useLanguage();
  const [isConfirming, setIsConfirming] = useState(false);
  
  const totalAmount = activity.price * numberOfPeople;
  const depositAmount = Math.round(totalAmount * 0.3); // 30% deposit
  const remainingAmount = totalAmount - depositAmount;

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center bg-moroccan-blue text-white">
          <CardTitle className="flex items-center justify-center gap-2">
            <Banknote className="w-6 h-6" />
            Cash Payment Confirmation
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Booking Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Booking Summary</h3>
            
            <div className="bg-moroccan-sand/20 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-moroccan-blue">{activity.name}</h4>
                  <p className="text-sm text-gray-600">{activity.category}</p>
                </div>
                <Badge variant="secondary" className="bg-moroccan-gold text-white">
                  {activity.duration}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-moroccan-blue" />
                  <span>{customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-moroccan-blue" />
                  <span>{customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-moroccan-blue" />
                  <span>{preferredDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-moroccan-blue" />
                  <span>{numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Payment Details</h3>
            
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Cash Payment Option</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Price per person:</span>
                  <span className="font-medium">{activity.price} MAD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Number of people:</span>
                  <span className="font-medium">{numberOfPeople}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-moroccan-blue">Total Amount:</span>
                  <span className="text-moroccan-red">{totalAmount} MAD</span>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Option 1: Full Payment</h4>
                <p className="text-sm text-blue-700 mb-3">Pay the complete amount on the day of activity</p>
                <div className="text-xl font-bold text-blue-600">{totalAmount} MAD</div>
                <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
                  Pay at pickup
                </Badge>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Option 2: Deposit + Balance</h4>
                <p className="text-sm text-orange-700 mb-3">Secure your booking with a deposit</p>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-orange-600">Deposit now:</span>
                    <span className="font-bold ml-2">{depositAmount} MAD</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-orange-600">Balance on day:</span>
                    <span className="font-bold ml-2">{remainingAmount} MAD</span>
                  </div>
                </div>
                <Badge variant="outline" className="mt-2 border-orange-300 text-orange-700">
                  Recommended
                </Badge>
              </div>
            </div>
          </div>

          {/* Meeting Point Information */}
          <div className="bg-moroccan-sand/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-moroccan-red" />
              <h4 className="font-medium text-moroccan-blue">Meeting Point & Payment</h4>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p>📍 <strong>Location:</strong> 54 Riad Zitoun Lakdim, Marrakech 40000</p>
              <p>💰 <strong>Payment:</strong> Cash only (MAD) - exact change preferred</p>
              <p>⏰ <strong>Arrival:</strong> Please arrive 15 minutes before scheduled time</p>
              <p>📱 <strong>Contact:</strong> Our team will confirm via WhatsApp</p>
            </div>
          </div>

          {/* Confirmation Steps */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">What happens next?</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-moroccan-blue text-white text-xs rounded-full flex items-center justify-center">1</div>
                <span className="text-sm">Booking confirmation sent via WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-moroccan-blue text-white text-xs rounded-full flex items-center justify-center">2</div>
                <span className="text-sm">Meeting point and timing details shared</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-moroccan-blue text-white text-xs rounded-full flex items-center justify-center">3</div>
                <span className="text-sm">Payment processed on arrival at meeting point</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-moroccan-blue text-white text-xs rounded-full flex items-center justify-center">4</div>
                <span className="text-sm">Begin your amazing Moroccan adventure!</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-moroccan-red hover:bg-red-600 text-white"
              disabled={isConfirming}
            >
              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Confirming...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Confirm Cash Booking
                </div>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By confirming this booking, you agree to pay in cash at the designated meeting point. 
            No online payment is required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}