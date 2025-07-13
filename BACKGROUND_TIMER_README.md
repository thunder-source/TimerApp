# Background Timer Implementation

This document explains how background timer functionality has been implemented in the TimerApp.

## Overview

The app now supports running timers in the background, ensuring that timers continue to count down even when the app is not in the foreground. This is achieved through a combination of React Native background task libraries and proper state management.

## Key Components

### 1. Background Timer Hook (`hooks/useBackgroundTimer.ts`)
- Handles background timer execution using `react-native-background-timer`
- Manages app state changes (foreground/background transitions)
- Provides timer tick and completion callbacks

### 2. Background Service Hook (`hooks/useBackgroundService.ts`)
- Provides persistent background timer state management
- Saves and loads timer state to/from AsyncStorage
- Handles app state transitions more robustly

### 3. Updated TimerContext (`contexts/TimerContext.tsx`)
- Integrates background timer functionality
- Maintains both foreground and background timer synchronization
- Handles timer completion notifications and history updates

## Features

### Background Execution
- Timers continue running when the app is in the background
- Automatic state synchronization between foreground and background
- Proper cleanup when the app is closed or backgrounded

### State Persistence
- Timer state is saved to AsyncStorage for persistence
- Background timer state is maintained separately for reliability
- State is restored when the app comes back to foreground

### Notifications
- Completion notifications are scheduled when timers finish
- Halfway alerts are sent for timers with that option enabled
- Notifications work even when the app is in the background

### App State Monitoring
- Real-time monitoring of app state (Active/Background/Inactive)
- Automatic switching between foreground and background timer modes
- Proper cleanup and resource management

## Dependencies

The following libraries have been added to support background functionality:

```json
{
  "react-native-background-timer": "^2.4.1",
  "react-native-background-fetch": "^4.2.1",
  "@types/react-native-background-timer": "^2.4.0"
}
```

## Platform Configuration

### Android
- Added background permissions to `AndroidManifest.xml`:
  - `FOREGROUND_SERVICE`
  - `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
- Existing notification permissions are utilized

### iOS
- Added background modes to `Info.plist`:
  - `background-processing`
  - `background-fetch`
- Existing notification permissions are utilized

## Usage

### Starting a Timer
1. Create a timer using the "Add Timer" button
2. Press "Start" to begin the timer
3. The timer will continue running even if you switch to another app

### Background Behavior
- When the app goes to background, background timers are automatically started
- When the app comes to foreground, background timers are stopped and foreground timers take over
- Timer state is synchronized between foreground and background modes

### Notifications
- Timer completion notifications are sent even when the app is in the background
- Halfway alerts are sent for timers with that option enabled
- Notifications include the timer name and completion status

## Testing

### Quick Background Timer Test
1. In development mode, tap the test tube icon (🧪) in the header
2. This will create a 30-second test timer
3. Start the timer and immediately switch to another app or lock your screen
4. Wait for the timer to complete
5. You should receive a notification when the timer finishes
6. Return to the app to see the timer marked as completed

### Manual Background Timer Test
1. Start a timer with a short duration (e.g., 30 seconds)
2. Switch to another app or lock the screen
3. Wait for the timer to complete
4. You should receive a notification when the timer finishes
5. Return to the app to see the timer marked as completed

### State Persistence Test
1. Start multiple timers
2. Force close the app
3. Reopen the app
4. Verify that running timers continue from where they left off

### Debug Information
- In development mode, a debug panel shows at the bottom of the screen
- This panel displays current app state and running timer information
- Use this to verify that background timers are working correctly

## Visual Indicators

### Background Status Indicator
- When the app is in background mode, a status bar appears at the top
- Shows "Timers running in background (Background)" or "Timers running in background (Inactive)"
- This indicates that background timer service is active

### Debug Panel (Development Only)
- Shows current app state (Active/Background/Inactive)
- Displays count of running timers
- Lists all timers with their current status and remaining time

## Limitations

### iOS
- Background execution time is limited by iOS system policies
- Long-running background tasks may be suspended by the system
- Background fetch intervals are controlled by iOS

### Android
- Battery optimization may affect background execution
- Some devices may have aggressive battery saving that limits background tasks
- Foreground service may be required for reliable background execution

## Troubleshooting

### Timers Not Running in Background
1. Check notification permissions are granted
2. Ensure battery optimization is disabled for the app
3. Verify background modes are properly configured
4. Check device-specific background app restrictions

### Notifications Not Received
1. Verify notification permissions in device settings
2. Check notification channel configuration
3. Ensure the app is not in battery optimization mode
4. Test with a short timer duration

### State Loss
1. Check AsyncStorage permissions
2. Verify background state saving is working
3. Check for memory pressure causing app termination
4. Test with smaller timer datasets

## Future Improvements

1. **Foreground Service**: Implement a proper foreground service for Android to ensure reliable background execution
2. **Background Fetch**: Utilize background fetch for periodic state synchronization
3. **Push Notifications**: Implement server-side push notifications for critical timer events
4. **Battery Optimization**: Add user guidance for battery optimization settings
5. **Background Time Limits**: Implement graceful handling of background time limits 