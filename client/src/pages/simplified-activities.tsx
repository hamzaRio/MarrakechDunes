import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Clock, Users, Star, SortAsc } from "lucide-react";
import { apiFetch } from "@/lib/api";
import SimplifiedActivityCard from "@/components/simplified-activity-card";
import SEOHead from "@/components/seo-head";
import type { ActivityType } from "marrakechdunes-shared/schema";

export default function SimplifiedActivities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");

  // Fetch activities with improved error handling
  const { data: activities, isLoading, error } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
    queryFn: async () => {
      try {
        const response = await apiFetch("/activities");
        if (!response.ok) {
          throw new Error(`Failed to fetch activities: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('[ACTIVITIES] Error fetching activities:', err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount >= 2) return false;
      return error instanceof Error && !error.message.includes('404');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Filter and sort activities
  const filteredActivities = activities?.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "popular" && activity.rating && activity.rating >= 4.5) ||
                          (filterBy === "budget" && Number(activity.price) <= 500) || 
                          (filterBy === "premium" && Number(activity.price) > 500);
    
    return matchesSearch && matchesFilter;
  }) || [];

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number(a.price) - Number(b.price);
      case "price-high":
        return Number(b.price) - Number(a.price);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEOHead 
          title="Activities - MarrakechDunes" 
          description="Discover amazing activities in Marrakech"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEOHead 
          title="Activities - MarrakechDunes" 
          description="Discover amazing activities in Marrakech"
        />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Activities</h2>
              <p className="text-gray-600">Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Activities - MarrakechDunes" 
        description="Discover amazing activities in Marrakech with easy booking"
      />
      
      {/* Header */}
      <div className="bg-moroccan-blue text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Discover Marrakech</h1>
          <p className="text-xl opacity-90">Amazing activities with easy booking</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    aria-label="Search activities"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Filter */}
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="popular">Popular (4.5+ ⭐)</SelectItem>
                  <SelectItem value="budget">Budget (≤500 MAD)</SelectItem>
                    <SelectItem value="premium">Premium (&gt;500 MAD)</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {sortedActivities.length} Activities Found
            </h2>
            {searchTerm && (
              <Badge variant="secondary">
                "{searchTerm}"
              </Badge>
            )}
          </div>
        </div>

        {/* Activities Grid */}
        {sortedActivities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Activities Found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                  setSortBy("name");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedActivities.map((activity) => (
              <SimplifiedActivityCard key={activity._id} activity={activity} />
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {activities && activities.length > 0 && (
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-center">Why Choose MarrakechDunes?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="bg-green-100 p-3 rounded-full mb-2">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Top Rated</h3>
                  <p className="text-sm text-gray-600">4.8/5 average rating</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-2">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Expert Guides</h3>
                  <p className="text-sm text-gray-600">Professional local guides</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-purple-100 p-3 rounded-full mb-2">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Best Locations</h3>
                  <p className="text-sm text-gray-600">Carefully selected spots</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-orange-100 p-3 rounded-full mb-2">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Easy Booking</h3>
                  <p className="text-sm text-gray-600">Book in 2 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
