import { useState } from 'react';

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

import { colors } from '../../theme/colors';
import { useAuth } from '../auth/AuthProvider';

import {
  addDaysToDateOnly,
  formatDateOnly,
  getTodayDateOnly,
  parseDisplayDateToDateOnly,
} from './date';

import { createPeriodEntry, deletePeriodEntry, updatePeriodEntry } from './repository';

import type { PeriodEntry } from './types';

type PeriodHistoryManagerProps = {
  periodEntries: PeriodEntry[];
  onDataChanged: () => Promise<void>;
  onPeriodSaved: (periodEntry: PeriodEntry) => void;
  onPeriodDeleted: (periodEntryId: string) => void;
};

type FormMode =
  | {
      type: 'closed';
    }
  | {
      type: 'add';
    }
  | {
      type: 'edit';
      periodEntryId: string;
    };

function differenceInDays(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);

  const [endYear, endMonth, endDay] = end.split('-').map(Number);

  const startTimestamp = Date.UTC(startYear ?? 0, (startMonth ?? 1) - 1, startDay ?? 1);

  const endTimestamp = Date.UTC(endYear ?? 0, (endMonth ?? 1) - 1, endDay ?? 1);

  return Math.floor((endTimestamp - startTimestamp) / (24 * 60 * 60 * 1000));
}

export function PeriodHistoryManager({
  periodEntries,
  onDataChanged,
  onPeriodSaved,
  onPeriodDeleted,
}: PeriodHistoryManagerProps) {
  const { user } = useAuth();

  const [formMode, setFormMode] = useState<FormMode>({
    type: 'closed',
  });

  const [startDate, setStartDate] = useState('');

  const [endDate, setEndDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [originalDurationDays, setOriginalDurationDays] = useState<number | null>(null);

  const closeForm = () => {
    setFormMode({
      type: 'closed',
    });

    setStartDate('');
    setEndDate('');
    setOriginalDurationDays(null);
  };

  const openAddForm = () => {
    setStartDate('');
    setEndDate('');
    setOriginalDurationDays(null);

    setFormMode({
      type: 'add',
    });
  };

  const openEditForm = (entry: PeriodEntry) => {
    setStartDate(formatDateOnly(entry.started_on));

    setEndDate(entry.ended_on ? formatDateOnly(entry.ended_on) : '');

    setOriginalDurationDays(
      entry.ended_on ? differenceInDays(entry.started_on, entry.ended_on) : null,
    );

    setFormMode({
      type: 'edit',
      periodEntryId: entry.id,
    });
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);

    if (formMode.type !== 'edit' || originalDurationDays === null) {
      return;
    }

    const parsedStartDate = parseDisplayDateToDateOnly(value);

    if (!parsedStartDate) {
      return;
    }

    const adjustedEndDate = addDaysToDateOnly(parsedStartDate, originalDurationDays);

    setEndDate(formatDateOnly(adjustedEndDate));
  };

  const handleSave = async () => {
    if (!user || isSaving) {
      return;
    }

    const parsedStart = parseDisplayDateToDateOnly(startDate);

    if (!parsedStart) {
      Alert.alert('Check start date', 'Enter the start date using DD/MM/YYYY.');

      return;
    }

    if (parsedStart > getTodayDateOnly()) {
      Alert.alert('Check start date', 'A recorded period cannot start in the future.');

      return;
    }

    let parsedEnd: string | null = null;

    if (endDate.trim().length > 0) {
      parsedEnd = parseDisplayDateToDateOnly(endDate);

      if (!parsedEnd) {
        Alert.alert('Check end date', 'Enter the end date using DD/MM/YYYY.');

        return;
      }

      if (parsedEnd < parsedStart) {
        Alert.alert('Check date range', 'The end date cannot be before the start date.');

        return;
      }

      if (parsedEnd > getTodayDateOnly()) {
        Alert.alert('Check end date', 'A recorded period end date cannot be in the future.');

        return;
      }

      if (differenceInDays(parsedStart, parsedEnd) > 14) {
        Alert.alert('Check date range', 'A recorded period cannot be longer than 15 days.');

        return;
      }
    }

    setIsSaving(true);

    try {
      const input = {
        ownerUserId: user.id,
        startedOn: parsedStart,
        endedOn: parsedEnd,
      };

      let savedPeriod: PeriodEntry;

      if (formMode.type === 'edit') {
        savedPeriod = await updatePeriodEntry(formMode.periodEntryId, input);
      } else {
        savedPeriod = await createPeriodEntry(input);
      }

      /*
       * Immediately update the parent state so
       * Calendar and List both rerender.
       */
      onPeriodSaved(savedPeriod);

      closeForm();

      /*
       * Then reload from Supabase to confirm
       * that local state matches the database.
       */
      await onDataChanged();

      Alert.alert('Period saved', 'Your period history was updated.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save the period.';

      Alert.alert(
        'Unable to save period',
        message.includes('unique_period_start_per_owner')
          ? 'A period already exists with this start date.'
          : message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (entry: PeriodEntry) => {
    if (!user || deletingId) {
      return;
    }

    Alert.alert(
      'Delete period?',
      `Delete the period starting ${formatDateOnly(entry.started_on)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete(entry.id);
          },
        },
      ],
    );
  };

  const handleDelete = async (entryId: string) => {
    if (!user) {
      return;
    }

    setDeletingId(entryId);

    try {
      await deletePeriodEntry(entryId, user.id);

      onPeriodDeleted(entryId);

      await onDataChanged();
    } catch (error: unknown) {
      Alert.alert(
        'Unable to delete period',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Manage period history</Text>

          <Text style={styles.description}>Add previous months to improve future estimates.</Text>
        </View>

        {formMode.type === 'closed' ? (
          <Pressable accessibilityRole="button" onPress={openAddForm} style={styles.addButton}>
            <Ionicons color={colors.textOnPrimary} name="add" size={19} />

            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      {formMode.type !== 'closed' ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {formMode.type === 'edit' ? 'Edit period' : 'Add previous period'}
          </Text>

          <Text style={styles.label}>Start date</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={handleStartDateChange}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            value={startDate}
          />

          <Text style={styles.label}>End date</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setEndDate}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textDisabled}
            style={styles.input}
            value={endDate}
          />

          <Text style={styles.helperText}>
            Leave the end date empty when the exact date is unknown.
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              void handleSave();
            }}
            style={[styles.saveButton, isSaving && styles.disabledButton]}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save period</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={closeForm}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      {periodEntries.map((entry) => (
        <View key={entry.id} style={styles.entryCard}>
          <View style={styles.entryContent}>
            <Text style={styles.entryTitle}>🩸 Period</Text>

            <Text style={styles.entryDate}>
              {formatDateOnly(entry.started_on)}
              {entry.ended_on ? ` – ${formatDateOnly(entry.ended_on)}` : ' — end date unknown'}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Edit period"
            accessibilityRole="button"
            onPress={() => {
              openEditForm(entry);
            }}
            style={styles.iconButton}
          >
            <Ionicons color={colors.primary} name="create-outline" size={20} />
          </Pressable>

          <Pressable
            accessibilityLabel="Delete period"
            accessibilityRole="button"
            disabled={deletingId === entry.id}
            onPress={() => {
              confirmDelete(entry);
            }}
            style={styles.iconButton}
          >
            {deletingId === entry.id ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <Ionicons color={colors.danger} name="trash-outline" size={20} />
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  addButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  formCard: {
    marginTop: 14,
    padding: 18,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  formTitle: {
    marginBottom: 18,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 50,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  saveButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    padding: 16,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  entryDate: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
});
