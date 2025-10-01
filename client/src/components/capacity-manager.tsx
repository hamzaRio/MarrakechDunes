import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { ActivityType } from "marrakechdunes-shared/schema";

interface CapacityManagerProps {
  activity: ActivityType;
  onCapacityUpdate?: (activity: ActivityType) => void;
}

export default function CapacityManager({ 
  activity, 
  onCapacityUpdate 
}: CapacityManagerProps) {
  const [capacitySettings, setCapacitySettings] = useState({
    maxParticipants: activity.maxParticipants || 20,
    weatherDependent: activity.capacitySettings?.weatherDependent || false,
    requiresGuide: activity.capacitySettings?.requiresGuide || false,
    requiresEquipment: activity.capacitySettings?.requiresEquipment || false,
    overbookingAllowed: activity.capacitySettings?.overbookingAllowed || false,
    overbookingLimit: activity.capacitySettings?.overbookingLimit || 10
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCapacityMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await api.put(`/admin/activities/${activity._id}`, {
        capacitySettings: settings
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Capacity Settings Updated",
        description: "Activity capacity settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/activities"] });
      onCapacityUpdate?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update capacity settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateCapacityMutation.mutate(capacitySettings);
  };

  const getCapacityStatus = () => {
    // This would typically come from a real-time booking count
    const currentBookings = 0; // Mock data
    const utilization = (currentBookings / capacitySettings.maxParticipants) * 100;
    
    if (utilization >= 100) {
      return { status: 'full', color: 'red', text: 'Fully Booked' };
    } else if (utilization >= 80) {
      return { status: 'high', color: 'orange', text: 'High Demand' };
    } else if (utilization >= 50) {
      return { status: 'medium', color: 'yellow', text: 'Moderate' };
    } else {
      return { status: 'available', color: 'green', text: 'Available' };
    }
  };

  const capacityStatus = getCapacityStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Capacity Management
          <Badge 
            variant="outline" 
            className={`${
              capacityStatus.color === 'red' ? 'border-red-500 text-red-700' :
              capacityStatus.color === 'orange' ? 'border-orange-500 text-orange-700' :
              capacityStatus.color === 'yellow' ? 'border-yellow-500 text-yellow-700' :
              'border-green-500 text-green-700'
            }`}
          >
            {capacityStatus.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              max="100"
              value={capacitySettings.maxParticipants}
              onChange={(e) => setCapacitySettings(prev => ({
                ...prev,
                maxParticipants: parseInt(e.target.value) || 1
              }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="overbookingLimit">Overbooking Limit (%)</Label>
            <Input
              id="overbookingLimit"
              type="number"
              min="0"
              max="50"
              value={capacitySettings.overbookingLimit}
              onChange={(e) => setCapacitySettings(prev => ({
                ...prev,
                overbookingLimit: parseInt(e.target.value) || 0
              }))}
              disabled={!capacitySettings.overbookingAllowed}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weather Dependent</Label>
              <p className="text-sm text-gray-600">Activity depends on weather conditions</p>
            </div>
            <Switch
              checked={capacitySettings.weatherDependent}
              onCheckedChange={(checked) => setCapacitySettings(prev => ({
                ...prev,
                weatherDependent: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requires Guide</Label>
              <p className="text-sm text-gray-600">Activity requires a professional guide</p>
            </div>
            <Switch
              checked={capacitySettings.requiresGuide}
              onCheckedChange={(checked) => setCapacitySettings(prev => ({
                ...prev,
                requiresGuide: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requires Equipment</Label>
              <p className="text-sm text-gray-600">Activity requires special equipment</p>
            </div>
            <Switch
              checked={capacitySettings.requiresEquipment}
              onCheckedChange={(checked) => setCapacitySettings(prev => ({
                ...prev,
                requiresEquipment: checked
              }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Overbooking</Label>
              <p className="text-sm text-gray-600">Allow bookings beyond capacity limit</p>
            </div>
            <Switch
              checked={capacitySettings.overbookingAllowed}
              onCheckedChange={(checked) => setCapacitySettings(prev => ({
                ...prev,
                overbookingAllowed: checked
              }))}
            />
          </div>
        </div>

        {capacitySettings.overbookingAllowed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Overbooking Warning</span>
            </div>
            <p className="text-sm text-yellow-700">
              Overbooking is enabled. Bookings beyond {capacitySettings.maxParticipants} participants 
              will be flagged for compensation (20% discount on next booking).
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCapacitySettings({
              maxParticipants: activity.maxParticipants || 20,
              weatherDependent: activity.capacitySettings?.weatherDependent || false,
              requiresGuide: activity.capacitySettings?.requiresGuide || false,
              requiresEquipment: activity.capacitySettings?.requiresEquipment || false,
              overbookingAllowed: activity.capacitySettings?.overbookingAllowed || false,
              overbookingLimit: activity.capacitySettings?.overbookingLimit || 10
            })}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateCapacityMutation.isPending}
          >
            {updateCapacityMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
