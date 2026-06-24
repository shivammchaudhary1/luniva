import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../src/lib/supabase/client';

type ConnectionStatus = 'checking' | 'connected' | 'error';

export default function HomeScreen() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  const [message, setMessage] = useState('Checking your Supabase connection...');

  const checkConnection = useCallback(async () => {
    setStatus('checking');
    setMessage('Checking your Supabase connection...');

    try {
      const { data, error } = await supabase.from('app_health').select('status').limit(1).single();

      if (error) {
        throw error;
      }

      if (!data || data.status !== 'ok') {
        throw new Error('Supabase connected, but the health-check row was not found.');
      }

      setStatus('connected');
      setMessage('Your Expo application is successfully connected to Supabase.');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown connection error occurred.';

      setStatus('error');
      setMessage(errorMessage);
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const isChecking = status === 'checking';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>STEP 2 · SUPABASE</Text>

        <Text style={styles.title}>Luniva</Text>

        <Text style={styles.subtitle}>Mobile application foundation</Text>

        <View style={styles.card}>
          {isChecking ? (
            <ActivityIndicator size="large" />
          ) : (
            <View
              style={[
                styles.statusIndicator,
                status === 'connected' ? styles.connectedIndicator : styles.errorIndicator,
              ]}
            />
          )}

          <Text style={styles.statusTitle}>
            {status === 'checking'
              ? 'Checking connection'
              : status === 'connected'
                ? 'Supabase connected'
                : 'Connection failed'}
          </Text>

          <Text style={styles.message}>{message}</Text>

          <Text style={styles.detail}>Environment: development</Text>

          <Text style={styles.detail}>Database: Supabase PostgreSQL</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isChecking}
          onPress={() => {
            void checkConnection();
          }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isChecking && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {isChecking ? 'Checking...' : 'Test connection again'}
          </Text>
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
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#68507A',
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#25182E',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    fontSize: 17,
    color: '#685E6D',
  },
  card: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  connectedIndicator: {
    backgroundColor: '#1D8A57',
  },
  errorIndicator: {
    backgroundColor: '#C53D4D',
  },
  statusTitle: {
    marginTop: 16,
    fontSize: 21,
    fontWeight: '700',
    color: '#25182E',
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#685E6D',
  },
  detail: {
    marginTop: 12,
    fontSize: 13,
    color: '#807585',
  },
  button: {
    alignItems: 'center',
    marginTop: 22,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#6E3B78',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
