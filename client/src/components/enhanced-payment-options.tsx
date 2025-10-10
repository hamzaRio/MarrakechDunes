import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Banknote, 
  Building, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info,
  Phone,
  Mail
} from 'lucide-react';

interface PaymentOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  method: 'cash' | 'cash_deposit';
  depositPercent?: number;
  features: string[];
  pros: string[];
  cons: string[];
  recommended?: boolean;
}

interface EnhancedPaymentOptionsProps {
  activity: {
    name: string;
    price: number;
    duration: string;
    location: string;
  };
  numberOfPeople: number;
  onPaymentSelect: (option: PaymentOption) => void;
  onCancel: () => void;
}

export default function EnhancedPaymentOptions({
  activity,
  numberOfPeople,
  onPaymentSelect,
  onCancel
}: EnhancedPaymentOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const totalAmount = activity.price * numberOfPeople;
  const depositAmount = Math.round(totalAmount * 0.3);

  const paymentOptions: PaymentOption[] = [
    {
      id: 'full_cash',
      name: 'Paiement Complet en Espèces',
      description: 'Payez le montant total le jour de l\'activité',
      icon: <Banknote className="w-6 h-6 text-green-600" />,
      method: 'cash',
      features: [
        'Aucun paiement à l\'avance',
        'Paiement sécurisé le jour J',
        'Pas de frais supplémentaires',
        'Flexibilité maximale'
      ],
      pros: [
        'Aucun risque financier',
        'Paiement simple et direct',
        'Pas de gestion d\'acompte'
      ],
      cons: [
        'Nécessite d\'avoir l\'argent sur soi',
        'Pas de garantie de réservation'
      ]
    },
    {
      id: 'deposit_agency',
      name: 'Acompte à l\'Agence + Solde le Jour J',
      description: '30% à l\'agence, le reste le jour de l\'activité',
      icon: <Building className="w-6 h-6 text-blue-600" />,
      method: 'cash_deposit',
      depositPercent: 30,
      features: [
        '30% d\'acompte à l\'agence',
        '70% le jour de l\'activité',
        'Réservation garantie',
        'Suivi personnalisé'
      ],
      pros: [
        'Réservation sécurisée',
        'Suivi personnalisé',
        'Flexibilité de paiement',
        'Confirmation immédiate'
      ],
      cons: [
        'Déplacement à l\'agence',
        'Gestion de deux paiements'
      ],
      recommended: true
    }
  ];

  const handleOptionSelect = (option: PaymentOption) => {
    setSelectedOption(option.id);
  };

  const handleConfirm = () => {
    const option = paymentOptions.find(opt => opt.id === selectedOption);
    if (option) {
      onPaymentSelect(option);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Choisissez Votre Mode de Paiement</h2>
        <p className="text-gray-600">Sélectionnez la méthode de paiement qui vous convient le mieux</p>
      </div>

      {/* Booking Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Résumé de Votre Réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Activité</p>
              <p className="font-semibold">{activity.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durée</p>
              <p className="font-semibold">{activity.duration}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nombre de personnes</p>
              <p className="font-semibold">{numberOfPeople} personne{numberOfPeople > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lieu</p>
              <p className="font-semibold flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {activity.location}
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Montant Total</span>
            <span className="text-2xl font-bold text-green-600">{totalAmount} MAD</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentOptions.map((option) => (
          <Card 
            key={option.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedOption === option.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:border-blue-300'
            } ${option.recommended ? 'border-2 border-green-300' : ''}`}
            onClick={() => handleOptionSelect(option)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {option.icon}
                  <div>
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
                {option.recommended && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Recommandé
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Breakdown */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Détails du Paiement</h4>
                {option.method === 'cash' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Montant total</span>
                      <span className="font-semibold">{totalAmount} MAD</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="text-sm">À payer le jour J</span>
                      <span className="font-bold">{totalAmount} MAD</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Acompte (30%)</span>
                      <span className="font-semibold text-blue-600">{depositAmount} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Solde le jour J</span>
                      <span className="font-semibold">{totalAmount - depositAmount} MAD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{totalAmount} MAD</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Avantages</h4>
                <ul className="space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Agency Info for Deposit Option */}
              {option.method === 'cash_deposit' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-800 mb-2">Informations Agence</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span>54 Riad Zitoun Lakdim, Marrakech 40000</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>+212 600 623 630</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Tous les jours 8h00 - 20h00</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="px-8"
        >
          Annuler
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedOption}
          className="px-8 bg-green-600 hover:bg-green-700"
        >
          Confirmer le Paiement
        </Button>
      </div>

      {/* Important Notes */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-800">Informations Importantes</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Paiement en espèces uniquement</strong> - Aucune carte de crédit acceptée</li>
                <li>• <strong>Monnaie exacte préférée</strong> - Pour faciliter les transactions</li>
                <li>• <strong>Confirmation par WhatsApp</strong> - Vous recevrez une confirmation immédiate</li>
                <li>• <strong>Politique d'annulation</strong> - 24h de préavis requis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
