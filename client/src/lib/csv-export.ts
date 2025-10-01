export interface CSVExportData {
  [key: string]: any;
}

export class CSVExportService {
  private static instance: CSVExportService;

  constructor() {}

  public static getInstance(): CSVExportService {
    if (!CSVExportService.instance) {
      CSVExportService.instance = new CSVExportService();
    }
    return CSVExportService.instance;
  }

  public exportToCSV(data: CSVExportData[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = this.generateCSVContent(data, headers);
    this.downloadCSV(csvContent, filename);
  }

  public exportBookingsToCSV(bookings: any[]): void {
    const csvData = bookings.map(booking => ({
      'Booking ID': booking._id,
      'Customer Name': booking.customerName,
      'Customer Phone': booking.customerPhone,
      'Activity': booking.activity?.name || 'N/A',
      'Date': new Date(booking.preferredDate).toLocaleDateString(),
      'Time': new Date(booking.preferredDate).toLocaleTimeString(),
      'Participants': booking.numberOfPeople,
      'Total Amount': booking.totalAmount,
      'Paid Amount': booking.paidAmount,
      'Payment Status': booking.paymentStatus,
      'Payment Method': booking.paymentMethod,
      'Status': booking.status,
      'Created': new Date(booking.createdAt).toLocaleDateString(),
      'Notes': booking.notes || '',
    }));

    this.exportToCSV(csvData, `bookings-${new Date().toISOString().split('T')[0]}.csv`);
  }

  public exportRevenueToCSV(revenueData: any[]): void {
    const csvData = revenueData.map(item => ({
      'Date': item.date,
      'Revenue': item.revenue,
      'Bookings': item.bookings,
      'Average Value': item.averageValue,
      'Activity': item.activity || 'All Activities',
    }));

    this.exportToCSV(csvData, `revenue-${new Date().toISOString().split('T')[0]}.csv`);
  }

  public exportCustomersToCSV(customers: any[]): void {
    const csvData = customers.map(customer => ({
      'Customer ID': customer._id,
      'Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email || 'N/A',
      'Total Bookings': customer.totalBookings,
      'Total Spent': customer.totalSpent,
      'Last Booking': customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : 'N/A',
      'Customer Segment': customer.segment || 'N/A',
      'Repeat Rate': customer.repeatRate ? `${(customer.repeatRate * 100).toFixed(1)}%` : 'N/A',
    }));

    this.exportToCSV(csvData, `customers-${new Date().toISOString().split('T')[0]}.csv`);
  }

  public exportAnalyticsToCSV(analyticsData: any, type: string): void {
    let csvData: CSVExportData[] = [];
    let filename = '';

    switch (type) {
      case 'demand':
        csvData = analyticsData.seasonalPatterns?.map((item: any) => ({
          'Month': item.month,
          'Bookings': item.bookings,
          'Revenue': item.revenue,
          'Average Value': item.averageValue,
        })) || [];
        filename = `demand-analysis-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'cancellations':
        csvData = analyticsData.byReason?.map((item: any) => ({
          'Reason': item.reason,
          'Count': item.count,
          'Percentage': `${item.percentage.toFixed(1)}%`,
          'Average Lead Time': item.averageLeadTime,
        })) || [];
        filename = `cancellations-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'weather':
        csvData = analyticsData.capacityByWeather?.map((item: any) => ({
          'Weather Condition': item.weather,
          'Capacity Utilization': `${item.utilization.toFixed(1)}%`,
          'Bookings': item.bookings,
          'Revenue Impact': item.revenueImpact,
        })) || [];
        filename = `weather-impact-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        console.warn('Unknown analytics type:', type);
        return;
    }

    if (csvData.length > 0) {
      this.exportToCSV(csvData, filename);
    }
  }

  private generateCSVContent(data: CSVExportData[], headers: string[]): string {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  public formatDateForCSV(date: Date): string {
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  }

  public formatCurrencyForCSV(amount: number, currency: string = 'MAD'): string {
    return `${amount.toFixed(2)} ${currency}`;
  }

  public sanitizeForCSV(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // Remove or replace problematic characters
    return stringValue
      .replace(/[\r\n]/g, ' ') // Replace line breaks with spaces
      .replace(/"/g, '""') // Escape quotes
      .trim();
  }
}

// Export singleton instance
export const csvExportService = CSVExportService.getInstance();
