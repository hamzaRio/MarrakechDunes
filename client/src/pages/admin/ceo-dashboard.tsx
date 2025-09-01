import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Crown,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SuperAdminRoute from "@/components/superadmin-route";
import ActivityManagementModal from "@/components/activity-management-modal";

export default function CEODashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPrice, setEditingPrice] = useState<{ id: string; price: number } | null>(null);

  // Fetch analytics data
  const { data: earnings } = useQuery({
    queryKey: ["/api/admin/analytics/earnings"],
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/admin/analytics/activities"],
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/admin/analytics/bookings"],
  });

  const { data: priceComparison } = useQuery({
    queryKey: ["/api/admin/getyourguide/comparison"],
  });

  // Update GetYourGuide price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/activities/${id}/getyourguide-price`, {
        getyourguidePrice: price
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/getyourguide/comparison"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/analytics/activities"] });
      setEditingPrice(null);
      toast({
        title: "Price Updated",
        description: "GetYourGuide price has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePriceUpdate = (id: string, newPrice: number) => {
    updatePriceMutation.mutate({ id, price: newPrice });
  };

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Prepare monthly earnings data for chart
  const monthlyData = (earnings as any)?.monthlyEarnings ? 
    Object.entries((earnings as any).monthlyEarnings).map(([month, amount]) => ({
      month,
      earnings: amount
    })) : [];

  return (
    <SuperAdminRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CEO Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive business analytics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <ActivityManagementModal mode="create" />
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Superadmin Access</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((earnings as any)?.totalEarnings || 0).toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">
              From {((earnings as any)?.totalBookings || 0)} confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(((earnings as any)?.averageBookingValue || 0)).toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">
              Per confirmed booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((activities as any)?.totalActivities || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Active experiences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(((bookings as any)?.conversionRate || 0))}%</div>
            <p className="text-xs text-muted-foreground">
              Booking to confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                <Line type="monotone" dataKey="earnings" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Confirmed', value: ((bookings as any)?.statusBreakdown?.confirmed || 0) },
                    { name: 'Pending', value: ((bookings as any)?.statusBreakdown?.pending || 0) },
                    { name: 'Cancelled', value: ((bookings as any)?.statusBreakdown?.cancelled || 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(earnings as any)?.topActivities || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
              <Bar dataKey="earnings" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* GetYourGuide Price Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            GetYourGuide Price Comparison
          </CardTitle>
          <p className="text-sm text-gray-600">
            Monitor and manage competitive pricing against GetYourGuide
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Competitive Activities</div>
              <div className="text-2xl font-bold text-green-700">
                {((priceComparison as any)?.competitiveActivities || 0)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Average Savings</div>
              <div className="text-2xl font-bold text-blue-700">
                {Math.round(((priceComparison as any)?.averageDiscount || 0))} MAD
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Total Activities</div>
              <div className="text-2xl font-bold text-purple-700">
                {((priceComparison as any)?.activities?.length || 0)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {((priceComparison as any)?.activities || []).map((activity: any, index: number) => (
              <div key={activity.id || activity._id || `price-activity-${index}`} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Our Price: </span>
                        <span className="font-medium text-green-600">{activity.ourPrice} MAD</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">GetYourGuide: </span>
                        {editingPrice?.id === activity.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editingPrice?.price || 0}
                              onChange={(e) => setEditingPrice({
                                id: activity.id,
                                price: Number(e.target.value)
                              })}
                              className="w-20 h-8"
                              placeholder="MAD"
                            />
                            <Button
                              size="sm"
                              onClick={() => handlePriceUpdate(activity.id, editingPrice?.price || 0)}
                              disabled={updatePriceMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPrice(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-600">{activity.getyourguidePrice || 0} MAD</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingPrice({
                                id: activity.id,
                                price: activity.getyourguidePrice || 0
                              })}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="text-gray-600">Difference: </span>
                      <div className="flex items-center gap-1">
                        {activity.competitiveAdvantage ? (
                          <>
                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-600">
                              {activity.priceDifference} MAD cheaper
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-red-600">
                              {Math.abs(activity.priceDifference)} MAD expensive
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={activity.competitiveAdvantage ? "default" : "destructive"}>
                    {activity.competitiveAdvantage ? "Competitive" : "Review Pricing"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Pricing Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            Seasonal Pricing Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Compare pricing strategies across different seasons
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Low Season (Nov-Feb)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Price:</span>
                  <span className="font-medium text-blue-600">850 MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Demand Level:</span>
                  <span className="font-medium text-orange-600">40%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Competitor Gap:</span>
                  <span className="font-medium text-green-600">-15% (Advantage)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Regular Season (Mar-May, Sep-Oct)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Price:</span>
                  <span className="font-medium text-blue-600">1,200 MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Demand Level:</span>
                  <span className="font-medium text-orange-600">75%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Competitor Gap:</span>
                  <span className="font-medium text-green-600">-8% (Advantage)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">High Season (Jun-Aug)</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Price:</span>
                  <span className="font-medium text-blue-600">1,500 MAD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Demand Level:</span>
                  <span className="font-medium text-orange-600">95%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Competitor Gap:</span>
                  <span className="font-medium text-red-600">+3% (Premium)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-gray-800 mb-3">Seasonal Pricing Recommendations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Low Season: Maintain competitive advantage for market penetration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Regular Season: Optimize pricing for balanced volume and margin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>High Season: Premium pricing justified by high demand and quality</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Activity</th>
                  <th className="text-left p-2">Bookings</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">Avg Rating</th>
                  <th className="text-left p-2">Our Price</th>
                  <th className="text-left p-2">GetYourGuide</th>
                </tr>
              </thead>
              <tbody>
                {((activities as any)?.activities || []).map((activity: any, index: number) => (
                  <tr key={activity.id || activity._id || `table-activity-${index}`} className="border-b">
                    <td className="p-2 font-medium">{activity.name}</td>
                    <td className="p-2">{activity.totalBookings}</td>
                    <td className="p-2">{activity.totalRevenue?.toLocaleString()} MAD</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>{activity.averageRating}</span>
                      </div>
                    </td>
                    <td className="p-2">{activity.price} MAD</td>
                    <td className="p-2">{activity.getyourguidePrice || 0} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </SuperAdminRoute>
  );
}