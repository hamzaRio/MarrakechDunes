import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, PieChart, Calendar, Download, Calculator } from "lucide-react";

interface FinancialMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  conversionRate: number;
  monthlyGrowth: number;
  taxableIncome: number;
  operatingExpenses: number;
  netProfit: number;
}

interface RevenueBreakdown {
  activityId: string;
  activityName: string;
  revenue: number;
  bookings: number;
  averageValue: number;
  percentage: number;
}

interface MonthlyReport {
  month: string;
  revenue: number;
  bookings: number;
  expenses: number;
  profit: number;
  taxDue: number;
}

export default function FinancialReporting() {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod, selectedYear]);

  const loadFinancialData = () => {
    // Simulate financial data loading
    const mockMetrics: FinancialMetrics = {
      totalRevenue: 892450,
      totalBookings: 324,
      averageBookingValue: 2755,
      conversionRate: 12.8,
      monthlyGrowth: 18.5,
      taxableIncome: 802005,
      operatingExpenses: 267735,
      netProfit: 534270
    };

    const mockRevenueBreakdown: RevenueBreakdown[] = [
      {
        activityId: '2',
        activityName: '3-Day Desert Experience',
        revenue: 380000,
        bookings: 76,
        averageValue: 5000,
        percentage: 42.6
      },
      {
        activityId: '1',
        activityName: 'Hot Air Balloon Ride',
        revenue: 178000,
        bookings: 89,
        averageValue: 2000,
        percentage: 19.9
      },
      {
        activityId: '3',
        activityName: 'Essaouira Day Trip',
        revenue: 150750,
        bookings: 67,
        averageValue: 1500,
        percentage: 16.9
      },
      {
        activityId: '4',
        activityName: 'Ourika Valley Adventure',
        revenue: 121500,
        bookings: 54,
        averageValue: 1500,
        percentage: 13.6
      },
      {
        activityId: '5',
        activityName: 'Ouzoud Waterfalls Tour',
        revenue: 64500,
        bookings: 43,
        averageValue: 1500,
        percentage: 7.2
      }
    ];

    const mockMonthlyReports: MonthlyReport[] = [
      {
        month: 'Jan 2025',
        revenue: 145680,
        bookings: 52,
        expenses: 43704,
        profit: 101976,
        taxDue: 29141
      },
      {
        month: 'Feb 2025',
        revenue: 168920,
        bookings: 61,
        expenses: 50676,
        profit: 118244,
        taxDue: 33790
      },
      {
        month: 'Mar 2025',
        revenue: 198750,
        bookings: 73,
        expenses: 59625,
        profit: 139125,
        taxDue: 39756
      },
      {
        month: 'Apr 2025',
        revenue: 215340,
        bookings: 78,
        expenses: 64602,
        profit: 150738,
        taxDue: 43061
      },
      {
        month: 'May 2025',
        revenue: 163760,
        bookings: 60,
        expenses: 49128,
        profit: 114632,
        taxDue: 32741
      }
    ];

    setMetrics(mockMetrics);
    setRevenueBreakdown(mockRevenueBreakdown);
    setMonthlyReports(mockMonthlyReports);
  };

  const generateReport = (format: 'pdf' | 'excel') => {
    // Simulate report generation
    alert(`Generating ${format.toUpperCase()} financial report for ${selectedPeriod} period...`);
  };

  const calculateTax = (revenue: number) => {
    // Morocco tax calculation (simplified)
    const taxRate = 0.30; // 30% corporate tax rate
    return Math.round(revenue * taxRate);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} MAD`;
  };

  if (!metrics) return <div>Loading financial data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Financial Reporting & Analysis</h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
                <p className="text-xs text-green-600">+{metrics.monthlyGrowth}% vs last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.netProfit)}</p>
                <p className="text-xs text-gray-600">
                  {Math.round((metrics.netProfit / metrics.totalRevenue) * 100)}% margin
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.averageBookingValue)}</p>
                <p className="text-xs text-gray-600">{metrics.totalBookings} total bookings</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tax Due</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(calculateTax(metrics.taxableIncome))}</p>
                <p className="text-xs text-gray-600">30% corporate rate</p>
              </div>
              <PieChart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown by Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Revenue Breakdown by Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueBreakdown.map((item, index) => (
              <div key={item.activityId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.activityName}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{item.bookings} bookings</span>
                      <span>Avg: {formatCurrency(item.averageValue)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(item.revenue)}</div>
                  <div className="text-sm text-gray-600">{item.percentage}% of total</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Month</th>
                  <th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Bookings</th>
                  <th className="text-right p-3">Expenses</th>
                  <th className="text-right p-3">Profit</th>
                  <th className="text-right p-3">Tax Due</th>
                  <th className="text-right p-3">Margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReports.map((report, index) => {
                  const margin = Math.round((report.profit / report.revenue) * 100);
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{report.month}</td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatCurrency(report.revenue)}
                      </td>
                      <td className="p-3 text-right">{report.bookings}</td>
                      <td className="p-3 text-right text-red-600">
                        {formatCurrency(report.expenses)}
                      </td>
                      <td className="p-3 text-right font-semibold text-blue-600">
                        {formatCurrency(report.profit)}
                      </td>
                      <td className="p-3 text-right text-orange-600">
                        {formatCurrency(report.taxDue)}
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={margin > 60 ? "default" : margin > 40 ? "secondary" : "destructive"}>
                          {margin}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Staff Costs</h4>
              <div className="text-2xl font-bold text-red-600">89,240 MAD</div>
              <div className="text-sm text-red-700">33% of expenses</div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Vehicle Maintenance</h4>
              <div className="text-2xl font-bold text-blue-600">67,185 MAD</div>
              <div className="text-sm text-blue-700">25% of expenses</div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Marketing</h4>
              <div className="text-2xl font-bold text-green-600">53,547 MAD</div>
              <div className="text-sm text-green-700">20% of expenses</div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Operations</h4>
              <div className="text-2xl font-bold text-purple-600">57,763 MAD</div>
              <div className="text-sm text-purple-700">22% of expenses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Summary & Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Corporate Tax (IS)</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxable Income:</span>
                  <span className="font-medium">{formatCurrency(metrics.taxableIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Rate:</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Tax Due:</span>
                  <span className="text-red-600">{formatCurrency(calculateTax(metrics.taxableIncome))}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">VAT Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT Collected (20%):</span>
                  <span className="font-medium">{formatCurrency(Math.round(metrics.totalRevenue * 0.2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT Paid on Expenses:</span>
                  <span className="font-medium">{formatCurrency(Math.round(metrics.operatingExpenses * 0.2))}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Net VAT Due:</span>
                  <span className="text-red-600">
                    {formatCurrency(Math.round((metrics.totalRevenue - metrics.operatingExpenses) * 0.2))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Generate Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={() => generateReport('pdf')} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download PDF Report
            </Button>
            <Button onClick={() => generateReport('excel')} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Reports include detailed breakdowns, tax calculations, and year-over-year comparisons.
            Perfect for accounting, tax filing, and business analysis.
          </div>
        </CardContent>
      </Card>

      {/* Financial Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Strong Performance Areas</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Desert experiences generating 42.6% of total revenue</li>
                <li>• 59.8% profit margin - well above industry average</li>
                <li>• 18.5% month-over-month growth trend</li>
                <li>• High-value bookings averaging 2,755 MAD per customer</li>
                <li>• Strong conversion rate of 12.8% from inquiries to bookings</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Optimization Opportunities</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Consider increasing balloon ride prices by 10-15%</li>
                <li>• Expand desert tour capacity during peak season</li>
                <li>• Optimize staff costs through seasonal scheduling</li>
                <li>• Invest in marketing for underperforming waterfall tours</li>
                <li>• Implement dynamic pricing based on demand patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}