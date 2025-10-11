import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, Clock, Star, ExternalLink, Plus } from 'lucide-react';
import apiClient from '@/lib/api';

/**
 * Zod schema for activity form validation
 */
const activitySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  price: z.coerce.number().positive('Le prix doit être positif'),
  category: z.string().min(1, 'La catégorie est requise'),
  location: z.string().optional(),
  duration: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

/**
 * External activity interface
 */
interface ExternalActivity {
  title: string;
  city: string;
  category?: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  reviewsCount?: number;
  provider: 'GetYourGuide' | 'Viator' | 'Mock';
  providerUrl?: string;
}

/**
 * Add Activity Modal with Morocco Competitor Search
 */
export default function AddActivityModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess?: () => void; 
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalActivity[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { toast } = useToast();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      location: '',
      duration: '',
    }
  });

  /**
   * Search for external activities in Morocco
   */
  const searchCompetitors = async () => {
    const formData = form.getValues();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nom d\'activité pour rechercher',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await apiClient.get('/api/external-activities', {
        params: {
          query: formData.name,
          city: formData.location || undefined,
          category: formData.category || undefined,
          minRating: 0
        }
      });

      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
        
        toast({
          title: 'Recherche terminée',
          description: `${response.data.count} activités trouvées au Maroc`,
        });
      } else {
        throw new Error(response.data.error || 'Erreur lors de la recherche');
      }
    } catch (error: any) {
      console.error('[ACTIVITY_MODAL] Search error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la recherche d\'activités similaires',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Use competitor price and details
   */
  const useCompetitorData = (activity: ExternalActivity) => {
    form.setValue('name', activity.title);
    form.setValue('price', activity.priceMAD);
    form.setValue('location', activity.city);
    form.setValue('duration', activity.durationText);
    if (activity.category) {
      form.setValue('category', activity.category);
    }
    
    toast({
      title: 'Données appliquées',
      description: `Prix et détails de ${activity.title} appliqués`,
    });
    
    setShowSearchResults(false);
  };

  /**
   * Add activity from competitor data
   */
  const addFromCompetitor = (activity: ExternalActivity) => {
    form.setValue('name', activity.title);
    form.setValue('price', activity.priceMAD);
    form.setValue('location', activity.city);
    form.setValue('duration', activity.durationText);
    if (activity.category) {
      form.setValue('category', activity.category);
    }
    
    toast({
      title: 'Activité ajoutée',
      description: `${activity.title} ajoutée au formulaire`,
    });
    
    setShowSearchResults(false);
  };

  /**
   * Submit activity form
   */
  const onSubmit = async (data: ActivityFormData) => {
    try {
      // Here you would typically call your API to create the activity
      console.log('[ACTIVITY_MODAL] Creating activity:', data);
      
      toast({
        title: 'Succès',
        description: 'Activité créée avec succès',
      });
      
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('[ACTIVITY_MODAL] Create error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de l\'activité',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter une Nouvelle Activité
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle activité avec recherche de concurrence au Maroc
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Activity Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'Activité *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="ex. Excursion Désert d'Agafay"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix (MAD) *</Label>
              <Input
                id="price"
                type="number"
                {...form.register('price', { valueAsNumber: true })}
                placeholder="ex. 450"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-600">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select onValueChange={(value) => form.setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Culture">Culture</SelectItem>
                  <SelectItem value="Désert">Désert</SelectItem>
                  <SelectItem value="Nature">Nature</SelectItem>
                  <SelectItem value="Plage">Plage</SelectItem>
                  <SelectItem value="Montagnes">Montagnes</SelectItem>
                  <SelectItem value="Gastronomie">Gastronomie</SelectItem>
                  <SelectItem value="Bien-être">Bien-être</SelectItem>
                  <SelectItem value="Aventure">Aventure</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                {...form.register('location')}
                placeholder="ex. Marrakech"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durée</Label>
              <Input
                id="duration"
                {...form.register('duration')}
                placeholder="ex. 8 heures"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Décrivez l'activité en détail..."
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Morocco Competitor Search */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Search className="w-5 h-5" />
                🔎 Recherche Concurrence Maroc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-600">
                Recherchez des activités similaires au Maroc pour comparer les prix et obtenir des idées
              </p>
              
              <Button
                type="button"
                onClick={searchCompetitors}
                disabled={isSearching}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Recherche des activités similaires...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Recherche Concurrence Maroc
                  </>
                )}
              </Button>

              {/* Search Results */}
              {showSearchResults && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700">
                    Résultats de la Concurrence ({searchResults.length} activités)
                  </h4>
                  
                  {searchResults.length === 0 ? (
                    <p className="text-gray-600 text-sm">Aucune activité similaire trouvée.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {searchResults.map((activity, index) => (
                        <Card key={index} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h5 className="font-medium text-sm">{activity.title}</h5>
                                <Badge variant="outline" className="text-xs">
                                  {activity.provider}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {activity.city}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activity.durationText}
                                </div>
                                {activity.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400" />
                                    {activity.rating}/5 ({activity.reviewsCount})
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-green-600">
                                  {activity.priceMAD} MAD
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => useCompetitorData(activity)}
                                    className="text-xs"
                                  >
                                    Utiliser Prix
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addFromCompetitor(activity)}
                                    className="text-xs"
                                  >
                                    Ajouter Activité
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Enregistrer l'Activité
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
