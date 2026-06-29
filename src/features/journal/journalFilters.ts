import { parseDisplayDateToDateOnly } from '../../lib/date';

import type { IntimacyEntryWithAlias, JournalMood, ProtectionMethod } from './types';

export type JournalFilterState = {
  searchQuery: string;
  aliasId: string | null;
  protectionMethod: ProtectionMethod | null;
  moodAfter: JournalMood | null;
  dateFromInput: string;
  dateToInput: string;
};

export type JournalFilterResult = {
  entries: IntimacyEntryWithAlias[];
  error: string | null;
};

export function createEmptyJournalFilters(): JournalFilterState {
  return {
    searchQuery: '',
    aliasId: null,
    protectionMethod: null,
    moodAfter: null,
    dateFromInput: '',
    dateToInput: '',
  };
}

export function hasActiveJournalFilters(filters: JournalFilterState): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    filters.aliasId !== null ||
    filters.protectionMethod !== null ||
    filters.moodAfter !== null ||
    filters.dateFromInput.trim().length > 0 ||
    filters.dateToInput.trim().length > 0
  );
}

function getInternalDate(displayValue: string): string | null {
  const trimmedValue = displayValue.trim();

  if (!trimmedValue) {
    return null;
  }

  return parseDisplayDateToDateOnly(trimmedValue);
}

function buildSearchableText(entry: IntimacyEntryWithAlias): string {
  const values = [
    entry.partner_alias?.alias_name,
    entry.location_category,
    entry.protection_method,
    entry.consent_status,
    entry.mood_before,
    entry.mood_after,
    entry.intimacy_category,
    entry.private_note,
    ...entry.tags,
  ];

  return values
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase();
}

export function filterJournalEntries(
  entries: IntimacyEntryWithAlias[],
  filters: JournalFilterState,
): JournalFilterResult {
  const dateFrom = getInternalDate(filters.dateFromInput);

  const dateTo = getInternalDate(filters.dateToInput);

  if (filters.dateFromInput.trim() && !dateFrom) {
    return {
      entries: [],
      error: 'Enter a valid From date using DD/MM/YYYY.',
    };
  }

  if (filters.dateToInput.trim() && !dateTo) {
    return {
      entries: [],
      error: 'Enter a valid To date using DD/MM/YYYY.',
    };
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      entries: [],
      error: 'The From date cannot be after the To date.',
    };
  }

  const normalizedSearch = filters.searchQuery.trim().toLocaleLowerCase();

  const filteredEntries = entries.filter((entry) => {
    if (normalizedSearch && !buildSearchableText(entry).includes(normalizedSearch)) {
      return false;
    }

    if (filters.aliasId && entry.partner_alias_id !== filters.aliasId) {
      return false;
    }

    if (filters.protectionMethod && entry.protection_method !== filters.protectionMethod) {
      return false;
    }

    if (filters.moodAfter && entry.mood_after !== filters.moodAfter) {
      return false;
    }

    if (dateFrom && entry.occurred_on < dateFrom) {
      return false;
    }

    if (dateTo && entry.occurred_on > dateTo) {
      return false;
    }

    return true;
  });

  return {
    entries: filteredEntries,
    error: null,
  };
}
