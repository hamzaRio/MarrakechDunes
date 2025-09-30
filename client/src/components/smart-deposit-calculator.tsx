import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface SmartDepositSystem {
  minDeposit: number;
  recommendedDeposit: number;
  maxDeposit: number;
  earlyBirdDiscount: number;
  groupDiscount: number;
  totalSavings: number;
}

interface CustomerProfile {
  isReturning: boolean;
  groupSize: number;
  activityType: string;
  season: 'high' | 'low';
  budget: number;
}

interface SmartDepositCalculatorProps {
  totalAmount: number;
  groupSize: number;
  activityType: string;
  customerProfile?: CustomerProfile;
  onDepositSelect: (depositAmount: number, paymentType: string) => void;
}

export default function SmartDepositCalculator({
  totalAmount,
  groupSize,
  activityType,
  customerProfile,
  onDepositSelect
}: SmartDepositCalculatorProps) {
  const [selectedOption, setSelectedOption] = useState<string>("recommended");
  const [depositCalculation, setDepositCalculation] = useState<SmartDepositSystem | null>(null);

  useEffect(() => {
    const calculation = calculateDeposit(totalAmount, groupSize, activityType, customerProfile);
    setDepositCalculation(calculation);
  }, [totalAmount, groupSize, activityType, customerProfile]);

  const calculateDeposit = (
    totalAmount: number, 
    groupSize: number, 
    activityType: string,
    customerProfile?: CustomerProfile
  ): SmartDepositSystem => {
    // Base deposit calculation
    const baseDepositPercentage = 0.3; // 30% base
    const minDeposit = Math.max(100, totalAmount * 0.1); // 100 MAD minimum or 10%
    const recommendedDeposit = Math.max(minDeposit, totalAmount * baseDepositPercentage);
    const maxDeposit = totalAmount * 0.5; // 50% maximum

    // Dynamic adjustments based on factors
    let adjustedPercentage = baseDepositPercentage;
    let earlyBirdDiscount = 0;
    let groupDiscount = 0;

    // Group size discount
    if (groupSize >= 4) {
      groupDiscount = totalAmount * 0.05; // 5% group discount
    }

    // Early bird discount for full payment
    earlyBirdDiscount = totalAmount * 0.10; // 10% early bird

    // Season-based adjustments
    if (customerProfile?.season === 'high') {
      adjustedPercentage = 0.4; // 40% deposit in high season
    }

    // Activity type adjustments
    if (activityType === 'premium' || activityType === 'luxury') {
      adjustedPercentage = 0.5; // 50% deposit for premium activities
    }

    // Returning customer benefits
    if (customerProfile?.isReturning) {
      adjustedPercentage = Math.max(0.2, adjustedPercentage - 0.1); // 10% less for returning customers
    }

    const finalDeposit = Math.max(minDeposit, Math.min(maxDeposit, totalAmount * adjustedPercentage));
    const totalSavings = earlyBirdDiscount + groupDiscount;

    return {
      minDeposit,
      recommendedDeposit: finalDeposit,
      maxDeposit,
      earlyBirdDiscount,
      groupDiscount,
      totalSavings
    };
  };

  const paymentOptions = [
    {
      id: "full",
      title: "Paiement Complet à l'Arrivée",
      description: "Payez le montant total à votre arrivée au point de rencontre",
      amount: totalAmount,
      discount: depositCalculation?.totalSavings || 0,
      finalAmount: totalAmount - (depositCalculation?.totalSavings || 0),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-blue-50 border-blue-200",
      badge: "Plus Populaire",
      badgeColor: "bg-blue-100 text-blue-800",
      benefits: [
        "Aucun paiement d'avance requis",
        "Flexibilité maximale",
        "Économies: " + (depositCalculation?.totalSavings || 0) + " MAD"
      ]
    },
    {
      id: "recommended",
      title: "Acompte Recommandé",
      description: `Payez ${depositCalculation?.recommendedDeposit || 0} MAD maintenant pour sécuriser votre réservation`,
      amount: depositCalculation?.recommendedDeposit || 0,
      discount: 0,
      finalAmount: depositCalculation?.recommendedDeposit || 0,
      icon: <Shield className="w-5 h-5" />,
      color: "bg-green-50 border-green-200",
      badge: "Recommandé",
      badgeColor: "bg-green-100 text-green-800",
      benefits: [
        "Sécurise votre réservation",
        "Réduit les annulations",
        "Solde à l'arrivée: " + (totalAmount - (depositCalculation?.recommendedDeposit || 0)) + " MAD"
      ]
    },
    {
      id: "minimum",
      title: "Acompte Minimum",
      description: `Payez seulement ${depositCalculation?.minDeposit || 0} MAD pour réserver`,
      amount: depositCalculation?.minDeposit || 0,
      discount: 0,
      finalAmount: depositCalculation?.minDeposit || 0,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-orange-50 border-orange-200",
      badge: "Économique",
      badgeColor: "bg-orange-100 text-orange-800",
      benefits: [
        "Engagement minimal",
        "Solde à l'arrivée: " + (totalAmount - (depositCalculation?.minDeposit || 0)) + " MAD",
        "Parfait pour les budgets serrés"
      ]
    }
  ];

  const handlePaymentSelect = (option: any) => {
    setSelectedOption(option.id);
    onDepositSelect(option.finalAmount, option.id);
  };

  if (!depositCalculation) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Calcul des options de paiement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Résumé du Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalAmount} MAD</div>
              <div className="text-sm text-gray-600">Montant Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{groupSize}</div>
              <div className="text-sm text-gray-600">Personnes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{depositCalculation.totalSavings} MAD</div>
              <div className="text-sm text-gray-600">Économies Possibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{activityType}</div>
              <div className="text-sm text-gray-600">Type d'Activité</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div className="grid gap-4">
        {paymentOptions.map((option) => (
          <Card 
            key={option.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedOption === option.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            } ${option.color}`}
            onClick={() => handlePaymentSelect(option)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white shadow-sm">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{option.title}</h3>
                      <Badge className={option.badgeColor}>
                        {option.badge}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{option.description}</p>
                    <div className="space-y-1">
                      {option.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {option.finalAmount} MAD
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

      {/* Smart Recommendations */}
      {customerProfile && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Recommandations Intelligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerProfile.isReturning && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Client fidèle - Acompte réduit disponible</span>
                </div>
              )}
              {groupSize >= 4 && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="w-4 h-4" />
                  <span>Groupe de {groupSize} personnes - Remise de groupe de 5%</span>
                </div>
              )}
              {customerProfile?.season === 'high' && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Saison haute - Acompte plus élevé recommandé</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
