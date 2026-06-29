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

import {
  createDailyCycleLog,
  deleteDailyCycleLog,
  getDailyCycleLogs,
  updateDailyCycleLog,
} from './repository';

import type {
  CycleDailyMood,
  CycleEnergyLevel,
  CycleFlowLevel,
  CycleSymptom,
  DailyCycleLog,
} from './types';

import { dailyCycleLogSchema } from './dailyLogValidation';

type FormMode =
  | {
      type: 'closed';
    }
  | {
      type: 'create';
    }
  | {
      type: 'edit';
      logId: string;
    };

type LabeledOption<T extends string> = {
  value: T;
  label: string;
  emoji?: string;
};

const flowOptions: LabeledOption<CycleFlowLevel>[] = [
  {
    value: 'spotting',
    label: 'Spotting',
    emoji: '🩸',
  },
  {
    value: 'light',
    label: 'Light',
    emoji: '🩸',
  },
  {
    value: 'medium',
    label: 'Medium',
    emoji: '🩸',
  },
  {
    value: 'heavy',
    label: 'Heavy',
    emoji: '🩸',
  },
];

const moodOptions: LabeledOption<CycleDailyMood>[] = [
  {
    value: 'very_low',
    label: 'Very low',
    emoji: '😞',
  },
  {
    value: 'low',
    label: 'Low',
    emoji: '🙁',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    emoji: '😐',
  },
  {
    value: 'good',
    label: 'Good',
    emoji: '🙂',
  },
  {
    value: 'very_good',
    label: 'Very good',
    emoji: '😊',
  },
];

const energyOptions: LabeledOption<CycleEnergyLevel>[] = [
  {
    value: 'very_low',
    label: 'Very low',
    emoji: '🪫',
  },
  {
    value: 'low',
    label: 'Low',
    emoji: '🔋',
  },
  {
    value: 'medium',
    label: 'Medium',
    emoji: '🔋',
  },
  {
    value: 'high',
    label: 'High',
    emoji: '⚡',
  },
  {
    value: 'very_high',
    label: 'Very high',
    emoji: '⚡',
  },
];

const symptomOptions: LabeledOption<CycleSymptom>[] = [
  {
    value: 'cramps',
    label: 'Cramps',
  },
  {
    value: 'bloating',
    label: 'Bloating',
  },
  {
    value: 'headache',
    label: 'Headache',
  },
  {
    value: 'backache',
    label: 'Backache',
  },
  {
    value: 'fatigue',
    label: 'Fatigue',
  },
  {
    value: 'breast_tenderness',
    label: 'Breast tenderness',
  },
  {
    value: 'nausea',
    label: 'Nausea',
  },
  {
    value: 'acne',
    label: 'Acne',
  },
  {
    value: 'cravings',
    label: 'Cravings',
  },
  {
    value: 'mood_changes',
    label: 'Mood changes',
  },
  {
    value: 'sleep_changes',
    label: 'Sleep changes',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const flowLabels = Object.fromEntries(
  flowOptions.map((option) => [option.value, option.label]),
) as Record<CycleFlowLevel, string>;

const moodLabels = Object.fromEntries(
  moodOptions.map((option) => [option.value, `${option.emoji ?? ''} ${option.label}`.trim()]),
) as Record<CycleDailyMood, string>;

const energyLabels = Object.fromEntries(
  energyOptions.map((option) => [option.value, `${option.emoji ?? ''} ${option.label}`.trim()]),
) as Record<CycleEnergyLevel, string>;

const symptomLabels = Object.fromEntries(
  symptomOptions.map((option) => [option.value, option.label]),
) as Record<CycleSymptom, string>;

function sortLogs(logs: DailyCycleLog[]): DailyCycleLog[] {
  return [...logs].sort((first, second) => second.logged_on.localeCompare(first.logged_on));
}

export function DailyCycleLogManager() {
  const { user } = useAuth();
  const userId = user?.id;

  const [logs, setLogs] = useState<DailyCycleLog[]>([]);

  const [formMode, setFormMode] = useState<FormMode>({
    type: 'closed',
  });

  const [loggedOn, setLoggedOn] = useState(formatDateOnly(getTodayDateOnly()));

  const [flowLevel, setFlowLevel] = useState<CycleFlowLevel | null>(null);

  const [mood, setMood] = useState<CycleDailyMood | null>(null);

  const [energyLevel, setEnergyLevel] = useState<CycleEnergyLevel | null>(null);

  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([]);

  const [privateNote, setPrivateNote] = useState('');

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const latestLog = useMemo(() => logs[0] ?? null, [logs]);

  const loadLogs = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const today = getTodayDateOnly();

      const result = await getDailyCycleLogs(userId, addDaysToDateOnly(today, -180), today);

      setLogs(sortLogs(result));
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load daily cycle logs.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const resetForm = () => {
    setLoggedOn(formatDateOnly(getTodayDateOnly()));

    setFlowLevel(null);
    setMood(null);
    setEnergyLevel(null);
    setSymptoms([]);
    setPrivateNote('');

    setFormMode({
      type: 'closed',
    });
  };

  const openCreateForm = () => {
    resetForm();

    setFormMode({
      type: 'create',
    });
  };

  const openEditForm = (log: DailyCycleLog) => {
    setLoggedOn(formatDateOnly(log.logged_on));

    setFlowLevel(log.flow_level);
    setMood(log.mood);
    setEnergyLevel(log.energy_level);
    setSymptoms(log.symptoms);

    setPrivateNote(log.private_note ?? '');

    setExpandedLogId(null);

    setFormMode({
      type: 'edit',
      logId: log.id,
    });
  };

  const toggleSymptom = (symptom: CycleSymptom) => {
    setSymptoms((currentSymptoms) =>
      currentSymptoms.includes(symptom)
        ? currentSymptoms.filter((currentSymptom) => currentSymptom !== symptom)
        : [...currentSymptoms, symptom],
    );
  };

  const applySavedLog = (savedLog: DailyCycleLog) => {
    setLogs((currentLogs) => {
      const exists = currentLogs.some((log) => log.id === savedLog.id);

      const nextLogs = exists
        ? currentLogs.map((log) => (log.id === savedLog.id ? savedLog : log))
        : [savedLog, ...currentLogs];

      return sortLogs(nextLogs);
    });
  };

  const handleSave = async () => {
    if (!userId || isSaving) {
      return;
    }

    const result = dailyCycleLogSchema.safeParse({
      loggedOn,
      flowLevel,
      mood,
      energyLevel,
      symptoms,
      privateNote,
    });

    if (!result.success) {
      Alert.alert(
        'Check daily log',
        result.error.issues[0]?.message ?? 'Review the entered information.',
      );

      return;
    }

    const duplicateLog = logs.find(
      (log) =>
        log.logged_on === result.data.loggedOn &&
        !(formMode.type === 'edit' && log.id === formMode.logId),
    );

    if (duplicateLog) {
      Alert.alert(
        'Log already exists',
        `A daily log already exists for ${formatDateOnly(
          result.data.loggedOn,
        )}. Edit the existing log instead.`,
      );

      return;
    }

    setIsSaving(true);

    try {
      const input = {
        loggedOn: result.data.loggedOn,
        flowLevel: result.data.flowLevel,
        mood: result.data.mood,
        energyLevel: result.data.energyLevel,
        symptoms: result.data.symptoms,
        privateNote: result.data.privateNote,
      };

      let savedLog: DailyCycleLog;

      if (formMode.type === 'edit') {
        savedLog = await updateDailyCycleLog(formMode.logId, userId, input);
      } else {
        savedLog = await createDailyCycleLog(userId, input);
      }

      applySavedLog(savedLog);
      resetForm();

      Alert.alert(
        'Daily log saved',
        `Your check-in for ${formatDateOnly(savedLog.logged_on)} was saved.`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to save the daily log.';

      Alert.alert(
        'Unable to save log',
        message.includes('daily_cycle_logs_owner_date_unique')
          ? 'A daily log already exists for this date.'
          : message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (log: DailyCycleLog) => {
    if (deletingId) {
      return;
    }

    Alert.alert(
      'Delete daily log?',
      `Permanently delete the log from ${formatDateOnly(log.logged_on)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete(log);
          },
        },
      ],
    );
  };

  const handleDelete = async (log: DailyCycleLog) => {
    if (!userId) {
      return;
    }

    setDeletingId(log.id);

    try {
      await deleteDailyCycleLog(log.id, userId);

      setLogs((currentLogs) => currentLogs.filter((currentLog) => currentLog.id !== log.id));

      setExpandedLogId((currentId) => (currentId === log.id ? null : currentId));

      if (formMode.type === 'edit' && formMode.logId === log.id) {
        resetForm();
      }
    } catch (error: unknown) {
      Alert.alert(
        'Unable to delete log',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />

        <Text style={styles.loadingText}>Loading daily check-ins…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Daily check-in</Text>

          <Text style={styles.description}>
            Privately record how you feel throughout your cycle.
          </Text>
        </View>

        {formMode.type === 'closed' ? (
          <Pressable accessibilityRole="button" onPress={openCreateForm} style={styles.addButton}>
            <Ionicons color={colors.textOnPrimary} name="add" size={19} />

            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <SummaryItem label="Recent logs" value={String(logs.length)} />

        <View style={styles.summaryDivider} />

        <SummaryItem
          label="Latest"
          value={latestLog ? formatDateOnly(latestLog.logged_on) : 'None'}
        />
      </View>

      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadLogs();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {formMode.type !== 'closed' ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {formMode.type === 'edit' ? 'Edit daily check-in' : 'New daily check-in'}
          </Text>

          <Text style={styles.label}>Date</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setLoggedOn}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={loggedOn}
          />

          <OptionSection
            label="Flow"
            onChange={setFlowLevel}
            options={flowOptions}
            value={flowLevel}
          />

          <OptionSection label="Mood" onChange={setMood} options={moodOptions} value={mood} />

          <OptionSection
            label="Energy"
            onChange={setEnergyLevel}
            options={energyOptions}
            value={energyLevel}
          />

          <Text style={styles.label}>Symptoms</Text>

          <View style={styles.chipContainer}>
            {symptomOptions.map((option) => {
              const selected = symptoms.includes(option.value);

              return (
                <SelectionChip
                  key={option.value}
                  label={option.label}
                  onPress={() => {
                    toggleSymptom(option.value);
                  }}
                  selected={selected}
                />
              );
            })}
          </View>

          <Text style={styles.label}>Optional private note</Text>

          <TextInput
            editable={!isSaving}
            maxLength={1000}
            multiline
            onChangeText={setPrivateNote}
            placeholder="Only you can see this note."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.noteInput]}
            textAlignVertical="top"
            value={privateNote}
          />

          <Text style={styles.characterCount}>{privateNote.length}/1000</Text>

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
              <Text style={styles.saveButtonText}>
                {formMode.type === 'edit' ? 'Update daily log' : 'Save daily log'}
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={resetForm}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Recent daily logs</Text>

      {logs.length > 0 ? (
        logs.map((log) => (
          <DailyLogCard
            deleting={deletingId === log.id}
            expanded={expandedLogId === log.id}
            key={log.id}
            log={log}
            onDelete={() => {
              confirmDelete(log);
            }}
            onEdit={() => {
              openEditForm(log);
            }}
            onToggle={() => {
              setExpandedLogId((currentId) => (currentId === log.id ? null : log.id));
            }}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌙</Text>

          <Text style={styles.emptyTitle}>No daily logs yet</Text>

          <Text style={styles.emptyText}>Add a private check-in when you are ready.</Text>
        </View>
      )}

      <Text style={styles.notice}>
        Daily cycle logs are personal observations and are not medical diagnosis.
      </Text>
    </View>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type SelectionChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function SelectionChip({ label, selected, onPress }: SelectionChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type OptionSectionProps<Value extends string> = {
  label: string;
  value: Value | null;
  options: LabeledOption<Value>[];
  onChange: (value: Value | null) => void;
};

function OptionSection<Value extends string>({
  label,
  value,
  options,
  onChange,
}: OptionSectionProps<Value>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.chipContainer}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <SelectionChip
              key={option.value}
              label={`${option.emoji ?? ''} ${option.label}`.trim()}
              onPress={() => {
                onChange(selected ? null : option.value);
              }}
              selected={selected}
            />
          );
        })}
      </View>
    </>
  );
}

type DailyLogCardProps = {
  log: DailyCycleLog;
  expanded: boolean;
  deleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function DailyLogCard({ log, expanded, deleting, onToggle, onEdit, onDelete }: DailyLogCardProps) {
  return (
    <View style={styles.logCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded,
        }}
        onPress={onToggle}
      >
        <View style={styles.logHeader}>
          <View style={styles.logIcon}>
            <Text style={styles.logEmoji}>{log.flow_level ? '🩸' : '🌙'}</Text>
          </View>

          <View style={styles.logHeading}>
            <Text style={styles.logDate}>{formatDateOnly(log.logged_on)}</Text>

            <Text style={styles.logPreview}>
              {[
                log.flow_level ? flowLabels[log.flow_level] : null,

                log.mood ? moodLabels[log.mood] : null,

                log.energy_level ? energyLabels[log.energy_level] : null,
              ]
                .filter(Boolean)
                .join(' • ') || 'Private daily check-in'}
            </Text>
          </View>

          <Ionicons
            color={colors.textMuted}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
          />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {log.flow_level ? <DetailRow label="Flow" value={flowLabels[log.flow_level]} /> : null}

          {log.mood ? <DetailRow label="Mood" value={moodLabels[log.mood]} /> : null}

          {log.energy_level ? (
            <DetailRow label="Energy" value={energyLabels[log.energy_level]} />
          ) : null}

          {log.symptoms.length > 0 ? (
            <View style={styles.symptomSection}>
              <Text style={styles.detailLabel}>Symptoms</Text>

              <View style={styles.symptomContainer}>
                {log.symptoms.map((symptom) => (
                  <View key={symptom} style={styles.symptomTag}>
                    <Text style={styles.symptomTagText}>{symptomLabels[symptom]}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {log.private_note ? (
            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>🔒 Private note</Text>

              <Text style={styles.noteText}>{log.private_note}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editButton}>
              <Ionicons color={colors.primary} name="create-outline" size={19} />

              <Text style={styles.editText}>Edit</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={onDelete}
              style={styles.deleteButton}
            >
              {deleting ? (
                <ActivityIndicator color={colors.danger} size="small" />
              ) : (
                <>
                  <Ionicons color={colors.danger} name="trash-outline" size={19} />

                  <Text style={styles.deleteText}>Delete</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 28,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 45,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  addButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  summaryCard: {
    flexDirection: 'row',
    marginTop: 17,
    paddingVertical: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  errorCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: colors.dangerSurface,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.danger,
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  formCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  formTitle: {
    marginBottom: 18,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    marginTop: 5,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 50,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surfaceSoft,
    fontSize: 16,
    color: colors.textPrimary,
  },
  noteInput: {
    minHeight: 110,
    paddingTop: 14,
    paddingBottom: 14,
  },
  characterCount: {
    marginTop: -6,
    fontSize: 12,
    textAlign: 'right',
    color: colors.textMuted,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  saveButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textOnPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logCard: {
    marginBottom: 11,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: colors.primarySurface,
  },
  logEmoji: {
    fontSize: 21,
  },
  logHeading: {
    flex: 1,
    marginLeft: 12,
  },
  logDate: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logPreview: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  expandedContent: {
    marginTop: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
    backgroundColor: colors.divider,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    flex: 1.3,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    color: colors.textPrimary,
  },
  symptomSection: {
    marginTop: 9,
  },
  symptomContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 9,
  },
  symptomTag: {
    marginRight: 7,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
  },
  symptomTagText: {
    fontSize: 12,
    color: colors.primary,
  },
  noteCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 13,
    backgroundColor: colors.surfaceSoft,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  noteText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 15,
  },
  editButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
  },
  editText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 13,
    backgroundColor: colors.dangerSurface,
  },
  deleteText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  emptyEmoji: {
    fontSize: 30,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  notice: {
    marginTop: 15,
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.infoSurface,
    fontSize: 12,
    lineHeight: 18,
    color: colors.info,
  },
});
