import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Save, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import type { ActivityType } from 'marrakechdunes-shared/schema';

interface OfflineBookingProps {
  activity: ActivityType;
  onBookingCreated?: (booking: any) => void;
}

interface OfflineBookingData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  numberOfPeople: number;
  preferredDate: string;
  participantNames: string[];
  notes: string;
  totalAmount: number;
}

export default function OfflineBooking({ activity, onBookingCreated }: OfflineBookingProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedBookings, setSavedBookings] = useState<OfflineBookingData[]>([]);
  const { toast } = useToast();
  // const { t } = useLanguage();

  const [formData, setFormData] = useState<OfflineBookingData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    numberOfPeople: 1,
    preferredDate: '',
    participantNames: [],
    notes: '',
    totalAmount: Number(activity.price) || 0
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load saved bookings from localStorage
    const saved = localStorage.getItem('offlineBookings');
    if (saved) {
      setSavedBookings(JSON.parse(saved));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInputChange = (field: keyof OfflineBookingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update total amount when number of people changes
    if (field === 'numberOfPeople') {
      setFormData(prev => ({
        ...prev,
        totalAmount: (Number(activity.price) || 0) * value
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.customerPhone || !formData.preferredDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isOnline) {
        // Submit online
        await submitOnline();
      } else {
        // Save offline
        await saveOffline();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la soumission",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOnline = async () => {
    const bookingData = {
      ...formData,
      activityId: activity._id,
      participantNames: formData.participantNames.length > 0 
        ? formData.participantNames 
        : [formData.customerName]
    };

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    if (response.ok) {
      const booking = await response.json();
      toast({
        title: "Succès",
        description: "Réservation créée avec succès",
      });
      
      if (onBookingCreated) {
        onBookingCreated(booking);
      }
      
      // Clear form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        numberOfPeople: 1,
        preferredDate: '',
        participantNames: [],
        notes: '',
        totalAmount: Number(activity.price) || 0
      });
    } else {
      throw new Error('Failed to create booking');
    }
  };

  const saveOffline = async () => {
    const newBooking = {
      ...formData,
      activityId: activity._id,
      activityName: activity.name,
      timestamp: new Date().toISOString(),
      status: 'offline'
    };

    const updatedBookings = [...savedBookings, newBooking];
    setSavedBookings(updatedBookings);
    localStorage.setItem('offlineBookings', JSON.stringify(updatedBookings));

    toast({
      title: "Sauvegardé hors ligne",
      description: "Votre réservation sera envoyée quand vous serez en ligne",
    });
  };

  const syncOfflineBookings = async () => {
    if (savedBookings.length === 0) return;

    try {
      const promises = savedBookings.map(booking => 
        fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...booking,
            participantNames: booking.participantNames.length > 0 
              ? booking.participantNames 
              : [booking.customerName]
          })
        })
      );

      await Promise.all(promises);
      
      // Clear saved bookings
      setSavedBookings([]);
      localStorage.removeItem('offlineBookings');
      
      toast({
        title: "Synchronisation réussie",
        description: `${savedBookings.length} réservations ont été synchronisées`,
      });
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les réservations hors ligne",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="border-2 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-600 font-medium">Hors ligne</span>
                </>
              )}
            </div>
            
            {!isOnline && savedBookings.length > 0 && (
              <Badge variant="outline" className="text-orange-600">
                {savedBookings.length} en attente
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Réservation - {activity.name}</span>
            {!isOnline && (
              <Badge variant="secondary">Mode hors ligne</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Nom complet *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Votre nom complet"
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Téléphone *</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="+212 6XX XXX XXX"
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            
            <div>
              <Label htmlFor="numberOfPeople">Nombre de personnes *</Label>
              <Input
                id="numberOfPeople"
                type="number"
                min="1"
                value={formData.numberOfPeople}
                onChange={(e) => handleInputChange('numberOfPeople', parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="preferredDate">Date préférée *</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Informations supplémentaires..."
                rows={3}
              />
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-moroccan-blue">
                {formData.totalAmount.toLocaleString()} MAD
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {Number(activity.price).toLocaleString()} MAD × {formData.numberOfPeople} personne(s)
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 text-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {isOnline ? 'Envoi...' : 'Sauvegarde...'}
              </>
            ) : (
              <>
                {isOnline ? (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Réserver maintenant
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Sauvegarder hors ligne
                  </>
                )}
              </>
            )}
          </Button>

          {/* Sync Button for Offline Bookings */}
          {!isOnline && savedBookings.length > 0 && (
            <Button
              onClick={syncOfflineBookings}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Synchroniser quand en ligne ({savedBookings.length})
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
