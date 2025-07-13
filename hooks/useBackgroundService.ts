import { useEffect, useRef } from 'react';
import BackgroundTimer from 'react-native-background-timer';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timer, TimerStatus } from '../contexts/TimerContext';
import { TIMER_STATE_KEY } from '../constant';
import notifee, { 
  AndroidImportance, 
  AndroidStyle, 
  TriggerType,
  TimestampTrigger 
} from '@notifee/react-native';

interface BackgroundTimerState {
    timers: Timer[];
    lastUpdate: number;
}

export const useBackgroundService = () => {
    const appStateRef = useRef(AppState.currentState);
    const backgroundIntervalRef = useRef<number | null>(null);
    const scheduledNotificationsRef = useRef<Set<string>>(new Set());

    const saveTimerState = async (timers: Timer[]) => {
        try {
            const state: BackgroundTimerState = {
                timers,
                lastUpdate: Date.now(),
            };
            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
            console.log(`Saved ${timers.length} timers to background storage`);
        } catch (error) {
            console.error('Error saving timer state:', error);
        }
    };

    const clearCompletedTimers = async () => {
        try {
            const data = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (data) {
                const state: BackgroundTimerState = JSON.parse(data);
                const activeTimers = state.timers.filter(timer => timer.status !== 'completed');
                
                if (activeTimers.length !== state.timers.length) {
                    const newState: BackgroundTimerState = {
                        timers: activeTimers,
                        lastUpdate: Date.now(),
                    };
                    await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(newState));
                    console.log(`Cleared ${state.timers.length - activeTimers.length} completed timers from background storage`);
                }
            }
        } catch (error) {
            console.error('Error clearing completed timers from background storage:', error);
        }
    };

    const loadTimerState = async (): Promise<Timer[]> => {
        try {
            const data = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (data) {
                const state: BackgroundTimerState = JSON.parse(data);
                // Check if the state is recent (within last 5 minutes)
                if (Date.now() - state.lastUpdate < 5 * 60 * 1000) {
                    // Check if history was cleared after any completed timers
                    const clearTimestampData = await AsyncStorage.getItem('history_clear_timestamp');
                    const clearTimestamp = clearTimestampData ? parseInt(clearTimestampData, 10) : 0;
                    
                    // Filter out completed timers that were completed before the history was cleared
                    const filteredTimers = state.timers.filter(timer => {
                        if (timer.status === 'completed') {
                            // For completed timers, check if they were completed after the last clear
                            // We need to estimate when they were completed based on the lastUpdate
                            // Since we don't store completion time in timer state, we'll be conservative
                            // and only include completed timers if the state was updated after the clear
                            return state.lastUpdate > clearTimestamp;
                        }
                        return true; // Keep all non-completed timers
                    });
                    
                    return filteredTimers;
                }
            }
        } catch (error) {
            console.error('Error loading timer state:', error);
        }
        return [];
    };

    // Function to schedule notifications from background service
    const scheduleBackgroundNotification = async (timerName: string, timerId: string) => {
        try {
            // Check if notification was already scheduled for this timer
            const notificationId = `${timerId}-complete`;
            if (scheduledNotificationsRef.current.has(notificationId)) {
                console.log('Notification already scheduled for timer:', timerName);
                return;
            }

            console.log('Scheduling background notification for timer:', timerName);
            
            // Create trigger for immediate notification
            const trigger: TimestampTrigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: Date.now() + 1000, // 1 second from now
            };

            // Create notification
            await notifee.createTriggerNotification(
                {
                    title: 'Timer Complete',
                    body: `${timerName} is complete!`,
                    id: notificationId,
                    android: {
                        channelId: 'timer-channel',
                        importance: AndroidImportance.HIGH,
                        sound: 'default',
                        vibrationPattern: [300, 500],
                        largeIcon: 'ic_launcher',
                        smallIcon: 'ic_launcher',
                        color: '#4CAF50',
                        pressAction: {
                            id: 'default',
                        },
                        style: {
                            type: AndroidStyle.BIGTEXT,
                            text: `${timerName} is complete!`,
                        },
                    },
                    ios: {
                        sound: 'default',
                        critical: true,
                        categoryId: 'timer',
                    },
                },
                trigger,
            );
            
            // Mark notification as scheduled
            scheduledNotificationsRef.current.add(notificationId);
            console.log('Background notification scheduled successfully for timer:', timerName);
        } catch (error) {
            console.error('Error scheduling background notification:', error);
        }
    };

    const startBackgroundService = (timers: Timer[], onTick: (timerId: string) => void) => {
        if (backgroundIntervalRef.current) {
            BackgroundTimer.clearInterval(backgroundIntervalRef.current);
        }

        const runningTimers = timers.filter(t => t.status === 'running');
        if (runningTimers.length === 0) {
            console.log('No running timers to start background service');
            return;
        }

        console.log('Starting background timer service with', runningTimers.length, 'running timers');

        // Store initial timer state
        let currentTimers = [...timers];

        backgroundIntervalRef.current = BackgroundTimer.setInterval(() => {
            // Update timers based on the tick
            currentTimers = currentTimers.map(timer => {
                if (timer.status === 'running' && timer.remaining > 0) {
                    const newRemaining = Math.max(0, timer.remaining - 1);
                    console.log(`Background tick for timer: ${timer.name} (${timer.remaining}s -> ${newRemaining}s)`);
                    
                    if (newRemaining <= 0) {
                        // Timer completed - schedule notification immediately
                        console.log(`Timer completed in background: ${timer.name} (ID: ${timer.id})`);
                        
                        // Schedule completion notification
                        scheduleBackgroundNotification(timer.name, timer.id);
                        
                        return { ...timer, remaining: 0, status: 'completed' as TimerStatus };
                    } else {
                        // Timer still running
                        return { ...timer, remaining: newRemaining };
                    }
                }
                return timer;
            });

            // Save updated state to background storage
            saveTimerState(currentTimers);

            // Call onTick for each running timer
            currentTimers.forEach(timer => {
                if (timer.status === 'running' && timer.remaining > 0) {
                    onTick(timer.id);
                }
            });
        }, 1000);
    };

    const stopBackgroundService = () => {
        if (backgroundIntervalRef.current) {
            BackgroundTimer.clearInterval(backgroundIntervalRef.current);
            backgroundIntervalRef.current = null;
            console.log('Stopped background timer service');
        }
        // Don't clear scheduled notifications tracking here - let it persist
        // to prevent duplicate notifications when app comes to foreground
    };

    const handleAppStateChange = (nextAppState: AppStateStatus, timers: Timer[], onTick: (timerId: string) => void) => {
        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            // App has come to the foreground
            console.log('App has come to the foreground');
            stopBackgroundService();
        } else if (nextAppState.match(/inactive|background/)) {
            // App has gone to the background
            console.log('App has gone to the background');
            const runningTimers = timers.filter(t => t.status === 'running');
            if (runningTimers.length > 0) {
                startBackgroundService(timers, onTick);
            }
        }
        appStateRef.current = nextAppState;
    };

    const clearBackgroundTimerState = async () => {
        try {
            await AsyncStorage.removeItem(TIMER_STATE_KEY);
            console.log('Cleared background timer state');
        } catch (error) {
            console.error('Error clearing background timer state:', error);
        }
    };

    useEffect(() => {
        return () => {
            stopBackgroundService();
        };
    }, []);

    return {
        startBackgroundService,
        stopBackgroundService,
        handleAppStateChange,
        saveTimerState,
        loadTimerState,
        clearCompletedTimers,
        clearBackgroundTimerState,
    };
}; 