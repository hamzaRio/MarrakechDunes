import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: '⚠️',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      iconBg: 'bg-red-100'
    },
    warning: {
      icon: '⚠️',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      iconBg: 'bg-yellow-100'
    },
    info: {
      icon: 'ℹ️',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-100'
    }
  };

  const styles = variantStyles[variant];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-full ${styles.iconBg}`}>
              <span className="text-xl">{styles.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>

          {/* Message */}
          <p className="text-gray-600 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmButton}`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for confirmation dialogs
export const useConfirmation = () => {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [isLoading, setIsLoading] = React.useState(false);

  const confirm = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options: {
      variant?: 'danger' | 'warning' | 'info';
      confirmText?: string;
      cancelText?: string;
    } = {}
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onConfirm();
          setDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Confirmation action failed:', error);
        } finally {
          setIsLoading(false);
        }
      },
      ...options
    });
  }, []);

  const close = React.useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
    setIsLoading(false);
  }, []);

  const ConfirmationComponent = React.useCallback(() => (
    <ConfirmationDialog
      isOpen={dialog.isOpen}
      onClose={close}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      variant={dialog.variant}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      isLoading={isLoading}
    />
  ), [dialog, close, isLoading]);

  return {
    confirm,
    close,
    ConfirmationComponent
  };
};

// Quick confirmation functions
export const confirmDelete = (
  confirmHook: ReturnType<typeof useConfirmation>,
  itemName: string,
  onDelete: () => void | Promise<void>
) => {
  confirmHook.confirm(
    'Delete Item',
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    onDelete,
    {
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }
  );
};

export const confirmBulkDelete = (
  confirmHook: ReturnType<typeof useConfirmation>,
  count: number,
  onDelete: () => void | Promise<void>
) => {
  confirmHook.confirm(
    'Delete Multiple Items',
    `Are you sure you want to delete ${count} items? This action cannot be undone.`,
    onDelete,
    {
      variant: 'danger',
      confirmText: `Delete ${count} Items`,
      cancelText: 'Cancel'
    }
  );
};

export const confirmSave = (
  confirmHook: ReturnType<typeof useConfirmation>,
  onSave: () => void | Promise<void>
) => {
  confirmHook.confirm(
    'Save Changes',
    'Do you want to save your changes?',
    onSave,
    {
      variant: 'info',
      confirmText: 'Save',
      cancelText: 'Cancel'
    }
  );
};

export const confirmDiscard = (
  confirmHook: ReturnType<typeof useConfirmation>,
  onDiscard: () => void | Promise<void>
) => {
  confirmHook.confirm(
    'Discard Changes',
    'You have unsaved changes. Are you sure you want to discard them?',
    onDiscard,
    {
      variant: 'warning',
      confirmText: 'Discard',
      cancelText: 'Keep Editing'
    }
  );
};
