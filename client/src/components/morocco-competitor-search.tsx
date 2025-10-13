import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, MapPin, Star, ExternalLink, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-utils';

interface MoroccoActivity {
  id: string;
  title: string;
  city: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  duration: string;
  source: 'GetYourGuide' | 'Viator' | 'TripAdvisor' | 'Airbnb';
  link: string;
  description: string;
  imageUrl?: string;
}

interface MoroccoCompetitorSearchProps {
  onActivitySelect?: (activity: MoroccoActivity) => void;
  onPriceSelect?: (price: number, activity: MoroccoActivity) => void;
}

const MOROCCO_CITIES = [
  'Marrakech', 'Casablanca', 'Fès', 'Rabat', 'Agadir', 'Tanger', 'Meknès', 
  'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'Mohammedia', 'Khouribga', 'Beni Mellal',
  'El Jadida', 'Taza', 'Nador', 'Settat', 'Larache', 'Ksar El Kebir'
];

const ACTIVITY_TYPES = [
  'Visite de la ville', 'Désert', 'Montagnes', 'Côte atlantique', 'Culture et histoire',
  'Gastronomie', 'Aventure', 'Relaxation', 'Photographie', 'Artisanat'
];

export default function MoroccoCompetitorSearch({ onActivitySelect, onPriceSelect }: MoroccoCompetitorSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activities, setActivities] = useState<MoroccoActivity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const searchMoroccoActivities = async () => {
    if (!searchQuery.trim() && !selectedCity && !selectedType) {
      toast({
        title: "Recherche requise",
        description: "Veuillez saisir un terme de recherche, sélectionner une ville ou un type d'activité.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const query = `${searchQuery} ${selectedCity} ${selectedType} maroc`.trim();
      console.log(`[MOROCCO] Recherche d'activités au Maroc: ${query}`);
      
      const response = await apiFetch(`/competitors/suggest?query=${encodeURIComponent(query)}&city=${selectedCity}`);
      
      if (response && response.items && Array.isArray(response.items)) {
        const moroccoActivities: MoroccoActivity[] = response.items.map((item: any) => ({
          id: item.id || Math.random().toString(),
          title: item.title || 'Activité sans nom',
          city: item.city || selectedCity || 'Marrakech',
          price: Number(item.priceMAD) || 0,
          currency: 'MAD',
          rating: Number(item.rating) || 4.0,
          reviewCount: Number(item.reviewsCount) || 0,
          duration: item.durationText || 'Non spécifié',
          source: item.provider || 'Mock',
          link: '#',
          description: item.title || 'Aucune description disponible',
          imageUrl: ''
        }));
        
        setActivities(moroccoActivities);
        console.log(`[MOROCCO] Trouvé ${moroccoActivities.length} activités au Maroc`);
        
        toast({
          title: "Recherche terminée",
          description: `${moroccoActivities.length} activités trouvées au Maroc`,
        });
      } else {
        setActivities([]);
        toast({
          title: "Aucun résultat",
          description: "Aucune activité trouvée pour cette recherche.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[MOROCCO] Erreur de recherche:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les activités. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const extractCityFromTitle = (title: string): string | null => {
    const cities = MOROCCO_CITIES.map(city => city.toLowerCase());
    const titleLower = title.toLowerCase();
    
    for (const city of cities) {
      if (titleLower.includes(city)) {
        return MOROCCO_CITIES.find(c => c.toLowerCase() === city) || null;
      }
    }
    return null;
  };

  const handleActivitySelect = (activity: MoroccoActivity) => {
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
    setIsOpen(false);
  };

  const handlePriceSelect = (activity: MoroccoActivity) => {
    if (onPriceSelect) {
      onPriceSelect(activity.price, activity);
    }
    toast({
      title: "Prix sélectionné",
      description: `Prix de ${activity.price} MAD sélectionné pour ${activity.title}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-moroccan-blue to-moroccan-red text-white hover:from-moroccan-red hover:to-moroccan-blue">
          <MapPin className="h-4 w-4 mr-2" />
          🔍 Recherche Concurrence Maroc
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gray-300 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-moroccan-blue flex items-center gap-2">
            🇲🇦 Analyse Concurrence Maroc
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Controls */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-moroccan-blue">🔍 Critères de Recherche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search-query">Terme de recherche</Label>
                  <Input
                    id="search-query"
                    placeholder="ex. désert, montagnes, culture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-2 border-gray-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city-select">Ville au Maroc</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="border-2 border-gray-300">
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOROCCO_CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="type-select">Type d'activité</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="border-2 border-gray-300">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={searchMoroccoActivities}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-moroccan-blue to-moroccan-red text-white hover:from-moroccan-red hover:to-moroccan-blue"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    🔍 Analyser la Concurrence au Maroc
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {activities.length > 0 && (
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-moroccan-blue flex items-center gap-2">
                  📊 Résultats de la Concurrence ({activities.length} activités)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activities.map((activity) => (
                    <Card key={activity.id} className="border-2 border-gray-200 hover:border-moroccan-blue transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">
                              {activity.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {activity.source}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-moroccan-blue" />
                            <span>{activity.city}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-moroccan-blue" />
                            <span>{activity.duration}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{activity.rating}/5 ({activity.reviewCount} avis)</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-lg font-bold text-green-600">
                                {activity.price.toLocaleString()} {activity.currency}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePriceSelect(activity)}
                              className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Utiliser Prix
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivitySelect(activity)}
                              className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <Users className="h-3 w-3 mr-1" />
                              Ajouter Activité
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(activity.link, '_blank')}
                              className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {activities.length === 0 && !isSearching && (
            <Card className="bg-gray-50 border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Aucune activité trouvée</h3>
                  <p>Utilisez les critères de recherche ci-dessus pour trouver des activités concurrentes au Maroc.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
