import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { AppLoadingScreen } from '../src/components/AppLoadingScreen';
import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
import { colors } from '../src/theme/colors';

SplashScreen.setOptions({
  duration: 700,
  fade: true,
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, profile, profileError, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoadingScreen />;
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
    <>
      <StatusBar backgroundColor={colors.background} style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: colors.background,
          },
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
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.danger,
  },
});
