import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { BrandLogo } from './BrandLogo';

type AppLoadingScreenProps = {
  message?: string;
};

export function AppLoadingScreen({
  message = 'Preparing your private space…',
}: AppLoadingScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <BrandLogo size={220} />

        <ActivityIndicator color={colors.primary} size="small" style={styles.indicator} />

        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  indicator: {
    marginTop: 6,
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
