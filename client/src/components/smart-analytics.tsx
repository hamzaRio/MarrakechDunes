import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  Star,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Download
} from "lucide-react";

interface RevenueInsights {
  dailyRevenue: number;
  monthlyTrend: number;
  topActivities: Activity[];
  paymentStatusBreakdown: PaymentStatus[];
}

interface BookingPredictions {
  nextWeekBookings: number;
  revenueForecast: number;
  capacityUtilization: number;
}

interface Activity {
  id: string;
  name: string;
  price: number;
  bookings: number;
  revenue: number;
  rating: number;
}

interface PaymentStatus {
  status: 'unpaid' | 'deposit_paid' | 'fully_paid';
  count: number;
  percentage: number;
  revenue: number;
}

interface SmartAnalyticsProps {
  bookings: any[];
  activities: any[];
}

export default function SmartAnalytics({ bookings, activities }: SmartAnalyticsProps) {
  const [revenueInsights, setRevenueInsights] = useState<RevenueInsights | null>(null);
  const [predictions, setPredictions] = useState<BookingPredictions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const insights = getRevenueInsights(bookings, activities);
      const bookingPredictions = predictBookings(bookings, activities);
      
      setRevenueInsights(insights);
      setPredictions(bookingPredictions);
      setIsLoading(false);
    };

    fetchAnalytics();
  }, [bookings, activities]);

  const getRevenueInsights = (bookings: any[], activities: any[]): RevenueInsights => {
    // Calculate daily revenue
    const today = new Date();
    const todayBookings = bookings.filter(booking => 
      new Date(booking.createdAt).toDateString() === today.toDateString()
    );
    const dailyRevenue = todayBookings.reduce((sum, booking) => 
      sum + (booking.paidAmount || 0), 0
    );

    // Calculate monthly trend
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthBookings = bookings.filter(booking => 
      new Date(booking.createdAt).getMonth() === currentMonth
    );
    const lastMonthBookings = bookings.filter(booking => 
      new Date(booking.createdAt).getMonth() === lastMonth
    );
    
    const currentMonthRevenue = currentMonthBookings.reduce((sum, booking) => 
      sum + (booking.paidAmount || 0), 0
    );
    const lastMonthRevenue = lastMonthBookings.reduce((sum, booking) => 
      sum + (booking.paidAmount || 0), 0
    );
    
    const monthlyTrend = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Top activities by revenue
    const activityRevenue = activities.map(activity => {
      const activityBookings = bookings.filter(booking => 
        booking.activityId === activity.id
      );
      const revenue = activityBookings.reduce((sum, booking) => 
        sum + (booking.paidAmount || 0), 0
      );
      return {
        id: activity.id,
        name: activity.name,
        price: activity.price,
        bookings: activityBookings.length,
        revenue,
        rating: activity.rating || 4.5
      };
    });

    const topActivities = activityRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Payment status breakdown
    const statusCounts = {
      unpaid: 0,
      deposit_paid: 0,
      fully_paid: 0
    };

    bookings.forEach(booking => {
      statusCounts[booking.paymentStatus as keyof typeof statusCounts]++;
    });

    const totalBookings = bookings.length;
    const paymentStatusBreakdown: PaymentStatus[] = [
      {
        status: 'unpaid',
        count: statusCounts.unpaid,
        percentage: totalBookings > 0 ? (statusCounts.unpaid / totalBookings) * 100 : 0,
        revenue: bookings
          .filter(b => b.paymentStatus === 'unpaid')
          .reduce((sum, b) => sum + (b.paidAmount || 0), 0)
      },
      {
        status: 'deposit_paid',
        count: statusCounts.deposit_paid,
        percentage: totalBookings > 0 ? (statusCounts.deposit_paid / totalBookings) * 100 : 0,
        revenue: bookings
          .filter(b => b.paymentStatus === 'deposit_paid')
          .reduce((sum, b) => sum + (b.paidAmount || 0), 0)
      },
      {
        status: 'fully_paid',
        count: statusCounts.fully_paid,
        percentage: totalBookings > 0 ? (statusCounts.fully_paid / totalBookings) * 100 : 0,
        revenue: bookings
          .filter(b => b.paymentStatus === 'fully_paid')
          .reduce((sum, b) => sum + (b.paidAmount || 0), 0)
      }
    ];

    return {
      dailyRevenue,
      monthlyTrend,
      topActivities,
      paymentStatusBreakdown
    };
  };

  const predictBookings = (bookings: any[], activities: any[]): BookingPredictions => {
    // Simple prediction algorithm based on historical data
    const lastWeekBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return bookingDate >= weekAgo;
    });

    const nextWeekBookings = Math.round(lastWeekBookings.length * 1.1); // 10% growth assumption

    const averageBookingValue = bookings.length > 0 
      ? bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) / bookings.length
      : 0;

    const revenueForecast = nextWeekBookings * averageBookingValue;

    // Capacity utilization (assuming max 20 bookings per day)
    const dailyCapacity = 20;
    const averageDailyBookings = bookings.length / 30; // Assuming 30 days of data
    const capacityUtilization = Math.min((averageDailyBookings / dailyCapacity) * 100, 100);

    return {
      nextWeekBookings,
      revenueForecast,
      capacityUtilization
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'deposit_paid': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'fully_paid': return 'Entièrement Payé';
      case 'deposit_paid': return 'Acompte Payé';
      case 'unpaid': return 'Non Payé';
      default: return 'Inconnu';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Analyse des données...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Insights */}
      {revenueInsights && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Aperçus des Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {revenueInsights.dailyRevenue} MAD
                </div>
                <div className="text-sm text-gray-600">Revenus Aujourd'hui</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                  revenueInsights.monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {revenueInsights.monthlyTrend >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {Math.abs(revenueInsights.monthlyTrend).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Tendance Mensuelle</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {revenueInsights.topActivities.length}
                </div>
                <div className="text-sm text-gray-600">Activités Populaires</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Activities */}
      {revenueInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Activités les Plus Performantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueInsights.topActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                      <div className="text-sm text-gray-600">
                        {activity.bookings} réservations • {activity.rating}⭐
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{activity.revenue} MAD</div>
                    <div className="text-sm text-gray-600">revenus</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Status Breakdown */}
      {revenueInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Répartition des Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueInsights.paymentStatusBreakdown.map((status) => (
                <div key={status.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(status.status)}>
                        {getStatusText(status.status)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {status.count} réservations
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{status.revenue} MAD</div>
                      <div className="text-sm text-gray-600">
                        {status.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <Progress value={status.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Predictions */}
      {predictions && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Prédictions Intelligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {predictions.nextWeekBookings}
                </div>
                <div className="text-sm text-gray-600">Réservations Prévues</div>
                <div className="text-xs text-gray-500">Semaine Prochaine</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(predictions.revenueForecast)} MAD
                </div>
                <div className="text-sm text-gray-600">Prévision Revenus</div>
                <div className="text-xs text-gray-500">Semaine Prochaine</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {predictions.capacityUtilization.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Utilisation Capacité</div>
                <div className="text-xs text-gray-500">Actuelle</div>
              </div>
            </div>
            
            {/* Capacity Utilization Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Utilisation de la Capacité</span>
                <span className="text-sm text-gray-600">
                  {predictions.capacityUtilization.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={predictions.capacityUtilization} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4 space-y-2">
              {predictions.capacityUtilization > 80 && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Capacité élevée - Considérez augmenter les prix</span>
                </div>
              )}
              {predictions.capacityUtilization < 30 && (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Capacité faible - Augmentez le marketing</span>
                </div>
              )}
              {predictions.nextWeekBookings > 15 && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Excellente semaine prévue - Préparez-vous!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-gray-600" />
            Actions d'Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Rapport Revenus
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Analyse Paiements
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Prédictions
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Complet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
