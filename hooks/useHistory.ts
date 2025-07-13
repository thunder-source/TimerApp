import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_KEY } from '../constant';

export interface HistoryItem {
    id: string;
    name: string;
    duration: number; // in seconds
    completedAt: number;
}



export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            const data = await AsyncStorage.getItem(HISTORY_KEY);
            if (data) {
                const parsedHistory = JSON.parse(data);
                // Handle backward compatibility for history items without duration
                const compatibleHistory = parsedHistory.map((item: any) => ({
                    ...item,
                    duration: item.duration || 0, // Default to 0 if duration is missing
                }));
                setHistory(compatibleHistory);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToHistory = useCallback(async (timer: { id: string; name: string; duration: number }) => {
        try {
            const newHistoryItem: HistoryItem = {
                id: timer.id,
                name: timer.name,
                duration: timer.duration,
                completedAt: Date.now(),
            };

            const updatedHistory = [newHistoryItem, ...history];
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
            setHistory(updatedHistory);
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }, [history]);

    const clearHistory = useCallback(async () => {
        console.log('clearHistory function called');
        try {
            console.log('Removing history from AsyncStorage...');
            await AsyncStorage.removeItem(HISTORY_KEY);
            console.log('History removed from AsyncStorage, clearing state...');
            setHistory([]);
            console.log('History state cleared');
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }, []);

    const cleanupOldHistory = useCallback(async (daysToKeep: number = 30) => {
        try {
            const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
            const filteredHistory = history.filter(item => item.completedAt > cutoffDate);
            
            if (filteredHistory.length !== history.length) {
                await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
                setHistory(filteredHistory);
            }
        } catch (error) {
            console.error('Error cleaning up history:', error);
        }
    }, [history]);

    return {
        history,
        isLoading,
        addToHistory,
        clearHistory,
        loadHistory,
        cleanupOldHistory,
    };
}; 