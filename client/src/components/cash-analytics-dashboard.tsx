import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Banknote, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Target
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface CashAnalyticsProps {
  bookings: any[];
  activities: any[];
}

export default function CashAnalyticsDashboard({ bookings, activities }: CashAnalyticsProps) {
  
  // Calculate cash flow metrics
  const cashMetrics = {
    totalCashRevenue: bookings
      .filter(b => b.paymentMethod === 'cash' && b.paymentStatus === 'fully_paid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0),
    
    pendingCashPayments: bookings
      .filter(b => b.paymentMethod === 'cash' && b.paymentStatus === 'unpaid')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0),
    
    depositsPaid: bookings
      .filter(b => b.paymentMethod === 'cash_deposit' && b.paymentStatus === 'deposit_paid')
      .reduce((sum, b) => sum + (b.paidAmount || 0), 0),
    
    outstandingBalances: bookings
      .filter(b => b.paymentMethod === 'cash_deposit' && b.paymentStatus === 'deposit_paid')
      .reduce((sum, b) => sum + (Number(b.totalAmount) - (b.paidAmount || 0)), 0),
  };

  // Daily cash collection data
  const dailyCashData = bookings
    .filter(b => b.paymentMethod === 'cash' && b.paymentStatus === 'fully_paid')
    .reduce((acc: any[], booking) => {
      const date = new Date(booking.preferredDate).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.amount += Number(booking.totalAmount);
        existing.bookings += 1;
      } else {
        acc.push({
          date,
          amount: Number(booking.totalAmount),
          bookings: 1
        });
      }
      
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Last 7 days

  // Payment method distribution (should be 100% cash)
  const paymentMethodData = [
    { 
      name: 'Cash Payments', 
      value: bookings.filter(b => b.paymentMethod === 'cash').length,
      color: '#10B981'
    },
    { 
      name: 'Cash Deposits', 
      value: bookings.filter(b => b.paymentMethod === 'cash_deposit').length,
      color: '#F59E0B'
    }
  ];

  // Cash collection efficiency
  const collectionEfficiency = {
    onTimePayments: bookings.filter(b => 
      b.paymentStatus === 'fully_paid' && 
      new Date(b.updatedAt) <= new Date(b.preferredDate)
    ).length,
    latePayments: bookings.filter(b => 
      b.paymentStatus === 'fully_paid' && 
      new Date(b.updatedAt) > new Date(b.preferredDate)
    ).length,
    unpaidBookings: bookings.filter(b => b.paymentStatus === 'unpaid').length
  };

  return (
    <div className="space-y-6">
      {/* Cash Flow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Cash Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{cashMetrics.totalCashRevenue} MAD</div>
            <p className="text-xs text-green-600">Fully paid bookings</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending Cash</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{cashMetrics.pendingCashPayments} MAD</div>
            <p className="text-xs text-yellow-600">Awaiting payment on arrival</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Deposits Collected</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{cashMetrics.depositsPaid} MAD</div>
            <p className="text-xs text-blue-600">Cash deposits received</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Outstanding Balances</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{cashMetrics.outstandingBalances} MAD</div>
            <p className="text-xs text-orange-600">Remaining after deposits</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cash-flow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="collection">Collection Efficiency</TabsTrigger>
          <TabsTrigger value="daily">Daily Collections</TabsTrigger>
          <TabsTrigger value="insights">Cash Insights</TabsTrigger>
        </TabsList>

        {/* Cash Flow Tab */}
        <TabsContent value="cash-flow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">100% Cash-Only Policy Maintained</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">On-time Payments</span>
                    <Badge variant="default" className="bg-green-600">
                      {collectionEfficiency.onTimePayments}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Late Payments</span>
                    <Badge variant="secondary" className="bg-yellow-600">
                      {collectionEfficiency.latePayments}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">Unpaid Bookings</span>
                    <Badge variant="destructive">
                      {collectionEfficiency.unpaidBookings}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 p-3 bg-moroccan-gold/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-moroccan-red" />
                      <span className="text-sm font-medium">Collection Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-moroccan-blue">
                      {Math.round((collectionEfficiency.onTimePayments / (collectionEfficiency.onTimePayments + collectionEfficiency.latePayments + collectionEfficiency.unpaidBookings)) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Collections Tab */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Daily Cash Collections (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyCashData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`${value} MAD`, 'Cash Collected']} />
                  <Bar dataKey="amount" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Handling Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Exact Change Policy</h4>
                    <p className="text-sm text-green-700">Encourage customers to bring exact change to speed up transactions</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Consistent Meeting Point</h4>
                    <p className="text-sm text-blue-700">Always collect payments at 54 Riad Zitoun Lakdim for security</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Deposit Strategy</h4>
                    <p className="text-sm text-yellow-700">30% deposits help secure bookings and reduce no-shows</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Transaction:</span>
                    <span className="font-bold">
                      {Math.round(cashMetrics.totalCashRevenue / Math.max(1, bookings.filter(b => b.paymentStatus === 'fully_paid').length))} MAD
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cash Conversion Rate:</span>
                    <span className="font-bold text-green-600">
                      {Math.round((bookings.filter(b => b.paymentStatus !== 'unpaid').length / Math.max(1, bookings.length)) * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">No-Show Rate:</span>
                    <span className="font-bold text-red-600">
                      {Math.round((bookings.filter(b => b.status === 'cancelled').length / Math.max(1, bookings.length)) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-moroccan-sand/30 rounded-lg">
                  <h4 className="font-medium text-moroccan-blue mb-2">💡 Optimization Tips</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Send payment reminders 24h before tours</li>
                    <li>• Offer small discounts for full upfront payment</li>
                    <li>• Keep change available for large bills</li>
                    <li>• Track peak collection times</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
