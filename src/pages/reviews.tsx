import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ReviewList from "@/components/review-list";
import ReviewForm from "@/components/review-form";
import ActivityRating from "@/components/activity-rating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageSquare, Filter, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { ActivityType } from "@shared/schema";

export default function Reviews() {
  const { t } = useLanguage();
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedActivityForReview, setSelectedActivityForReview] = useState<ActivityType | null>(null);

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  const handleWriteReview = (activity?: ActivityType) => {
    if (activity) {
      setSelectedActivityForReview(activity);
    }
    setShowReviewForm(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setSelectedActivityForReview(null);
  };

  return (
    <div className="min-h-screen bg-moroccan-sand">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-moroccan-blue mb-4">
            Customer Reviews
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover what our travelers say about their authentic Moroccan experiences
          </p>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {activities.slice(0, 4).map((activity) => (
            <Card key={activity.id || activity._id} className="border-moroccan-gold/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-moroccan-blue mb-2 truncate">
                  {activity.name}
                </h3>
                <ActivityRating 
                  activityId={activity.id} 
                  className="mb-3" 
                  showReviewCount={true}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWriteReview(activity)}
                  className="w-full text-moroccan-blue border-moroccan-blue hover:bg-moroccan-blue hover:text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Write Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-moroccan-blue" />
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                {activities.map((activity) => (
                  <SelectItem key={activity.id || activity._id} value={activity.id || activity._id}>
                    {activity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={() => handleWriteReview()}
            className="bg-moroccan-red hover:bg-red-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-moroccan-blue">Write a Review</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowReviewForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </Button>
                </div>
                
                {selectedActivityForReview ? (
                  <ReviewForm
                    activityId={selectedActivityForReview.id}
                    activityName={selectedActivityForReview.name}
                    onSuccess={handleReviewSubmitted}
                  />
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600">Select an activity to review:</p>
                    <div className="grid gap-2">
                      {activities.map((activity) => (
                        <Button
                          key={activity.id || activity._id}
                          variant="outline"
                          onClick={() => setSelectedActivityForReview(activity)}
                          className="justify-start text-left"
                        >
                          {activity.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="max-w-4xl mx-auto">
          <ReviewList 
            activityId={selectedActivity === "all" ? undefined : selectedActivity}
            showActivityName={selectedActivity === "all"}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}