import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import type { BookingWithActivity } from "@shared/schema";

interface PaymentManagementProps {
  booking: BookingWithActivity;
}

export default function PaymentManagement({ booking }: PaymentManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'full' | 'deposit' | 'balance'>('full');

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: {
      bookingId: string;
      paymentStatus: string;
      paidAmount: number;
      paymentMethod: string;
      depositAmount?: number;
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/bookings/${data.bookingId}/payment`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Payment Updated",
        description: "Payment status has been successfully updated.",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
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
        newPaidAmount = booking.totalAmount;
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
      bookingId: booking.id,
      paymentStatus: newPaymentStatus,
      paidAmount: newPaidAmount,
      paymentMethod: paymentType === 'deposit' ? 'cash_deposit' : 'cash',
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

  const currentPaid = booking.paidAmount || 0;
  const remainingAmount = booking.totalAmount - currentPaid;
  const isFullyPaid = booking.paymentStatus === 'fully_paid';
  const isDepositPaid = booking.paymentStatus === 'deposit_paid';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="w-5 h-5 text-moroccan-blue" />
          Payment Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={`${getPaymentStatusColor(booking.paymentStatus)} flex items-center gap-1`}>
              {getPaymentStatusIcon(booking.paymentStatus)}
              {booking.paymentStatus?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit className="w-4 h-4" />
                Update Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Update Payment Status
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-moroccan-sand/20 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-medium">{booking.totalAmount} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-medium text-green-600">{currentPaid} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-medium text-orange-600">{remainingAmount} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={paymentType} onValueChange={(value: 'full' | 'deposit' | 'balance') => setPaymentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {!isFullyPaid && (
                          <SelectItem value="full">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Full Payment ({booking.totalAmount} MAD)
                            </div>
                          </SelectItem>
                        )}
                        {!isDepositPaid && !isFullyPaid && (
                          <SelectItem value="deposit">
                            <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4" />
                              Deposit Payment
                            </div>
                          </SelectItem>
                        )}
                        {isDepositPaid && !isFullyPaid && (
                          <SelectItem value="balance">
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4" />
                              Balance Payment ({remainingAmount} MAD)
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {(paymentType === 'deposit' || paymentType === 'balance') && (
                    <div>
                      <Label htmlFor="amount">Amount (MAD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        max={paymentType === 'deposit' ? booking.totalAmount : remainingAmount}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 0)}
                        placeholder={`Enter amount`}
                      />
                      {paymentType === 'deposit' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: {Math.round(booking.totalAmount * 0.3)} MAD (30%)
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
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePaymentUpdate}
                    disabled={updatePaymentMutation.isPending || (paymentType !== 'full' && paymentAmount <= 0)}
                    className="flex-1 bg-moroccan-red hover:bg-red-600"
                  >
                    {updatePaymentMutation.isPending ? "Updating..." : "Update Payment"}
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
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">{booking.totalAmount} MAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium capitalize">
                {booking.paymentMethod?.replace('_', ' ') || 'Cash'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-medium text-green-600">{currentPaid} MAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-medium text-orange-600">{remainingAmount} MAD</span>
            </div>
          </div>
        </div>

        {/* Payment Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Payment Progress</span>
            <span>{Math.round((currentPaid / booking.totalAmount) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-moroccan-blue to-moroccan-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentPaid / booking.totalAmount) * 100}%` }}
            />
          </div>
        </div>

        {/* Deposit Information */}
        {booking.depositAmount && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Deposit Information</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>Deposit Amount:</span>
                <span className="font-medium">{booking.depositAmount} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Balance Due:</span>
                <span className="font-medium">{booking.totalAmount - booking.depositAmount} MAD</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}