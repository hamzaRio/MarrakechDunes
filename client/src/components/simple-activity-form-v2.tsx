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
import { Plus, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
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
        return await api.put(`/activities/${activity._id}`, payload);
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
    setImages(urls);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {activity ? "Modifier l'Activité" : "Ajouter une Activité"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
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
                      <SelectContent>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
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
            <div className="space-y-2">
              <FormLabel>Images de l'Activité</FormLabel>
              <ObjectUploader
                onUpload={handleImageUpload}
                // existingUrls={images} // Not supported in current ObjectUploader
                maxFiles={5}
                acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
              />
              <p className="text-sm text-gray-500">
                Téléchargez jusqu'à 5 images (JPEG, PNG, WebP)
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
                className="bg-moroccan-blue hover:bg-moroccan-blue/90"
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
