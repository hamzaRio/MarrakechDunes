import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  TrendingDown,
  Globe
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getAssetUrl } from "@/lib/utils";
import type { ActivityType } from "marrakechdunes-shared/schema";
import GetYourGuidePriceFetcher from "@/components/getyourguide-price-fetcher";

interface ActivityFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  location: string;
  maxParticipants: string;
  imageUrls: string[];
  category: string;
  difficulty: string;
  getyourguidePrice?: string;
}

export default function ActivityManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    description: '',
    price: 0,
    duration: '',
    location: '',
    maxParticipants: 1,
    imageUrls: [''],
    category: 'adventure',
    difficulty: 'easy',
    getyourguidePrice: 0
  });

  // Fetch activities
  const { data: activities, isLoading } = useQuery<ActivityType[]>({
    queryKey: ["/admin/activities/all"],
    queryFn: () => apiFetch("/admin/activities/all"),
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (activityData: ActivityFormData) => {
      return apiFetch("/admin/activities", {
        method: "POST",
        data: activityData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/activities/all"] });
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      toast({
        title: "Activity Created",
        description: "Activity has been created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error?.message || "Failed to create activity",
        variant: "destructive",
      });
    }
  });

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ActivityFormData> }) => {
      return apiFetch(`/admin/activities/${id}`, {
        method: "PUT",
        data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/activities/all"] });
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      toast({
        title: "Activity Updated",
        description: "Activity has been updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update activity",
        variant: "destructive",
      });
    }
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      return apiFetch(`/admin/activities/${activityId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/activities/all"] });
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      toast({
        title: "Activity Deleted",
        description: "Activity has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete activity",
        variant: "destructive",
      });
    }
  });

  // Update GetYourGuide price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      return apiFetch(`/admin/activities/${id}/getyourguide-price`, {
        method: "PATCH",
        data: { getyourguidePrice: price }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/activities/all"] });
      toast({
        title: "Price Updated",
        description: "GetYourGuide price has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Price Update Failed",
        description: error?.message || "Failed to update price",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: '',
      location: '',
      maxParticipants: 1,
      imageUrls: [''],
      category: 'adventure',
      difficulty: 'easy',
      getyourguidePrice: 0
    });
  };

  const handleEdit = (activity: ActivityType) => {
    setSelectedActivity(activity);
    setFormData({
      name: activity.name,
      description: activity.description || '',
      price: activity.price.toString(),
      duration: activity.duration || '',
      location: activity.location || '',
      maxParticipants: (activity.maxParticipants || 1).toString(),
      imageUrls: activity.imageUrls || [''],
      category: activity.category || 'adventure',
      difficulty: activity.difficulty || 'easy',
      getyourguidePrice: (activity.getyourguidePrice || 0).toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string form data to proper types for API
    const apiData = {
      ...formData,
      price: Number(formData.price),
      maxParticipants: Number(formData.maxParticipants),
      getyourguidePrice: formData.getyourguidePrice ? Number(formData.getyourguidePrice) : undefined
    };
    
    if (selectedActivity) {
      updateActivityMutation.mutate({
        id: selectedActivity._id,
        data: apiData
      });
    } else {
      createActivityMutation.mutate(apiData);
    }
  };

  const handleAddImageUrl = () => {
    setFormData({
      ...formData,
      imageUrls: [...formData.imageUrls, '']
    });
  };

  const handleGetYourGuidePriceSelect = (price: number, suggestions: any) => {
    setFormData({ ...formData, getyourguidePrice: price.toString() });
    
    // Show toast with pricing suggestion
    toast({
      title: "Competitor Price Found",
      description: `GetYourGuide price: ${price} MAD. Consider setting your price based on the suggestions.`,
    });
  };

  const handleRemoveImageUrl = (index: number) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index)
    });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = value;
    setFormData({
      ...formData,
      imageUrls: newImageUrls
    });
  };

  // Filter activities
  const filteredActivities = (activities || []).filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "approved" && activity.approvalStatus === 'approved') ||
                         (statusFilter === "pending" && activity.approvalStatus === 'pending') ||
                         (statusFilter === "rejected" && activity.approvalStatus === 'rejected');
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Management</h2>
          <p className="text-gray-600">Manage activities, pricing, and competitor analysis</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setSelectedActivity(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900"
            aria-describedby="activity-form-description"
          >
            <DialogHeader>
              <DialogTitle className="text-gray-900">Create New Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-900 font-medium">Activity Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="text-gray-900 bg-white border-gray-300"
                    placeholder="e.g., Hot Air Balloon Ride"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-gray-900 font-medium">Price (MAD) *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="text-gray-900 bg-white border-gray-300"
                    />
                    {Number(formData.getyourguidePrice) > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const competitivePrice = Math.round(Number(formData.getyourguidePrice) * 0.95);
                          setFormData({ ...formData, price: competitivePrice.toString() });
                          toast({
                            title: "Price Updated",
                            description: `Set to competitive price: ${competitivePrice} MAD (5% below GetYourGuide)`,
                          });
                        }}
                        className="whitespace-nowrap"
                      >
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Use Competitive
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* GetYourGuide Price Fetcher */}
              <GetYourGuidePriceFetcher
                activityName={formData.name}
                onPriceSelect={handleGetYourGuidePriceSelect}
                currentPrice={formData.getyourguidePrice}
              />

              <div>
                <Label htmlFor="description" className="text-gray-900 font-medium">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="text-gray-900 bg-white border-gray-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-gray-900 font-medium">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 4 hours"
                    className="text-gray-900 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-900 font-medium">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Marrakech"
                    className="text-gray-900 bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="maxParticipants" className="text-gray-900 font-medium">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })}
                    className="text-gray-900 bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-gray-900 font-medium">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="text-gray-900 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="adventure" className="text-gray-900">Adventure</SelectItem>
                      <SelectItem value="cultural" className="text-gray-900">Cultural</SelectItem>
                      <SelectItem value="nature" className="text-gray-900">Nature</SelectItem>
                      <SelectItem value="desert" className="text-gray-900">Desert</SelectItem>
                      <SelectItem value="city" className="text-gray-900">City</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty" className="text-gray-900 font-medium">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger className="text-gray-900 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="easy" className="text-gray-900">Easy</SelectItem>
                      <SelectItem value="medium" className="text-gray-900">Medium</SelectItem>
                      <SelectItem value="hard" className="text-gray-900">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="getyourguidePrice" className="text-gray-900 font-medium">GetYourGuide Price (MAD)</Label>
                <Input
                  id="getyourguidePrice"
                  type="number"
                  value={formData.getyourguidePrice}
                  onChange={(e) => setFormData({ ...formData, getyourguidePrice: parseInt(e.target.value) || 0 })}
                  placeholder="Competitor price for comparison"
                  className="text-gray-900 bg-white border-gray-300"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium">Image URLs</Label>
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      placeholder="Image URL"
                      className="text-gray-900 bg-white border-gray-300"
                    />
                    {formData.imageUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveImageUrl(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImageUrl}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image URL
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createActivityMutation.isPending}>
                  {createActivityMutation.isPending ? "Creating..." : "Create Activity"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((activity) => (
          <Card key={activity._id} className="hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden">
              <img
                src={getAssetUrl(activity.imageUrls?.[0] || '')}
                alt={activity.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-activity.jpg';
                }}
              />
              <div className="absolute top-2 right-2">
                <Badge variant={
                  activity.approvalStatus === 'approved' ? 'default' :
                  activity.approvalStatus === 'pending' ? 'secondary' : 'destructive'
                }>
                  {activity.approvalStatus}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{activity.name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">{activity.price} MAD</span>
                  {activity.getyourguidePrice && (
                    <span className="text-xs text-gray-500">
                      (GYG: {activity.getyourguidePrice} MAD)
                    </span>
                  )}
                </div>
                
                {activity.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{activity.duration}</span>
                  </div>
                )}
                
                {activity.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                )}
                
                {activity.maxParticipants && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Up to {activity.maxParticipants} people</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(activity)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newPrice = prompt(`Enter GetYourGuide price for ${activity.name}:`, activity.getyourguidePrice?.toString() || '');
                    if (newPrice && !isNaN(parseInt(newPrice))) {
                      updatePriceMutation.mutate({
                        id: activity._id,
                        price: parseInt(newPrice)
                      });
                    }
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  GYG Price
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{activity.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteActivityMutation.mutate(activity._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby="edit-activity-description"
        >
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Activity Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price (MAD) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-maxParticipants">Max Participants</Label>
                <Input
                  id="edit-maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="desert">Desert</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-getyourguidePrice">GetYourGuide Price (MAD)</Label>
              <Input
                id="edit-getyourguidePrice"
                type="number"
                value={formData.getyourguidePrice}
                onChange={(e) => setFormData({ ...formData, getyourguidePrice: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label>Image URLs</Label>
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder="Image URL"
                  />
                  {formData.imageUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImageUrl(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImageUrl}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image URL
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateActivityMutation.isPending}>
                {updateActivityMutation.isPending ? "Updating..." : "Update Activity"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
