import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { borderRadius, spacing } from './utils/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TimerProvider, useTimers } from './contexts/TimerContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import CompletionModal from './components/CompletionModal';
import { useInitializeNotifications } from './hooks/useInitializeNotifications';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  if (isKeyboardVisible) return null;

  // Map route names to icon names
  const icons: Record<string, string> = {
    Home: 'home',
    History: 'history',
    Settings: 'cog',
  };

  const tabBarStyles = createTabBarStyles(colors, borderRadius, spacing);

  return (
    <View style={tabBarStyles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string'
          ? options.tabBarLabel
          : typeof options.title === 'string'
            ? options.title
            : route.name;
        const isFocused = state.index === index;
        const iconName = icons[route.name] || 'circle-outline';
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={[tabBarStyles.tabItem, isFocused && tabBarStyles.tabItemFocused]}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? colors.primary : colors.muted}
              style={tabBarStyles.tabIcon}
            />
            <Text style={[tabBarStyles.tabLabel, isFocused && tabBarStyles.tabLabelFocused]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createTabBarStyles = (colors: any, borderRadius: any, spacing: any) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    flexDirection: 'column',
  },
  tabItemFocused: {
    backgroundColor: colors.primary + '11',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

function AppContent() {
  const { completionModal, hideCompletionModal } = useTimers();
  const { colors } = useTheme();
  const containerStyle = createContainerStyle(colors);

  return (
    <>
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <NavigationContainer>
          <Tab.Navigator
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </KeyboardAvoidingView>

      <CompletionModal
        visible={completionModal.visible}
        timerName={completionModal.timerName}
        onClose={hideCompletionModal}
      />
    </>
  );
}

const createContainerStyle = (colors: any) => ({
  flex: 1,
  backgroundColor: colors.background,
});

export default function App() {
  // Use the new hook for notification setup
  useInitializeNotifications();

  return (
    <ThemeProvider>
      <TimerProvider>
        <AppContent />
      </TimerProvider>
    </ThemeProvider>
  );
}


