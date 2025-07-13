This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Notification Testing

To test if notifications are working properly:

1. **First Launch**: The app will automatically request notification permissions on first launch
2. **Manual Testing**: 
   - Tap the settings icon (gear) in the top-left corner of the Home screen
   - If notifications are enabled, you can send a test notification
   - If notifications are disabled, you can enable them from the settings
3. **Timer Testing**: 
   - Create a short timer (e.g., 10 seconds)
   - Start the timer and wait for it to complete
   - You should receive a notification when the timer finishes

### Common Issues:

- **Android**: Make sure to grant notification permissions when prompted
- **iOS**: Check Settings > Notifications > TimerApp to ensure notifications are enabled
- **Emulator**: Some emulators may not show notifications properly - test on a real device
- **Background**: The app should work even when in the background

### Debug Steps:

1. Check the console logs for notification-related messages
2. Verify notification permissions in device settings
3. Test with a real device instead of emulator
4. Ensure the app is not in battery optimization mode (Android)

# Assumptions Made During Development

- **Notification Permissions**: It is assumed that users will grant notification permissions when prompted. The app requests these permissions on first launch and provides options to enable/disable notifications in the settings.
- **Background Execution**: Timers are expected to run reliably in the background, but:
  - On **iOS**, background execution time is limited by system policies. Long-running background tasks may be suspended by the system, and background fetch intervals are controlled by iOS.
  - On **Android**, battery optimization or device-specific restrictions may affect background execution. Users may need to disable battery optimization for the app for best results.
- **State Persistence**: Timer state is saved to AsyncStorage and is expected to persist across app restarts. However, if the app is force-closed or the device is under memory pressure, state loss may occur.
- **Default Categories**: If no timer categories exist, default categories ("Workout", "Study", "Break") are created on first launch.
- **Emulator Limitations**: Some emulators may not show notifications or handle background tasks as reliably as real devices. Testing on real hardware is recommended for full feature validation.
- **Foreground Service (Android)**: The app does not currently implement a persistent foreground service for timers, which may affect reliability on some Android devices. This is noted as a future improvement.
- **Notification Delivery**: The app schedules local notifications for timer completion and halfway alerts. Delivery depends on device settings and OS behavior.
- **App State Monitoring**: The app monitors foreground/background/inactive states to switch timer modes and manage resources efficiently.
- **Backward Compatibility**: History items without duration or category fields are assigned default values for compatibility with older app versions.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
