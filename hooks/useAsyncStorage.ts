import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T = any>(key: string) {
  const getItem = useCallback(async (): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, [key]);

  const setItem = useCallback(async (value: T) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }, [key]);

  const removeItem = useCallback(async () => {
    await AsyncStorage.removeItem(key);
  }, [key]);

  return { getItem, setItem, removeItem };
} 