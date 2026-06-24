import { Link, Stack } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppScreen } from '@/src/components/ui/AppScreen';
import { theme } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <AppScreen>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          Return to Luniva
        </Link>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  link: {
    marginTop: theme.spacing.lg,
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
