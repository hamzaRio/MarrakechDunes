import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityRatingProps {
  activityId: string;
  className?: string;
  showReviewCount?: boolean;
}

interface RatingData {
  averageRating: number;
  totalReviews: number;
}

export default function ActivityRating({ 
  activityId, 
  className = "", 
  showReviewCount = true 
}: ActivityRatingProps) {
  const { data: rating, isLoading } = useQuery<RatingData>({
    queryKey: [`/api/activities/${activityId}/rating`],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${activityId}/rating`);
      if (!response.ok) throw new Error("Failed to fetch rating");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!rating || rating.totalReviews === 0) {
    return (
      <div className={`flex items-center space-x-1 text-gray-500 ${className}`}>
        <Star className="w-4 h-4" />
        <span className="text-sm">No reviews yet</span>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {/* Full stars */}
        {Array(fullStars).fill(null).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array(emptyStars).fill(null).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {renderStars(rating.averageRating)}
      <span className="text-sm font-medium text-gray-700">
        {rating.averageRating.toFixed(1)}
      </span>
      {showReviewCount && (
        <Badge variant="secondary" className="text-xs">
          {rating.totalReviews} {rating.totalReviews === 1 ? 'review' : 'reviews'}
        </Badge>
      )}
    </div>
  );
}