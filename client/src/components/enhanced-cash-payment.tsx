import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  Users, 
  Banknote, 
  User,
  Shield,
  Star,
  Gift,
  AlertCircle
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { ActivityType } from "marrakechdunes-shared/schema";

interface EnhancedCashPaymentProps {
  activity: ActivityType;
  numberOfPeople: number;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  onConfirm: (paymentOption: string) => void;
  onCancel: () => void;
}

export default function EnhancedCashPayment({
  activity,
  numberOfPeople,
  customerName,
  customerPhone,
  preferredDate,
  onConfirm,
  onCancel
}: EnhancedCashPaymentProps) {
  const { t } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<string>("full");
  const [isConfirming, setIsConfirming] = useState(false);
  
  const totalAmount = Number(activity.price) * numberOfPeople;
  const depositAmount = Math.round(totalAmount * 0.3); // 30% deposit
  const remainingAmount = totalAmount - depositAmount;
  const earlyBirdDiscount = Math.round(totalAmount * 0.1); // 10% early bird
  const groupDiscount = numberOfPeople >= 4 ? Math.round(totalAmount * 0.05) : 0; // 5% group discount

  const paymentOptions = [
    {
      id: "full",
      title: "Full Payment on Arrival",
      description: "Pay complete amount when you arrive at meeting point",
      amount: totalAmount,
      discount: 0,
      finalAmount: totalAmount,
      icon: <Banknote className="w-5 h-5" />,
      color: "bg-blue-50 border-blue-200",
      badge: "Most Popular",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      id: "deposit",
      title: "Secure with Deposit",
      description: "Pay 30% now to secure your booking, balance on arrival",
      amount: depositAmount,
      discount: 0,
      finalAmount: depositAmount,
      icon: <Shield className="w-5 h-5" />,
      color: "bg-orange-50 border-orange-200",
      badge: "Recommended",
      badgeColor: "bg-orange-100 text-orange-800"
    },
    {
      id: "early_bird",
      title: "Early Bird Special",
      description: "Pay full amount 7 days in advance and save 10%",
      amount: totalAmount,
      discount: earlyBirdDiscount,
      finalAmount: totalAmount - earlyBirdDiscount,
      icon: <Star className="w-5 h-5" />,
      color: "bg-green-50 border-green-200",
      badge: "Save 10%",
      badgeColor: "bg-green-100 text-green-800",
      condition: "Must pay 7 days before activity"
    },
    {
      id: "group",
      title: "Group Discount",
      description: "Special rate for groups of 4+ people",
      amount: totalAmount,
      discount: groupDiscount,
      finalAmount: totalAmount - groupDiscount,
      icon: <Gift className="w-5 h-5" />,
      color: "bg-purple-50 border-purple-200",
      badge: "Group Rate",
      badgeColor: "bg-purple-100 text-purple-800",
      condition: numberOfPeople >= 4 ? "Available" : "Need 4+ people"
    }
  ];

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm(selectedOption);
    setIsConfirming(false);
  };

  const selectedPayment = paymentOptions.find(option => option.id === selectedOption);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center bg-moroccan-blue text-white">
          <CardTitle className="flex items-center justify-center gap-2">
            <Banknote className="w-6 h-6" />
            Cash Payment Options
          </CardTitle>
          <p className="text-moroccan-gold">Choose your preferred payment method</p>
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

          {/* Payment Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Choose Payment Method</h3>
            
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-4">
              {paymentOptions.map((option) => (
                <div key={option.id} className={`border-2 rounded-lg p-4 transition-all ${
                  selectedOption === option.id 
                    ? 'border-moroccan-red bg-moroccan-red/5' 
                    : 'border-gray-200 hover:border-moroccan-blue/50'
                }`}>
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${option.color}`}>
                          {option.icon}
                        </div>
                        <div>
                          <Label htmlFor={option.id} className="text-lg font-semibold cursor-pointer">
                            {option.title}
                          </Label>
                          {option.badge && (
                            <Badge className={`ml-2 ${option.badgeColor}`}>
                              {option.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{option.description}</p>
                      
                      {option.condition && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{option.condition}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          {option.discount > 0 && (
                            <div className="text-sm text-gray-500 line-through">
                              {option.amount} MAD
                            </div>
                          )}
                          <div className="text-xl font-bold text-moroccan-red">
                            {option.finalAmount} MAD
                          </div>
                          {option.discount > 0 && (
                            <div className="text-sm text-green-600 font-medium">
                              You save {option.discount} MAD!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Selected Payment Summary */}
          {selectedPayment && (
            <div className="bg-moroccan-sand/30 p-4 rounded-lg">
              <h4 className="font-medium text-moroccan-blue mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Selected Option:</span>
                  <span className="font-medium">{selectedPayment.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount to Pay:</span>
                  <span className="font-bold text-moroccan-red">{selectedPayment.finalAmount} MAD</span>
                </div>
                {selectedPayment.id === 'deposit' && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Balance on arrival:</span>
                    <span>{remainingAmount} MAD</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
              <p>🛡️ <strong>Security:</strong> All payments are secure and receipted</p>
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
            No online payment is required. All transactions are secure and receipted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
