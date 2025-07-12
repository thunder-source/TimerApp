import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
    id: string;
    name: string;
    completedAt: number;
}

const HISTORY_KEY = 'timer-history';

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await AsyncStorage.getItem(HISTORY_KEY);
            if (data) {
                setHistory(JSON.parse(data));
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const addToHistory = async (timer: { id: string; name: string }) => {
        try {
            const newHistoryItem: HistoryItem = {
                id: timer.id,
                name: timer.name,
                completedAt: Date.now(),
            };

            const updatedHistory = [newHistoryItem, ...history];
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
            setHistory(updatedHistory);
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    };

    const clearHistory = async () => {
        try {
            await AsyncStorage.removeItem(HISTORY_KEY);
            setHistory([]);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    const cleanupOldHistory = async (daysToKeep: number = 30) => {
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
    };

    return {
        history,
        addToHistory,
        clearHistory,
        loadHistory,
        cleanupOldHistory,
    };
}; 