import type { ComponentProps } from 'react';

import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { BrandLogo } from '../../../src/components/BrandLogo';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import { colors } from '../../../src/theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

type DashboardModuleCardProps = {
  title: string;
  description: string;
  icon: IconName;
};

function DashboardModuleCard({ title, description, icon }: DashboardModuleCardProps) {
  return (
    <View style={styles.moduleCard}>
      <View style={styles.moduleIcon}>
        <Ionicons color={colors.primary} name={icon} size={25} />
      </View>

      <View style={styles.moduleContent}>
        <Text style={styles.moduleTitle}>{title}</Text>

        <Text style={styles.moduleDescription}>{description}</Text>
      </View>

      <Ionicons color={colors.borderStrong} name="checkmark-circle" size={22} />
    </View>
  );
}

export default function HomeScreen() {
  const { profile } = useAuth();

  const displayName = profile?.display_name ?? 'Luniva user';

  const firstName = displayName.trim().split(/\s+/)[0] || 'Luniva user';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.homeLogo}>
          <BrandLogo size={112} />
        </View>

        <Text style={styles.eyebrow}>YOUR PRIVATE SPACE</Text>

        <Text style={styles.title}>Hello, {firstName}</Text>

        <Text style={styles.subtitle}>Track your wellness privately and at your own pace.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons color={colors.success} name="shield-checkmark" size={29} />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Your account is protected</Text>

            <Text style={styles.summaryDescription}>
              Your profile is connected only to your authenticated Supabase account.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your workspace</Text>

        {profile?.cycle_module_enabled ? (
          <DashboardModuleCard
            description="Period, symptom, mood, and cycle-history tracking."
            icon="calendar-outline"
            title="Cycle Care"
          />
        ) : null}

        {profile?.journal_module_enabled ? (
          <DashboardModuleCard
            description="Private partner aliases and personal intimacy records."
            icon="lock-closed-outline"
            title="Private Journal"
          />
        ) : null}

        <DashboardModuleCard
          description="Share selected information only after explicit consent."
          icon="people-outline"
          title="Consent-Based Sharing"
        />

        <View style={styles.nextCard}>
          <Text style={styles.nextEyebrow}>NEXT DEVELOPMENT STEP</Text>

          <Text style={styles.nextTitle}>Cycle setup and period logging</Text>

          <Text style={styles.nextDescription}>
            We will next collect initial cycle information and create secure period records with Row
            Level Security.
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
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 42,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: {
    marginTop: 9,
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    padding: 19,
    borderRadius: 18,
    backgroundColor: colors.successSurface,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: colors.surface,
  },
  summaryContent: {
    flex: 1,
    marginLeft: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  summaryDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: colors.success,
  },
  sectionTitle: {
    marginTop: 30,
    marginBottom: 2,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 17,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.primarySurface,
  },
  moduleContent: {
    flex: 1,
    marginHorizontal: 13,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moduleDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  nextCard: {
    marginTop: 26,
    padding: 21,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  nextEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },
  nextTitle: {
    marginTop: 9,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nextDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  homeLogo: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
});
