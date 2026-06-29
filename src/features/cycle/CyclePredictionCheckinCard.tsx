import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { addDaysToDateOnly, formatDateOnly, getTodayDateOnly } from '../../lib/date';

import { colors } from '../../theme/colors';
import { useAuth } from '../auth/AuthProvider';

import { getCyclePredictionCheckin, respondToCyclePrediction } from './repository';

import { alternatePeriodStartSchema } from './predictionValidation';

import type { CyclePredictionCheckin, CyclePredictionResponse, PeriodEntry } from './types';

type CyclePredictionCheckinCardProps = {
  predictedStartOn: string;

  onPeriodSaved: (periodEntry: PeriodEntry) => void;

  onDataChanged: () => Promise<void>;
};

export function CyclePredictionCheckinCard({
  predictedStartOn,
  onPeriodSaved,
  onDataChanged,
}: CyclePredictionCheckinCardProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const [checkin, setCheckin] = useState<CyclePredictionCheckin | null>(null);

  const [alternateDate, setAlternateDate] = useState('');

  const [showAlternateForm, setShowAlternateForm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const today = getTodayDateOnly();

  const visibleFrom = useMemo(() => addDaysToDateOnly(predictedStartOn, -2), [predictedStartOn]);

  const isConfirmed =
    checkin?.response === 'started_on_predicted_date' ||
    checkin?.response === 'started_on_another_date';

  const loadCheckin = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getCyclePredictionCheckin(userId, predictedStartOn);

      setCheckin(result);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error ? error.message : 'Unable to load the prediction check-in.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [predictedStartOn, userId]);

  useEffect(() => {
    setAlternateDate('');
    setShowAlternateForm(false);
    void loadCheckin();
  }, [loadCheckin]);

  const saveResponse = async (response: CyclePredictionResponse, actualStartOn: string | null) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await respondToCyclePrediction({
        predictedStartOn,
        response,
        actualStartOn,
      });

      setCheckin(result.checkin);

      if (result.periodEntry) {
        onPeriodSaved(result.periodEntry);

        await onDataChanged();

        Alert.alert(
          'Period recorded',
          `Your period start was recorded as ${formatDateOnly(result.periodEntry.started_on)}.`,
        );
      } else {
        Alert.alert(
          'Response saved',
          'The prediction remains visible so you can confirm it later.',
        );
      }

      setAlternateDate('');
      setShowAlternateForm(false);
    } catch (error: unknown) {
      Alert.alert(
        'Unable to save response',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmPredictedDate = () => {
    void saveResponse('started_on_predicted_date', null);
  };

  const confirmNotStarted = () => {
    void saveResponse('not_started_yet', null);
  };

  const confirmAlternateDate = () => {
    const result = alternatePeriodStartSchema.safeParse({
      actualStartOn: alternateDate,
    });

    if (!result.success) {
      Alert.alert('Check the start date', result.error.issues[0]?.message ?? 'Enter a valid date.');

      return;
    }

    if (result.data.actualStartOn === predictedStartOn) {
      void saveResponse('started_on_predicted_date', null);

      return;
    }

    void saveResponse('started_on_another_date', result.data.actualStartOn);
  };

  /*
   * Do not show the check-in long before
   * the predicted period.
   */
  if (today < visibleFrom) {
    return null;
  }

  /*
   * A confirmed prediction becomes a real
   * period entry. The refreshed overview
   * will calculate the next prediction.
   */
  if (isConfirmed) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🌸</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>PERIOD CHECK-IN</Text>

          <Text style={styles.title}>Was this prediction correct?</Text>
        </View>
      </View>

      <Text style={styles.message}>
        Your period was predicted for{' '}
        <Text style={styles.date}>{formatDateOnly(predictedStartOn)}</Text>.
      </Text>

      {checkin?.response === 'not_started_yet' ? (
        <View style={styles.previousResponse}>
          <Ionicons color={colors.info} name="information-circle-outline" size={19} />

          <Text style={styles.previousResponseText}>
            You previously selected “Not yet.” Confirm the start when it happens.
          </Text>
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadCheckin();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>Loading check-in…</Text>
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={confirmPredictedDate}
            style={[styles.primaryButton, isSaving && styles.disabledButton]}
          >
            <Ionicons color={colors.textOnPrimary} name="checkmark-circle-outline" size={20} />

            <Text style={styles.primaryButtonText}>Yes, it started</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={confirmNotStarted}
            style={[styles.secondaryButton, isSaving && styles.disabledButton]}
          >
            <Ionicons color={colors.primary} name="time-outline" size={20} />

            <Text style={styles.secondaryButtonText}>Not yet</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              setShowAlternateForm((currentValue) => !currentValue);
            }}
            style={[styles.secondaryButton, isSaving && styles.disabledButton]}
          >
            <Ionicons color={colors.primary} name="calendar-outline" size={20} />

            <Text style={styles.secondaryButtonText}>Started on another date</Text>
          </Pressable>
        </>
      )}

      {showAlternateForm && !isLoading ? (
        <View style={styles.alternateForm}>
          <Text style={styles.label}>Actual period start date</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setAlternateDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={alternateDate}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={confirmAlternateDate}
            style={[styles.confirmButton, isSaving && styles.disabledButton]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm actual date</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              setAlternateDate('');
              setShowAlternateForm(false);
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.notice}>
        Cycle dates are estimates and are not contraception or medical diagnosis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: colors.pinkSurface,
  },
  icon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
    marginLeft: 13,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary,
  },
  title: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  date: {
    fontWeight: '800',
    color: colors.primary,
  },
  previousResponse: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.infoSurface,
  },
  previousResponseText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 19,
    color: colors.info,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  primaryButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  secondaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  alternateForm: {
    marginTop: 17,
    padding: 15,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
  },
  confirmButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.dangerSurface,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.danger,
  },
  retryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  notice: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.warningSurface,
    fontSize: 12,
    lineHeight: 18,
    color: colors.warning,
  },
});
