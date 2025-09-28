import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ActivityType } from "marrakechdunes-shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { User, Phone, Mail, Calendar, Users, MapPin } from "lucide-react";

// Simple booking schema
const bookingSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(8, "Phone number is required"),
  customerEmail: z.string().email("Valid email required").optional().or(z.literal('')),
  activityId: z.string().min(1, "Please select an activity"),
  numberOfPeople: z.number().min(1, "At least 1 person required").max(20, "Maximum 20 people"),
  preferredDate: z.string().min(1, "Date is required"),
  specialRequests: z.string().optional()
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function SimpleBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get activities
  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => apiRequest<ActivityType[]>("/activities")
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<BookingFormData>();

  const selectedActivityId = watch("activityId");
  const numberOfPeople = watch("numberOfPeople") || 1;

  const selectedActivity = activities.find(a => a._id === selectedActivityId);
  const totalPrice = selectedActivity ? selectedActivity.price * numberOfPeople : 0;

  const submitBooking = useMutation({
    mutationFn: async (data: BookingFormData) => {
      return apiRequest("/bookings", {
        method: "POST",
        data: {
          ...data,
          totalAmount: totalPrice,
          status: 'pending'
        }
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: any) => {
      alert(`Booking failed: ${error.message || 'Please try again'}`);
    }
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      await submitBooking.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your booking. We'll contact you within 24 hours to confirm your reservation.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-medium">Payment: Cash on arrival</p>
                <p className="text-yellow-700 text-sm">You'll pay ${totalPrice} when you arrive for your activity.</p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Book Your Adventure</h1>
            <p className="text-gray-600">Choose your perfect Marrakech experience</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Activity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Select Activity
                </label>
                <select
                  {...register("activityId", { required: "Please select an activity" })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose an activity...</option>
                  {activities.map((activity) => (
                    <option key={activity._id} value={activity._id}>
                      {activity.name} - ${activity.price} per person
                    </option>
                  ))}
                </select>
                {errors.activityId && (
                  <p className="text-red-500 text-sm mt-1">{errors.activityId.message}</p>
                )}
              </div>

              {/* Number of People */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Number of People
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="1"
                  {...register("numberOfPeople", { 
                    valueAsNumber: true,
                    required: "Number of people is required" 
                  })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                {errors.numberOfPeople && (
                  <p className="text-red-500 text-sm mt-1">{errors.numberOfPeople.message}</p>
                )}
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...register("customerName", { required: "Name is required" })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Your full name"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register("customerPhone", { required: "Phone number is required" })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="+1234567890"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  {...register("customerEmail")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="your.email@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
                )}
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  {...register("preferredDate", { required: "Date is required" })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                {errors.preferredDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.preferredDate.message}</p>
                )}
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  {...register("specialRequests")}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Any special requirements or requests..."
                />
              </div>

              {/* Price Summary */}
              {selectedActivity && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedActivity.name}</h3>
                      <p className="text-sm text-gray-600">
                        ${selectedActivity.price} × {numberOfPeople} person{numberOfPeople !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">${totalPrice}</p>
                      <p className="text-sm text-gray-600">Cash on arrival</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedActivity}
                className={`w-full py-4 px-6 rounded-lg font-medium text-white ${
                  isSubmitting || !selectedActivity
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isSubmitting ? 'Processing...' : `Book Now - Pay $${totalPrice} on Arrival`}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
