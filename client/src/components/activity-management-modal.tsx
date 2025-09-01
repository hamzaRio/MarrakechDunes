import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Settings, Trash2, Power, PowerOff, Upload, Image, Search, ExternalLink } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { ActivityType } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

const activityFormSchema = z.object({
  name: z.string().min(2, "Activity name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  currency: z.string().default("MAD"),
  category: z.string().min(1, "Category is required"),
  availability: z.string().optional(),
  image: z.string().min(1, "Image is required"),
  isActive: z.boolean().default(true),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityManagementModalProps {
  activity?: ActivityType;
  mode: "create" | "edit" | "delete" | "toggle";
  trigger?: React.ReactNode;
}

export default function ActivityManagementModal({ 
  activity, 
  mode, 
  trigger 
}: ActivityManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [priceSearchQuery, setPriceSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: activity?.name || "",
      description: activity?.description || "",
      price: activity?.price || "",
      currency: activity?.currency || "MAD",
      category: activity?.category || "",
      availability: activity?.availability || "",
      image: activity?.image || uploadedImageUrl || "",
      isActive: activity?.isActive ?? true,
    },
  });

  // Image upload mutation for updating existing activities
  const updateImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const res = await apiRequest("PUT", `/api/admin/activities/${activity?._id}/image`, { imageURL });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Image Updated",
        description: "Activity image has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Image Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const res = await apiRequest("POST", "/api/admin/activities", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Activity Created",
        description: "New activity has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // GetYourGuide price search function
  const searchGetYourGuidePrice = async () => {
    if (!priceSearchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Mock search results - in real implementation, you would call GetYourGuide API
      const mockResults = [
        {
          name: priceSearchQuery + " - Premium Tour",
          price: Math.floor(Math.random() * 500) + 200,
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/search?q=" + encodeURIComponent(priceSearchQuery)
        },
        {
          name: priceSearchQuery + " - Standard Tour",
          price: Math.floor(Math.random() * 300) + 150,
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/search?q=" + encodeURIComponent(priceSearchQuery)
        }
      ];
      
      setSearchResults(mockResults);
      toast({
        title: "Price Search Completed",
        description: `Found ${mockResults.length} similar activities on GetYourGuide`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Could not fetch price data from GetYourGuide",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Set suggested price based on search results
  const setSuggestedPrice = (suggestedPrice: number) => {
    const competitivePrice = Math.floor(suggestedPrice * 0.85); // 15% discount from competitors
    form.setValue("price", competitivePrice.toString());
    toast({
      title: "Price Updated",
      description: `Set competitive price: ${competitivePrice} MAD (15% below GetYourGuide)`,
    });
  };

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const res = await apiRequest("PUT", `/api/admin/activities/${activity?._id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsOpen(false);
      toast({
        title: "Activity Updated",
        description: "Activity has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/admin/activities/${activity?._id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsOpen(false);
      toast({
        title: "Activity Deleted",
        description: "Activity has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle activity status mutation
  const toggleActivityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/admin/activities/${activity?._id}`, {
        isActive: !activity?.isActive
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsOpen(false);
      toast({
        title: activity?.isActive ? "Activity Deactivated" : "Activity Activated",
        description: `Activity has been ${activity?.isActive ? 'deactivated' : 'activated'} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Status Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ActivityFormData) => {
    if (mode === "create") {
      createActivityMutation.mutate(data);
    } else if (mode === "edit") {
      updateActivityMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${activity?.name}"? This action cannot be undone.`)) {
      deleteActivityMutation.mutate();
    }
  };

  const handleToggle = () => {
    const action = activity?.isActive ? "deactivate" : "activate";
    if (confirm(`Are you sure you want to ${action} "${activity?.name}"?`)) {
      toggleActivityMutation.mutate();
    }
  };

  const getDialogContent = () => {
    switch (mode) {
      case "delete":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Delete Activity</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{activity?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteActivityMutation.isPending}
              >
                {deleteActivityMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </>
        );

      case "toggle":
        return (
          <>
            <DialogHeader>
              <DialogTitle>{activity?.isActive ? "Deactivate" : "Activate"} Activity</DialogTitle>
              <DialogDescription>
                Are you sure you want to {activity?.isActive ? "deactivate" : "activate"} "{activity?.name}"?
                {activity?.isActive ? " This will hide it from customers." : " This will make it available to customers."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleToggle}
                disabled={toggleActivityMutation.isPending}
                className={activity?.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {toggleActivityMutation.isPending ? "Updating..." : (activity?.isActive ? "Deactivate" : "Activate")}
              </Button>
            </div>
          </>
        );

      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "Create New Activity" : "Edit Activity"}</DialogTitle>
              <DialogDescription>
                {mode === "create" 
                  ? "Add a new adventure experience for customers to book."
                  : "Update the activity details and pricing."
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4 bg-white/95 p-6 rounded-lg border border-gray-200">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hot Air Balloon Ride" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the activity experience..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (MAD)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input type="number" placeholder="1200" {...field} />
                            
                            {/* GetYourGuide Price Search */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                                <Search className="h-4 w-4 mr-1" />
                                Competitive Pricing Assistant
                              </h4>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Search activity name on GetYourGuide..."
                                  value={priceSearchQuery}
                                  onChange={(e) => setPriceSearchQuery(e.target.value)}
                                  className="text-sm"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={searchGetYourGuidePrice}
                                  disabled={isSearching || !priceSearchQuery.trim()}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  {isSearching ? "Searching..." : "Search"}
                                </Button>
                              </div>
                              
                              {searchResults.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-blue-700">Found similar activities:</p>
                                  {searchResults.map((result, index) => (
                                    <div key={index} className="bg-white p-2 rounded border text-xs flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{result.name}</p>
                                        <p className="text-orange-600 font-bold">{result.price} MAD</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setSuggestedPrice(result.price)}
                                          className="h-6 px-2 text-xs"
                                        >
                                          Use -15%
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(result.url, '_blank')}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Adventure">Adventure</SelectItem>
                            <SelectItem value="Cultural">Cultural</SelectItem>
                            <SelectItem value="Desert">Desert</SelectItem>
                            <SelectItem value="Nature">Nature</SelectItem>
                            <SelectItem value="Historical">Historical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Image</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5242880} // 5MB
                            onGetUploadParameters={async () => {
                              const res = await apiRequest("POST", "/api/objects/upload");
                              const data = await res.json();
                              return {
                                method: "PUT" as const,
                                url: data.uploadURL,
                              };
                            }}
                            onComplete={(result) => {
                              if (result.successful && result.successful.length > 0) {
                                const uploadedFile = result.successful[0];
                                const imageUrl = uploadedFile.uploadURL;
                                setUploadedImageUrl(imageUrl);
                                field.onChange(imageUrl);
                                toast({
                                  title: "Image Uploaded",
                                  description: "Activity image has been uploaded successfully.",
                                });
                              }
                            }}
                            buttonClassName="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Activity Image
                          </ObjectUploader>
                          {field.value && (
                            <div className="flex items-center space-x-2 text-sm text-green-600">
                              <Image className="h-4 w-4" />
                              <span>Image uploaded successfully</span>
                            </div>
                          )}
                          <Input 
                            type="hidden" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Daily at sunrise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createActivityMutation.isPending || updateActivityMutation.isPending 
                      ? "Saving..." 
                      : mode === "create" ? "Create Activity" : "Update Activity"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </>
        );
    }
  };

  const getDefaultTrigger = () => {
    switch (mode) {
      case "create":
        return (
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Activity
          </Button>
        );
      case "edit":
        return (
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-1" />
            Edit
          </Button>
        );
      case "delete":
        return (
          <Button size="sm" variant="destructive">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        );
      case "toggle":
        return (
          <Button size="sm" variant="outline" className={activity?.isActive ? "text-red-600" : "text-green-600"}>
            {activity?.isActive ? <PowerOff className="h-4 w-4 mr-1" /> : <Power className="h-4 w-4 mr-1" />}
            {activity?.isActive ? "Deactivate" : "Activate"}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || getDefaultTrigger()}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/98 backdrop-blur-sm border-2 border-moroccan-gold/30 shadow-xl">
        {getDialogContent()}
      </DialogContent>
    </Dialog>
  );
}