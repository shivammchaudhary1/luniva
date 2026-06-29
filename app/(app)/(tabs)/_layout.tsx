import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { useAuth } from '../../../src/features/auth/AuthProvider';
import { colors } from '../../../src/theme/colors';

export default function TabLayout() {
  const { profile } = useAuth();

  const cycleEnabled = profile?.cycle_module_enabled === true;

  const journalEnabled = profile?.journal_module_enabled === true;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          borderTopColor: colors.divider,
          backgroundColor: colors.surface,
          paddingTop: 6,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Luniva home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? 'home' : 'home-outline'} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="cycle"
        options={{
          title: 'Cycle',

          // Do not explicitly pass undefined because
          // exactOptionalPropertyTypes is enabled.
          ...(cycleEnabled ? {} : { href: null }),

          tabBarAccessibilityLabel: 'Cycle Care',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? 'calendar' : 'calendar-outline'} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',

          // Hide the tab only when the module is disabled.
          ...(journalEnabled ? {} : { href: null }),

          tabBarAccessibilityLabel: 'Private Journal',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? 'book' : 'book-outline'} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="connections"
        options={{
          title: 'Sharing',
          tabBarAccessibilityLabel: 'Consent-based sharing',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? 'people' : 'people-outline'} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={focused ? 'settings' : 'settings-outline'} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
