import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, profile, profileError, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading Luniva...</Text>
      </View>
    );
  }

  if (session && profileError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Unable to load your profile</Text>

        <Text style={styles.errorText}>{profileError}</Text>
      </View>
    );
  }

  const hasCompletedOnboarding = profile?.onboarding_completed === true;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(session) && !hasCompletedOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(session) && hasCompletedOnboarding}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F8F6FB',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: '#685E6D',
  },
  errorTitle: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    color: '#25182E',
  },
  errorText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#C53D4D',
  },
});
