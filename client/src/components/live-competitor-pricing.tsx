import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface LiveCompetitorPricingProps {
  activityName: string;
  city?: string;
  onPriceUpdate?: (price: number) => void;
}

interface CompetitorPrice {
  title: string;
  city: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  reviewsCount?: number;
  provider: string;
  providerUrl?: string;
}

export default function LiveCompetitorPricing({ 
  activityName, 
  city, 
  onPriceUpdate 
}: LiveCompetitorPricingProps) {
  const [competitorPrices, setCompetitorPrices] = useState<CompetitorPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchLivePrices = async () => {
    if (!activityName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await api.get('/competitors/suggest', {
        params: { 
          query: activityName, 
          city: city || 'Marrakech' 
        }
      });
      
      const data = response.data;
      if (data?.items && Array.isArray(data.items)) {
        setCompetitorPrices(data.items);
        setLastUpdated(new Date());
        
        // Notify parent component of the first price
        if (data.items.length > 0 && onPriceUpdate) {
          onPriceUpdate(data.items[0].priceMAD);
        }
        
        toast({
          title: "Prix concurrent mis à jour",
          description: `${data.items.length} prix trouvés pour "${activityName}"`,
        });
      } else {
        setCompetitorPrices([]);
        toast({
          title: "Aucun prix concurrent trouvé",
          description: "Aucune activité similaire trouvée sur GetYourGuide",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching competitor prices:', error);
      toast({
        title: "Erreur de récupération",
        description: "Impossible de récupérer les prix concurrents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    if (activityName.trim()) {
      fetchLivePrices();
    }
  }, [activityName, city]);

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'getyourguide':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viator':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mock':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'getyourguide':
        return '🌍';
      case 'viator':
        return '✈️';
      case 'mock':
        return '📊';
      default:
        return '🔍';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Prix Concurrents (GetYourGuide)
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Mis à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLivePrices}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-600">Récupération des prix concurrents...</span>
            </div>
          </div>
        ) : competitorPrices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun prix concurrent trouvé</p>
            <p className="text-sm text-gray-400 mt-1">
              Essayez de modifier le nom de l'activité
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {competitorPrices.slice(0, 5).map((price, index) => (
              <div
                key={`${price.provider}-${price.title}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{price.title}</span>
                    <Badge className={`${getProviderColor(price.provider)} flex items-center gap-1`}>
                      <span>{getProviderIcon(price.provider)}</span>
                      {price.provider}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📍 {price.city}</span>
                    <span>⏱️ {price.durationText}</span>
                    {price.rating && (
                      <span>⭐ {price.rating.toFixed(1)} ({price.reviewsCount} avis)</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {price.priceMAD} MAD
                    </div>
                    {index === 0 && (
                      <div className="text-xs text-green-500 font-medium">
                        Prix le plus bas
                      </div>
                    )}
                  </div>
                  
                  {price.providerUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(price.providerUrl, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {competitorPrices.length > 5 && (
              <div className="text-center text-sm text-gray-500">
                +{competitorPrices.length - 5} autres prix disponibles
              </div>
            )}
          </div>
        )}
        
        <div className="pt-3 border-t">
          <div className="text-xs text-gray-500">
            💡 <strong>Conseil:</strong> Utilisez ces prix pour positionner votre activité de manière compétitive
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
