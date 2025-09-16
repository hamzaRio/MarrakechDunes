import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Banknote,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Download
} from "lucide-react";
import type { BookingType, ActivityType } from "@shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

interface CashPaymentAnalyticsProps {
  bookings: BookingWithActivity[];
}

export default function CashPaymentAnalytics({ bookings }: CashPaymentAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<string>("30");

  // Filter bookings by time range
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= parseInt(timeRange);
  });

  // Calculate analytics
  const totalBookings = filteredBookings.length;
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);
  const paidBookings = filteredBookings.filter(b => b.paymentStatus === 'fully_paid').length;
  const depositBookings = filteredBookings.filter(b => b.paymentStatus === 'deposit_paid').length;
  const unpaidBookings = filteredBookings.filter(b => b.paymentStatus === 'unpaid').length;
  
  const paidRevenue = filteredBookings
    .filter(b => b.paymentStatus === 'fully_paid')
    .reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);
  
  const depositRevenue = filteredBookings
    .filter(b => b.paymentStatus === 'deposit_paid')
    .reduce((sum, booking) => sum + (booking.paidAmount || 0), 0);
  
  const pendingRevenue = filteredBookings
    .filter(b => b.paymentStatus === 'unpaid')
    .reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);

  const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const paymentCompletionRate = totalBookings > 0 ? Math.round((paidBookings / totalBookings) * 100) : 0;

  // Activity performance
  const activityStats = filteredBookings.reduce((acc, booking) => {
    const activityName = booking.activity.name;
    if (!acc[activityName]) {
      acc[activityName] = { bookings: 0, revenue: 0 };
    }
    acc[activityName].bookings += 1;
    acc[activityName].revenue += parseInt(booking.totalAmount);
    return acc;
  }, {} as Record<string, { bookings: number; revenue: number }>);

  const topActivities = Object.entries(activityStats)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .slice(0, 5);

  // Payment method breakdown
  const paymentMethods = {
    full: filteredBookings.filter(b => b.paymentMethod === 'cash' && b.paymentStatus === 'fully_paid').length,
    deposit: filteredBookings.filter(b => b.paymentMethod === 'cash_deposit').length,
  };

  const exportData = () => {
    const csvData = filteredBookings.map(booking => ({
      'Customer Name': booking.customerName,
      'Phone': booking.customerPhone,
      'Activity': booking.activity.name,
      'Date': new Date(booking.preferredDate).toLocaleDateString(),
      'People': booking.numberOfPeople,
      'Total Amount': booking.totalAmount,
      'Payment Status': booking.paymentStatus,
      'Paid Amount': booking.paidAmount || 0,
      'Created': new Date(booking.createdAt).toLocaleDateString()
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-payments-${timeRange}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-moroccan-blue">Cash Payment Analytics</h2>
          <p className="text-gray-600">Track your cash-only tour operations</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-moroccan-red">{totalRevenue.toLocaleString()} MAD</p>
              </div>
              <DollarSign className="w-8 h-8 text-moroccan-red" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Cash Only
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-moroccan-blue">{totalBookings}</p>
              </div>
              <Users className="w-8 h-8 text-moroccan-blue" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Avg: {averageBookingValue} MAD/booking</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                <p className="text-2xl font-bold text-green-600">{paymentCompletionRate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">{paidBookings} fully paid</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-orange-600">{pendingRevenue.toLocaleString()} MAD</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">{unpaidBookings} unpaid bookings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Payment Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Fully Paid</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{paidBookings}</div>
                  <div className="text-sm text-gray-500">{paidRevenue.toLocaleString()} MAD</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Deposit Paid</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">{depositBookings}</div>
                  <div className="text-sm text-gray-500">{depositRevenue.toLocaleString()} MAD</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Unpaid</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{unpaidBookings}</div>
                  <div className="text-sm text-gray-500">{pendingRevenue.toLocaleString()} MAD</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Performing Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topActivities.map(([activityName, stats], index) => (
                <div key={activityName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-moroccan-blue text-white text-xs rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{activityName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-moroccan-red">{stats.revenue.toLocaleString()} MAD</div>
                    <div className="text-sm text-gray-500">{stats.bookings} bookings</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Payment Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Cash Payment Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{paymentMethods.full}</div>
              <div className="text-sm text-gray-600">Full Cash Payments</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{paymentMethods.deposit}</div>
              <div className="text-sm text-gray-600">Deposit + Cash</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(((paymentMethods.full + paymentMethods.deposit) / totalBookings) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Cash Payment Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
