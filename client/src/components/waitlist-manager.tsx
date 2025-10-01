import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, Clock, Phone, Calendar, ArrowUp } from "lucide-react";
import type { BookingType } from "marrakechdunes-shared/schema";

interface WaitlistManagerProps {
  activityId: string;
  onPromotion?: (booking: BookingType) => void;
}

interface WaitlistEntry {
  _id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  position: number;
  createdAt: string;
}

export default function WaitlistManager({ 
  activityId, 
  onPromotion 
}: WaitlistManagerProps) {
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: waitlistEntries, isLoading } = useQuery({
    queryKey: ['/admin/waitlist', activityId],
    queryFn: async () => {
      const response = await api.get(`/admin/activities/${activityId}/waitlist`);
      return response.data as WaitlistEntry[];
    },
  });

  const promoteFromWaitlistMutation = useMutation({
    mutationFn: async (waitlistId: string) => {
      const response = await api.post(`/admin/waitlist/${waitlistId}/promote`);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Promoted",
        description: `${data.booking.customerName} has been promoted from waitlist`,
      });
      queryClient.invalidateQueries({ queryKey: ['/admin/waitlist', activityId] });
      queryClient.invalidateQueries({ queryKey: ['/admin/bookings'] });
      onPromotion?.(data.booking);
      setPromotingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to promote booking",
        variant: "destructive",
      });
      setPromotingId(null);
    },
  });

  const handlePromote = (waitlistId: string) => {
    setPromotingId(waitlistId);
    promoteFromWaitlistMutation.mutate(waitlistId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading waitlist...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!waitlistEntries || waitlistEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No waitlist entries for this activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Waitlist ({waitlistEntries.length} entries)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Preferred Date</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waitlistEntries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <ArrowUp className="h-3 w-3" />
                    #{entry.position}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{entry.customerName}</TableCell>
                <TableCell className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {entry.customerPhone}
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(entry.preferredDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handlePromote(entry._id)}
                    disabled={promotingId === entry._id}
                  >
                    {promotingId === entry._id ? "Promoting..." : "Promote"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
