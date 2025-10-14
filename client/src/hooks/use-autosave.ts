import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave?: (data: any) => Promise<void> | void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  storageKey?: string;
}

export const useAutoSave = <T>(
  data: T,
  options: UseAutoSaveOptions = {}
) => {
  const {
    delay = 2000,
    onSave,
    onError,
    enabled = true,
    storageKey
  } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>();
  const isSavingRef = useRef(false);

  // Save to localStorage if storageKey is provided
  const saveToStorage = useCallback((dataToSave: T) => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }, [storageKey]);

  // Load from localStorage if storageKey is provided
  const loadFromStorage = useCallback((): T | null => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : null;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return null;
      }
    }
    return null;
  }, [storageKey]);

  // Auto-save function
  const autoSave = useCallback(async (dataToSave: T) => {
    if (!enabled || isSavingRef.current) return;

    const dataString = JSON.stringify(dataToSave);
    if (dataString === lastSavedRef.current) return;

    isSavingRef.current = true;

    try {
      // Save to localStorage first
      saveToStorage(dataToSave);

      // Call custom save function if provided
      if (onSave) {
        await onSave(dataToSave);
      }

      lastSavedRef.current = dataString;
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, onSave, onError, saveToStorage]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      autoSave(data);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, autoSave, enabled]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return autoSave(data);
  }, [autoSave, data]);

  // Clear saved data
  const clearSaved = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    lastSavedRef.current = undefined;
  }, [storageKey]);

  return {
    saveNow,
    clearSaved,
    loadFromStorage,
    isSaving: isSavingRef.current
  };
};

// Form-specific auto-save hook
export const useFormAutoSave = <T extends Record<string, any>>(
  formData: T,
  options: UseAutoSaveOptions & {
    formId?: string;
    excludeFields?: (keyof T)[];
  } = {}
) => {
  const { formId, excludeFields = [], ...restOptions } = options;

  // Filter out excluded fields
  const filteredData = Object.fromEntries(
    Object.entries(formData).filter(([key]) => !excludeFields.includes(key as keyof T))
  ) as T;

  const storageKey = formId ? `autosave_${formId}` : undefined;

  return useAutoSave(filteredData, {
    ...restOptions,
    storageKey
  });
};
