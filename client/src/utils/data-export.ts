// Data export utilities for multiple formats

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
}

export interface ExportableData {
  [key: string]: any;
}

// CSV Export
export const exportToCSV = (
  data: ExportableData[],
  options: ExportOptions = {}
): void => {
  const {
    filename = 'export.csv',
    includeHeaders = true,
    dateFormat = 'YYYY-MM-DD'
  } = options;

  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  let csvContent = '';

  // Add headers
  if (includeHeaders) {
    csvContent += headers.join(',') + '\n';
  }

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle dates
      if (value instanceof Date) {
        return formatDate(value, dateFormat);
      }
      
      // Handle objects/arrays
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csvContent += values.join(',') + '\n';
  });

  downloadFile(csvContent, filename, 'text/csv');
};

// Excel Export (using CSV format for simplicity)
export const exportToExcel = (
  data: ExportableData[],
  options: ExportOptions = {}
): void => {
  const filename = options.filename?.replace(/\.xlsx?$/, '') + '.csv';
  exportToCSV(data, { ...options, filename });
};

// JSON Export
export const exportToJSON = (
  data: ExportableData[],
  options: ExportOptions = {}
): void => {
  const { filename = 'export.json' } = options;
  
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

// PDF Export (basic text format)
export const exportToPDF = (
  data: ExportableData[],
  options: ExportOptions = {}
): void => {
  const { filename = 'export.pdf' } = options;
  
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  let pdfContent = '';

  // Add headers
  pdfContent += headers.join(' | ') + '\n';
  pdfContent += headers.map(() => '---').join(' | ') + '\n';

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      
      if (value instanceof Date) {
        return formatDate(value, 'YYYY-MM-DD');
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return String(value);
    });
    
    pdfContent += values.join(' | ') + '\n';
  });

  // For now, export as text file (real PDF would require a library)
  downloadFile(pdfContent, filename.replace('.pdf', '.txt'), 'text/plain');
};

// XML Export
export const exportToXML = (
  data: ExportableData[],
  options: ExportOptions = {}
): void => {
  const { filename = 'export.xml' } = options;
  
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<data>\n';

  data.forEach((row, index) => {
    xmlContent += `  <item id="${index}">\n`;
    Object.entries(row).forEach(([key, value]) => {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      const cleanValue = String(value || '').replace(/[<>&"']/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      });
      xmlContent += `    <${cleanKey}>${cleanValue}</${cleanKey}>\n`;
    });
    xmlContent += '  </item>\n';
  });

  xmlContent += '</data>';
  downloadFile(xmlContent, filename, 'application/xml');
};

// Utility function to download file
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Utility function to format dates
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Export component for UI
export interface ExportButtonProps {
  data: ExportableData[];
  filename?: string;
  formats?: Array<'csv' | 'json' | 'xml' | 'pdf'>;
  className?: string;
  children?: React.ReactNode;
}

// Booking-specific export functions
export const exportBookings = {
  toCSV: (bookings: any[], options: ExportOptions = {}) => {
    const exportData = bookings.map(booking => ({
      'Booking ID': booking.id,
      'Customer Name': booking.customerName,
      'Customer Phone': booking.customerPhone,
      'Customer Email': booking.customerEmail || '',
      'Activity': booking.activityName,
      'Date': booking.date,
      'Time': booking.time,
      'Participants': booking.participants,
      'Price': booking.price,
      'Status': booking.status,
      'Created At': booking.createdAt,
      'Notes': booking.notes || ''
    }));
    
    exportToCSV(exportData, {
      filename: 'bookings.csv',
      ...options
    });
  },

  toJSON: (bookings: any[], options: ExportOptions = {}) => {
    exportToJSON(bookings, {
      filename: 'bookings.json',
      ...options
    });
  }
};

// Activity-specific export functions
export const exportActivities = {
  toCSV: (activities: any[], options: ExportOptions = {}) => {
    const exportData = activities.map(activity => ({
      'Activity ID': activity.id,
      'Name': activity.name,
      'Description': activity.description || '',
      'Price': activity.price,
      'Duration': activity.duration || '',
      'Location': activity.location || '',
      'Category': activity.category || '',
      'Max Participants': activity.maxParticipants || '',
      'Status': activity.status || 'active',
      'Created At': activity.createdAt
    }));
    
    exportToCSV(exportData, {
      filename: 'activities.csv',
      ...options
    });
  },

  toJSON: (activities: any[], options: ExportOptions = {}) => {
    exportToJSON(activities, {
      filename: 'activities.json',
      ...options
    });
  }
};

// Customer-specific export functions
export const exportCustomers = {
  toCSV: (customers: any[], options: ExportOptions = {}) => {
    const exportData = customers.map(customer => ({
      'Customer ID': customer.id,
      'Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email || '',
      'Total Bookings': customer.totalBookings || 0,
      'Total Spent': customer.totalSpent || 0,
      'Last Booking': customer.lastBooking || '',
      'Created At': customer.createdAt
    }));
    
    exportToCSV(exportData, {
      filename: 'customers.csv',
      ...options
    });
  },

  toJSON: (customers: any[], options: ExportOptions = {}) => {
    exportToJSON(customers, {
      filename: 'customers.json',
      ...options
    });
  }
};
