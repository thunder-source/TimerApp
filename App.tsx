import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import { colors, borderRadius, spacing } from './utils/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TimerProvider } from './contexts/TimerContext';
import { Header } from './components/ui';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  // Hide tab bar when keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  // Map route names to icon names
  const icons: Record<string, string> = {
    Home: 'home',
    History: 'history',
  };
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        console.log('route.name', route.name)
        const { options } = descriptors[route.key];
        let label: string;
        if (typeof options.tabBarLabel === 'string') {
          label = options.tabBarLabel;
        } else if (typeof options.title === 'string') {
          label = options.title;
        } else {
          label = route.name;
        }
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
            style={[styles.tabItem, isFocused && styles.tabItemFocused]}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? colors.primary : colors.muted}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  return (
    <TimerProvider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
          </Tab.Navigator>
        </NavigationContainer>
      </KeyboardAvoidingView>
    </TimerProvider>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.primary + '11', // subtle highlight
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabIconFocused: {
    color: colors.primary,
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
