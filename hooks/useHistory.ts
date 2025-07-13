import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_CLEAR_TIMESTAMP_KEY, HISTORY_KEY } from '../constant';
import { useBackgroundService } from './useBackgroundService';

export interface HistoryItem {
    id: string;
    name: string;
    duration: number; // in seconds
    category: string;
    completedAt: number;
}



export const useHistory = () => {
    const { clearBackgroundTimerState } = useBackgroundService();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastClearTimestamp, setLastClearTimestamp] = useState<number>(0);
    
    console.log('history',history)
    
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            // Load the last clear timestamp
            const clearTimestampData = await AsyncStorage.getItem(HISTORY_CLEAR_TIMESTAMP_KEY);
            const clearTimestamp = clearTimestampData ? parseInt(clearTimestampData, 10) : 0;
            setLastClearTimestamp(clearTimestamp);
            
            const data = await AsyncStorage.getItem(HISTORY_KEY);
            if (data) {
                const parsedHistory = JSON.parse(data);
                // Handle backward compatibility for history items without duration or category
                const compatibleHistory = parsedHistory.map((item: any) => ({
                    ...item,
                    duration: item.duration || 0, // Default to 0 if duration is missing
                    category: item.category || 'Uncategorized', // Default to 'Uncategorized' if category is missing
                }));
                
                // Filter out history items that were completed before the last clear
                const filteredHistory = compatibleHistory.filter((item: HistoryItem) => 
                    item.completedAt > clearTimestamp
                );
                
                setHistory(filteredHistory);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToHistory = useCallback(async (timer: { id: string; name: string; duration: number; category: string }) => {
        try {
            console.log(`Adding timer to history: ${timer.name} (ID: ${timer.id})`);
            
            const newHistoryItem: HistoryItem = {
                id: timer.id,
                name: timer.name,
                duration: timer.duration,
                category: timer.category,
                completedAt: Date.now(),
            };

            // Check if this timer was completed before the last clear
            if (newHistoryItem.completedAt <= lastClearTimestamp) {
                console.log(`Skipping history addition for timer ${timer.name} - completed before last clear`);
                return;
            }

            setHistory(prevHistory => {
                // Check if timer with this ID already exists
                const existingTimerIndex = prevHistory.findIndex(item => item.id === timer.id);
                
                let updatedHistory;
                if (existingTimerIndex !== -1) {
                    // Replace existing timer with the new one
                    updatedHistory = [...prevHistory];
                    updatedHistory[existingTimerIndex] = newHistoryItem;
                    console.log(`Updated existing timer in history: ${timer.name} (ID: ${timer.id})`);
                } else {
                    // Add new timer to the beginning
                    updatedHistory = [newHistoryItem, ...prevHistory];
                    console.log(`Successfully added new timer to history: ${timer.name} (ID: ${timer.id})`);
                }
                
                AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
                return updatedHistory;
            });
        } catch (error) {
            console.error('Error adding to history:', error);
        }
    }, [lastClearTimestamp]);

    const clearHistory = useCallback(async () => {
        console.log('clearHistory function called');
        try {
            console.log('Removing history from AsyncStorage...');
            await AsyncStorage.removeItem(HISTORY_KEY);
            
            // Set the clear timestamp to current time
            const currentTimestamp = Date.now();
            await AsyncStorage.setItem(HISTORY_CLEAR_TIMESTAMP_KEY, currentTimestamp.toString());
            setLastClearTimestamp(currentTimestamp);
            
            // Also clear background timer state to prevent completed timers from reappearing
            await clearBackgroundTimerState();
            
            console.log('History removed from AsyncStorage, clearing state...');
            setHistory([]);
            console.log('History state cleared');
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }, [clearBackgroundTimerState]);

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