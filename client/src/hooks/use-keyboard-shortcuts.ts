import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: HTMLElement | Document;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, target = document } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    target.addEventListener('keydown', handleKeyDown);

    return () => {
      target.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, target]);

  return shortcuts.map(s => s.description);
};

// Common admin shortcuts
export const createAdminShortcuts = (actions: {
  onSave?: () => void;
  onNew?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onHelp?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: actions.onSave,
      description: 'Save (Ctrl+S)'
    });
  }

  if (actions.onNew) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: actions.onNew,
      description: 'New (Ctrl+N)'
    });
  }

  if (actions.onDelete) {
    shortcuts.push({
      key: 'Delete',
      action: actions.onDelete,
      description: 'Delete selected items (Delete)'
    });
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: 'f',
      ctrlKey: true,
      action: actions.onSearch,
      description: 'Search (Ctrl+F)'
    });
  }

  if (actions.onRefresh) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      action: actions.onRefresh,
      description: 'Refresh (Ctrl+R)'
    });
  }

  if (actions.onExport) {
    shortcuts.push({
      key: 'e',
      ctrlKey: true,
      action: actions.onExport,
      description: 'Export (Ctrl+E)'
    });
  }

  if (actions.onPrint) {
    shortcuts.push({
      key: 'p',
      ctrlKey: true,
      action: actions.onPrint,
      description: 'Print (Ctrl+P)'
    });
  }

  if (actions.onHelp) {
    shortcuts.push({
      key: 'F1',
      action: actions.onHelp,
      description: 'Help (F1)'
    });
  }

  return shortcuts;
};

// Shortcut help component
export const ShortcutHelp: React.FC<{ shortcuts: string[] }> = ({ shortcuts }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-2">Keyboard Shortcuts</h3>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="text-sm text-gray-600">
            {shortcut}
          </div>
        ))}
      </div>
    </div>
  );
};
