import { getTodayDateOnly } from '../../lib/date';

import type { IntimacyEntryWithAlias, JournalMood, ProtectionMethod } from './types';

export type CountedInsight<Value extends string = string> = {
  value: Value;
  count: number;
};

export type MonthlyJournalActivity = {
  monthKey: string;
  label: string;
  count: number;
};

export type JournalInsightsModel = {
  totalEntries: number;
  currentMonthEntries: number;
  latestEntryDate: string | null;
  monthlyActivity: MonthlyJournalActivity[];
  aliasBreakdown: CountedInsight<string>[];
  protectionBreakdown: CountedInsight<ProtectionMethod | 'not_recorded'>[];
  moodAfterBreakdown: CountedInsight<JournalMood | 'not_recorded'>[];
  topTags: CountedInsight<string>[];
};

function incrementCount(counts: Map<string, number>, value: string): void {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function mapCounts<Value extends string>(counts: Map<string, number>): CountedInsight<Value>[] {
  return [...counts.entries()]
    .map(([value, count]) => ({
      value: value as Value,
      count,
    }))
    .sort((first, second) => second.count - first.count || first.value.localeCompare(second.value));
}

function getMonthKey(dateOnly: string): string {
  return dateOnly.slice(0, 7);
}

function shiftMonth(monthKey: string, offset: number): string {
  const [yearText, monthText] = monthKey.split('-');

  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + offset, 1));

  return date.toISOString().slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  const [yearText, monthText] = monthKey.split('-');

  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function buildJournalInsights(
  entries: IntimacyEntryWithAlias[],
  today = getTodayDateOnly(),
): JournalInsightsModel {
  const currentMonth = getMonthKey(today);

  const monthCounts = new Map<string, number>();

  const aliasCounts = new Map<string, number>();

  const protectionCounts = new Map<string, number>();

  const moodAfterCounts = new Map<string, number>();

  const tagCounts = new Map<string, number>();

  for (const entry of entries) {
    incrementCount(monthCounts, getMonthKey(entry.occurred_on));

    incrementCount(aliasCounts, entry.partner_alias?.alias_name ?? 'No alias');

    incrementCount(protectionCounts, entry.protection_method ?? 'not_recorded');

    incrementCount(moodAfterCounts, entry.mood_after ?? 'not_recorded');

    for (const tag of entry.tags) {
      incrementCount(tagCounts, tag.trim());
    }
  }

  const monthlyActivity = Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const monthKey = shiftMonth(currentMonth, index - 5);

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        count: monthCounts.get(monthKey) ?? 0,
      };
    },
  );

  return {
    totalEntries: entries.length,

    currentMonthEntries: monthCounts.get(currentMonth) ?? 0,

    latestEntryDate: entries[0]?.occurred_on ?? null,

    monthlyActivity,

    aliasBreakdown: mapCounts<string>(aliasCounts).slice(0, 5),

    protectionBreakdown: mapCounts<ProtectionMethod | 'not_recorded'>(protectionCounts),

    moodAfterBreakdown: mapCounts<JournalMood | 'not_recorded'>(moodAfterCounts),

    topTags: mapCounts<string>(tagCounts).slice(0, 8),
  };
}
