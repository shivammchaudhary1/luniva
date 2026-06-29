import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { BrandLogo } from '../../../src/components/BrandLogo';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import { colors } from '../../../src/theme/colors';

type SettingRowProps = {
  label: string;
  value: string;
};

function SettingRow({ label, value }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>

      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

function getGenderLabel(gender: string | null | undefined): string {
  switch (gender) {
    case 'female':
      return 'Female';

    case 'male':
      return 'Male';

    case 'non_binary':
      return 'Non-binary';

    case 'prefer_not_to_say':
      return 'Prefer not to say';

    default:
      return 'Not provided';
  }
}

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      Alert.alert('Unable to sign out', 'Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <BrandLogo size={110} />
        </View>

        <Text style={styles.eyebrow}>SETTINGS</Text>

        <Text style={styles.title}>Your account</Text>

        <Text style={styles.subtitle}>Review your profile and selected Luniva features.</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons color={colors.primary} name="person" size={28} />
          </View>

          <View style={styles.profileContent}>
            <Text style={styles.profileName}>{profile?.display_name ?? 'Luniva user'}</Text>

            <Text style={styles.profileEmail}>{user?.email ?? 'Email unavailable'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.card}>
          <SettingRow label="Gender" value={getGenderLabel(profile?.gender)} />

          <View style={styles.divider} />

          <SettingRow
            label="Age requirement"
            value={profile?.age_confirmed_at ? '18+ confirmed' : 'Not confirmed'}
          />

          <View style={styles.divider} />

          <SettingRow label="Timezone" value={profile?.timezone ?? 'UTC'} />
        </View>

        <Text style={styles.sectionTitle}>Enabled modules</Text>

        <View style={styles.card}>
          <SettingRow
            label="Cycle Care"
            value={profile?.cycle_module_enabled ? 'Enabled' : 'Disabled'}
          />

          <View style={styles.divider} />

          <SettingRow
            label="Private Journal"
            value={profile?.journal_module_enabled ? 'Enabled' : 'Disabled'}
          />
        </View>

        <Text style={styles.helperText}>
          Profile editing and module controls will be added in a later settings step.
        </Text>

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
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Ionicons color={colors.danger} name="log-out-outline" size={21} />

              <Text style={styles.signOutText}>Sign out</Text>
            </>
          )}
        </Pressable>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    padding: 19,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: colors.primarySurface,
  },
  profileContent: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  settingValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  helperText: {
    marginTop: 13,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  signOutButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    backgroundColor: colors.dangerSurface,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
});
