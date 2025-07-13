import { useEffect, useRef } from 'react';
import BackgroundTimer from 'react-native-background-timer';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timer, TimerStatus } from '../contexts/TimerContext';
import { TIMER_STATE_KEY } from '../constant';

interface BackgroundTimerState {
    timers: Timer[];
    lastUpdate: number;
}

export const useBackgroundService = () => {
    const appStateRef = useRef(AppState.currentState);
    const backgroundIntervalRef = useRef<number | null>(null);

    const saveTimerState = async (timers: Timer[]) => {
        try {
            const state: BackgroundTimerState = {
                timers,
                lastUpdate: Date.now(),
            };
            await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving timer state:', error);
        }
    };

    const loadTimerState = async (): Promise<Timer[]> => {
        try {
            const data = await AsyncStorage.getItem(TIMER_STATE_KEY);
            if (data) {
                const state: BackgroundTimerState = JSON.parse(data);
                // Check if the state is recent (within last 5 minutes)
                if (Date.now() - state.lastUpdate < 5 * 60 * 1000) {
                    return state.timers;
                }
            }
        } catch (error) {
            console.error('Error loading timer state:', error);
        }
        return [];
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
                        // Timer completed
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
    };
}; 