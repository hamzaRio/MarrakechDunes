import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  MapPin
} from "lucide-react";

interface PaymentFlowEnhancements {
  paymentOptions: {
    fullPayment: {
      amount: number;
      discount: number;
      benefits: string[];
    };
    depositPayment: {
      depositAmount: number;
      balanceAmount: number;
      securityBenefits: string[];
    };
    earlyBirdSpecial: {
      discount: number;
      deadline: Date;
      savings: number;
    };
  };
}

interface PaymentStatus {
  status: 'unpaid' | 'deposit_paid' | 'fully_paid';
  paidAmount: number;
  remainingAmount: number;
  depositAmount?: number;
  paymentMethod: 'cash' | 'cash_deposit';
}

interface EnhancedPaymentFlowProps {
  activity: any;
  numberOfPeople: number;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  onPaymentConfirm: (paymentData: any) => void;
  onCancel: () => void;
}

export default function EnhancedPaymentFlow({
  activity,
  numberOfPeople,
  customerName,
  customerPhone,
  preferredDate,
  onPaymentConfirm,
  onCancel
}: EnhancedPaymentFlowProps) {
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("full");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlowEnhancements | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const totalAmount = activity.price * numberOfPeople;
  const depositAmount = Math.round(totalAmount * 0.3);
  const earlyBirdDiscount = Math.round(totalAmount * 0.1);
  const groupDiscount = numberOfPeople >= 4 ? Math.round(totalAmount * 0.05) : 0;
  const totalSavings = earlyBirdDiscount + groupDiscount;

  useEffect(() => {
    const flow: PaymentFlowEnhancements = {
      paymentOptions: {
        fullPayment: {
          amount: totalAmount,
          discount: totalSavings,
          benefits: [
            "Aucun paiement d'avance requis",
            "Flexibilité maximale",
            `Économies: ${totalSavings} MAD`,
            "Confirmation immédiate"
          ]
        },
        depositPayment: {
          depositAmount: depositAmount,
          balanceAmount: totalAmount - depositAmount,
          securityBenefits: [
            "Sécurise votre réservation",
            "Réduit les annulations",
            "Confirmation immédiate",
            `Solde à l'arrivée: ${totalAmount - depositAmount} MAD`
          ]
        },
        earlyBirdSpecial: {
          discount: earlyBirdDiscount,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          savings: earlyBirdDiscount
        }
      }
    };
    setPaymentFlow(flow);
  }, [totalAmount, depositAmount, earlyBirdDiscount, groupDiscount]);

  const trackPaymentStatus = (bookingId: string): PaymentStatus => {
    // This would typically fetch from API
    return {
      status: 'unpaid',
      paidAmount: 0,
      remainingAmount: totalAmount,
      paymentMethod: 'cash'
    };
  };

  const handlePaymentSelection = (option: string) => {
    setSelectedPaymentOption(option);
    setCurrentStep(2);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    
    const paymentData = {
      activity,
      numberOfPeople,
      customerName,
      customerPhone,
      preferredDate,
      paymentOption: selectedPaymentOption,
      totalAmount,
      depositAmount: selectedPaymentOption === 'deposit' ? depositAmount : 0,
      balanceAmount: selectedPaymentOption === 'deposit' ? totalAmount - depositAmount : 0,
      discount: selectedPaymentOption === 'full' ? totalSavings : 0,
      paymentMethod: selectedPaymentOption === 'deposit' ? 'cash_deposit' : 'cash'
    };

    try {
      await onPaymentConfirm(paymentData);
      setCurrentStep(3);
    } catch (error) {
      console.error('Payment confirmation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentOptions = [
    {
      id: "full",
      title: "Paiement Complet à l'Arrivée",
      description: "Payez le montant total à votre arrivée",
      amount: totalAmount - totalSavings,
      originalAmount: totalAmount,
      discount: totalSavings,
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-blue-50 border-blue-200",
      badge: "Plus Populaire",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      id: "deposit",
      title: "Acompte Sécurisé",
      description: `Payez ${depositAmount} MAD maintenant, solde à l'arrivée`,
      amount: depositAmount,
      originalAmount: totalAmount,
      discount: 0,
      icon: <Shield className="w-5 h-5" />,
      color: "bg-green-50 border-green-200",
      badge: "Recommandé",
      badgeColor: "bg-green-100 text-green-800"
    },
    {
      id: "early_bird",
      title: "Offre Early Bird",
      description: `Paiement complet avec ${earlyBirdDiscount} MAD d'économies`,
      amount: totalAmount - earlyBirdDiscount,
      originalAmount: totalAmount,
      discount: earlyBirdDiscount,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-purple-50 border-purple-200",
      badge: "Économies",
      badgeColor: "bg-purple-100 text-purple-800"
    }
  ];

  if (!paymentFlow) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement des options de paiement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Étape {currentStep} sur 3</span>
          <span>{Math.round((currentStep / 3) * 100)}%</span>
        </div>
        <Progress value={(currentStep / 3) * 100} className="h-2" />
      </div>

      {/* Booking Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Résumé de la Réservation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{activity.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{numberOfPeople} personne{numberOfPeople > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{new Date(preferredDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalAmount} MAD</div>
              <div className="text-sm text-gray-600">Montant Total</div>
              {totalSavings > 0 && (
                <div className="text-sm text-green-600">
                  Économies possibles: {totalSavings} MAD
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Choisissez votre option de paiement</h3>
          <div className="grid gap-4">
            {paymentOptions.map((option) => (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedPaymentOption === option.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                } ${option.color}`}
                onClick={() => handlePaymentSelection(option.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        {option.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{option.title}</h4>
                          <Badge className={option.badgeColor}>
                            {option.badge}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {option.amount} MAD
                      </div>
                      {option.discount > 0 && (
                        <div className="text-sm text-green-600">
                          -{option.discount} MAD d'économies
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Payment Confirmation */}
      {currentStep === 2 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Confirmation du Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Détails du Paiement</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Montant total:</span>
                  <span>{totalAmount} MAD</span>
                </div>
                {selectedPaymentOption === 'deposit' && (
                  <>
                    <div className="flex justify-between">
                      <span>Acompte:</span>
                      <span>{depositAmount} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Solde à l'arrivée:</span>
                      <span>{totalAmount - depositAmount} MAD</span>
                    </div>
                  </>
                )}
                {selectedPaymentOption === 'full' && totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Économies:</span>
                    <span>-{totalSavings} MAD</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>À payer maintenant:</span>
                    <span>
                      {selectedPaymentOption === 'deposit' 
                        ? `${depositAmount} MAD` 
                        : selectedPaymentOption === 'full' 
                          ? `${totalAmount - totalSavings} MAD`
                          : `${totalAmount - earlyBirdDiscount} MAD`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  'Confirmer le Paiement'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(1)}
                disabled={isProcessing}
              >
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Success */}
      {currentStep === 3 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Paiement Confirmé!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Votre réservation est confirmée!
                </h3>
                <p className="text-gray-600">
                  Vous recevrez un SMS de confirmation avec tous les détails.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Prochaines étapes:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vous recevrez un SMS de confirmation</li>
                  <li>• Rendez-vous au point de rencontre à l'heure indiquée</li>
                  <li>• Présentez votre pièce d'identité</li>
                  <li>• Profitez de votre aventure!</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {currentStep < 3 && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Annuler
          </Button>
        )}
        {currentStep === 3 && (
          <Button 
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            Retour à l'Accueil
          </Button>
        )}
      </div>
    </div>
  );
}
