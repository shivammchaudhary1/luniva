import type { ComponentProps } from 'react';

import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

type FeaturePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
  icon: IconName;
};

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  nextStep,
  icon,
}: FeaturePlaceholderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>{description}</Text>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons color={colors.primary} name={icon} size={32} />
          </View>

          <Text style={styles.cardTitle}>Module foundation ready</Text>

          <Text style={styles.cardDescription}>{nextStep}</Text>
        </View>

        <View style={styles.privacyCard}>
          <Ionicons color={colors.success} name="shield-checkmark-outline" size={22} />

          <Text style={styles.privacyText}>
            Your information remains private and protected by your authenticated account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 38,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  card: {
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    backgroundColor: colors.primarySurface,
  },
  cardTitle: {
    marginTop: 20,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  cardDescription: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.successSurface,
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
    color: colors.success,
  },
});
