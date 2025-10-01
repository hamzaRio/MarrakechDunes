import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle, DollarSign, Clock } from "lucide-react";
import type { BookingType, CancellationReason } from "marrakechdunes-shared/schema";

interface BookingCancellationHandlerProps {
  booking: BookingType;
  onCancellation?: (booking: BookingType) => void;
}

const CANCELLATION_REASONS: { value: CancellationReason; label: string }[] = [
  { value: 'WEATHER', label: 'Weather Conditions' },
  { value: 'EMERGENCY', label: 'Personal Emergency' },
  { value: 'TRAVEL', label: 'Travel Changes' },
  { value: 'HEALTH', label: 'Health Issues' },
  { value: 'OTHER', label: 'Other' }
];

export default function BookingCancellationHandler({ 
  booking, 
  onCancellation 
}: BookingCancellationHandlerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<CancellationReason | "">("");
  const [policy, setPolicy] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { 
      bookingId: string; 
      reason: CancellationReason; 
    }) => {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, {
        reason
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Cancelled",
        description: `Booking cancelled with ${data.policy.description}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      onCancellation?.(data.booking);
      setIsOpen(false);
      setReason("");
      setPolicy(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    if (!reason) return;
    
    cancelBookingMutation.mutate({
      bookingId: booking._id,
      reason: reason as CancellationReason
    });
  };

  const calculatePolicy = (reason: CancellationReason) => {
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const totalAmount = parseInt(booking.totalAmount);
    
    let policy;
    
    if (hoursUntilBooking >= 24) {
      policy = {
        refundPercentage: 100,
        fee: 0,
        description: 'Free cancellation (24+ hours notice)'
      };
    } else if (hoursUntilBooking >= 12) {
      policy = {
        refundPercentage: 75,
        fee: totalAmount * 0.25,
        description: '75% refund (12-24 hours notice)'
      };
    } else if (hoursUntilBooking >= 6) {
      policy = {
        refundPercentage: 0,
        fee: totalAmount,
        description: 'No refund (less than 12 hours notice)'
      };
    } else if (reason === 'EMERGENCY' || reason === 'HEALTH') {
      policy = {
        refundPercentage: 50,
        fee: totalAmount * 0.5,
        description: '50% refund (emergency/health reasons)'
      };
    } else {
      policy = {
        refundPercentage: 0,
        fee: totalAmount,
        description: 'No refund (less than 6 hours notice)'
      };
    }
    
    setPolicy(policy);
  };

  const handleReasonChange = (newReason: CancellationReason) => {
    setReason(newReason);
    calculatePolicy(newReason);
  };

  const bookingDate = new Date(booking.preferredDate);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Cancel Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            Cancel booking #{booking._id.slice(-8)} for {booking.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason</Label>
            <Select value={reason} onValueChange={handleReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select cancellation reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {policy && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cancellation Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time until booking:</span>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.round(hoursUntilBooking)} hours
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Refund:</span>
                  <Badge 
                    variant={policy.refundPercentage === 100 ? "default" : 
                            policy.refundPercentage > 0 ? "secondary" : "destructive"}
                  >
                    {policy.refundPercentage}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fee:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-sm font-medium">{policy.fee} MAD</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  {policy.description}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={cancelBookingMutation.isPending}
            >
              Keep Booking
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancel}
              disabled={!reason || cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
