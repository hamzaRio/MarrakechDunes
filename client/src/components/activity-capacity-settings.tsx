import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Settings, Users, Cloud, UserCheck, Shield } from "lucide-react";
import type { ActivityType } from "marrakechdunes-shared/schema";

interface ActivityCapacitySettingsProps {
  activity: ActivityType;
  onClose: () => void;
}

export default function ActivityCapacitySettings({ 
  activity, 
  onClose 
}: ActivityCapacitySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [capacitySettings, setCapacitySettings] = useState({
    maxParticipants: activity.capacitySettings?.maxParticipants || 10,
    weatherDependent: activity.capacitySettings?.weatherDependent || false,
    requiresGuide: activity.capacitySettings?.requiresGuide || false,
    requiresEquipment: activity.capacitySettings?.requiresEquipment || false,
    overbookingAllowed: activity.capacitySettings?.overbookingAllowed || false,
    overbookingLimit: activity.capacitySettings?.overbookingLimit || 10,
  });

  const updateCapacityMutation = useMutation({
    mutationFn: async (settings: typeof capacitySettings) => {
      const response = await api.patch(`/admin/activities/${activity._id}/capacity`, settings);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Capacity Settings Updated",
        description: "Activity capacity settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/admin/activities'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update capacity settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    updateCapacityMutation.mutate(capacitySettings);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Capacity Settings - {activity.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Maximum Participants
              </Label>
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
              <Label htmlFor="overbookingLimit" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Overbooking Limit (%)
              </Label>
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
              <Label htmlFor="weatherDependent" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather Dependent
              </Label>
              <Switch
                id="weatherDependent"
                checked={capacitySettings.weatherDependent}
                onCheckedChange={(checked) => setCapacitySettings(prev => ({
                  ...prev,
                  weatherDependent: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requiresGuide" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Requires Guide
              </Label>
              <Switch
                id="requiresGuide"
                checked={capacitySettings.requiresGuide}
                onCheckedChange={(checked) => setCapacitySettings(prev => ({
                  ...prev,
                  requiresGuide: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="requiresEquipment" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Requires Equipment
              </Label>
              <Switch
                id="requiresEquipment"
                checked={capacitySettings.requiresEquipment}
                onCheckedChange={(checked) => setCapacitySettings(prev => ({
                  ...prev,
                  requiresEquipment: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="overbookingAllowed" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Allow Overbooking
              </Label>
              <Switch
                id="overbookingAllowed"
                checked={capacitySettings.overbookingAllowed}
                onCheckedChange={(checked) => setCapacitySettings(prev => ({
                  ...prev,
                  overbookingAllowed: checked
                }))}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={updateCapacityMutation.isPending}>
              {updateCapacityMutation.isPending ? "Updating..." : "Update Settings"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
