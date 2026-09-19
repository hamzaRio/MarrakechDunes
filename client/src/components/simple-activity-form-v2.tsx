import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
import { Plus, Upload, Search, X, Link as LinkIcon } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
// Removed GYGReferenceTool - not needed for simple form
import type { ActivityType } from "marrakechdunes-shared/schema";

const activityFormSchema = z.object({
  name: z.string().min(2, "Le nom de l'activité est requis"),
  description: z.string().min(10, "La description est requise"),
  price: z.string().min(1, "Le prix est requis"),
  currency: z.string().default("MAD"),
  category: z.string().min(1, "La catégorie est requise"),
  location: z.string().optional(),
  duration: z.string().optional(),
  maxParticipants: z.string().optional(),
  difficulty: z.string().optional(),
  imageUrls: z.array(z.string()).default([]),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface SimpleActivityFormProps {
  activity?: ActivityType;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  mode?: 'create' | 'edit';
}

const categories = [
  "Aventures",
  "Culture",
  "Nature",
  "Gastronomie",
  "Sport",
  "Relaxation",
  "Histoire",
  "Artisanat",
];

const difficulties = [
  "Facile",
  "Modéré",
  "Difficile",
  "Expert",
];

export default function SimpleActivityForm({ 
  activity, 
  onSuccess, 
  trigger,
  mode = 'create'
}: SimpleActivityFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>(activity?.imageUrls || []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: activity?.name || "",
      description: activity?.description || "",
      price: activity?.price?.toString() || "",
      currency: activity?.currency || "MAD",
      category: activity?.category || "",
      location: activity?.location || "",
      duration: activity?.duration || "",
      maxParticipants: activity?.maxParticipants?.toString() || "",
      difficulty: activity?.difficulty || "",
      imageUrls: activity?.imageUrls || [],
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const payload = {
        ...data,
        price: Number(data.price),
        maxParticipants: data.maxParticipants ? Number(data.maxParticipants) : undefined,
        imageUrls: images,
        isActive: true,
        approvalStatus: "approved" as const,
      };

      if (activity) {
        return await api.put(`/admin/activities/${activity._id}`, payload);
      } else {
        return await api.post("/activities", payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: activity ? "Activité mise à jour avec succès" : "Activité créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      form.reset();
      setImages([]);
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error saving activity:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de l'activité",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ActivityFormData) => {
    createActivityMutation.mutate(data);
  };

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleAddImageUrl = () => {
    const urlInput = document.getElementById('image-url-input') as HTMLInputElement;
    const url = urlInput?.value?.trim();
    if (url && isValidImageUrl(url)) {
      setImages(prev => [...prev, url]);
      urlInput.value = '';
      toast({
        title: "Image URL Added",
        description: "Image URL has been added successfully",
      });
    } else {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            {activity ? "Modifier l'Activité" : "+ Ajouter une Activité"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>
            {activity ? "Modifier l'Activité" : "Ajouter une Nouvelle Activité"}
          </DialogTitle>
          <DialogDescription>
            {activity 
              ? "Modifiez les détails de votre activité" 
              : "Créez une nouvelle activité pour votre catalogue"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Nom de l'Activité */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'Activité *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ex. Visite de Marrakech" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Décrivez l'activité en détail..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prix et Catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Votre Prix (MAD) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="ex. 500" />
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
                    <FormLabel>Catégorie *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="text-gray-900 dark:text-gray-100">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lieu et Durée */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ex. Marrakech" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ex. 4 heures" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Participants et Difficulté */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants Maximum</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="ex. 10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulté</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty} className="text-gray-900 dark:text-gray-100">
                            {difficulty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Upload d'Images */}
            <div className="space-y-4">
              <FormLabel>Images de l'Activité</FormLabel>
              
              {/* URL Input for Internet Images */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="image-url-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImageUrl}
                    variant="outline"
                    className="gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Add URL
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Or upload from your computer below
                </p>
              </div>

              {/* File Upload */}
              <ObjectUploader
                maxNumberOfFiles={5}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={async () => {
                  const res = await apiRequest("/objects/upload", {
                    method: "POST"
                  });
                  const data = await res.json();
                  return {
                    method: "PUT" as const,
                    url: data.uploadURL,
                  };
                }}
                onUpload={handleImageUpload}
                buttonClassName="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images from Desktop
              </ObjectUploader>

              {/* Display Current Images */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Images ({images.length}/5):</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Activity image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border border-gray-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Maximum 5 images (JPEG, PNG, WebP) - Upload from desktop or add URLs from internet
              </p>
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createActivityMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {createActivityMutation.isPending ? (
                  "Sauvegarde..."
                ) : activity ? (
                  "Mettre à Jour"
                ) : (
                  "Créer l'Activité"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
