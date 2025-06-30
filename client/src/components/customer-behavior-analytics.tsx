import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, ShoppingCart, Star, Clock, MapPin } from "lucide-react";

interface CustomerInsight {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

interface PopularActivity {
  name: string;
  bookings: number;
  revenue: number;
  conversionRate: number;
  avgRating: number;
}

interface BookingPattern {
  timeSlot: string;
  bookings: number;
  percentage: number;
}

export default function CustomerBehaviorAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7days' | '30days' | '90days'>('30days');

  const customerInsights: CustomerInsight[] = [
    { metric: "Page Views", value: "12,847", change: "+18%", trend: 'up' },
    { metric: "Unique Visitors", value: "3,421", change: "+24%", trend: 'up' },
    { metric: "Booking Conversion", value: "12.8%", change: "+3.2%", trend: 'up' },
    { metric: "Avg Session Duration", value: "8m 42s", change: "+1m 15s", trend: 'up' },
    { metric: "Return Customers", value: "34%", change: "+8%", trend: 'up' },
    { metric: "Mobile Bookings", value: "67%", change: "+12%", trend: 'up' }
  ];

  const popularActivities: PopularActivity[] = [
    { name: "Hot Air Balloon Ride", bookings: 89, revenue: 178000, conversionRate: 18.5, avgRating: 4.9 },
    { name: "3-Day Desert Experience", bookings: 76, revenue: 380000, conversionRate: 15.2, avgRating: 4.8 },
    { name: "Essaouira Day Trip", bookings: 67, revenue: 100500, conversionRate: 22.1, avgRating: 4.7 },
    { name: "Ourika Valley Adventure", bookings: 54, revenue: 81000, conversionRate: 16.8, avgRating: 4.6 },
    { name: "Ouzoud Waterfalls Tour", bookings: 43, revenue: 64500, conversionRate: 14.3, avgRating: 4.5 }
  ];

  const bookingPatterns: BookingPattern[] = [
    { timeSlot: "Morning (6AM-12PM)", bookings: 156, percentage: 48 },
    { timeSlot: "Afternoon (12PM-6PM)", bookings: 118, percentage: 36 },
    { timeSlot: "Evening (6PM-12AM)", bookings: 52, percentage: 16 }
  ];

  const customerSegments = [
    { segment: "Solo Travelers", percentage: 28, avgSpend: 1850, preferredActivities: ["Hot Air Balloon", "Cultural Tours"] },
    { segment: "Couples", percentage: 45, avgSpend: 3200, preferredActivities: ["Desert Experience", "Romantic Dinners"] },
    { segment: "Families", percentage: 18, avgSpend: 4500, preferredActivities: ["Day Trips", "Safe Adventures"] },
    { segment: "Groups (4+)", percentage: 9, avgSpend: 6800, preferredActivities: ["Multi-day Tours", "Custom Experiences"] }
  ];

  const geographicData = [
    { country: "France", visitors: 1247, bookings: 189, conversionRate: 15.2 },
    { country: "Spain", visitors: 892, bookings: 143, conversionRate: 16.0 },
    { country: "Germany", visitors: 756, bookings: 98, conversionRate: 13.0 },
    { country: "United Kingdom", visitors: 634, bookings: 87, conversionRate: 13.7 },
    { country: "Italy", visitors: 567, bookings: 76, conversionRate: 13.4 },
    { country: "Morocco", visitors: 423, bookings: 67, conversionRate: 15.8 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Behavior Analytics</h2>
        <div className="flex gap-2">
          {(['7days', '30days', '90days'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedTimeframe === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(period)}
            >
              {period === '7days' ? '7D' : period === '30days' ? '30D' : '90D'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {customerInsights.map((insight, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{insight.metric}</p>
                  <p className="text-2xl font-bold">{insight.value}</p>
                  <p className={`text-sm ${insight.trend === 'up' ? 'text-green-600' : insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {insight.change}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${insight.trend === 'up' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {index === 0 && <Eye className="h-4 w-4 text-blue-600" />}
                  {index === 1 && <Users className="h-4 w-4 text-purple-600" />}
                  {index === 2 && <ShoppingCart className="h-4 w-4 text-green-600" />}
                  {index === 3 && <Clock className="h-4 w-4 text-orange-600" />}
                  {index === 4 && <Star className="h-4 w-4 text-yellow-600" />}
                  {index === 5 && <MapPin className="h-4 w-4 text-red-600" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{activity.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{activity.bookings} bookings</Badge>
                      <Badge variant="outline">{activity.conversionRate}% conversion</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{activity.avgRating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {activity.revenue.toLocaleString()} MAD
                  </div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Patterns & Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Time Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingPatterns.map((pattern, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{pattern.timeSlot}</span>
                    <span className="text-sm text-gray-600">{pattern.bookings} bookings</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${pattern.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-600">{pattern.percentage}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerSegments.map((segment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{segment.segment}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{segment.percentage}%</div>
                      <div className="text-xs text-gray-600">{segment.avgSpend} MAD avg</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${segment.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {segment.preferredActivities.map((activity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{activity}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Customer Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geographicData.map((country, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{country.country}</h4>
                  <Badge variant="secondary">{country.conversionRate}%</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visitors:</span>
                    <span className="font-medium">{country.visitors.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bookings:</span>
                    <span className="font-medium text-green-600">{country.bookings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Customer Behavior Insights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 67% of bookings happen on mobile - optimize mobile experience</li>
                <li>• Morning time slots have highest conversion (48%)</li>
                <li>• Couples segment generates 45% of revenue - target with romantic packages</li>
                <li>• French visitors have 15.2% conversion rate - expand French marketing</li>
                <li>• Hot Air Balloon has 18.5% conversion - increase inventory</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Growth Opportunities</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Launch couple-focused packages for Valentine's/anniversaries</li>
                <li>• Create morning-specific promotions for early birds</li>
                <li>• Develop mobile app for better booking experience</li>
                <li>• Target German market with specialized content</li>
                <li>• Add family-friendly activities (18% segment underserved)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}