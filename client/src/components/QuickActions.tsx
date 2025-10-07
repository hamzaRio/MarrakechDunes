import React from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  shortcut?: string;
  disabled?: boolean;
  tooltip?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabels?: boolean;
  showShortcuts?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  orientation = 'horizontal',
  size = 'md',
  className = '',
  showLabels = true,
  showShortcuts = false
}) => {
  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-3 text-base',
    lg: 'p-4 text-lg'
  };

  const orientationClasses = {
    horizontal: 'flex flex-row space-x-2',
    vertical: 'flex flex-col space-y-2'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <div className={`${orientationClasses[orientation]} ${className}`}>
      {actions.map(action => (
        <button
          key={action.id}
          onClick={action.action}
          disabled={action.disabled}
          title={action.tooltip || action.label}
          className={`
            ${sizeClasses[size]}
            ${variantClasses[action.variant || 'primary']}
            rounded-lg font-medium transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center space-x-2
            ${orientation === 'vertical' ? 'justify-start' : 'justify-center'}
          `}
        >
          <span className="flex-shrink-0">{action.icon}</span>
          {showLabels && (
            <span className="flex-1 text-left">{action.label}</span>
          )}
          {showShortcuts && action.shortcut && (
            <span className="text-xs opacity-75 ml-1">
              {action.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Floating Quick Actions (FAB-style)
export const FloatingQuickActions: React.FC<{
  actions: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}> = ({
  actions,
  position = 'bottom-right',
  isOpen,
  onToggle,
  className = ''
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
      {/* Action Buttons */}
      <div className={`space-y-2 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={action.disabled}
            title={action.tooltip || action.label}
            className="bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action.icon}
          </button>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
      >
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          +
        </span>
      </button>
    </div>
  );
};

// Quick Action Bar for Admin Dashboard
export const AdminQuickActions: React.FC<{
  onNewBooking?: () => void;
  onNewActivity?: () => void;
  onExportData?: () => void;
  onRefreshData?: () => void;
  onViewReports?: () => void;
  onManageCustomers?: () => void;
  className?: string;
}> = ({
  onNewBooking,
  onNewActivity,
  onExportData,
  onRefreshData,
  onViewReports,
  onManageCustomers,
  className = ''
}) => {
  const actions: QuickAction[] = [
    {
      id: 'new-booking',
      label: 'New Booking',
      icon: '📝',
      action: onNewBooking || (() => console.log('New booking')),
      variant: 'primary',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'new-activity',
      label: 'New Activity',
      icon: '🎯',
      action: onNewActivity || (() => console.log('New activity')),
      variant: 'success',
      shortcut: 'Ctrl+A'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: '📊',
      action: onExportData || (() => console.log('Export data')),
      variant: 'secondary',
      shortcut: 'Ctrl+E'
    },
    {
      id: 'refresh-data',
      label: 'Refresh',
      icon: '🔄',
      action: onRefreshData || (() => console.log('Refresh data')),
      variant: 'secondary',
      shortcut: 'Ctrl+R'
    },
    {
      id: 'view-reports',
      label: 'Reports',
      icon: '📈',
      action: onViewReports || (() => console.log('View reports')),
      variant: 'warning',
      shortcut: 'Ctrl+P'
    },
    {
      id: 'manage-customers',
      label: 'Customers',
      icon: '👥',
      action: onManageCustomers || (() => console.log('Manage customers')),
      variant: 'secondary',
      shortcut: 'Ctrl+C'
    }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
      <QuickActions
        actions={actions}
        orientation="horizontal"
        size="sm"
        showLabels={true}
        showShortcuts={true}
      />
    </div>
  );
};

// Context-specific quick actions
export const BookingQuickActions: React.FC<{
  bookingId: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  onSendReminder?: () => void;
  onViewDetails?: () => void;
  className?: string;
}> = ({
  bookingId,
  onEdit,
  onCancel,
  onReschedule,
  onSendReminder,
  onViewDetails,
  className = ''
}) => {
  const actions: QuickAction[] = [
    {
      id: 'edit-booking',
      label: 'Edit',
      icon: '✏️',
      action: onEdit || (() => console.log('Edit booking', bookingId)),
      variant: 'primary'
    },
    {
      id: 'reschedule-booking',
      label: 'Reschedule',
      icon: '📅',
      action: onReschedule || (() => console.log('Reschedule booking', bookingId)),
      variant: 'warning'
    },
    {
      id: 'send-reminder',
      label: 'Remind',
      icon: '📱',
      action: onSendReminder || (() => console.log('Send reminder', bookingId)),
      variant: 'secondary'
    },
    {
      id: 'view-details',
      label: 'Details',
      icon: '👁️',
      action: onViewDetails || (() => console.log('View details', bookingId)),
      variant: 'secondary'
    },
    {
      id: 'cancel-booking',
      label: 'Cancel',
      icon: '❌',
      action: onCancel || (() => console.log('Cancel booking', bookingId)),
      variant: 'danger'
    }
  ];

  return (
    <QuickActions
      actions={actions}
      orientation="horizontal"
      size="sm"
      showLabels={false}
      className={className}
    />
  );
};

// Hook for managing quick actions
export const useQuickActions = () => {
  const [actions, setActions] = React.useState<QuickAction[]>([]);

  const addAction = React.useCallback((action: QuickAction) => {
    setActions(prev => [...prev, action]);
  }, []);

  const removeAction = React.useCallback((actionId: string) => {
    setActions(prev => prev.filter(action => action.id !== actionId));
  }, []);

  const updateAction = React.useCallback((actionId: string, updates: Partial<QuickAction>) => {
    setActions(prev => prev.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    ));
  }, []);

  const clearActions = React.useCallback(() => {
    setActions([]);
  }, []);

  return {
    actions,
    addAction,
    removeAction,
    updateAction,
    clearActions
  };
};
