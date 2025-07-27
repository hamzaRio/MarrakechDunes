import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Target, DollarSign } from "lucide-react";

interface CompetitorPrice {
  id: string;
  activityName: string;
  ourPrice: number;
  getYourGuidePrice: number;
  viatorPrice: number;
  airbnbPrice: number;
  lastUpdated: Date;
  priceChange: number;
  competitiveAdvantage: number;
  recommendedAction: string;
}

interface PriceAlert {
  id: string;
  activity: string;
  type: 'price_drop' | 'price_increase' | 'competitive_threat';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export default function CompetitorPriceMonitor() {
  const [competitorPrices, setCompetitorPrices] = useState<CompetitorPrice[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);

  useEffect(() => {
    // Simulate real competitor price data
    const mockData: CompetitorPrice[] = [
      {
        id: "1",
        activityName: "Hot Air Balloon Ride",
        ourPrice: 2000,
        getYourGuidePrice: 2350,
        viatorPrice: 2280,
        airbnbPrice: 2150,
        lastUpdated: new Date(),
        priceChange: -50,
        competitiveAdvantage: 350,
        recommendedAction: "Maintain current pricing - strong advantage"
      },
      {
        id: "2", 
        activityName: "3-Day Desert Experience",
        ourPrice: 5000,
        getYourGuidePrice: 5800,
        viatorPrice: 5650,
        airbnbPrice: 5200,
        lastUpdated: new Date(),
        priceChange: 100,
        competitiveAdvantage: 800,
        recommendedAction: "Consider 10% price increase"
      },
      {
        id: "3",
        activityName: "Essaouira Day Trip", 
        ourPrice: 1500,
        getYourGuidePrice: 1680,
        viatorPrice: 1620,
        airbnbPrice: 1550,
        lastUpdated: new Date(),
        priceChange: 0,
        competitiveAdvantage: 180,
        recommendedAction: "Optimal pricing position"
      },
      {
        id: "4",
        activityName: "Ourika Valley Adventure",
        ourPrice: 1500,
        getYourGuidePrice: 1750,
        viatorPrice: 1480,
        airbnbPrice: 1520,
        lastUpdated: new Date(),
        priceChange: -20,
        competitiveAdvantage: 250,
        recommendedAction: "Monitor Viator closely"
      },
      {
        id: "5",
        activityName: "Ouzoud Waterfalls Tour",
        ourPrice: 1500,
        getYourGuidePrice: 1650,
        viatorPrice: 1580,
        airbnbPrice: 1490,
        lastUpdated: new Date(),
        priceChange: 30,
        competitiveAdvantage: 150,
        recommendedAction: "Slight price adjustment recommended"
      }
    ];

    const mockAlerts: PriceAlert[] = [
      {
        id: "1",
        activity: "Hot Air Balloon Ride",
        type: "price_drop",
        message: "GetYourGuide reduced price by 50 MAD - still 350 MAD above us",
        severity: "low",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: "2", 
        activity: "3-Day Desert Experience",
        type: "competitive_threat",
        message: "Viator offering 10% discount promotion - monitor closely",
        severity: "medium",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: "3",
        activity: "Ourika Valley Adventure", 
        type: "price_drop",
        message: "Viator price dropped to 1480 MAD - 20 MAD below our price",
        severity: "high",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    setCompetitorPrices(mockData);
    setPriceAlerts(mockAlerts);
  }, []);

  const updatePrices = async () => {
    setIsUpdating(true);
    // Simulate API call to update competitor prices
    setTimeout(() => {
      setCompetitorPrices(prev => prev.map(price => ({
        ...price,
        lastUpdated: new Date(),
        priceChange: Math.floor(Math.random() * 100) - 50
      })));
      setIsUpdating(false);
    }, 2000);
  };

  const updateOurPrice = (id: string, newPrice: number) => {
    setCompetitorPrices(prev => prev.map(price => 
      price.id === id 
        ? { 
            ...price, 
            ourPrice: newPrice,
            competitiveAdvantage: Math.min(price.getYourGuidePrice, price.viatorPrice, price.airbnbPrice) - newPrice
          }
        : price
    ));
    setEditingPrice(null);
  };

  const getLowestCompetitor = (price: CompetitorPrice) => {
    const competitors = [
      { name: "GetYourGuide", price: price.getYourGuidePrice },
      { name: "Viator", price: price.viatorPrice },
      { name: "Airbnb", price: price.airbnbPrice }
    ];
    return competitors.reduce((lowest, current) => 
      current.price < lowest.price ? current : lowest
    );
  };

  const totalCompetitiveAdvantage = competitorPrices.reduce((sum, price) => sum + price.competitiveAdvantage, 0);
  const avgAdvantage = Math.round(totalCompetitiveAdvantage / competitorPrices.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Competitor Price Monitoring</h2>
        <Button onClick={updatePrices} disabled={isUpdating}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Updating...' : 'Update Prices'}
        </Button>
      </div>

      {/* Price Alerts */}
      {priceAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Price Alerts</h3>
          {priceAlerts.map((alert) => (
            <Alert key={alert.id} className={`
              ${alert.severity === 'high' ? 'border-red-200 bg-red-50' : 
                alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' : 
                'border-blue-200 bg-blue-50'}
            `}>
              <AlertTriangle className={`h-4 w-4 ${
                alert.severity === 'high' ? 'text-red-600' :
                alert.severity === 'medium' ? 'text-yellow-600' : 
                'text-blue-600'
              }`} />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{alert.activity}</span>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'default' : 'secondary'
                  }>
                    {alert.severity}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Competitive Advantage</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgAdvantage} MAD</div>
            <p className="text-xs text-gray-600">Per booking saved vs competitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Leader Activities</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {competitorPrices.filter(p => p.competitiveAdvantage > 0).length}/5
            </div>
            <p className="text-xs text-gray-600">Activities below competitor prices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Opportunity</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalCompetitiveAdvantage.toLocaleString()} MAD
            </div>
            <p className="text-xs text-gray-600">Monthly potential from price optimization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Position</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Strong</div>
            <p className="text-xs text-gray-600">Overall competitive position</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Price Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Price Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {competitorPrices.map((price) => {
              const lowestCompetitor = getLowestCompetitor(price);
              return (
                <div key={price.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">{price.activityName}</h4>
                    <div className="flex items-center gap-2">
                      {price.priceChange !== 0 && (
                        <Badge variant={price.priceChange > 0 ? "destructive" : "default"}>
                          {price.priceChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(price.priceChange)} MAD
                        </Badge>
                      )}
                      <Badge variant={price.competitiveAdvantage > 0 ? "default" : "destructive"}>
                        {price.competitiveAdvantage > 0 ? '+' : ''}{price.competitiveAdvantage} MAD advantage
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">Our Price</div>
                      {editingPrice === price.id ? (
                        <Input
                          type="number"
                          defaultValue={price.ourPrice}
                          className="text-center mt-1"
                          onBlur={(e) => updateOurPrice(price.id, parseInt(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateOurPrice(price.id, parseInt((e.target as HTMLInputElement).value));
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-xl font-bold text-blue-600 cursor-pointer hover:bg-blue-100 rounded px-2 py-1"
                          onClick={() => setEditingPrice(price.id)}
                        >
                          {price.ourPrice} MAD
                        </div>
                      )}
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">GetYourGuide</div>
                      <div className="text-xl font-bold">{price.getYourGuidePrice} MAD</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Viator</div>
                      <div className="text-xl font-bold">{price.viatorPrice} MAD</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Airbnb</div>
                      <div className="text-xl font-bold">{price.airbnbPrice} MAD</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Lowest competitor: </span>
                      <span className="font-medium">{lowestCompetitor.name} ({lowestCompetitor.price} MAD)</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last updated: </span>
                      <span className="font-medium">{price.lastUpdated.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                    <span className="font-medium text-yellow-800">Recommendation: </span>
                    <span className="text-yellow-700">{price.recommendedAction}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Dynamic Pricing Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Competitive Advantages</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 15-20% lower prices than GetYourGuide across all activities</li>
                <li>• Hot Air Balloon: 350 MAD customer savings vs competitors</li>
                <li>• Desert Experience: 800 MAD advantage - room for 10% increase</li>
                <li>• Strong position in day trip market with optimal pricing</li>
                <li>• Average 200+ MAD savings per booking for customers</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700">Price Optimization Opportunities</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Monitor Viator's Ourika Valley pricing (20 MAD below us)</li>
                <li>• Consider 5-10% increase on Desert Experience</li>
                <li>• Set automatic alerts for 15%+ competitor price changes</li>
                <li>• Implement seasonal pricing adjustments (high/low season)</li>
                <li>• Track promotional campaigns from competitors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}