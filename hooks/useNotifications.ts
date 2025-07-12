import PushNotification from 'react-native-push-notification';

export function useNotifications() {
  const scheduleNotification = (title: string, message: string, date: Date, id: string) => {
    PushNotification.localNotificationSchedule({
      id,
      channelId: 'timer-channel',
      title,
      message,
      date,
      allowWhileIdle: true,
    });
  };

  const cancelNotification = (id: string) => {
    PushNotification.cancelLocalNotifications({ id });
  };

  return { scheduleNotification, cancelNotification };
}

// Call this once in your app to create the notification channel
export function configureNotificationChannel() {
  PushNotification.createChannel(
    {
      channelId: 'timer-channel',
      channelName: 'Timer Notifications',
      importance: 4,
      vibrate: true,
    },
    (created: boolean) => {}
  );
} 