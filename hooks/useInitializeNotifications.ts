import { useEffect } from 'react';
import { configureNotificationChannel, useNotifications } from './useNotifications';

export function useInitializeNotifications() {
  const { requestPermissions, checkPermissions } = useNotifications();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('Initializing notifications...');
        configureNotificationChannel();
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          console.log('Requesting notification permissions...');
          const granted = await requestPermissions();
          console.log('Notification permission granted:', granted);
        } else {
          console.log('Notification permissions already granted');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };
    initializeNotifications();
  }, [checkPermissions, requestPermissions]);
} 