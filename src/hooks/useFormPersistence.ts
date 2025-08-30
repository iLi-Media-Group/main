import { useState, useEffect, useCallback } from 'react';

interface FormPersistenceOptions {
  storageKey: string;
  excludeFields?: string[];
  onLoad?: (data: any) => void;
  onSave?: (data: any) => void;
}

export function useFormPersistence<T extends Record<string, any>>(
  initialState: T,
  options: FormPersistenceOptions
) {
  const { storageKey, excludeFields = [], onLoad, onSave } = options;

  // Load saved data on mount
  const loadSavedData = useCallback((): T => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        onLoad?.(parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
    return initialState;
  }, [storageKey, initialState, onLoad]);

  const [formData, setFormData] = useState<T>(loadSavedData);

  // Save data to localStorage whenever formData changes
  const saveToStorage = useCallback((data: T) => {
    try {
      // Filter out File objects and other non-serializable data
      const serializableData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
          if (excludeFields.includes(key)) return false;
          if (value instanceof File) return false;
          if (value instanceof Blob) return false;
          if (typeof value === 'function') return false;
          return true;
        })
      );
      
      localStorage.setItem(storageKey, JSON.stringify(serializableData));
      onSave?.(serializableData);
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  }, [storageKey, excludeFields, onSave]);

  useEffect(() => {
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    clearSavedData();
  }, [initialState, clearSavedData]);

  return {
    formData,
    updateFormData,
    clearSavedData,
    resetForm,
    loadSavedData
  };
} 