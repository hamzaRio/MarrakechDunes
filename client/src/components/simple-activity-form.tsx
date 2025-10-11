import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
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
import { getAssetUrl } from "@/lib/utils";
import { Plus, Settings, Trash2, Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import MoroccoCompetitorSearch from "@/components/morocco-competitor-search";
import type { ActivityType } from "marrakechdunes-shared/schema";
// import type { UploadResult } from "@uppy/core";

const createActivityFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(2, "Le nom de l'activité est requis"),
  description: z.string().min(10, "La description est requise"),
  price: z.string().min(1, "Le prix est requis"),
  currency: z.string().default("MAD"),
  category: z.string().min(1, "La catégorie est requise"),
  location: z.string().optional(),
  duration: z.string().optional(),
  maxParticipants: z.string().optional(),
  availability: z.string().optional(),
  imageUrls: z.array(z.string()).default([]),
  getyourguidePrice: z.string().optional(),
});

type ActivityFormData = z.infer<ReturnType<typeof createActivityFormSchema>>;

interface SimpleActivityFormProps {
  mode: "create" | "edit" | "delete";
  activity?: ActivityType;
  trigger?: React.ReactNode;
}

export default function SimpleActivityForm({ mode, activity, trigger }: SimpleActivityFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  // const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(createActivityFormSchema(() => "")),
    defaultValues: {
      name: activity?.name || "",
      description: activity?.description || "",
      price: activity?.price?.toString() || "",
      currency: activity?.currency || "MAD",
      category: activity?.category || "",
      location: activity?.location || "",
      duration: activity?.duration || "",
      maxParticipants: activity?.maxParticipants?.toString() || "",
      availability: activity?.availability || "",
      imageUrls: activity?.imageUrls || [],
      getyourguidePrice: activity?.getyourguidePrice?.toString() || "",
    },
  });

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const payload = {
        ...data,
        imageUrls: data.imageUrls.filter((url) => !!url?.trim()),
      };
      const res = await apiRequest("/admin/activities", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Activité Créée",
        description: "Nouvelle activité créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de Création",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update activity mutation
  const updateActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const payload = {
        ...data,
        imageUrls: data.imageUrls.filter((url) => !!url?.trim()),
      };
      const res = await apiRequest(`/admin/activities/${activity?.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      setIsOpen(false);
      toast({
        title: "Activité Mise à Jour",
        description: "Activité mise à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de Mise à Jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/admin/activities/${activity?.id}`, {
        method: "DELETE"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      setIsOpen(false);
      toast({
        title: "Activité Supprimée",
        description: "Activité supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur de Suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ActivityFormData) => {
    if (mode === "create") {
      createActivityMutation.mutate(data);
    } else if (mode === "edit") {
      updateActivityMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (mode === "delete") {
      deleteActivityMutation.mutate();
    }
  };

  const handleUploadComplete = (uploadURL: string) => {
    setUrls(prev => [...prev, uploadURL]);
    form.setValue("imageUrls", [...urls, uploadURL]);
  };

  const getDefaultTrigger = () => {
    switch (mode) {
      case "create":
        return (
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Nouvelle Activité
          </Button>
        );
      case "edit":
        return (
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-1" />
            Modifier
          </Button>
        );
      case "delete":
        return (
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (mode === "delete") {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Supprimer l'Activité
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteActivityMutation.isPending}
            >
              {deleteActivityMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'Activité *</FormLabel>
                <FormControl>
                  <Input placeholder="ex. Visite de Marrakech" {...field} />
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
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Décrivez l'activité en détail..." 
                    rows={4}
                    {...field} 
                  />
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
                  <FormLabel>Prix (MAD) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500" {...field} />
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
                      <SelectItem value="desert">Désert</SelectItem>
                      <SelectItem value="mountains">Montagnes</SelectItem>
                      <SelectItem value="city">Ville</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="adventure">Aventure</SelectItem>
                      <SelectItem value="relaxation">Détente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu</FormLabel>
                  <FormControl>
                    <Input placeholder="ex. Marrakech" {...field} />
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
                    <Input placeholder="ex. 4 heures" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Morocco Competitor Search */}
          <div className="bg-gradient-to-r from-moroccan-blue/10 to-moroccan-red/10 p-4 rounded-lg border-2 border-moroccan-blue/20">
            <h4 className="font-semibold text-moroccan-blue mb-3 flex items-center gap-2">
              🇲🇦 Recherche Concurrence Maroc
            </h4>
            <p className="text-xs text-moroccan-blue mb-3">
              Recherchez des activités similaires au Maroc pour comparer les prix
            </p>
            <MoroccoCompetitorSearch
              onActivitySelect={(activity) => {
                form.setValue("name", activity.title);
                form.setValue("description", activity.description);
                form.setValue("price", activity.price.toString());
                form.setValue("getyourguidePrice", activity.price.toString());
                toast({
                  title: "Activité Appliquée",
                  description: `Données appliquées: ${activity.title}`,
                });
              }}
              onPriceSelect={(price, _activity) => {
                form.setValue("price", price.toString());
                form.setValue("getyourguidePrice", price.toString());
                toast({
                  title: "Prix Appliqué",
                  description: `Prix de ${price} MAD appliqué`,
                });
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="imageUrls"
            render={({ field: _field }) => (
              <FormItem>
                <FormLabel>Images de l'Activité</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <ObjectUploader
                      maxNumberOfFiles={3}
                      maxFileSize={5242880}
                      onGetUploadParameters={async () => {
                        const res = await apiRequest("/api/objects/upload", {
                          method: "POST"
                        });
                        const data = await res.json();
                        return {
                          method: "PUT" as const,
                          url: data.uploadURL,
                        };
                      }}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          result.successful.forEach((file) => handleUploadComplete(file.uploadURL || ""));
                          toast({
                            title: "Image Téléchargée",
                            description: "Image de l'activité téléchargée avec succès.",
                          });
                        }
                      }}
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Télécharger Image
                    </ObjectUploader>
                    {urls.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {urls.map((src, index) => (
                          <img
                            key={`${src}-${index}`}
                            src={getAssetUrl(src)}
                            alt={`Image activité ${index + 1}`}
                            className="h-16 w-16 object-cover rounded-md border border-white/40 shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createActivityMutation.isPending || updateActivityMutation.isPending 
                ? "Sauvegarde..." 
                : mode === "create" ? "Créer Activité" : "Mettre à Jour"
              }
            </Button>
          </div>
        </form>
      </Form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || getDefaultTrigger()}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-moroccan-blue">
            {mode === "create" && "➕ Ajouter Nouvelle Activité"}
            {mode === "edit" && "✏️ Modifier l'Activité"}
            {mode === "delete" && "🗑️ Supprimer l'Activité"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" && "Créez une nouvelle activité pour votre catalogue"}
            {mode === "edit" && "Modifiez les détails de cette activité"}
            {mode === "delete" && "Cette action supprimera définitivement l'activité"}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
