import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../src/features/auth/AuthProvider';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const rawDisplayName = user?.user_metadata?.display_name;

  const displayName =
    typeof rawDisplayName === 'string' && rawDisplayName.trim().length > 0
      ? rawDisplayName.trim()
      : 'Luniva user';

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();

      // Protected Routes automatically return
      // the user to the sign-in screen.
    } catch {
      Alert.alert('Unable to sign out', 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>AUTHENTICATED</Text>

        <Text style={styles.title}>Hello, {displayName}</Text>

        <Text style={styles.subtitle}>Your Luniva account is ready.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Authentication successful</Text>

          <Text style={styles.cardText}>You are viewing a protected screen.</Text>

          <Text style={styles.label}>Signed in as</Text>

          <Text style={styles.email}>{user?.email ?? 'Email unavailable'}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={() => {
            void handleSignOut();
          }}
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.buttonPressed,
            isSigningOut && styles.buttonDisabled,
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#6E3B78" />
          ) : (
            <Text style={styles.signOutText}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6FB',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#1D8A57',
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: '800',
    color: '#25182E',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 17,
    color: '#685E6D',
  },
  card: {
    marginTop: 28,
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#25182E',
  },
  cardText: {
    marginTop: 8,
    fontSize: 15,
    color: '#685E6D',
  },
  label: {
    marginTop: 22,
    fontSize: 13,
    fontWeight: '600',
    color: '#807585',
  },
  email: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '600',
    color: '#3E3145',
  },
  signOutButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#6E3B78',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6E3B78',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
