import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Calendar, Users } from "lucide-react";

const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  activityId: z.string().min(1, "Activity selection is required"),
  numberOfPeople: z.number().min(1, "At least 1 person required").max(20, "Maximum 20 people"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  activities?: any[];
}

export default function BookingFormModal({ 
  trigger, 
  isOpen = false, 
  onClose, 
  activities: passedActivities 
}: BookingFormModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fetchedActivities } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !passedActivities,
  });

  const activities = passedActivities || fetchedActivities || [];
  const isControlled = isOpen !== undefined && onClose !== undefined;
  const modalOpen = isControlled ? isOpen : open;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      activityId: "",
      numberOfPeople: 1,
      preferredDate: "",
      preferredTime: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          preferredDate: data.preferredDate ? new Date(data.preferredDate) : undefined,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create booking");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  // Calculate total amount based on activity and number of people
  const selectedActivityId = form.watch("activityId");
  const numberOfPeople = form.watch("numberOfPeople");
  const selectedActivity = Array.isArray(activities) ? activities.find((activity: any) => activity.id === selectedActivityId) : null;
  const totalAmount = selectedActivity ? selectedActivity.price * numberOfPeople : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-moroccan-blue hover:bg-blue-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-moroccan-blue">
            <Calendar className="h-5 w-5" />
            Create New Booking
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter customer name"
                        className="border-gray-300 focus:border-moroccan-blue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+212 6XX XXX XXX"
                        className="border-gray-300 focus:border-moroccan-blue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Activity</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:border-moroccan-blue">
                        <SelectValue placeholder="Choose an activity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(activities) && activities.map((activity: any) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name} - {activity.price} MAD per person
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="numberOfPeople"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Number of People
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="20"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="border-gray-300 focus:border-moroccan-blue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="border-gray-300 focus:border-moroccan-blue"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-300 focus:border-moroccan-blue">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning (6:00 - 10:00)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (14:00 - 18:00)</SelectItem>
                        <SelectItem value="evening">Evening (18:00 - 22:00)</SelectItem>
                        <SelectItem value="sunrise">Sunrise (5:30 - 7:00)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Special requests, dietary requirements, etc."
                      className="border-gray-300 focus:border-moroccan-blue min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedActivity && (
              <div className="space-y-4">
                {/* Price Comparison Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-moroccan-blue mb-3 flex items-center gap-2">
                    <span>💰</span>
                    Price Comparison Analysis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-green-700 mb-1">Our Price</div>
                      <div className="text-xl font-bold text-green-600">{selectedActivity.price} MAD</div>
                      <div className="text-xs text-gray-600">Best Value</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-orange-700 mb-1">GetYourGuide</div>
                      <div className="text-xl font-bold text-orange-600">{selectedActivity.getyourguidePrice || selectedActivity.price + 150} MAD</div>
                      <div className="text-xs text-red-600">+{Math.round(((selectedActivity.getyourguidePrice || selectedActivity.price + 150) - selectedActivity.price) / selectedActivity.price * 100)}% more</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-blue-700 mb-1">You Save</div>
                      <div className="text-xl font-bold text-blue-600">{((selectedActivity.getyourguidePrice || selectedActivity.price + 150) - selectedActivity.price)} MAD</div>
                      <div className="text-xs text-green-600">Per person</div>
                    </div>
                  </div>
                </div>

                {/* Seasonal Pricing */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-moroccan-blue mb-3 flex items-center gap-2">
                    <span>📅</span>
                    Seasonal Pricing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-blue-700">Low Season</div>
                      <div className="text-lg font-bold text-blue-600">{Math.round(selectedActivity.price * 0.85)} MAD</div>
                      <div className="text-xs text-gray-600">Nov-Feb</div>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-300">
                      <div className="font-medium text-green-700">Regular Season ✓</div>
                      <div className="text-lg font-bold text-green-600">{selectedActivity.price} MAD</div>
                      <div className="text-xs text-gray-600">Current Price</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-red-700">High Season</div>
                      <div className="text-lg font-bold text-red-600">{Math.round(selectedActivity.price * 1.25)} MAD</div>
                      <div className="text-xs text-gray-600">Jun-Aug</div>
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-moroccan-blue mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Activity:</span>
                      <span className="font-medium">{selectedActivity.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per person:</span>
                      <span>{selectedActivity.price} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of people:</span>
                      <span>{numberOfPeople}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold text-moroccan-blue">
                      <span>Total Amount:</span>
                      <span>{totalAmount.toLocaleString()} MAD</span>
                    </div>
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Total Savings vs GetYourGuide:</span>
                      <span>{(((selectedActivity.getyourguidePrice || selectedActivity.price + 150) - selectedActivity.price) * numberOfPeople).toLocaleString()} MAD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createBookingMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-moroccan-red hover:bg-red-600 text-white"
                disabled={createBookingMutation.isPending}
              >
                {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}