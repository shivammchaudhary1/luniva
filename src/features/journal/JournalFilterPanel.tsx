import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../../theme/colors';

import type { JournalMood, PartnerAlias, ProtectionMethod } from './types';

import type { JournalFilterState } from './journalFilters';

type JournalFilterPanelProps = {
  aliases: PartnerAlias[];
  filters: JournalFilterState;
  resultCount: number;
  validationError: string | null;
  onChange: (filters: JournalFilterState) => void;
  onClear: () => void;
};

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

const protectionOptions: FilterOption<ProtectionMethod>[] = [
  {
    value: 'barrier',
    label: 'Barrier',
  },
  {
    value: 'hormonal',
    label: 'Hormonal',
  },
  {
    value: 'barrier_and_hormonal',
    label: 'Barrier + hormonal',
  },
  {
    value: 'none_recorded',
    label: 'None recorded',
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

const moodOptions: FilterOption<JournalMood>[] = [
  {
    value: 'very_low',
    label: '😞 Very low',
  },
  {
    value: 'low',
    label: '🙁 Low',
  },
  {
    value: 'neutral',
    label: '😐 Neutral',
  },
  {
    value: 'good',
    label: '🙂 Good',
  },
  {
    value: 'very_good',
    label: '😊 Very good',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Prefer not to say',
  },
];

export function JournalFilterPanel({
  aliases,
  filters,
  resultCount,
  validationError,
  onChange,
  onClear,
}: JournalFilterPanelProps) {
  const updateFilter = <Key extends keyof JournalFilterState>(
    key: Key,
    value: JournalFilterState[Key],
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Search and filters</Text>

          <Text style={styles.resultText}>
            {resultCount} {resultCount === 1 ? 'entry' : 'entries'} found
          </Text>
        </View>

        <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton}>
          <Ionicons color={colors.primary} name="refresh-outline" size={17} />

          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Search</Text>

      <View style={styles.searchContainer}>
        <Ionicons color={colors.textMuted} name="search-outline" size={19} />

        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => {
            updateFilter('searchQuery', value);
          }}
          placeholder="Alias, tag, category or note"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={filters.searchQuery}
        />
      </View>

      <Text style={styles.label}>Private alias</Text>

      <View style={styles.chipContainer}>
        <FilterChip
          label="All aliases"
          onPress={() => {
            updateFilter('aliasId', null);
          }}
          selected={filters.aliasId === null}
        />

        {aliases.map((alias) => (
          <FilterChip
            key={alias.id}
            label={`${alias.emoji ?? '👤'} ${alias.alias_name}${
              alias.is_archived ? ' (Archived)' : ''
            }`}
            onPress={() => {
              updateFilter('aliasId', alias.id);
            }}
            selected={filters.aliasId === alias.id}
          />
        ))}
      </View>

      <Text style={styles.label}>Protection</Text>

      <View style={styles.chipContainer}>
        <FilterChip
          label="All"
          onPress={() => {
            updateFilter('protectionMethod', null);
          }}
          selected={filters.protectionMethod === null}
        />

        {protectionOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            onPress={() => {
              updateFilter('protectionMethod', option.value);
            }}
            selected={filters.protectionMethod === option.value}
          />
        ))}
      </View>

      <Text style={styles.label}>Mood after</Text>

      <View style={styles.chipContainer}>
        <FilterChip
          label="All"
          onPress={() => {
            updateFilter('moodAfter', null);
          }}
          selected={filters.moodAfter === null}
        />

        {moodOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            onPress={() => {
              updateFilter('moodAfter', option.value);
            }}
            selected={filters.moodAfter === option.value}
          />
        ))}
      </View>

      <Text style={styles.label}>Date range</Text>

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>From</Text>

          <TextInput
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={(value) => {
              updateFilter('dateFromInput', value);
            }}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            style={styles.dateInput}
            value={filters.dateFromInput}
          />
        </View>

        <View style={styles.dateSpacer} />

        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>To</Text>

          <TextInput
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onChangeText={(value) => {
              updateFilter('dateToInput', value);
            }}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            style={styles.dateInput}
            value={filters.dateToInput}
          />
        </View>
      </View>

      {validationError ? (
        <View style={styles.errorCard}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={19} />

          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      ) : null}
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
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

const styles = StyleSheet.create({
  card: {
    marginTop: 17,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultText: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },
  clearButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
  },
  clearText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    marginTop: 5,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surfaceSoft,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 15,
    color: colors.textPrimary,
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
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.surfaceSoft,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateField: {
    flex: 1,
  },
  dateSpacer: {
    width: 12,
  },
  dateLabel: {
    marginBottom: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  dateInput: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surfaceSoft,
    fontSize: 14,
    color: colors.textPrimary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.dangerSurface,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.danger,
  },
});
