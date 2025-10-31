import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { ActivityType } from "marrakechdunes-shared/schema";

export default function BookingTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testData, setTestData] = useState({
    customerName: "Test Client",
    customerPhone: "+212600000000",
    customerEmail: "test@example.com",
    activityId: "",
    numberOfPeople: 2,
    preferredDate: new Date().toISOString().split('T')[0],
    notes: "Test booking créé depuis le dashboard admin"
  });

  // Fetch activities for dropdown
  const { data: activities = [] } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
    queryFn: async () => {
      const response = await apiFetch("/activities");
      return await response.json();
    },
  });

  const createTestBookingMutation = useMutation({
    mutationFn: async (data: typeof testData) => {
      // Get activity price
      const activity = activities.find(a => a._id === data.activityId);
      if (!activity) {
        throw new Error("Veuillez sélectionner une activité");
      }
      
      const totalAmount = (Number(activity.price) || 0) * data.numberOfPeople;
      
      const response = await apiFetch("/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalAmount: totalAmount.toString(),
          status: "pending",
          paymentStatus: "unpaid",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création de la réservation");
      }

      return await response.json();
    },
    onSuccess: (booking) => {
      toast({
        title: "✅ Test de Réservation Réussi",
        description: `Réservation créée: ${booking.customerName} - ${booking.totalAmount} MAD`,
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      // Reset form
      setTestData({
        ...testData,
        customerName: "Test Client",
        customerPhone: "+212600000000",
        customerEmail: `test${Date.now()}@example.com`,
        numberOfPeople: 2,
        preferredDate: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur de Test",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestBooking = () => {
    if (!testData.activityId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une activité",
        variant: "destructive",
      });
      return;
    }
    createTestBookingMutation.mutate(testData);
  };

  const selectedActivity = activities.find(a => a._id === testData.activityId);
  const estimatedTotal = selectedActivity 
    ? (Number(selectedActivity.price) || 0) * testData.numberOfPeople 
    : 0;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Test de Réservation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="test-customer-name">Nom du Client</Label>
            <Input
              id="test-customer-name"
              value={testData.customerName}
              onChange={(e) => setTestData({ ...testData, customerName: e.target.value })}
              placeholder="Nom du client"
            />
          </div>
          <div>
            <Label htmlFor="test-customer-phone">Téléphone</Label>
            <Input
              id="test-customer-phone"
              value={testData.customerPhone}
              onChange={(e) => setTestData({ ...testData, customerPhone: e.target.value })}
              placeholder="+212600000000"
            />
          </div>
          <div>
            <Label htmlFor="test-customer-email">Email</Label>
            <Input
              id="test-customer-email"
              type="email"
              value={testData.customerEmail}
              onChange={(e) => setTestData({ ...testData, customerEmail: e.target.value })}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <Label htmlFor="test-activity">Activité *</Label>
            <select
              id="test-activity"
              className="w-full px-3 py-2 border rounded-md"
              value={testData.activityId}
              onChange={(e) => setTestData({ ...testData, activityId: e.target.value })}
            >
              <option value="">Sélectionner une activité</option>
              {activities.map((activity) => (
                <option key={activity._id} value={activity._id}>
                  {activity.name} - {activity.price} MAD
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="test-people">Nombre de Personnes</Label>
            <Input
              id="test-people"
              type="number"
              min="1"
              value={testData.numberOfPeople}
              onChange={(e) => setTestData({ ...testData, numberOfPeople: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label htmlFor="test-date">Date Préférée</Label>
            <Input
              id="test-date"
              type="date"
              value={testData.preferredDate}
              onChange={(e) => setTestData({ ...testData, preferredDate: e.target.value })}
            />
          </div>
        </div>

        {selectedActivity && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm">
              <strong>Activité sélectionnée:</strong> {selectedActivity.name}
              <br />
              <strong>Prix unitaire:</strong> {selectedActivity.price} MAD
              <br />
              <strong>Total estimé:</strong> {estimatedTotal.toLocaleString()} MAD ({testData.numberOfPeople} personne{testData.numberOfPeople !== 1 ? 's' : ''})
            </div>
          </div>
        )}

        <Button
          onClick={handleTestBooking}
          disabled={createTestBookingMutation.isPending || !testData.activityId}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {createTestBookingMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Créer Réservation de Test
            </>
          )}
        </Button>

        {createTestBookingMutation.isSuccess && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-green-800 text-sm">
            ✅ Réservation de test créée avec succès! Vérifiez l'onglet "Réservations".
          </div>
        )}

        {createTestBookingMutation.isError && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800 text-sm">
            ❌ Erreur: {createTestBookingMutation.error?.message || "Échec de la création"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
