import React, { useState } from 'react';
import { 
  exportToCSV, 
  exportToJSON, 
  exportToXML, 
  exportToPDF,
  ExportableData,
  ExportOptions 
} from '../utils/data-export';

interface ExportButtonProps {
  data: ExportableData[];
  filename?: string;
  formats?: Array<'csv' | 'json' | 'xml' | 'pdf'>;
  className?: string;
  children?: React.ReactNode;
  onExport?: (format: string) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename = 'export',
  formats = ['csv', 'json'],
  className = '',
  children,
  onExport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        filename: `${filename}.${format}`,
        includeHeaders: true
      };

      switch (format) {
        case 'csv':
          exportToCSV(data, options);
          break;
        case 'json':
          exportToJSON(data, options);
          break;
        case 'xml':
          exportToXML(data, options);
          break;
        case 'pdf':
          exportToPDF(data, options);
          break;
        default:
          console.warn(`Unsupported export format: ${format}`);
      }

      onExport?.(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const formatLabels = {
    csv: 'CSV',
    json: 'JSON',
    xml: 'XML',
    pdf: 'PDF'
  };

  const formatIcons = {
    csv: '📊',
    json: '📄',
    xml: '📋',
    pdf: '📑'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={data.length === 0 || isExporting}
        className={`
          bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center space-x-2 transition-colors
          ${className}
        `}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <span>📊</span>
            <span>{children || 'Export'}</span>
            <span className="text-xs">▼</span>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {formats.map(format => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
              >
                <span>{formatIcons[format]}</span>
                <span>{formatLabels[format]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Specialized export buttons
export const BookingExportButton: React.FC<{
  bookings: any[];
  className?: string;
}> = ({ bookings, className = '' }) => {
  return (
    <ExportButton
      data={bookings}
      filename="bookings"
      formats={['csv', 'json', 'xml']}
      className={className}
    >
      Export Bookings
    </ExportButton>
  );
};

export const ActivityExportButton: React.FC<{
  activities: any[];
  className?: string;
}> = ({ activities, className = '' }) => {
  return (
    <ExportButton
      data={activities}
      filename="activities"
      formats={['csv', 'json']}
      className={className}
    >
      Export Activities
    </ExportButton>
  );
};

export const CustomerExportButton: React.FC<{
  customers: any[];
  className?: string;
}> = ({ customers, className = '' }) => {
  return (
    <ExportButton
      data={customers}
      filename="customers"
      formats={['csv', 'json']}
      className={className}
    >
      Export Customers
    </ExportButton>
  );
};

// Bulk export component
export const BulkExportButton: React.FC<{
  selectedItems: any[];
  itemType: 'bookings' | 'activities' | 'customers';
  className?: string;
}> = ({ selectedItems, itemType, className = '' }) => {
  const getFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${itemType}_${selectedItems.length}_items_${timestamp}`;
  };

  const getFormats = (): Array<'csv' | 'json' | 'xml' | 'pdf'> => {
    switch (itemType) {
      case 'bookings':
        return ['csv', 'json', 'xml'];
      case 'activities':
        return ['csv', 'json'];
      case 'customers':
        return ['csv', 'json'];
      default:
        return ['csv'];
    }
  };

  if (selectedItems.length === 0) {
    return (
      <button
        disabled
        className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
      >
        Export Selected (0)
      </button>
    );
  }

  return (
    <ExportButton
      data={selectedItems}
      filename={getFilename()}
      formats={getFormats()}
      className={className}
    >
      Export Selected ({selectedItems.length})
    </ExportButton>
  );
};
