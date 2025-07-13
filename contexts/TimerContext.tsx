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
    alertAt?: number; // seconds before end or absolute time in seconds
    alertTriggered?: boolean; // true if alert has been triggered
}

export type TimerAction =
    | { type: 'ADD_TIMER'; timer: Timer }
    | { type: 'START_TIMER'; id: string }
    | { type: 'PAUSE_TIMER'; id: string }
    | { type: 'RESET_TIMER'; id: string }
    | { type: 'TICK'; id: string }
    | { type: 'COMPLETE_TIMER'; id: string }
    | { type: 'COMPLETE_MULTIPLE_TIMERS'; timerIds: string[] }
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
    handleTimerReset: (timerId: string) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

function timerReducer(state: Timer[], action: TimerAction): Timer[] {
    switch (action.type) {
        case 'ADD_TIMER':
            return [...state, { ...action.timer, alertTriggered: false }];
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
                    ? { ...t, remaining: t.duration, status: 'idle', alertTriggered: false }
                    : t
            );
        case 'TICK':
            return state.map((t) => {
                if (t.id === action.id && t.status === 'running') {
                    const newRemaining = Math.max(0, t.remaining - 1);
                    let newAlertTriggered = t.alertTriggered;
                    // Check if alert should be triggered
                    if (
                        t.alertAt !== undefined &&
                        !t.alertTriggered &&
                        newRemaining === t.alertAt
                    ) {
                        console.log(`Alert condition met for timer ${t.name}: remaining=${newRemaining}, alertAt=${t.alertAt}`);
                        newAlertTriggered = true;
                    }
                    if (newRemaining <= 0) {
                        return { ...t, remaining: 0, status: 'completed', alertTriggered: newAlertTriggered };
                    }
                    return { ...t, remaining: newRemaining, alertTriggered: newAlertTriggered };
                }
                return t;
            });
        case 'COMPLETE_TIMER':
            return state.map((t) =>
                t.id === action.id ? { ...t, status: 'completed', remaining: 0 } : t
            );
        case 'COMPLETE_MULTIPLE_TIMERS':
            return state.map((t) =>
                action.timerIds.includes(t.id) ? { ...t, status: 'completed', remaining: 0 } : t
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
    const sentAlertsRef = useRef<Set<string>>(new Set());
    const timersRef = useRef<Timer[]>([]);
    const saveTimerStateRef = useRef<((timers: Timer[]) => Promise<void>) | null>(null);

    console.log("timers", timers)
    console.log("completedTimersRef", completedTimersRef)
    console.log("shownCompletionModalsRef", shownCompletionModalsRef)
    console.log("sentAlertsRef", sentAlertsRef)
    console.log("saveTimerStateRef", saveTimerStateRef)
    console.log("timersRef", timersRef)
    console.log("appStateRef", appStateRef)
    console.log("intervalRef", intervalRef)


    const {
        startBackgroundService,
        stopBackgroundService,
        handleAppStateChange,
        saveTimerState,
        loadTimerState,
        clearCompletedTimers,
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
        console.log('Hiding completion modal and clearing completed timers');
        setCompletionModal({ visible: false, timerName: '' });

        // Clear completed timers immediately when modal is closed
        const activeTimers = timers.filter(timer => timer.status !== 'completed');
        if (activeTimers.length !== timers.length) {
            console.log(`Clearing ${timers.length - activeTimers.length} completed timers from storage`);
            AsyncStorage.setItem('timers', JSON.stringify(activeTimers));
            dispatch({ type: 'LOAD_TIMERS', timers: activeTimers });

            // Also clear completed timers from background storage
            clearCompletedTimers();
        }

        // Clear the completed timers tracking set to prevent memory leaks
        completedTimersRef.current.clear();
        console.log('Cleared completed timers tracking set');
    }, [timers, dispatch, clearCompletedTimers]);

    // Handle timer tick
    const handleTimerTick = useCallback((timerId: string) => {
        dispatch({ type: 'TICK', id: timerId });
    }, [dispatch]);

    // Clear sent alerts when timer is reset
    const handleTimerReset = useCallback((timerId: string) => {
        sentAlertsRef.current.delete(timerId);
        dispatch({ type: 'RESET_TIMER', id: timerId });
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
                        console.log(`Processing ${newlyCompletedTimers.length} timers completed in background`);
                        newlyCompletedTimers.forEach(timer => {
                            console.log(`Timer completed in background: ${timer.name} (ID: ${timer.id})`);

                            // Add to history IMMEDIATELY when timer completes in background
                            // addToHistoryRef.current({ id: timer.id, name: timer.name, duration: timer.duration, category: timer.category });

                            // Schedule completion notification
                            const notificationTime = new Date(Date.now() + 1000);
                            scheduleNotificationRef.current(
                                'Timer Complete',
                                `${timer.name} is complete!`,
                                notificationTime,
                                `${timer.id}-complete`
                            );

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

        console.log(`Processing ${newlyCompletedTimers.length} newly completed timers:`, newlyCompletedTimers.map(t => `${t.name} (${t.id})`));

        // Process all completed timers immediately
        newlyCompletedTimers.forEach((timer) => {
            console.log(`Handling completion for timer: ${timer.name} (ID: ${timer.id})`);

            // Mark as processed FIRST to prevent duplicate processing
            completedTimersRef.current.add(timer.id);

            // Add to history IMMEDIATELY when timer completes
            addToHistory({ id: timer.id, name: timer.name, duration: timer.duration, category: timer.category });

            // Schedule completion notification
            const notificationTime = new Date(Date.now() + 2000);
            scheduleNotification(
                'Timer Complete',
                `${timer.name} is complete!`,
                notificationTime,
                `${timer.id}-complete`
            );

            // Show completion modal
            showCompletionModal(timer.name, timer.id);
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
                    console.log(`Timer ${t.name}: remaining=${t.remaining}, alertAt=${t.alertAt}, alertTriggered=${t.alertTriggered}`);

                    // Tick the timer first
                    handleTimerTick(t.id);

                    // Check for alert AFTER the tick (in the next render cycle)
                    // We'll handle this in a separate effect that watches for alertTriggered changes
                });
            }, 1000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [timers, handleTimerTick]);

    // Handle alert notifications when alertTriggered changes
    useEffect(() => {
        timers.forEach((timer) => {
            if (timer.alertTriggered && timer.alertAt !== undefined && !sentAlertsRef.current.has(timer.id)) {
                console.log(`Alert triggered for timer: ${timer.name} at ${timer.alertAt} seconds`);
                sentAlertsRef.current.add(timer.id);
                // Schedule notification for 1 second in the future to satisfy Notifee requirements
                const notificationTime = new Date(Date.now() + 1000);
                scheduleNotification(
                    'Timer Alert',
                    `${timer.name} has reached its alert time!`,
                    notificationTime,
                    `${timer.id}-alert`
                );
            }
        });
    }, [timers, scheduleNotification]);

    return (
        <TimerContext.Provider value={{
            timers,
            dispatch,
            completionModal,
            showCompletionModal,
            hideCompletionModal,
            handleTimerReset
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