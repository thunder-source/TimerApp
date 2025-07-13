import notifee, { 
  AndroidImportance, 
  AndroidStyle, 
  AuthorizationStatus, 
  EventType, 
  TriggerType,
  TimestampTrigger 
} from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { useCallback } from 'react';

export function useNotifications() {
  // Helper function to check if device supports POST_NOTIFICATIONS permission
  const supportsNotificationPermission = useCallback(() => {
    if (Platform.OS === 'android') {
      // POST_NOTIFICATIONS permission was introduced in Android 13 (API level 33)
      return Platform.Version >= 33;
    }
    return true; // iOS always supports notification permissions
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        // Check if device supports POST_NOTIFICATIONS permission
        if (supportsNotificationPermission()) {
          // Use PermissionsAndroid for Android 13+
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          
          console.log('Android notification permission result:', granted);
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For older Android versions, notifications are enabled by default
          console.log('Android version < 13, notifications enabled by default');
          return true;
        }
      } else {
        // Use Notifee for iOS
        const authStatus = await notifee.requestPermission();
        console.log('iOS notification permission status:', authStatus);
        return authStatus.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, [supportsNotificationPermission]);

  const checkPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        // Check if device supports POST_NOTIFICATIONS permission
        if (supportsNotificationPermission()) {
          // Check Android permissions using PermissionsAndroid
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log('Android notification permission check:', hasPermission);
          return hasPermission;
        } else {
          // For older Android versions, notifications are enabled by default
          console.log('Android version < 13, notifications enabled by default');
          return true;
        }
      } else {
        // Check iOS permissions using Notifee
        const settings = await notifee.getNotificationSettings();
        console.log('iOS notification permissions:', settings);
        return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }, [supportsNotificationPermission]);

  const scheduleNotification = useCallback(async (title: string, message: string, date: Date, id: string) => {
    try {
      console.log('Scheduling notification:', { title, message, date, id });
      
      // Create trigger for the specified date
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
      };

      // Create notification
      await notifee.createTriggerNotification(
        {
          title,
          body: message,
          id,
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
              text: message,
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
      
      console.log('Notification scheduled successfully with ID:', id);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }, []);

  const cancelNotification = useCallback(async (id: string) => {
    try {
      console.log('Canceling notification:', id);
      await notifee.cancelTriggerNotifications([id]);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    try {
      console.log('Canceling all notifications');
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }, []);


  return { 
    scheduleNotification, 
    cancelNotification, 
    cancelAllNotifications,
    requestPermissions,
    checkPermissions,
    supportsNotificationPermission
  };
}

// Helper function to create notification channel
async function createNotificationChannel() {
  try {
    await notifee.createChannel({
      id: 'timer-channel',
      name: 'Timer Notifications',
      description: 'Notifications for timer completion and alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
    });
    console.log('Notification channel created successfully');
  } catch (error) {
    console.error('Error creating notification channel:', error);
  }
}

// Call this once in your app to create the notification channel and configure Notifee
export function configureNotificationChannel() {
  try {
    console.log('Configuring notification channel');
    
    // Create the notification channel
    createNotificationChannel();

    // Configure Notifee event listeners
    notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          break;
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          break;
      }
    });

    console.log('Notifee configured successfully');
  } catch (error) {
    console.error('Error configuring notification channel:', error);
  }
} 