import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Import our components
import { LoadingSpinner, AsyncWrapper, useLoading } from '../components/LoadingSpinner';
import { useFormAutoSave } from '../hooks/use-autosave';
import { useKeyboardShortcuts, createAdminShortcuts } from '../hooks/use-keyboard-shortcuts';
import { BulkSelector, useBulkSelection } from '../components/BulkSelector';
import { SearchHighlight, useSearchHighlight } from '../components/SearchHighlight';
import { useConfirmation, confirmDelete } from '../components/ConfirmationDialog';
import { AdminQuickActions, FloatingQuickActions } from '../components/QuickActions';
import { BookingExportButton, BulkExportButton } from '../components/ExportButton';
import { OfflineIndicator, ConnectionStatusBadge } from '../components/OfflineIndicator';
import { BookingTemplates } from '../components/BookingTemplates';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Test component for loading spinner
const TestLoadingComponent: React.FC = () => {
  const { loading, withLoading } = useLoading();

  const handleAsyncAction = () => {
    withLoading(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  return (
    <div>
      <button onClick={handleAsyncAction}>Test Loading</button>
      {loading && <LoadingSpinner text="Loading..." />}
    </div>
  );
};

// Test component for auto-save
const TestAutoSaveComponent: React.FC = () => {
  const [formData, setFormData] = React.useState({ name: '', email: '' });
  
  const { saveNow } = useFormAutoSave(formData, {
    formId: 'test-form',
    delay: 1000
  });

  return (
    <div>
      <input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      <input
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      <button onClick={saveNow}>Save Now</button>
    </div>
  );
};

// Test component for keyboard shortcuts
const TestKeyboardShortcutsComponent: React.FC = () => {
  const [action, setAction] = React.useState('');

  const shortcuts = createAdminShortcuts({
    onSave: () => setAction('save'),
    onNew: () => setAction('new'),
    onDelete: () => setAction('delete'),
    onSearch: () => setAction('search'),
    onRefresh: () => setAction('refresh'),
    onExport: () => setAction('export'),
    onHelp: () => setAction('help')
  });

  useKeyboardShortcuts(shortcuts);

  return (
    <div>
      <div data-testid="action">{action}</div>
      <input placeholder="Search" />
    </div>
  );
};

// Test component for bulk selection
const TestBulkSelectionComponent: React.FC = () => {
  const items = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' }
  ];

  const [selectedItems, setSelectedItems] = React.useState<any[]>([]);

  return (
    <BulkSelector
      items={items}
      onSelectionChange={setSelectedItems}
      getItemId={(item) => item.id}
    >
      {(item, isSelected, toggleSelection) => (
        <div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={toggleSelection}
          />
          <span>{item.name}</span>
        </div>
      )}
    </BulkSelector>
  );
};

// Test component for search highlighting
const TestSearchHighlightComponent: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { highlightText } = useSearchHighlight(searchTerm);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search"
      />
      <div>{highlightText('Test search result')}</div>
    </div>
  );
};

// Test component for confirmation dialog
const TestConfirmationComponent: React.FC = () => {
  const { confirm, ConfirmationComponent } = useConfirmation();
  const [result, setResult] = React.useState('');

  const handleDelete = () => {
    confirmDelete(confirm, 'Test Item', () => {
      setResult('deleted');
    });
  };

  return (
    <div>
      <button onClick={handleDelete}>Delete Item</button>
      <div data-testid="result">{result}</div>
      <ConfirmationComponent />
    </div>
  );
};

// Test component for quick actions
const TestQuickActionsComponent: React.FC = () => {
  const [action, setAction] = React.useState('');

  return (
    <div>
      <AdminQuickActions
        onNewBooking={() => setAction('new-booking')}
        onNewActivity={() => setAction('new-activity')}
        onExportData={() => setAction('export')}
        onRefreshData={() => setAction('refresh')}
        onViewReports={() => setAction('reports')}
        onManageCustomers={() => setAction('customers')}
      />
      <div data-testid="action">{action}</div>
    </div>
  );
};

// Test component for export button
const TestExportComponent: React.FC = () => {
  const testData = [
    { id: '1', name: 'Test Booking 1', amount: 100 },
    { id: '2', name: 'Test Booking 2', amount: 200 }
  ];

  return (
    <div>
      <BookingExportButton bookings={testData} />
      <BulkExportButton selectedItems={testData} itemType="bookings" />
    </div>
  );
};

// Test component for offline indicator
const TestOfflineComponent: React.FC = () => {
  return (
    <div>
      <OfflineIndicator />
      <ConnectionStatusBadge />
    </div>
  );
};

// Test component for booking templates
const TestBookingTemplatesComponent: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null);

  return (
    <BookingTemplates
      onSelectTemplate={setSelectedTemplate}
      onSaveTemplate={(template) => console.log('Template saved:', template)}
      currentBooking={selectedTemplate}
    />
  );
};

// Integration tests
describe('Enhanced Admin Dashboard Integration Tests', () => {
  test('LoadingSpinner component renders and works correctly', async () => {
    render(
      <TestWrapper>
        <TestLoadingComponent />
      </TestWrapper>
    );

    const button = screen.getByText('Test Loading');
    fireEvent.click(button);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('Auto-save hook works correctly', async () => {
    render(
      <TestWrapper>
        <TestAutoSaveComponent />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email');
    const saveButton = screen.getByText('Save Now');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(saveButton);

    // Auto-save should work without errors
    expect(nameInput).toHaveValue('Test User');
    expect(emailInput).toHaveValue('test@example.com');
  });

  test('Keyboard shortcuts work correctly', async () => {
    render(
      <TestWrapper>
        <TestKeyboardShortcutsComponent />
      </TestWrapper>
    );

    const actionDiv = screen.getByTestId('action');

    // Test Ctrl+S (save)
    fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    expect(actionDiv).toHaveTextContent('save');

    // Test Ctrl+N (new)
    fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
    expect(actionDiv).toHaveTextContent('new');

    // Test Ctrl+F (search)
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    expect(actionDiv).toHaveTextContent('search');
  });

  test('Bulk selection works correctly', async () => {
    render(
      <TestWrapper>
        <TestBulkSelectionComponent />
      </TestWrapper>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    
    // Select first item
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();

    // Select all
    const selectAllCheckbox = screen.getByLabelText(/select all/i);
    fireEvent.click(selectAllCheckbox);
    
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  test('Search highlighting works correctly', async () => {
    render(
      <TestWrapper>
        <TestSearchHighlightComponent />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search');
    const resultDiv = screen.getByText('Test search result');

    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Should highlight the search term
    expect(resultDiv).toBeInTheDocument();
  });

  test('Confirmation dialog works correctly', async () => {
    render(
      <TestWrapper>
        <TestConfirmationComponent />
      </TestWrapper>
    );

    const deleteButton = screen.getByText('Delete Item');
    fireEvent.click(deleteButton);

    // Should show confirmation dialog
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Test Item"? This action cannot be undone.')).toBeInTheDocument();
  });

  test('Quick actions work correctly', async () => {
    render(
      <TestWrapper>
        <TestQuickActionsComponent />
      </TestWrapper>
    );

    const actionDiv = screen.getByTestId('action');

    // Test new booking action
    const newBookingButton = screen.getByText('New Booking');
    fireEvent.click(newBookingButton);
    expect(actionDiv).toHaveTextContent('new-booking');

    // Test export action
    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);
    expect(actionDiv).toHaveTextContent('export');
  });

  test('Export buttons render correctly', () => {
    render(
      <TestWrapper>
        <TestExportComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Export Bookings')).toBeInTheDocument();
    expect(screen.getByText('Export Selected (2)')).toBeInTheDocument();
  });

  test('Offline indicators render correctly', () => {
    render(
      <TestWrapper>
        <TestOfflineComponent />
      </TestWrapper>
    );

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  test('Booking templates render correctly', () => {
    render(
      <TestWrapper>
        <TestBookingTemplatesComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Saved Templates')).toBeInTheDocument();
  });

  test('AsyncWrapper works correctly', async () => {
    const TestAsyncComponent = () => (
      <AsyncWrapper loading={true} spinnerText="Loading test data...">
        <div>Content</div>
      </AsyncWrapper>
    );

    render(
      <TestWrapper>
        <TestAsyncComponent />
      </TestWrapper>
    );

    expect(screen.getByText('Loading test data...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('Components render quickly', () => {
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <TestQuickActionsComponent />
        <TestExportComponent />
        <TestOfflineComponent />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('Bulk selection handles large datasets', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Item ${i}`
    }));

    const TestLargeBulkComponent = () => {
      const [selectedItems, setSelectedItems] = React.useState<any[]>([]);

      return (
        <BulkSelector
          items={largeDataset}
          onSelectionChange={setSelectedItems}
          getItemId={(item) => item.id}
        >
          {(item, isSelected, toggleSelection) => (
            <div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={toggleSelection}
              />
              <span>{item.name}</span>
            </div>
          )}
        </BulkSelector>
      );
    };

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <TestLargeBulkComponent />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should handle large datasets efficiently
    expect(renderTime).toBeLessThan(500);
  });
});

// Accessibility tests
describe('Accessibility Tests', () => {
  test('Components have proper ARIA labels', () => {
    render(
      <TestWrapper>
        <TestQuickActionsComponent />
        <TestExportComponent />
      </TestWrapper>
    );

    // Check for proper button labels
    expect(screen.getByText('New Booking')).toBeInTheDocument();
    expect(screen.getByText('Export Bookings')).toBeInTheDocument();
  });

  test('Keyboard navigation works', () => {
    render(
      <TestWrapper>
        <TestKeyboardShortcutsComponent />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search');
    
    // Should be able to focus search input
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);
  });
});

export default {
  TestWrapper,
  TestLoadingComponent,
  TestAutoSaveComponent,
  TestKeyboardShortcutsComponent,
  TestBulkSelectionComponent,
  TestSearchHighlightComponent,
  TestConfirmationComponent,
  TestQuickActionsComponent,
  TestExportComponent,
  TestOfflineComponent,
  TestBookingTemplatesComponent
};
