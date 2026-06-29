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

import { formatDateOnly, getTodayDateOnly } from '../../lib/date';

import { colors } from '../../theme/colors';
import { useAuth } from '../auth/AuthProvider';

import { createIntimacyEntry, getPartnerAliases, getRecentIntimacyEntries } from './repository';

import type {
  ConsentStatus,
  IntimacyCategory,
  IntimacyEntryWithAlias,
  JournalLocationCategory,
  JournalMood,
  PartnerAlias,
  ProtectionMethod,
} from './types';

import { intimacyEntrySchema } from './validation';

type JournalEntryManagerProps = {
  aliasRevision: number;
};

type LabeledOption<T extends string> = {
  value: T;
  label: string;
  emoji?: string;
};

const locationOptions: LabeledOption<JournalLocationCategory>[] = [
  {
    value: 'home',
    label: 'Home',
    emoji: '🏠',
  },
  {
    value: 'partner_home',
    label: 'Partner’s home',
    emoji: '🏡',
  },
  {
    value: 'hotel',
    label: 'Hotel',
    emoji: '🏨',
  },
  {
    value: 'travel',
    label: 'Travel',
    emoji: '🧳',
  },
  {
    value: 'other',
    label: 'Other',
    emoji: '📍',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

const protectionOptions: LabeledOption<ProtectionMethod>[] = [
  {
    value: 'barrier',
    label: 'Barrier',
    emoji: '🛡️',
  },
  {
    value: 'hormonal',
    label: 'Hormonal',
  },
  {
    value: 'barrier_and_hormonal',
    label: 'Barrier + hormonal',
    emoji: '🛡️',
  },
  {
    value: 'other',
    label: 'Other',
  },
  {
    value: 'none_recorded',
    label: 'None recorded',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

const consentOptions: LabeledOption<ConsentStatus>[] = [
  {
    value: 'consensual',
    label: 'Consensual',
  },
  {
    value: 'unsure',
    label: 'Unsure',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

const moodOptions: LabeledOption<JournalMood>[] = [
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
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

const categoryOptions: LabeledOption<IntimacyCategory>[] = [
  {
    value: 'affection',
    label: 'Affection',
    emoji: '💜',
  },
  {
    value: 'intimacy',
    label: 'Intimacy',
    emoji: '🌙',
  },
  {
    value: 'sexual_activity',
    label: 'Sexual activity',
    emoji: '🔒',
  },
  {
    value: 'other',
    label: 'Other',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

const locationLabels = Object.fromEntries(
  locationOptions.map((option) => [option.value, option.label]),
) as Record<JournalLocationCategory, string>;

const protectionLabels = Object.fromEntries(
  protectionOptions.map((option) => [option.value, option.label]),
) as Record<ProtectionMethod, string>;

const moodLabels = Object.fromEntries(
  moodOptions.map((option) => [option.value, `${option.emoji ?? ''} ${option.label}`.trim()]),
) as Record<JournalMood, string>;

function formatTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}

export function JournalEntryManager({ aliasRevision }: JournalEntryManagerProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const [entries, setEntries] = useState<IntimacyEntryWithAlias[]>([]);

  const [aliases, setAliases] = useState<PartnerAlias[]>([]);

  const [formOpen, setFormOpen] = useState(false);

  const [occurredOn, setOccurredOn] = useState(formatDateOnly(getTodayDateOnly()));

  const [approximateTime, setApproximateTime] = useState('');

  const [partnerAliasId, setPartnerAliasId] = useState<string | null>(null);

  const [locationCategory, setLocationCategory] = useState<JournalLocationCategory | null>(null);

  const [protectionMethod, setProtectionMethod] = useState<ProtectionMethod | null>(null);

  const [consentStatus, setConsentStatus] = useState<ConsentStatus>('prefer_not_to_say');

  const [moodBefore, setMoodBefore] = useState<JournalMood | null>(null);

  const [moodAfter, setMoodAfter] = useState<JournalMood | null>(null);

  const [intimacyCategory, setIntimacyCategory] = useState<IntimacyCategory | null>(null);

  const [tagsInput, setTagsInput] = useState('');

  const [privateNote, setPrivateNote] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const activeAliases = useMemo(() => aliases.filter((alias) => !alias.is_archived), [aliases]);

  const loadJournalData = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [aliasResult, entryResult] = await Promise.all([
        getPartnerAliases(userId),
        getRecentIntimacyEntries(userId),
      ]);

      setAliases(aliasResult);
      setEntries(entryResult);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load private journal data.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadJournalData();
  }, [aliasRevision, loadJournalData]);

  const resetForm = () => {
    setOccurredOn(formatDateOnly(getTodayDateOnly()));

    setApproximateTime('');
    setPartnerAliasId(null);
    setLocationCategory(null);
    setProtectionMethod(null);

    setConsentStatus('prefer_not_to_say');

    setMoodBefore(null);
    setMoodAfter(null);
    setIntimacyCategory(null);
    setTagsInput('');
    setPrivateNote('');
    setFormOpen(false);
  };

  const handleSave = async () => {
    if (!userId || isSaving) {
      return;
    }

    const result = intimacyEntrySchema.safeParse({
      partnerAliasId,
      occurredOn,
      approximateTime,
      locationCategory,
      protectionMethod,
      consentStatus,
      moodBefore,
      moodAfter,
      intimacyCategory,
      tagsInput,
      privateNote,
    });

    if (!result.success) {
      Alert.alert(
        'Check entry details',
        result.error.issues[0]?.message ?? 'Complete the required information.',
      );

      return;
    }

    setIsSaving(true);

    try {
      const savedEntry = await createIntimacyEntry(userId, {
        partnerAliasId: result.data.partnerAliasId,

        occurredOn: result.data.occurredOn,

        approximateTime: result.data.approximateTime,

        locationCategory: result.data.locationCategory,

        protectionMethod: result.data.protectionMethod,

        consentStatus: result.data.consentStatus,

        moodBefore: result.data.moodBefore,

        moodAfter: result.data.moodAfter,

        intimacyCategory: result.data.intimacyCategory,

        tags: result.data.tagsInput,

        privateNote: result.data.privateNote,
      });

      setEntries((currentEntries) =>
        [savedEntry, ...currentEntries].sort((first, second) => {
          const dateComparison = second.occurred_on.localeCompare(first.occurred_on);

          if (dateComparison !== 0) {
            return dateComparison;
          }

          return second.created_at.localeCompare(first.created_at);
        }),
      );

      resetForm();

      Alert.alert('Private entry saved', 'This entry is visible only inside your account.');
    } catch (error: unknown) {
      Alert.alert(
        'Unable to save entry',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />

        <Text style={styles.loadingText}>Loading your private journal…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Private entries</Text>

          <Text style={styles.description}>Record only the details that are useful to you.</Text>
        </View>

        {!formOpen ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFormOpen(true);
            }}
            style={styles.addButton}
          >
            <Ionicons color={colors.textOnPrimary} name="add" size={19} />

            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      {loadError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{loadError}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadJournalData();
            }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}

      {formOpen ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New private entry</Text>

          <Text style={styles.label}>Date</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={setOccurredOn}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={occurredOn}
          />

          <Text style={styles.label}>Approximate time</Text>

          <TextInput
            editable={!isSaving}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            onChangeText={setApproximateTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={approximateTime}
          />

          <Text style={styles.helperText}>
            Time is optional. Use 24-hour format, for example 21:30.
          </Text>

          <Text style={styles.label}>Private alias</Text>

          <View style={styles.chipContainer}>
            <SelectionChip
              label="No alias"
              onPress={() => {
                setPartnerAliasId(null);
              }}
              selected={partnerAliasId === null}
            />

            {activeAliases.map((alias) => (
              <SelectionChip
                key={alias.id}
                label={`${alias.emoji ?? '👤'} ${alias.alias_name}`}
                onPress={() => {
                  setPartnerAliasId(alias.id);
                }}
                selected={partnerAliasId === alias.id}
              />
            ))}
          </View>

          <OptionSection
            label="General location"
            onChange={setLocationCategory}
            options={locationOptions}
            value={locationCategory}
          />

          <OptionSection
            label="Protection record"
            onChange={setProtectionMethod}
            options={protectionOptions}
            value={protectionMethod}
          />

          <Text style={styles.noticeText}>
            Protection records are informational and do not confirm pregnancy or STI outcomes.
          </Text>

          <OptionSection
            allowClear={false}
            label="Consent reflection"
            onChange={(value) => {
              if (value !== null) {
                setConsentStatus(value);
              }
            }}
            options={consentOptions}
            value={consentStatus}
          />

          <Text style={styles.noticeText}>
            This private reflection is not a legal consent record.
          </Text>

          <OptionSection
            label="Mood before"
            onChange={setMoodBefore}
            options={moodOptions}
            value={moodBefore}
          />

          <OptionSection
            label="Mood after"
            onChange={setMoodAfter}
            options={moodOptions}
            value={moodAfter}
          />

          <OptionSection
            label="Entry category"
            onChange={setIntimacyCategory}
            options={categoryOptions}
            value={intimacyCategory}
          />

          <Text style={styles.label}>Optional tags</Text>

          <TextInput
            editable={!isSaving}
            maxLength={300}
            onChangeText={setTagsInput}
            placeholder="Example: caring, relaxed"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={tagsInput}
          />

          <Text style={styles.helperText}>Separate tags with commas. Maximum 10 tags.</Text>

          <Text style={styles.label}>Optional private note</Text>

          <TextInput
            editable={!isSaving}
            maxLength={2000}
            multiline
            onChangeText={setPrivateNote}
            placeholder="Only you can see this note."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.noteInput]}
            textAlignVertical="top"
            value={privateNote}
          />

          <Text style={styles.characterCount}>{privateNote.length}/2000</Text>

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
              <Text style={styles.saveButtonText}>Save private entry</Text>
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

      <Text style={styles.sectionTitle}>Recent entries</Text>

      {entries.length > 0 ? (
        entries.map((entry) => <JournalEntryCard entry={entry} key={entry.id} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🔒</Text>

          <Text style={styles.emptyTitle}>No private entries yet</Text>

          <Text style={styles.emptyText}>
            Add an entry when you are ready. Every optional field can be left blank.
          </Text>
        </View>
      )}
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

type OptionSectionProps<T extends string> = {
  label: string;
  value: T | null;
  options: LabeledOption<T>[];
  onChange: (value: T | null) => void;
  allowClear?: boolean;
};

function OptionSection<T extends string>({
  label,
  value,
  options,
  onChange,
  allowClear = true,
}: OptionSectionProps<T>) {
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
                onChange(selected && allowClear ? null : option.value);
              }}
              selected={selected}
            />
          );
        })}
      </View>
    </>
  );
}

type JournalEntryCardProps = {
  entry: IntimacyEntryWithAlias;
};

function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const time = formatTime(entry.approximate_time);

  const location = entry.location_category ? locationLabels[entry.location_category] : null;

  const protection = entry.protection_method ? protectionLabels[entry.protection_method] : null;

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryIcon}>
          <Text style={styles.entryEmoji}>{entry.partner_alias?.emoji ?? '🔒'}</Text>
        </View>

        <View style={styles.entryHeading}>
          <Text style={styles.entryDate}>
            {formatDateOnly(entry.occurred_on)}
            {time ? ` • ${time}` : ''}
          </Text>

          <Text style={styles.entryAlias}>
            {entry.partner_alias?.alias_name ?? 'Private entry'}
          </Text>
        </View>
      </View>

      <View style={styles.entryDetails}>
        {location ? <Text style={styles.detailText}>📍 {location}</Text> : null}

        {protection ? <Text style={styles.detailText}>🛡️ {protection}</Text> : null}

        {entry.mood_after ? (
          <Text style={styles.detailText}>Mood after: {moodLabels[entry.mood_after]}</Text>
        ) : null}
      </View>

      {entry.tags.length > 0 ? (
        <View style={styles.tagContainer}>
          {entry.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {entry.private_note ? (
        <Text numberOfLines={2} style={styles.privateNotePreview}>
          🔒 Private note saved
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 30,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 45,
  },
  loadingText: {
    marginTop: 13,
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
  errorCard: {
    marginTop: 14,
    padding: 16,
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
    marginBottom: 19,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    marginTop: 5,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    minHeight: 50,
    marginBottom: 10,
    paddingHorizontal: 15,
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
  helperText: {
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  noticeText: {
    marginTop: -2,
    marginBottom: 15,
    fontSize: 12,
    lineHeight: 18,
    color: colors.warning,
  },
  characterCount: {
    marginTop: -5,
    fontSize: 12,
    textAlign: 'right',
    color: colors.textMuted,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 13,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 13,
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
  sectionTitle: {
    marginTop: 27,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  entryCard: {
    marginBottom: 12,
    padding: 17,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIcon: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: colors.primarySurface,
  },
  entryEmoji: {
    fontSize: 21,
  },
  entryHeading: {
    flex: 1,
    marginLeft: 12,
  },
  entryDate: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  entryAlias: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textMuted,
  },
  entryDetails: {
    marginTop: 12,
  },
  detailText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tag: {
    marginRight: 7,
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
  },
  privateNotePreview: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
    marginTop: 11,
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
});
