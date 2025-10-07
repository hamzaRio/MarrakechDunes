import React from 'react';
import { useOffline, useOfflineQueue } from '../hooks/use-offline';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  className?: string;
  showQueueCount?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  className = '',
  showQueueCount = true
}) => {
  const { isOnline, isOffline, lastOffline } = useOffline();
  const { queueLength } = useOfflineQueue();

  if (isOnline) {
    return null;
  }

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0'
  };

  return (
    <div className={`fixed ${positionClasses[position]} left-0 right-0 z-50 ${className}`}>
      <div className="bg-red-600 text-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">You're offline</span>
            {lastOffline && (
              <span className="text-sm opacity-75">
                Since {lastOffline.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {showQueueCount && queueLength > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {queueLength} action{queueLength !== 1 ? 's' : ''} pending
              </span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Connection status badge
export const ConnectionStatusBadge: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className = '', showDetails = false }) => {
  const { isOnline, connectionType } = useOffline();

  const getStatusColor = () => {
    if (isOnline) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (isOnline) {
      return connectionType ? `Online (${connectionType})` : 'Online';
    }
    return 'Offline';
  };

  const getStatusIcon = () => {
    return isOnline ? '🟢' : '🔴';
  };

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()} ${className}`}>
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  );
};

// Offline warning for forms
export const OfflineFormWarning: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { isOffline } = useOffline();

  if (!isOffline) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 z-10">
        <div className="flex items-center space-x-2 text-yellow-800">
          <span>⚠️</span>
          <span className="font-medium">You're offline</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Your changes will be saved locally and synced when you're back online.
        </p>
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

// Offline data sync component
export const OfflineSyncStatus: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { isOnline } = useOffline();
  const { queueLength, processQueue } = useOfflineQueue();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!isOnline || queueLength === 0) return;

    setIsSyncing(true);
    try {
      await processQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && queueLength === 0) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-blue-800">
            {isOnline ? 'Syncing data...' : 'Offline mode'}
          </span>
          {queueLength > 0 && (
            <span className="text-xs text-blue-600">
              {queueLength} pending
            </span>
          )}
        </div>
        
        {isOnline && queueLength > 0 && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};

// Offline-capable fetch wrapper
export const useOfflineFetch = () => {
  const { isOnline } = useOffline();
  const { addToQueue } = useOfflineQueue();

  const offlineFetch = React.useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (isOnline) {
      try {
        return await fetch(url, options);
      } catch (error) {
        // If request fails, add to queue for retry
        addToQueue({
          url,
          options
        });
        throw error;
      }
    } else {
      // Add to queue when offline
      addToQueue({
        url,
        options
      });
      
      // Return a mock response for offline mode
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Request queued for when connection is restored' 
        }),
        { 
          status: 202, 
          statusText: 'Accepted',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }, [isOnline, addToQueue]);

  return { offlineFetch, isOnline };
};
