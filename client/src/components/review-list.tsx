import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar, CheckCircle } from "lucide-react";
import type { ReviewWithActivity } from "@shared/schema";

interface ReviewListProps {
  activityId?: string;
  showActivityName?: boolean;
  limit?: number;
}

export default function ReviewList({ activityId, showActivityName = false, limit }: ReviewListProps) {
  
  const { data: reviews = [], isLoading } = useQuery<ReviewWithActivity[]>({
    queryKey: activityId ? ["/api/reviews", { activityId }] : ["/api/reviews"],
    queryFn: async () => {
      const url = activityId ? `/api/reviews?activityId=${activityId}` : "/api/reviews";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
  });

  const displayedReviews = limit ? reviews.slice(0, limit) : reviews;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">
            Be the first to share your experience with this activity!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-moroccan-blue">
          Customer Reviews ({reviews.length})
        </h3>
      </div>

      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <Card key={review._id} className="border-l-4 border-l-moroccan-gold">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{review.customerName}</span>
                      </div>
                      {(review as any).verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      {renderStars(review.rating)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(review.createdAt.toString())}
                      </div>
                    </div>
                  </div>
                  {showActivityName && review.activity && (
                    <Badge variant="outline" className="text-moroccan-blue border-moroccan-blue">
                      {review.activity.name}
                    </Badge>
                  )}
                </div>

                {/* Review Content */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{(review as any).title || 'Review'}</h4>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}