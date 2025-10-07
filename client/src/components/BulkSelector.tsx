import React, { useState, useCallback } from 'react';

interface BulkSelectorProps<T> {
  items: T[];
  onSelectionChange: (selectedItems: T[]) => void;
  getItemId: (item: T) => string;
  children: (item: T, isSelected: boolean, toggleSelection: () => void) => React.ReactNode;
  className?: string;
}

export function BulkSelector<T>({
  items,
  onSelectionChange,
  getItemId,
  children,
  className = ''
}: BulkSelectorProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((item: T) => {
    const itemId = getItemId(item);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, [getItemId]);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId));
    setSelectedIds(allIds);
  }, [items, getItemId]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = selectedIds.size === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < items.length;

  // Update parent when selection changes
  React.useEffect(() => {
    const selectedItems = items.filter(item => selectedIds.has(getItemId(item)));
    onSelectionChange(selectedItems);
  }, [selectedIds, items, getItemId, onSelectionChange]);

  return (
    <div className={className}>
      {/* Bulk Actions Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isPartiallySelected;
              }}
              onChange={isAllSelected ? selectNone : selectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </span>
          </label>
        </div>
        
        {selectedIds.size > 0 && (
          <BulkActions selectedCount={selectedIds.size} onClear={selectNone} />
        )}
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-200">
        {items.map(item => {
          const itemId = getItemId(item);
          const isSelected = selectedIds.has(itemId);
          
          return (
            <div key={itemId} className="p-4">
              {children(item, isSelected, () => toggleSelection(item))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bulk Actions Component
interface BulkActionsProps {
  selectedCount: number;
  onClear: () => void;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    icon?: React.ReactNode;
  }>;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onClear,
  actions = []
}) => {
  const defaultActions = [
    {
      label: 'Export Selected',
      action: () => console.log('Export selected items'),
      variant: 'secondary' as const,
      icon: '📊'
    },
    {
      label: 'Delete Selected',
      action: () => {
        if (confirm(`Are you sure you want to delete ${selectedCount} items?`)) {
          console.log('Delete selected items');
        }
      },
      variant: 'danger' as const,
      icon: '🗑️'
    }
  ];

  const allActions = [...actions, ...defaultActions];

  return (
    <div className="flex items-center space-x-2">
      {allActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`
            px-3 py-1 text-sm rounded-md transition-colors
            ${action.variant === 'danger' 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : action.variant === 'primary'
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {action.icon && <span className="mr-1">{action.icon}</span>}
          {action.label}
        </button>
      ))}
      <button
        onClick={onClear}
        className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
      >
        Clear
      </button>
    </div>
  );
};

// Simple checkbox selector for individual items
export const SelectableItem: React.FC<{
  isSelected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isSelected, onToggle, children, className = '' }) => {
  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

// Hook for managing bulk selection state
export const useBulkSelection = <T>(items: T[], getItemId: (item: T) => string) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = items.filter(item => selectedIds.has(getItemId(item)));

  const toggleSelection = useCallback((item: T) => {
    const itemId = getItemId(item);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, [getItemId]);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(getItemId));
    setSelectedIds(allIds);
  }, [items, getItemId]);

  const selectNone = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((item: T) => {
    return selectedIds.has(getItemId(item));
  }, [selectedIds, getItemId]);

  const isAllSelected = selectedIds.size === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isPartiallySelected,
    toggleSelection,
    selectAll,
    selectNone,
    isSelected
  };
};
