import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../../src/features/auth/AuthProvider';

import {
  addDaysToDateOnly,
  formatDateOnly,
  getTodayDateOnly,
} from '../../../src/features/cycle/date';

import { getCycleOverview, saveCycleSetup } from '../../../src/features/cycle/repository';

import type { CycleOverview, PeriodEntry } from '../../../src/features/cycle/types';

import { cycleSetupSchema } from '../../../src/features/cycle/validation';

import { CycleCalendar } from '../../../src/features/cycle/CycleCalendar';
import { colors } from '../../../src/theme/colors';

export default function CycleScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  const [overview, setOverview] = useState<CycleOverview | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [lastPeriodStartedOn, setLastPeriodStartedOn] = useState(
    formatDateOnly(getTodayDateOnly()),
  );

  const [typicalCycleLength, setTypicalCycleLength] = useState('28');

  const [typicalPeriodLength, setTypicalPeriodLength] = useState('5');

  const [cycleRegular, setCycleRegular] = useState(true);

  const [fertilityInsightsEnabled, setFertilityInsightsEnabled] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getCycleOverview(userId);

      setOverview(result);

      if (result.preferences) {
        setTypicalCycleLength(String(result.preferences.typical_cycle_length));

        setTypicalPeriodLength(String(result.preferences.typical_period_length));

        setCycleRegular(result.preferences.cycle_regular);

        setFertilityInsightsEnabled(result.preferences.fertility_insights_enabled);
      }

      if (result.latestPeriod) {
        setLastPeriodStartedOn(formatDateOnly(result.latestPeriod.started_on));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load cycle information.';

      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const applySavedPeriod = useCallback((savedPeriod: PeriodEntry) => {
    setOverview((currentOverview) => {
      if (!currentOverview) {
        return currentOverview;
      }

      const periodExists = currentOverview.periodEntries.some(
        (entry) => entry.id === savedPeriod.id,
      );

      const periodEntries = periodExists
        ? currentOverview.periodEntries.map((entry) =>
            entry.id === savedPeriod.id ? savedPeriod : entry,
          )
        : [savedPeriod, ...currentOverview.periodEntries];

      periodEntries.sort((first, second) => second.started_on.localeCompare(first.started_on));

      return {
        ...currentOverview,
        periodEntries,
        latestPeriod: periodEntries[0] ?? null,
      };
    });
  }, []);

  const applyDeletedPeriod = useCallback((periodEntryId: string) => {
    setOverview((currentOverview) => {
      if (!currentOverview) {
        return currentOverview;
      }

      const periodEntries = currentOverview.periodEntries.filter(
        (entry) => entry.id !== periodEntryId,
      );

      return {
        ...currentOverview,
        periodEntries,
        latestPeriod: periodEntries[0] ?? null,
      };
    });
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const setupCompleted = Boolean(overview?.preferences) && Boolean(overview?.latestPeriod);

  const estimatedNextPeriod = useMemo(() => {
    const preferences = overview?.preferences;

    const latestPeriod = overview?.latestPeriod;

    if (!preferences || !latestPeriod) {
      return null;
    }

    return addDaysToDateOnly(latestPeriod.started_on, preferences.typical_cycle_length);
  }, [overview]);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const result = cycleSetupSchema.safeParse({
      lastPeriodStartedOn,
      typicalCycleLength,
      typicalPeriodLength,
      cycleRegular,
      fertilityInsightsEnabled,
    });

    if (!result.success) {
      Alert.alert(
        'Check your cycle details',
        result.error.issues[0]?.message ?? 'Complete the required information.',
      );

      return;
    }

    setIsSaving(true);

    try {
      await saveCycleSetup({
        typicalCycleLength: result.data.typicalCycleLength,

        typicalPeriodLength: result.data.typicalPeriodLength,

        cycleRegular: result.data.cycleRegular,

        fertilityInsightsEnabled: result.data.fertilityInsightsEnabled,

        lastPeriodStartedOn: result.data.lastPeriodStartedOn,
      });

      await loadOverview();
      setIsEditing(false);

      Alert.alert('Cycle setup saved', 'Your cycle information was saved securely.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save cycle information.';

      Alert.alert('Unable to save cycle setup', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !overview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />

          <Text style={styles.loadingText}>Loading Cycle Care...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && !overview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={42} />

          <Text style={styles.errorTitle}>Unable to load Cycle Care</Text>

          <Text style={styles.errorText}>{loadError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadOverview();
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (setupCompleted && !isEditing) {
    const preferences = overview?.preferences;

    const latestPeriod = overview?.latestPeriod;

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.eyebrow}>CYCLE CARE</Text>

          <Text style={styles.title}>Your cycle overview</Text>

          <Text style={styles.subtitle}>
            These dates are estimates based on the information you entered.
          </Text>

          {overview ? (
            <CycleCalendar
              onDataChanged={loadOverview}
              onPeriodDeleted={applyDeletedPeriod}
              onPeriodSaved={applySavedPeriod}
              overview={overview}
            />
          ) : null}

          <View style={styles.estimateCard}>
            <Text style={styles.cardLabel}>Estimated next period</Text>

            <Text style={styles.estimateDate}>
              {estimatedNextPeriod ? formatDateOnly(estimatedNextPeriod) : 'Unavailable'}
            </Text>

            <Text style={styles.disclaimer}>
              This estimate is not medical advice and must not be used as guaranteed contraception.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <SummaryRow
              label="Last period started"
              value={latestPeriod ? formatDateOnly(latestPeriod.started_on) : 'Unavailable'}
            />

            <View style={styles.divider} />

            <SummaryRow
              label="Typical cycle"
              value={`${preferences?.typical_cycle_length ?? 0} days`}
            />

            <View style={styles.divider} />

            <SummaryRow
              label="Typical period"
              value={`${preferences?.typical_period_length ?? 0} days`}
            />

            <View style={styles.divider} />

            <SummaryRow
              label="Cycle pattern"
              value={preferences?.cycle_regular ? 'Usually regular' : 'Often irregular'}
            />

            <View style={styles.divider} />

            <SummaryRow
              label="Fertility insights"
              value={preferences?.fertility_insights_enabled ? 'Enabled' : 'Disabled'}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setIsEditing(true);
            }}
            style={styles.secondaryButton}
          >
            <Ionicons color={colors.primary} name="create-outline" size={20} />

            <Text style={styles.secondaryButtonText}>Edit cycle setup</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>CYCLE SETUP</Text>

        <Text style={styles.title}>Tell us about your cycle</Text>

        <Text style={styles.subtitle}>
          Enter approximate information. You can update it as you record more cycles.
        </Text>

        <View style={styles.formSection}>
          <Text style={styles.label}>Last period started</Text>

          <TextInput
            autoCapitalize="none"
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setLastPeriodStartedOn}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            value={lastPeriodStartedOn}
          />

          <Text style={styles.helperText}> Example: 15/06/2026</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Typical cycle length</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={(value) => {
              setTypicalCycleLength(value.replace(/\D/g, ''));
            }}
            placeholder="28"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            value={typicalCycleLength}
          />

          <Text style={styles.helperText}>
            Count from the first day of one period to the first day of the next.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Typical period duration</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={(value) => {
              setTypicalPeriodLength(value.replace(/\D/g, ''));
            }}
            placeholder="5"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            value={typicalPeriodLength}
          />
        </View>

        <View style={styles.switchCard}>
          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>Usually regular cycle</Text>

            <Text style={styles.switchDescription}>
              Enable this when your cycle normally follows a similar length.
            </Text>
          </View>

          <Switch disabled={isSaving} onValueChange={setCycleRegular} value={cycleRegular} />
        </View>

        <View style={styles.switchCard}>
          <View style={styles.switchContent}>
            <Text style={styles.switchTitle}>Fertility insights</Text>

            <Text style={styles.switchDescription}>
              Show educational estimated fertility information. This is not contraception.
            </Text>
          </View>

          <Switch
            disabled={isSaving}
            onValueChange={setFertilityInsightsEnabled}
            value={fertilityInsightsEnabled}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => {
            void handleSave();
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
            <Text style={styles.primaryButtonText}>Save cycle setup</Text>
          )}
        </Pressable>

        {setupCompleted ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              setIsEditing(false);
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>

      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
    paddingBottom: 44,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.danger,
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
    marginTop: 9,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  formSection: {
    marginTop: 24,
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
  helperText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    padding: 17,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  switchContent: {
    flex: 1,
    paddingRight: 14,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  switchDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  estimateCard: {
    marginTop: 26,
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.primary,
  },
  estimateDate: {
    marginTop: 8,
    fontSize: 27,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  summaryCard: {
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  summaryRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    color: colors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
