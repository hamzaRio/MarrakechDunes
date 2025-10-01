import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign } from "lucide-react";
import type { ActivityType, PricingQuote } from "marrakechdunes-shared/schema";

interface DynamicPricingPanelProps {
  activity: ActivityType;
  selectedDate: Date;
  partySize: number;
  onPriceSelect?: (price: number) => void;
}

export default function DynamicPricingPanel({ 
  activity, 
  selectedDate, 
  partySize,
  onPriceSelect 
}: DynamicPricingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const { data: pricingQuote, isLoading, error } = useQuery({
    queryKey: ['/pricing/quote', activity._id, selectedDate.toISOString(), partySize],
    queryFn: async () => {
      const response = await api.get('/pricing/quote', {
        params: {
          activityId: activity._id,
          date: selectedDate.toISOString(),
          partySize: partySize
        }
      });
      return response.data as PricingQuote;
    },
    enabled: isExpanded && activity.dynamicPricingEnabled,
  });

  const handlePriceSelect = (price: number) => {
    onPriceSelect?.(price);
    toast({
      title: "Price Selected",
      description: `Selected price: ${price} MAD`,
    });
  };

  if (!activity.dynamicPricingEnabled) {
    return null;
  }

  const basePrice = parseInt(activity.price);
  const totalBasePrice = basePrice * partySize;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Dynamic Pricing
          <Badge variant="outline" className="text-xs">
            {activity.dynamicPricingEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExpanded ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsExpanded(true)}
            className="w-full"
          >
            Calculate Dynamic Price
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Base Price</Label>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="font-medium">{totalBasePrice} MAD</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Party Size</Label>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">{partySize} people</span>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Calculating dynamic price...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <p className="text-sm text-red-600">Failed to calculate dynamic pricing</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsExpanded(false)}
                  className="mt-2"
                >
                  Use Base Price
                </Button>
              </div>
            )}

            {pricingQuote && (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Final Price</span>
                    <Badge variant="default" className="text-lg">
                      {pricingQuote.finalPrice} MAD
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>{pricingQuote.breakdown.base} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seasonal ({pricingQuote.seasonalAdjustment > 0 ? '+' : ''}{pricingQuote.seasonalAdjustment}%):</span>
                      <span className={pricingQuote.breakdown.seasonal > 0 ? 'text-green-600' : 'text-red-600'}>
                        {pricingQuote.breakdown.seasonal > 0 ? '+' : ''}{pricingQuote.breakdown.seasonal} MAD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demand ({pricingQuote.demandAdjustment > 0 ? '+' : ''}{pricingQuote.demandAdjustment}%):</span>
                      <span className={pricingQuote.breakdown.demand > 0 ? 'text-green-600' : 'text-red-600'}>
                        {pricingQuote.breakdown.demand > 0 ? '+' : ''}{pricingQuote.breakdown.demand} MAD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Group Discount (-{pricingQuote.groupDiscount}%):</span>
                      <span className="text-green-600">
                        -{pricingQuote.breakdown.group} MAD
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{pricingQuote.finalPrice} MAD</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handlePriceSelect(pricingQuote.finalPrice)}
                    className="flex-1"
                  >
                    Use Dynamic Price
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePriceSelect(totalBasePrice)}
                  >
                    Use Base Price
                  </Button>
                </div>
              </div>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="w-full"
            >
              Hide Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
