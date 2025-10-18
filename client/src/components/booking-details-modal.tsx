import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Mail
} from "lucide-react";
import type { BookingWithActivity } from "marrakechdunes-shared/schema";

interface BookingDetailsModalProps {
  booking: BookingWithActivity;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'deposit_paid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'deposit_paid':
        return <ClockIcon className="w-4 h-4" />;
      case 'unpaid':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Détails de la Réservation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" />
                Informations Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Nom:</span>
                <span className="text-gray-700">{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Téléphone:</span>
                <span className="text-gray-700">{booking.customerPhone}</span>
              </div>
              {booking.customerEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Email:</span>
                  <span className="text-gray-700">{booking.customerPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-green-600" />
                Détails de l'Activité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">Activité:</span>
                <span className="text-gray-700">{booking.activity?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Nombre de personnes:</span>
                <span className="text-gray-700">{booking.numberOfPeople}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Date préférée:</span>
                <span className="text-gray-700">
                  {booking.preferredDate 
                    ? new Date(booking.preferredDate).toLocaleDateString('fr-FR')
                    : 'Flexible'
                  }
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Heure préférée:</span>
                <span className="text-gray-700">
                  {booking.preferredDate ? new Date(booking.preferredDate).toLocaleTimeString() : 'Toute heure'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Informations de Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut de la réservation:</span>
                <Badge className={`${getStatusColor(booking.status)} flex items-center gap-1`}>
                  {booking.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Statut du paiement:</span>
                <Badge className={`${getPaymentStatusColor(booking.paymentStatus)} flex items-center gap-1`}>
                  {getPaymentStatusIcon(booking.paymentStatus)}
                  {booking.paymentStatus?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Prix total:</span>
                  <div className="text-lg font-bold text-gray-800">
                    {booking.totalAmount} MAD
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Montant payé:</span>
                  <div className="text-lg font-bold text-green-600">
                    {booking.paidAmount || 0} MAD
                  </div>
                </div>
              </div>
              {booking.paymentMethod && (
                <div>
                  <span className="text-sm text-gray-500">Méthode de paiement:</span>
                  <div className="text-sm font-medium text-gray-700">
                    {booking.paymentMethod}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{booking.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
