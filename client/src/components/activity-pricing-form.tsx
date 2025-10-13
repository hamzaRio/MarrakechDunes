import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import LiveCompetitorPricing from './live-competitor-pricing';
import { api } from '@/lib/api';

const pricingSchema = z.object({
  price: z.number().min(0, 'Le prix doit être positif'),
  competitorPrice: z.number().min(0, 'Le prix concurrent doit être positif').optional(),
  margin: z.number().optional(),
  notes: z.string().optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface ActivityPricingFormProps {
  activity: {
    id: string;
    name: string;
    price: number;
    city?: string;
    getyourguidePrice?: number;
  };
  onSave?: (data: PricingFormData) => void;
  onCancel?: () => void;
}

export default function ActivityPricingForm({ 
  activity, 
  onSave, 
  onCancel 
}: ActivityPricingFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [competitorPrice, setCompetitorPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      price: activity.price || 0,
      competitorPrice: activity.getyourguidePrice || 0,
      notes: '',
    },
  });

  const watchedPrice = form.watch('price');
  const watchedCompetitorPrice = form.watch('competitorPrice');

  // Calculate margin
  useEffect(() => {
    if (watchedPrice && watchedCompetitorPrice) {
      const margin = watchedPrice - watchedCompetitorPrice;
      form.setValue('margin', margin);
    }
  }, [watchedPrice, watchedCompetitorPrice, form]);

  const updateActivityMutation = useMutation({
    mutationFn: async (data: PricingFormData) => {
      const response = await api.patch(`/activities/${activity.id}`, {
        price: data.price,
        getyourguidePrice: data.competitorPrice,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/activities'] });
      toast({
        title: "Prix mis à jour",
        description: `Le prix de "${activity.name}" a été mis à jour avec succès`,
      });
      onSave?.(form.getValues());
    },
    onError: (error) => {
      console.error('Error updating activity price:', error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour le prix de l'activité",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PricingFormData) => {
    setIsLoading(true);
    updateActivityMutation.mutate(data);
  };

  const getMarginColor = (margin: number) => {
    if (margin > 100) return 'text-green-600';
    if (margin > 0) return 'text-blue-600';
    if (margin > -50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarginIcon = (margin: number) => {
    if (margin > 100) return <TrendingUp className="w-4 h-4" />;
    if (margin > 0) return <CheckCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const margin = watchedPrice && watchedCompetitorPrice 
    ? watchedPrice - watchedCompetitorPrice 
    : 0;

  return (
    <div className="space-y-6">
      {/* Activity Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Gestion des Prix - {activity.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Ville</Label>
              <div className="font-medium">{activity.city || 'Non spécifiée'}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Prix actuel</Label>
              <div className="font-medium text-lg">{activity.price} MAD</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Competitor Pricing */}
      <LiveCompetitorPricing
        activityName={activity.name}
        city={activity.city}
        onPriceUpdate={setCompetitorPrice}
      />

      {/* Pricing Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Configuration des Prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Votre Prix (MAD) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Prix en MAD"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Competitor Price */}
                <FormField
                  control={form.control}
                  name="competitorPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix Concurrent (MAD)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Prix concurrent"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Margin Analysis */}
              {watchedPrice && watchedCompetitorPrice && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Marge de profit:</span>
                      <Badge 
                        variant="outline" 
                        className={`${getMarginColor(margin)} flex items-center gap-1`}
                      >
                        {getMarginIcon(margin)}
                        {margin > 0 ? `+${margin}` : margin} MAD
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {margin > 0 ? 'Avantage concurrentiel' : 'Prix concurrent plus élevé'}
                    </div>
                  </div>
                  
                  {margin < 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      ⚠️ Votre prix est {Math.abs(margin)} MAD plus élevé que le concurrent
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes sur la tarification</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Notes sur la stratégie de prix..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
