import { useReducer, useEffect, useRef } from 'react';
import { useAsyncStorage } from './useAsyncStorage';
import { useNotifications, configureNotificationChannel } from './useNotifications';

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

function timerReducer(state: Timer[], action: TimerAction): Timer[] {
  switch (action.type) {
    case 'ADD_TIMER':
      return [...state, action.timer];
    case 'START_TIMER':
      return state.map((t) =>
        t.id === action.id && t.status !== 'completed'
          ? { ...t, status: 'running' }
          : t
      );
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
          const newRemaining = t.remaining - 1;
          if (newRemaining <= 0) {
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

export function useTimers() {
  const { getItem, setItem } = useAsyncStorage<Timer[]>('timers');
  const { scheduleNotification, cancelNotification } = useNotifications();
  const [timers, dispatch] = useReducer(timerReducer, []);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load timers from AsyncStorage on mount
  useEffect(() => {
    getItem().then((saved) => {
      if (saved) dispatch({ type: 'LOAD_TIMERS', timers: saved });
    });
    configureNotificationChannel();
  }, []);

  // Save timers to AsyncStorage on change
  useEffect(() => {
    setItem(timers);
  }, [timers, setItem]);

  // Timer ticking
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timers.some((t) => t.status === 'running')) {
      intervalRef.current = setInterval(() => {
        timers.forEach((t) => {
          if (t.status === 'running') {
            dispatch({ type: 'TICK', id: t.id });
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
            // Completion
            if (t.remaining === 1) {
              scheduleNotification(
                'Timer Complete',
                `${t.name} is complete!`,
                new Date(Date.now() + 1000),
                `${t.id}-complete`
              );
            }
          }
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timers]);

  return { timers, dispatch };
} 