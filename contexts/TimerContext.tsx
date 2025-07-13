import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../hooks/useNotifications';
import { useHistory } from '../hooks/useHistory';
import { useBackgroundService } from '../hooks/useBackgroundService';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface Timer {
    id: string;
    name: string;
    duration: number; // in seconds
    remaining: number; // in seconds
    category: string;
    status: TimerStatus;
    halfwayAlert?: boolean;
}

export type TimerAction =
    | { type: 'ADD_TIMER'; timer: Timer }
    | { type: 'START_TIMER'; id: string }
    | { type: 'PAUSE_TIMER'; id: string }
    | { type: 'RESET_TIMER'; id: string }
    | { type: 'TICK'; id: string }
    | { type: 'COMPLETE_TIMER'; id: string }
    | { type: 'LOAD_TIMERS'; timers: Timer[] };

interface TimerContextType {
    timers: Timer[];
    dispatch: React.Dispatch<TimerAction>;
    completionModal: {
        visible: boolean;
        timerName: string;
    };
    showCompletionModal: (timerName: string) => void;
    hideCompletionModal: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

function timerReducer(state: Timer[], action: TimerAction): Timer[] {
    switch (action.type) {
        case 'ADD_TIMER':
            return [...state, action.timer];
        case 'START_TIMER':
            return state.map((t) => {
                if (t.id === action.id && t.status !== 'completed') {
                    console.log(`Starting timer: ${t.name} (${t.remaining}s remaining)`);
                    return { ...t, status: 'running' };
                }
                return t;
            });
        case 'PAUSE_TIMER':
            return state.map((t) =>
                t.id === action.id && t.status === 'running'
                    ? { ...t, status: 'paused' }
                    : t
            );
        case 'RESET_TIMER':
            return state.map((t) =>
                t.id === action.id
                    ? { ...t, remaining: t.duration, status: 'idle' }
                    : t
            );
        case 'TICK':
            return state.map((t) => {
                if (t.id === action.id && t.status === 'running') {
                    const newRemaining = Math.max(0, t.remaining - 1);
                    console.log(`Timer ${t.name} ticked: ${t.remaining} -> ${newRemaining}`);
                    if (newRemaining <= 0) {
                        console.log(`Timer ${t.name} completed!`);
                        // Return the completed timer, but we'll handle completion logic in useEffect
                        return { ...t, remaining: 0, status: 'completed' };
                    }
                    return { ...t, remaining: newRemaining };
                }
                return t;
            });
        case 'COMPLETE_TIMER':
            return state.map((t) =>
                t.id === action.id ? { ...t, status: 'completed', remaining: 0 } : t
            );
        case 'LOAD_TIMERS':
            return action.timers;
        default:
            return state;
    }
}

interface TimerProviderProps {
    children: ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
    const { scheduleNotification, cancelNotification } = useNotifications();
    const { addToHistory } = useHistory();
    const [timers, dispatch] = useReducer(timerReducer, []);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef(AppState.currentState);
    const completedTimersRef = useRef<Set<string>>(new Set());
    const shownCompletionModalsRef = useRef<Set<string>>(new Set());
    const timersRef = useRef<Timer[]>([]);
    const saveTimerStateRef = useRef<((timers: Timer[]) => Promise<void>) | null>(null);

    const {
        startBackgroundService,
        stopBackgroundService,
        handleAppStateChange,
        saveTimerState,
        loadTimerState,
    } = useBackgroundService();

    // Store function reference to avoid dependency issues
    saveTimerStateRef.current = saveTimerState;



    // Completion modal state
    const [completionModal, setCompletionModal] = useState({
        visible: false,
        timerName: '',
    });

    const showCompletionModal = useCallback((timerName: string, timerId?: string) => {
        // If timerId is provided, check if we've already shown the modal for this timer
        if (timerId && shownCompletionModalsRef.current.has(timerId)) {
            console.log(`Completion modal already shown for timer: ${timerName}`);
            return;
        }

        console.log(`Showing completion modal for timer: ${timerName}`);
        setCompletionModal({ visible: true, timerName });

        // Track that we've shown the modal for this timer
        if (timerId) {
            shownCompletionModalsRef.current.add(timerId);
        }
    }, []);

    const hideCompletionModal = useCallback(() => {
        console.log('Hiding completion modal and clearing data');
        setCompletionModal({ visible: false, timerName: '' });

        // Clear the tracking set to prevent memory leaks
        // We'll clear it periodically or when the app is closed
    }, []);

    // Handle timer tick
    const handleTimerTick = useCallback((timerId: string) => {
        dispatch({ type: 'TICK', id: timerId });
    }, [dispatch]);

    // Store function references in refs to avoid dependency issues
    const startBackgroundServiceRef = useRef(startBackgroundService);
    const stopBackgroundServiceRef = useRef(stopBackgroundService);
    const handleTimerTickRef = useRef(handleTimerTick);
    const loadTimerStateRef = useRef(loadTimerState);
    const scheduleNotificationRef = useRef(scheduleNotification);
    const addToHistoryRef = useRef(addToHistory);
    const showCompletionModalRef = useRef(showCompletionModal);
    const hideCompletionModalRef = useRef(hideCompletionModal);

    startBackgroundServiceRef.current = startBackgroundService;
    stopBackgroundServiceRef.current = stopBackgroundService;
    handleTimerTickRef.current = handleTimerTick;
    loadTimerStateRef.current = loadTimerState;
    scheduleNotificationRef.current = scheduleNotification;
    addToHistoryRef.current = addToHistory;
    showCompletionModalRef.current = showCompletionModal;
    hideCompletionModalRef.current = hideCompletionModal;



    // Handle app state changes - memoize to prevent recreation
    const handleAppStateChangeWrapper = useCallback((nextAppState: AppStateStatus) => {
        console.log('App state changed from', appStateRef.current, 'to', nextAppState);

        if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
            // App has come to the foreground
            console.log('App has come to the foreground - stopping background service');
            stopBackgroundServiceRef.current();

            // Sync timer state from background storage
            const syncTimerState = async () => {
                try {
                    const backgroundTimers = await loadTimerStateRef.current();
                    if (backgroundTimers.length > 0) {
                        console.log('Syncing timer state from background:', backgroundTimers.length, 'timers');

                        // Check for newly completed timers
                        const currentTimers = timersRef.current;
                        const newlyCompletedTimers = backgroundTimers.filter(bgTimer => {
                            const currentTimer = currentTimers.find(t => t.id === bgTimer.id);
                            return bgTimer.status === 'completed' &&
                                (!currentTimer || currentTimer.status !== 'completed');
                        });

                        // Handle completed timers
                        newlyCompletedTimers.forEach(timer => {
                            console.log(`Timer completed in background: ${timer.name}`);
                            // Schedule completion notification
                            const notificationTime = new Date(Date.now() + 1000);
                            scheduleNotificationRef.current(
                                'Timer Complete',
                                `${timer.name} is complete!`,
                                notificationTime,
                                `${timer.id}-complete`
                            );
                            // Add to history
                            addToHistoryRef.current({ id: timer.id, name: timer.name, duration: timer.duration });
                            // Show completion modal
                            showCompletionModalRef.current(timer.name, timer.id);
                        });

                        // Update timers with background state
                        dispatch({ type: 'LOAD_TIMERS', timers: backgroundTimers });
                    }
                } catch (error) {
                    console.error('Error syncing timer state:', error);
                }
            };
            syncTimerState();

            // Clear any existing foreground interval to restart it
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        } else if (nextAppState.match(/inactive|background/)) {
            // App has gone to the background
            console.log('App has gone to the background - starting background service');
            // Stop foreground timer
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            // Start background service
            const currentTimers = timersRef.current;
            const runningTimers = currentTimers.filter(t => t.status === 'running');
            if (runningTimers.length > 0) {
                startBackgroundServiceRef.current(currentTimers, handleTimerTickRef.current);
            }
        }

        appStateRef.current = nextAppState;
    }, []); // No dependencies since we're using refs

    // Load timers from AsyncStorage on mount
    useEffect(() => {
        const loadTimers = async () => {
            try {
                const savedData = await AsyncStorage.getItem('timers');
                const saved = savedData ? JSON.parse(savedData) : null;
                if (saved) {
                    console.log('TimerContext: Loaded', saved.length, 'timers from AsyncStorage');
                    dispatch({ type: 'LOAD_TIMERS', timers: saved });
                } else {
                    // Try to load from background state
                    const backgroundTimers = await loadTimerState();
                    if (backgroundTimers.length > 0) {
                        console.log('TimerContext: Loaded', backgroundTimers.length, 'timers from background state');
                        dispatch({ type: 'LOAD_TIMERS', timers: backgroundTimers });
                    }
                }
            } catch (error) {
                console.error('TimerContext: Error loading timers:', error);
            }
        };

        loadTimers();
    }, []); // Run only once on mount

    // Save timers to AsyncStorage on change and update ref
    useEffect(() => {
        timersRef.current = timers;
        AsyncStorage.setItem('timers', JSON.stringify(timers));
        if (saveTimerStateRef.current) {
            saveTimerStateRef.current(timers);
        }
    }, [timers]); // Only depend on timers

    // App state change listener
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChangeWrapper);

        return () => {
            subscription?.remove();
            stopBackgroundServiceRef.current();
        };
    }, [handleAppStateChangeWrapper]);

    // Handle timer completion when status changes to 'completed'
    useEffect(() => {
        const newlyCompletedTimers = timers.filter((timer) =>
            timer.status === 'completed' &&
            timer.remaining === 0 &&
            !completedTimersRef.current.has(timer.id)
        );

        newlyCompletedTimers.forEach((timer) => {
            console.log(`Handling completion for timer: ${timer.name}`);

            // Schedule completion notification
            const notificationTime = new Date(Date.now() + 2000);
            scheduleNotification(
                'Timer Complete',
                `${timer.name} is complete!`,
                notificationTime,
                `${timer.id}-complete`
            );

            // Add to history
            addToHistory({ id: timer.id, name: timer.name, duration: timer.duration });

            // Show completion modal
            showCompletionModal(timer.name, timer.id);

            // Mark as processed
            completedTimersRef.current.add(timer.id);
        });
    }, [timers, scheduleNotification, addToHistory, showCompletionModal]);

    // Foreground timer ticking (for immediate UI updates)
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        const runningTimers = timers.filter((t) => t.status === 'running');
        if (runningTimers.length > 0 && appStateRef.current === 'active') {
            console.log('Starting foreground timer with', runningTimers.length, 'running timers');
            intervalRef.current = setInterval(() => {
                // Get current running timers to avoid stale closure
                const currentRunningTimers = timersRef.current.filter((t) => t.status === 'running');
                currentRunningTimers.forEach((t) => {
                    // Tick the timer
                    handleTimerTick(t.id);

                    // Halfway alert
                    if (
                        t.halfwayAlert &&
                        t.remaining === Math.floor(t.duration / 2)
                    ) {
                        scheduleNotification(
                            'Halfway Alert',
                            `${t.name} is halfway done!`,
                            new Date(Date.now()),
                            `${t.id}-halfway`
                        );
                    }
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [timers, handleTimerTick, scheduleNotification]);

    return (
        <TimerContext.Provider value={{
            timers,
            dispatch,
            completionModal,
            showCompletionModal,
            hideCompletionModal
        }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimers() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimers must be used within a TimerProvider');
    }
    return context;
} 