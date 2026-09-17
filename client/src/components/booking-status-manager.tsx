import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStatusDisplayName, getStatusColor, getNextPossibleStatuses } from "@/lib/booking-utils";
import type { BookingType, BookingStatus } from "marrakechdunes-shared/schema";

interface BookingStatusManagerProps {
  booking: BookingType;
  onStatusChange?: (booking: BookingType) => void;
}

export default function BookingStatusManager({ 
  booking, 
  onStatusChange 
}: BookingStatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, reason }: { 
      bookingId: string; 
      status: BookingStatus; 
      reason?: string; 
    }) => {
      const response = await api.patch(`/admin/bookings/${bookingId}/status`, {
        status,
        reason
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${data.displayName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      onStatusChange?.(data.booking);
      setIsOpen(false);
      setNewStatus("");
      setReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = () => {
    if (!newStatus) return;
    
    updateStatusMutation.mutate({
      bookingId: booking._id,
      status: newStatus as BookingStatus,
      reason: reason || undefined
    });
  };

  const currentStatus = booking.status as BookingStatus;
  const possibleStatuses = getNextPossibleStatuses(currentStatus);
  const statusColor = getStatusColor(currentStatus);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              statusColor === 'red' ? 'border-red-500 text-red-700' :
              statusColor === 'green' ? 'border-green-500 text-green-700' :
              statusColor === 'blue' ? 'border-blue-500 text-blue-700' :
              statusColor === 'yellow' ? 'border-yellow-500 text-yellow-700' :
              statusColor === 'purple' ? 'border-purple-500 text-purple-700' :
              'border-gray-500 text-gray-700'
            }`}
          >
            {getStatusDisplayName(currentStatus)}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="status-change-description"
      >
        <DialogHeader>
          <DialogTitle>Change Booking Status</DialogTitle>
          <DialogDescription>
            Update the status for booking #{booking._id.slice(-8)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-status">Current Status</Label>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${
                  statusColor === 'red' ? 'border-red-500 text-red-700' :
                  statusColor === 'green' ? 'border-green-500 text-green-700' :
                  statusColor === 'blue' ? 'border-blue-500 text-blue-700' :
                  statusColor === 'yellow' ? 'border-yellow-500 text-yellow-700' :
                  statusColor === 'purple' ? 'border-purple-500 text-purple-700' :
                  'border-gray-500 text-gray-700'
                }`}
              >
                {getStatusDisplayName(currentStatus)}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-status">New Status</Label>
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {possibleStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusDisplayName(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              disabled={!newStatus || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
