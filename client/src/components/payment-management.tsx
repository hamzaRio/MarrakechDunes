import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Banknote, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Edit, 
  Receipt,
  Calculator,
  CreditCard
} from "lucide-react";
import type { BookingWithActivity } from "marrakechdunes-shared/schema";

const FR_LABELS = {
  paymentUpdated: 'Paiement Mis à Jour',
  paymentSuccess: 'Le statut de paiement a été mis à jour avec succès',
  updateFailed: 'Échec de la Mise à Jour',
  paymentManagement: 'Gestion des Paiements',
  status: 'Statut',
  fullyPaid: 'Entièrement Payé',
  depositPaid: 'Acompte Payé',
  unpaid: 'Non Payé',
  totalAmount: 'Montant Total',
  paidAmount: 'Montant Payé',
  remaining: 'Restant',
  paymentMethod: 'Méthode de Paiement',
  cash: 'Espèces',
  cashDeposit: 'Acompte en Espèces',
  paymentProgress: 'Progression du Paiement',
  updatePayment: 'Mettre à Jour le Paiement',
  cancel: 'Annuler',
  save: 'Enregistrer',
};

// Fix: Payment type options for dropdown - Cash only as requested
const PAYMENT_TYPE_OPTIONS = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'DEPOSIT', label: 'Acompte' }
];

interface PaymentManagementProps {
  booking: BookingWithActivity;
}

export default function PaymentManagement({ booking }: PaymentManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'full' | 'deposit' | 'balance'>('full');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(booking.paymentMethod || 'CASH');

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      bookingId: string;
      paymentStatus: string;
      paidAmount: number;
      paymentMethod: string;
      depositAmount?: number;
    }) => {
      const response = await apiRequest(`/api/admin/bookings/${data.bookingId}/payment`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({
        title: "Paiement Mis à Jour",
        description: "Le statut de paiement a été mis à jour avec succès.",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de la Mise à Jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePaymentUpdate = () => {
    let newPaymentStatus: string;
    let newPaidAmount: number;
    let depositAmount: number | undefined;

    const currentPaid = booking.paidAmount || 0;

    switch (paymentType) {
      case 'full':
        newPaymentStatus = 'fully_paid';
        newPaidAmount = Number(booking.totalAmount);
        break;
      case 'deposit':
        newPaymentStatus = 'deposit_paid';
        newPaidAmount = paymentAmount;
        depositAmount = paymentAmount;
        break;
      case 'balance':
        newPaymentStatus = 'fully_paid';
        newPaidAmount = currentPaid + paymentAmount;
        break;
      default:
        return;
    }

    updatePaymentMutation.mutate({
      bookingId: booking.id || booking._id || '',
      paymentStatus: newPaymentStatus,
      paidAmount: newPaidAmount,
      paymentMethod: selectedPaymentMethod,
      depositAmount,
    });
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
        return <Clock className="w-4 h-4" />;
      case 'unpaid':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Fix: Correct payment status calculation based on actual payment data
  const currentPaid = booking.paidAmount || 0;
  const totalAmount = Number(booking.totalAmount);
  const remainingAmount = totalAmount - currentPaid;
  
  // Correct payment status logic
  const getCorrectPaymentStatus = () => {
    if (currentPaid <= 0) return 'unpaid';
    if (currentPaid < totalAmount) return 'deposit_paid';
    if (currentPaid >= totalAmount) return 'fully_paid';
    return 'pending';
  };
  
  const correctPaymentStatus = getCorrectPaymentStatus();
  const isFullyPaid = correctPaymentStatus === 'fully_paid';
  const isDepositPaid = correctPaymentStatus === 'deposit_paid';
  
  // Fix display logic for fully paid bookings
  const displayPaidAmount = currentPaid;
  const displayRemaining = Math.max(0, remainingAmount);
  const displayProgress = totalAmount > 0 ? Math.round((currentPaid / totalAmount) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="w-5 h-5 text-moroccan-blue" />
          {FR_LABELS.paymentManagement}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{FR_LABELS.status}:</span>
            <Badge className={`${getPaymentStatusColor(correctPaymentStatus)} flex items-center gap-1`}>
              {getPaymentStatusIcon(correctPaymentStatus)}
              {correctPaymentStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="w-4 h-4" />
                {FR_LABELS.updatePayment}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-gray-300 shadow-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Mettre à Jour le Statut de Paiement
                </DialogTitle>
                <DialogDescription>
                  Modifiez le statut de paiement et le montant payé pour cette réservation.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-moroccan-sand/20 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>{FR_LABELS.totalAmount}:</span>
                      <span className="font-medium">{booking.totalAmount} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{FR_LABELS.paidAmount}:</span>
                      <span className="font-medium text-green-600">{displayPaidAmount} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{FR_LABELS.remaining}:</span>
                      <span className="font-medium text-orange-600">{displayRemaining} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="paymentType">Type de Paiement</Label>
                    <Select value={paymentType} onValueChange={(value: 'full' | 'deposit' | 'balance') => setPaymentType(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner le type de paiement" />
                      </SelectTrigger>
                      <SelectContent>
                        {!isFullyPaid && (
                          <SelectItem value="full">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Paiement Complet ({booking.totalAmount} MAD)
                            </div>
                          </SelectItem>
                        )}
                        {!isDepositPaid && !isFullyPaid && (
                          <SelectItem value="deposit">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4" />
                              Paiement d'Acompte
                            </div>
                          </SelectItem>
                        )}
                        {isDepositPaid && !isFullyPaid && (
                          <SelectItem value="balance">
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4" />
                              Paiement du Solde ({remainingAmount} MAD)
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Fix: Add payment method dropdown */}
                  <div>
                    <Label htmlFor="paymentMethod">Méthode de Paiement</Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner la méthode de paiement" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(paymentType === 'deposit' || paymentType === 'balance') && (
                    <div>
                      <Label htmlFor="amount">Montant (MAD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        max={paymentType === 'deposit' ? booking.totalAmount : remainingAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                        placeholder={`Saisir le montant`}
                      />
                      {paymentType === 'deposit' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Recommandé: {Math.round(Number(booking.totalAmount) * 0.3)} MAD (30%)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    {FR_LABELS.cancel}
                  </Button>
                  <Button
                    onClick={handlePaymentUpdate}
                    disabled={updatePaymentMutation.isPending || (paymentType !== 'full' && paymentAmount <= 0)}
                    className="flex-1 bg-moroccan-red hover:bg-red-600"
                  >
                    {updatePaymentMutation.isPending ? "Mise à jour..." : FR_LABELS.updatePayment}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{FR_LABELS.totalAmount}:</span>
              <span className="font-medium">{booking.totalAmount} MAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{FR_LABELS.paymentMethod}:</span>
              <span className="font-medium capitalize">
                {booking.paymentMethod?.replace('_', ' ') || 'Cash'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{FR_LABELS.paidAmount}:</span>
              <span className="font-medium text-green-600">{displayPaidAmount} MAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{FR_LABELS.remaining}:</span>
              <span className="font-medium text-orange-600">{displayRemaining} MAD</span>
            </div>
          </div>
        </div>

        {/* Payment Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{FR_LABELS.paymentProgress}</span>
            <span>{displayProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-moroccan-blue to-moroccan-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* Deposit Information */}
        {booking.depositAmount && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Informations d'Acompte</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>Montant d'Acompte:</span>
                <span className="font-medium">{booking.depositAmount} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Solde Dû:</span>
                <span className="font-medium">{Number(booking.totalAmount) - Number(booking.depositAmount)} MAD</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}