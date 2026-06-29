import type { ComponentProps } from 'react';

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

import { Calendar } from 'react-native-calendars';

import { formatDateOnly, getTodayDateOnly } from '../../lib/date';

import { colors } from '../../theme/colors';
import { useAuth } from '../auth/AuthProvider';

import {
  createIntimacyEntry,
  deleteIntimacyEntry,
  getPartnerAliases,
  getRecentIntimacyEntries,
  updateIntimacyEntry,
} from './repository';

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

type CalendarMarkedDates = NonNullable<ComponentProps<typeof Calendar>['markedDates']>;

type JournalEntryManagerProps = {
  aliasRevision: number;
};

type JournalViewMode = 'calendar' | 'list' | 'guide';

type EntryFormMode =
  | {
      type: 'closed';
    }
  | {
      type: 'create';
    }
  | {
      type: 'edit';
      entryId: string;
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

const consentLabels = Object.fromEntries(
  consentOptions.map((option) => [option.value, option.label]),
) as Record<ConsentStatus, string>;

const moodLabels = Object.fromEntries(
  moodOptions.map((option) => [option.value, `${option.emoji ?? ''} ${option.label}`.trim()]),
) as Record<JournalMood, string>;

const categoryLabels = Object.fromEntries(
  categoryOptions.map((option) => [option.value, `${option.emoji ?? ''} ${option.label}`.trim()]),
) as Record<IntimacyCategory, string>;

function formatTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}

function sortEntries(entries: IntimacyEntryWithAlias[]): IntimacyEntryWithAlias[] {
  return [...entries].sort((first, second) => {
    const dateComparison = second.occurred_on.localeCompare(first.occurred_on);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return second.created_at.localeCompare(first.created_at);
  });
}

export function JournalEntryManager({ aliasRevision }: JournalEntryManagerProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const [entries, setEntries] = useState<IntimacyEntryWithAlias[]>([]);

  const [aliases, setAliases] = useState<PartnerAlias[]>([]);

  const [viewMode, setViewMode] = useState<JournalViewMode>('calendar');

  const [selectedDate, setSelectedDate] = useState(getTodayDateOnly());

  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<EntryFormMode>({
    type: 'closed',
  });

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

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const activeAliases = useMemo(() => aliases.filter((alias) => !alias.is_archived), [aliases]);

  const selectedAlias = useMemo(
    () => aliases.find((alias) => alias.id === partnerAliasId) ?? null,
    [aliases, partnerAliasId],
  );

  const formAliases = useMemo(() => {
    if (
      selectedAlias &&
      selectedAlias.is_archived &&
      !activeAliases.some((alias) => alias.id === selectedAlias.id)
    ) {
      return [...activeAliases, selectedAlias];
    }

    return activeAliases;
  }, [activeAliases, selectedAlias]);

  const selectedDateEntries = useMemo(
    () => entries.filter((entry) => entry.occurred_on === selectedDate),
    [entries, selectedDate],
  );

  const markedDates = useMemo<CalendarMarkedDates>(() => {
    const result: CalendarMarkedDates = {};

    for (const entry of entries) {
      result[entry.occurred_on] = {
        dots: [
          {
            key: 'journal-entry',
            color: colors.primary,
          },
        ],
      };
    }

    const currentSelection = result[selectedDate] ?? {};

    result[selectedDate] = {
      ...currentSelection,
      selected: true,
      selectedColor: colors.primary,
    };

    return result;
  }, [entries, selectedDate]);

  const loadJournalData = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [aliasResult, entryResult] = await Promise.all([
        getPartnerAliases(userId),

        getRecentIntimacyEntries(userId, 100),
      ]);

      setAliases(aliasResult);
      setEntries(sortEntries(entryResult));
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

  const openEditForm = (entry: IntimacyEntryWithAlias) => {
    setOccurredOn(formatDateOnly(entry.occurred_on));

    setApproximateTime(formatTime(entry.approximate_time) ?? '');

    setPartnerAliasId(entry.partner_alias_id);

    setLocationCategory(entry.location_category);

    setProtectionMethod(entry.protection_method);

    setConsentStatus(entry.consent_status);

    setMoodBefore(entry.mood_before);
    setMoodAfter(entry.mood_after);

    setIntimacyCategory(entry.intimacy_category);

    setTagsInput(entry.tags.join(', '));

    setPrivateNote(entry.private_note ?? '');

    setExpandedEntryId(null);

    setFormMode({
      type: 'edit',
      entryId: entry.id,
    });
  };

  const applySavedEntry = (savedEntry: IntimacyEntryWithAlias) => {
    setEntries((currentEntries) => {
      const exists = currentEntries.some((entry) => entry.id === savedEntry.id);

      const nextEntries = exists
        ? currentEntries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
        : [savedEntry, ...currentEntries];

      return sortEntries(nextEntries);
    });
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
      const input = {
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
      };

      let savedEntry: IntimacyEntryWithAlias;

      if (formMode.type === 'edit') {
        savedEntry = await updateIntimacyEntry(formMode.entryId, userId, input);
      } else {
        savedEntry = await createIntimacyEntry(userId, input);
      }

      applySavedEntry(savedEntry);

      setSelectedDate(savedEntry.occurred_on);

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

  const confirmDelete = (entry: IntimacyEntryWithAlias) => {
    if (!userId || deletingId) {
      return;
    }

    Alert.alert(
      'Delete private entry?',
      `Permanently delete the entry from ${formatDateOnly(entry.occurred_on)}?`,
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
    if (!userId) {
      return;
    }

    setDeletingId(entryId);

    try {
      await deleteIntimacyEntry(entryId, userId);

      setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== entryId));

      setExpandedEntryId((currentId) => (currentId === entryId ? null : currentId));

      if (formMode.type === 'edit' && formMode.entryId === entryId) {
        resetForm();
      }
    } catch (error: unknown) {
      Alert.alert(
        'Unable to delete entry',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setDeletingId(null);
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

        {formMode.type === 'closed' ? (
          <Pressable accessibilityRole="button" onPress={openCreateForm} style={styles.addButton}>
            <Ionicons color={colors.textOnPrimary} name="add" size={19} />

            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summaryCard}>
        <SummaryItem label="Total entries" value={entries.length} />

        <View style={styles.summaryDivider} />

        <SummaryItem label="Selected date" value={selectedDateEntries.length} />
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

      {formMode.type !== 'closed' ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {formMode.type === 'edit' ? 'Edit private entry' : 'New private entry'}
          </Text>

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

            {formAliases.map((alias) => (
              <SelectionChip
                key={alias.id}
                label={`${alias.emoji ?? '👤'} ${alias.alias_name}${
                  alias.is_archived ? ' (Archived)' : ''
                }`}
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
              <Text style={styles.saveButtonText}>
                {formMode.type === 'edit' ? 'Update private entry' : 'Save private entry'}
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

      <View style={styles.viewSelector}>
        <ViewModeButton
          emoji="📅"
          label="Calendar"
          onPress={() => {
            setViewMode('calendar');
          }}
          selected={viewMode === 'calendar'}
        />

        <ViewModeButton
          emoji="📋"
          label="List"
          onPress={() => {
            setViewMode('list');
          }}
          selected={viewMode === 'list'}
        />

        <ViewModeButton
          emoji="ℹ️"
          label="Guide"
          onPress={() => {
            setViewMode('guide');
          }}
          selected={viewMode === 'guide'}
        />
      </View>

      {viewMode === 'calendar' ? (
        <JournalCalendarView
          deletingId={deletingId}
          entries={selectedDateEntries}
          markedDates={markedDates}
          onDelete={confirmDelete}
          onEdit={openEditForm}
          onSelectDate={setSelectedDate}
          onToggleEntry={(entryId) => {
            setExpandedEntryId((currentId) => (currentId === entryId ? null : entryId));
          }}
          selectedDate={selectedDate}
          expandedEntryId={expandedEntryId}
        />
      ) : null}

      {viewMode === 'list' ? (
        <JournalListView
          deletingId={deletingId}
          entries={entries}
          expandedEntryId={expandedEntryId}
          onDelete={confirmDelete}
          onEdit={openEditForm}
          onToggleEntry={(entryId) => {
            setExpandedEntryId((currentId) => (currentId === entryId ? null : entryId));
          }}
        />
      ) : null}

      {viewMode === 'guide' ? <JournalGuide /> : null}
    </View>
  );
}

type SummaryItemProps = {
  label: string;
  value: number;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type ViewModeButtonProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ViewModeButton({ emoji, label, selected, onPress }: ViewModeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      onPress={onPress}
      style={[styles.viewButton, selected && styles.viewButtonSelected]}
    >
      <Text style={styles.viewEmoji}>{emoji}</Text>

      <Text style={[styles.viewText, selected && styles.viewTextSelected]}>{label}</Text>
    </Pressable>
  );
}

type JournalCalendarViewProps = {
  selectedDate: string;
  markedDates: CalendarMarkedDates;
  entries: IntimacyEntryWithAlias[];
  expandedEntryId: string | null;
  deletingId: string | null;
  onSelectDate: (date: string) => void;
  onToggleEntry: (entryId: string) => void;
  onEdit: (entry: IntimacyEntryWithAlias) => void;
  onDelete: (entry: IntimacyEntryWithAlias) => void;
};

function JournalCalendarView({
  selectedDate,
  markedDates,
  entries,
  expandedEntryId,
  deletingId,
  onSelectDate,
  onToggleEntry,
  onEdit,
  onDelete,
}: JournalCalendarViewProps) {
  return (
    <>
      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          enableSwipeMonths
          firstDay={1}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => {
            onSelectDate(day.dateString);
          }}
          theme={{
            backgroundColor: colors.surface,

            calendarBackground: colors.surface,

            todayTextColor: colors.primary,

            selectedDayBackgroundColor: colors.primary,

            selectedDayTextColor: colors.textOnPrimary,

            arrowColor: colors.primary,

            monthTextColor: colors.textPrimary,

            textMonthFontWeight: '700',

            textDayFontWeight: '500',

            textDayHeaderFontWeight: '600',
          }}
        />
      </View>

      <View style={styles.calendarGuide}>
        <View style={styles.calendarDot} />

        <Text style={styles.calendarGuideText}>
          A discreet dot indicates that a private entry exists on that date.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{formatDateOnly(selectedDate)}</Text>

      {entries.length > 0 ? (
        entries.map((entry) => (
          <JournalEntryCard
            deleting={deletingId === entry.id}
            entry={entry}
            expanded={expandedEntryId === entry.id}
            key={entry.id}
            onDelete={() => {
              onDelete(entry);
            }}
            onEdit={() => {
              onEdit(entry);
            }}
            onToggle={() => {
              onToggleEntry(entry.id);
            }}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📅</Text>

          <Text style={styles.emptyTitle}>No entry on this date</Text>

          <Text style={styles.emptyText}>Select another date or add a new private entry.</Text>
        </View>
      )}
    </>
  );
}

type JournalListViewProps = {
  entries: IntimacyEntryWithAlias[];
  expandedEntryId: string | null;
  deletingId: string | null;
  onToggleEntry: (entryId: string) => void;
  onEdit: (entry: IntimacyEntryWithAlias) => void;
  onDelete: (entry: IntimacyEntryWithAlias) => void;
};

function JournalListView({
  entries,
  expandedEntryId,
  deletingId,
  onToggleEntry,
  onEdit,
  onDelete,
}: JournalListViewProps) {
  return (
    <>
      <Text style={styles.listIntro}>
        Entries are ordered from newest to oldest. Private notes remain hidden until you expand an
        entry.
      </Text>

      <Text style={styles.sectionTitle}>All private entries</Text>

      {entries.length > 0 ? (
        entries.map((entry) => (
          <JournalEntryCard
            deleting={deletingId === entry.id}
            entry={entry}
            expanded={expandedEntryId === entry.id}
            key={entry.id}
            onDelete={() => {
              onDelete(entry);
            }}
            onEdit={() => {
              onEdit(entry);
            }}
            onToggle={() => {
              onToggleEntry(entry.id);
            }}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🔒</Text>

          <Text style={styles.emptyTitle}>No private entries yet</Text>

          <Text style={styles.emptyText}>Add an entry when you are ready.</Text>
        </View>
      )}
    </>
  );
}

function JournalGuide() {
  return (
    <>
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Journal guide</Text>

        <GuideRow
          emoji="📅"
          text="Calendar markers are deliberately discreet and do not reveal entry details."
          title="Calendar"
        />

        <GuideRow emoji="📋" text="List view shows entries from newest to oldest." title="List" />

        <GuideRow
          emoji="🔒"
          text="Tap an entry to reveal its private details and notes."
          title="Entry details"
        />

        <GuideRow
          emoji="✏️"
          text="Editing immediately updates both Calendar and List views."
          title="Editing"
        />

        <GuideRow
          emoji="🗑️"
          text="Deletion is permanent and requires confirmation."
          title="Deletion"
        />
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Privacy information</Text>

        <Text style={styles.guideParagraph}>
          Entries belong only to your authenticated account. Partner aliases do not notify or
          connect to another person.
        </Text>

        <Text style={styles.guideParagraph}>
          Private journal records are not included in consent-based sharing.
        </Text>

        <Text style={styles.guideWarning}>
          Protection records are informational only and do not confirm pregnancy, contraception, STI
          status, or medical outcomes.
        </Text>

        <Text style={styles.guideWarning}>
          Consent reflection is a private personal field and is not a legal consent record.
        </Text>
      </View>
    </>
  );
}

type GuideRowProps = {
  emoji: string;
  title: string;
  text: string;
};

function GuideRow({ emoji, title, text }: GuideRowProps) {
  return (
    <View style={styles.guideRow}>
      <Text style={styles.guideEmoji}>{emoji}</Text>

      <View style={styles.guideContent}>
        <Text style={styles.guideRowTitle}>{title}</Text>

        <Text style={styles.guideText}>{text}</Text>
      </View>
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
  expanded: boolean;
  deleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function JournalEntryCard({
  entry,
  expanded,
  deleting,
  onToggle,
  onEdit,
  onDelete,
}: JournalEntryCardProps) {
  const time = formatTime(entry.approximate_time);

  const location = entry.location_category ? locationLabels[entry.location_category] : null;

  const protection = entry.protection_method ? protectionLabels[entry.protection_method] : null;

  return (
    <View style={styles.entryCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded,
        }}
        onPress={onToggle}
        style={styles.entryPressable}
      >
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

          <Ionicons
            color={colors.textMuted}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
          />
        </View>

        <View style={styles.entryPreview}>
          {entry.intimacy_category ? (
            <Text style={styles.detailText}>{categoryLabels[entry.intimacy_category]}</Text>
          ) : null}

          {entry.tags.length > 0 ? (
            <Text style={styles.previewText}>
              {entry.tags.length} {entry.tags.length === 1 ? 'tag' : 'tags'}
            </Text>
          ) : null}

          {entry.private_note ? <Text style={styles.previewText}>🔒 Private note</Text> : null}
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {location ? <DetailRow label="Location" value={`📍 ${location}`} /> : null}

          {protection ? <DetailRow label="Protection" value={`🛡️ ${protection}`} /> : null}

          <DetailRow label="Consent reflection" value={consentLabels[entry.consent_status]} />

          {entry.mood_before ? (
            <DetailRow label="Mood before" value={moodLabels[entry.mood_before]} />
          ) : null}

          {entry.mood_after ? (
            <DetailRow label="Mood after" value={moodLabels[entry.mood_after]} />
          ) : null}

          {entry.intimacy_category ? (
            <DetailRow label="Category" value={categoryLabels[entry.intimacy_category]} />
          ) : null}

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
            <View style={styles.noteCard}>
              <Text style={styles.noteLabel}>🔒 Private note</Text>

              <Text style={styles.noteText}>{entry.private_note}</Text>
            </View>
          ) : null}

          <View style={styles.entryActions}>
            <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editButton}>
              <Ionicons color={colors.primary} name="create-outline" size={19} />

              <Text style={styles.editButtonText}>Edit</Text>
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

                  <Text style={styles.deleteButtonText}>Delete</Text>
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
  summaryCard: {
    flexDirection: 'row',
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryLabel: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
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
  viewSelector: {
    flexDirection: 'row',
    marginTop: 25,
    padding: 4,
    borderRadius: 15,
    backgroundColor: colors.primarySurface,
  },
  viewButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  viewButtonSelected: {
    backgroundColor: colors.surface,
  },
  viewEmoji: {
    fontSize: 15,
  },
  viewText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  viewTextSelected: {
    color: colors.primary,
  },
  calendarCard: {
    overflow: 'hidden',
    marginTop: 16,
    borderRadius: 19,
    backgroundColor: colors.surface,
  },
  calendarGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  calendarDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  calendarGuideText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  listIntro: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  entryCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  entryPressable: {
    borderRadius: 14,
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
  entryPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  previewText: {
    marginRight: 12,
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },
  detailText: {
    marginRight: 12,
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
  },
  expandedContent: {
    marginTop: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
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
    flex: 1.25,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    color: colors.textPrimary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 11,
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
  noteCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 13,
    backgroundColor: colors.surfaceSoft,
  },
  noteLabel: {
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
  entryActions: {
    flexDirection: 'row',
    marginTop: 15,
  },
  editButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 13,
    backgroundColor: colors.dangerSurface,
  },
  deleteButtonText: {
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
  guideCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  guideTitle: {
    marginBottom: 5,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideRow: {
    flexDirection: 'row',
    marginTop: 15,
  },
  guideEmoji: {
    width: 31,
    fontSize: 19,
  },
  guideContent: {
    flex: 1,
  },
  guideRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  guideParagraph: {
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  guideWarning: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.warningSurface,
    fontSize: 13,
    lineHeight: 19,
    color: colors.warning,
  },
});
