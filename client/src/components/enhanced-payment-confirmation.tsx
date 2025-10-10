import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  Banknote,
  Building,
  Download,
  Share2,
  MessageCircle
} from 'lucide-react';

interface PaymentConfirmationProps {
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    activity: {
      name: string;
      price: number;
      duration: string;
      location: string;
    };
    numberOfPeople: number;
    preferredDate: string;
    totalAmount: number;
    paymentMethod: 'cash' | 'cash_deposit';
    depositAmount?: number;
    balanceAmount?: number;
  };
  onDownloadReceipt: () => void;
  onShareBooking: () => void;
  onContactSupport: () => void;
}

export default function EnhancedPaymentConfirmation({
  booking,
  onDownloadReceipt,
  onShareBooking,
  onContactSupport
}: PaymentConfirmationProps) {
  const isDepositPayment = booking.paymentMethod === 'cash_deposit';
  const nextSteps = isDepositPayment 
    ? [
        'Rendez-vous à notre agence pour payer l\'acompte',
        'Recevez votre reçu d\'acompte',
        'Attendez la confirmation de votre guide',
        'Payez le solde le jour de l\'activité'
      ]
    : [
        'Recevez la confirmation de votre guide',
        'Préparez-vous pour votre activité',
        'Payez le montant total le jour J'
      ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-green-600">Réservation Confirmée !</h1>
          <p className="text-gray-600 mt-2">
            Votre réservation a été enregistrée avec succès. Vous recevrez une confirmation par WhatsApp.
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
          ID de Réservation: {booking.id}
        </Badge>
      </div>

      {/* Booking Details */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calendar className="w-5 h-5" />
            Détails de Votre Réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Activité</p>
                <p className="font-semibold text-lg">{booking.activity.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">{new Date(booking.preferredDate).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durée</p>
                <p className="font-semibold">{booking.activity.duration}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Participants</p>
                <p className="font-semibold flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {booking.numberOfPeople} personne{booking.numberOfPeople > 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lieu</p>
                <p className="font-semibold flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {booking.activity.location}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-semibold">{booking.customerName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            {isDepositPayment ? <Building className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
            Informations de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDepositPayment ? (
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-blue-800 mb-3">Paiement en 2 étapes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Acompte (30%)</span>
                    <span className="font-bold text-blue-600">{booking.depositAmount} MAD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Solde le jour J</span>
                    <span className="font-semibold">{booking.balanceAmount} MAD</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span className="text-green-600">{booking.totalAmount} MAD</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">📍 Où payer l'acompte</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-yellow-600" />
                    <span>54 Riad Zitoun Lakdim, Marrakech 40000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-yellow-600" />
                    <span>+212 600 623 630</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span>Tous les jours 8h00 - 20h00</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-green-800 mb-3">Paiement Complet le Jour J</h4>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {booking.totalAmount} MAD
                </div>
                <p className="text-sm text-gray-600">
                  À payer en espèces le jour de l'activité
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Prochaines Étapes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                </div>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Contact & Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Notre Équipe</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>Ahmed: +212 600 623 630</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>Yahia: +212 693 323 368</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>Nadia: +212 654 497 354</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Email</h4>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-600" />
                <span>timedizzy45@gmail.com</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={onDownloadReceipt}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Télécharger le Reçu
        </Button>
        <Button 
          onClick={onShareBooking}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Partager la Réservation
        </Button>
        <Button 
          onClick={onContactSupport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Contacter le Support
        </Button>
      </div>

      {/* Important Notes */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-yellow-800">⚠️ Informations Importantes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Confirmation WhatsApp</strong> - Vous recevrez une confirmation dans les 24h</li>
              <li>• <strong>Point de rendez-vous</strong> - Vous serez contacté pour le lieu exact</li>
              <li>• <strong>Paiement en espèces uniquement</strong> - Aucune carte acceptée</li>
              <li>• <strong>Annulation</strong> - 24h de préavis requis</li>
              <li>• <strong>Météo</strong> - L'activité peut être reportée en cas de mauvais temps</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
