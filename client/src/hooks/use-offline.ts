import { useState, useEffect, useCallback } from 'react';

interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
  connectionType: string | null;
}

export const useOffline = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    lastOnline: null,
    lastOffline: null,
    connectionType: null
  });

  const updateStatus = useCallback((isOnline: boolean) => {
    const now = new Date();
    
    setStatus(prev => ({
      isOnline,
      isOffline: !isOnline,
      lastOnline: isOnline ? now : prev.lastOnline,
      lastOffline: !isOnline ? now : prev.lastOffline,
      connectionType: (navigator as any).connection?.effectiveType || null
    }));
  }, []);

  useEffect(() => {
    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => {
        setStatus(prev => ({
          ...prev,
          connectionType: connection.effectiveType
        }));
      };

      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateStatus]);

  return status;
};

// Offline queue for failed requests
interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: Date;
  retries: number;
}

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedRequest[]>([]);
  const { isOnline } = useOffline();

  const addToQueue = useCallback((request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>) => {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      retries: 0
    };

    setQueue(prev => [...prev, queuedRequest]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(req => req.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0) return;

    const requestsToProcess = [...queue];
    const successfulRequests: string[] = [];
    const failedRequests: QueuedRequest[] = [];

    for (const request of requestsToProcess) {
      try {
        const response = await fetch(request.url, request.options);
        
        if (response.ok) {
          successfulRequests.push(request.id);
        } else {
          failedRequests.push({
            ...request,
            retries: request.retries + 1
          });
        }
      } catch (error) {
        failedRequests.push({
          ...request,
          retries: request.retries + 1
        });
      }
    }

    // Remove successful requests
    setQueue(prev => prev.filter(req => !successfulRequests.includes(req.id)));

    // Update failed requests with new retry count
    if (failedRequests.length > 0) {
      setQueue(prev => {
        const updated = prev.map(req => {
          const failed = failedRequests.find(f => f.id === req.id);
          return failed || req;
        });
        return updated;
      });
    }
  }, [isOnline, queue]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    processQueue,
    queueLength: queue.length
  };
};

// Offline storage for critical data
export const useOfflineStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  const clearStoredValue = useCallback(() => {
    try {
      setValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [value, setStoredValue, clearStoredValue] as const;
};
