import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BrandLogo } from '../../src/components/BrandLogo';
import { useAuth } from '../../src/features/auth/AuthProvider';
import type { GenderOption } from '../../src/features/profile/types';
import { onboardingSchema } from '../../src/features/profile/validation';
import { supabase } from '../../src/lib/supabase/client';
import { colors } from '../../src/theme/colors';

const genderChoices: {
  label: string;
  value: GenderOption;
}[] = [
  {
    label: 'Female',
    value: 'female',
  },
  {
    label: 'Male',
    value: 'male',
  },
  {
    label: 'Non-binary',
    value: 'non_binary',
  },
  {
    label: 'Prefer not to say',
    value: 'prefer_not_to_say',
  },
];

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export default function OnboardingScreen() {
  const { user, profile, refreshProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');

  const [gender, setGender] = useState<GenderOption | null>(profile?.gender ?? null);

  const [cycleModuleEnabled, setCycleModuleEnabled] = useState(
    profile?.cycle_module_enabled ?? true,
  );

  const [journalModuleEnabled, setJournalModuleEnabled] = useState(
    profile?.journal_module_enabled ?? true,
  );

  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (!user || isSaving) {
      return;
    }

    const result = onboardingSchema.safeParse({
      displayName,
      gender,
      ageConfirmed,
      cycleModuleEnabled,
      journalModuleEnabled,
    });

    if (!result.success) {
      Alert.alert(
        'Check your details',
        result.error.issues[0]?.message ?? 'Complete the required fields.',
      );

      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: result.data.displayName,

          gender: result.data.gender,

          age_confirmed_at: new Date().toISOString(),

          timezone: getDeviceTimezone(),

          cycle_module_enabled: result.data.cycleModuleEnabled,

          journal_module_enabled: result.data.journalModuleEnabled,

          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Unable to save profile', error.message);

        return;
      }

      await refreshProfile();
    } catch {
      Alert.alert('Unable to save profile', 'Check your internet connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <BrandLogo size={145} />
        </View>

        <Text style={styles.eyebrow}>WELCOME TO LUNIVA</Text>

        <Text style={styles.title}>Personalize your experience</Text>

        <Text style={styles.subtitle}>
          Choose the tools you want to use. You can change these settings later.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Display name</Text>

          <TextInput
            autoCapitalize="words"
            autoComplete="name"
            editable={!isSaving}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            value={displayName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>

          <Text style={styles.helperText}>
            Optional. This does not control which features you can use.
          </Text>

          <View style={styles.choiceContainer}>
            {genderChoices.map((choice) => {
              const isSelected = gender === choice.value;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: isSelected,
                  }}
                  disabled={isSaving}
                  key={choice.value}
                  onPress={() => {
                    setGender(isSelected ? null : choice.value);
                  }}
                  style={[styles.choice, isSelected && styles.choiceSelected]}
                >
                  <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                    {choice.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your features</Text>

          <View style={styles.moduleCard}>
            <View style={styles.moduleText}>
              <Text style={styles.moduleTitle}>Cycle Care</Text>

              <Text style={styles.moduleDescription}>
                Track periods, symptoms, moods, and cycle history.
              </Text>
            </View>

            <Switch
              disabled={isSaving}
              onValueChange={setCycleModuleEnabled}
              value={cycleModuleEnabled}
            />
          </View>

          <View style={styles.moduleCard}>
            <View style={styles.moduleText}>
              <Text style={styles.moduleTitle}>Private Journal</Text>

              <Text style={styles.moduleDescription}>
                Maintain private partner aliases and intimacy records.
              </Text>
            </View>

            <Switch
              disabled={isSaving}
              onValueChange={setJournalModuleEnabled}
              value={journalModuleEnabled}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{
            checked: ageConfirmed,
          }}
          disabled={isSaving}
          onPress={() => {
            setAgeConfirmed((current) => !current);
          }}
          style={styles.confirmationRow}
        >
          <View style={[styles.checkbox, ageConfirmed && styles.checkboxSelected]}>
            {ageConfirmed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>

          <Text style={styles.confirmationText}>I confirm that I am at least 18 years old.</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => {
            void handleContinue();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            isSaving && styles.buttonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue to Luniva</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => {
            void signOut();
          }}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
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
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 28,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  helperText: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  choiceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  choice: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  choiceTextSelected: {
    color: colors.primary,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  moduleText: {
    flex: 1,
    paddingRight: 14,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moduleDescription: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  confirmationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  signOutButton: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
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
