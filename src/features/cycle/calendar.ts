import { addDaysToDateOnly, getTodayDateOnly } from './date';

import type { CycleOverview } from './types';

export type CycleDayKind =
  | 'recorded_period'
  | 'predicted_period'
  | 'potentially_fertile'
  | 'estimated_ovulation'
  | 'lower_likelihood'
  | 'neutral';

export type CycleDayInsight = {
  date: string;
  kind: CycleDayKind;
  emoji: string;
  title: string;
  description: string;
};

export type UpcomingCycleItem = {
  id: string;
  date: string;
  endDate: string | null;
  emoji: string;
  title: string;
  description: string;
};

export type CycleCalendarModel = {
  days: Record<string, CycleDayInsight>;
  upcoming: UpcomingCycleItem[];
  fertilityAvailable: boolean;
  fertilityMessage: string;
  rangeStart: string;
  rangeEnd: string;
};

function dateOnlyToTimestamp(value: string): number {
  const [year, month, day] = value.split('-').map(Number);

  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function differenceInDays(start: string, end: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((dateOnlyToTimestamp(end) - dateOnlyToTimestamp(start)) / millisecondsPerDay);
}

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  let safetyCounter = 0;

  while (current <= end && safetyCounter < 500) {
    dates.push(current);

    current = addDaysToDateOnly(current, 1);

    safetyCounter += 1;
  }

  return dates;
}

function setDayInsight(days: Record<string, CycleDayInsight>, insight: CycleDayInsight): void {
  days[insight.date] = insight;
}

export function buildCycleCalendarModel(
  overview: CycleOverview,
  today = getTodayDateOnly(),
): CycleCalendarModel {
  const preferences = overview.preferences;

  const latestPeriod = overview.latestPeriod;

  if (!preferences || !latestPeriod) {
    return {
      days: {},
      upcoming: [],
      fertilityAvailable: false,
      fertilityMessage: 'Complete cycle setup to see calendar estimates.',
      rangeStart: today,
      rangeEnd: today,
    };
  }

  const cycleLength = preferences.typical_cycle_length;

  const periodLength = preferences.typical_period_length;

  const daysSinceLatestPeriod = Math.max(0, differenceInDays(latestPeriod.started_on, today));

  const currentCycleIndex = Math.floor(daysSinceLatestPeriod / cycleLength);

  const firstCycleIndex = Math.max(0, currentCycleIndex);

  const finalCycleIndex = firstCycleIndex + 3;

  const rangeStart = addDaysToDateOnly(latestPeriod.started_on, firstCycleIndex * cycleLength);

  const rangeEnd = addDaysToDateOnly(
    latestPeriod.started_on,
    (finalCycleIndex + 1) * cycleLength - 1,
  );

  const fertilityAvailable =
    preferences.fertility_insights_enabled &&
    preferences.cycle_regular &&
    cycleLength >= 26 &&
    cycleLength <= 32;

  let fertilityMessage: string;

  if (!preferences.fertility_insights_enabled) {
    fertilityMessage = 'Fertility estimates are disabled in your cycle settings.';
  } else if (!preferences.cycle_regular) {
    fertilityMessage = 'Fertility estimates are hidden because your cycle is marked as irregular.';
  } else if (cycleLength < 26 || cycleLength > 32) {
    fertilityMessage =
      'Calendar-only fertility estimates are not shown because your typical cycle is outside 26–32 days.';
  } else {
    fertilityMessage = 'Highlighted fertility dates are estimates, not guarantees.';
  }

  const days: Record<string, CycleDayInsight> = {};

  const upcoming: UpcomingCycleItem[] = [];

  for (let cycleIndex = firstCycleIndex; cycleIndex <= finalCycleIndex; cycleIndex += 1) {
    const cycleStart = addDaysToDateOnly(latestPeriod.started_on, cycleIndex * cycleLength);

    const cycleEnd = addDaysToDateOnly(cycleStart, cycleLength - 1);

    if (fertilityAvailable) {
      for (const date of getDateRange(cycleStart, cycleEnd)) {
        setDayInsight(days, {
          date,
          kind: 'lower_likelihood',
          emoji: '🔹',
          title: 'Lower estimated conception likelihood',
          description:
            'Pregnancy may still be possible. This date must not be treated as a guaranteed safe day.',
        });
      }

      const fertileStart = addDaysToDateOnly(cycleStart, 7);

      const fertileEnd = addDaysToDateOnly(cycleStart, 18);

      for (const date of getDateRange(fertileStart, fertileEnd)) {
        setDayInsight(days, {
          date,
          kind: 'potentially_fertile',
          emoji: '🌱',
          title: 'Potentially fertile',
          description:
            'This date falls within the calendar-estimated fertility window and may be more favorable for conception.',
        });
      }

      const estimatedOvulation = addDaysToDateOnly(cycleStart, cycleLength - 15);

      setDayInsight(days, {
        date: estimatedOvulation,
        kind: 'estimated_ovulation',
        emoji: '✨',
        title: 'Estimated ovulation',
        description: 'This is an approximate ovulation estimate based only on cycle timing.',
      });

      if (fertileEnd >= today) {
        upcoming.push({
          id: `fertility-${cycleIndex}`,
          date: fertileStart,
          endDate: fertileEnd,
          emoji: '🌱',
          title: 'Estimated fertility window',
          description: 'Potentially more favorable timing for conception.',
        });
      }

      if (estimatedOvulation >= today) {
        upcoming.push({
          id: `ovulation-${cycleIndex}`,
          date: estimatedOvulation,
          endDate: null,
          emoji: '✨',
          title: 'Estimated ovulation',
          description: 'Approximate calendar-based estimate.',
        });
      }
    }

    if (cycleIndex > 0) {
      const predictedPeriodEnd = addDaysToDateOnly(cycleStart, periodLength - 1);

      for (const date of getDateRange(cycleStart, predictedPeriodEnd)) {
        setDayInsight(days, {
          date,
          kind: 'predicted_period',
          emoji: '🌸',
          title: 'Predicted period',
          description: 'This date is part of your estimated upcoming period range.',
        });
      }

      if (predictedPeriodEnd >= today) {
        upcoming.push({
          id: `period-${cycleIndex}`,
          date: cycleStart,
          endDate: predictedPeriodEnd,
          emoji: '🌸',
          title: 'Predicted period',
          description: 'Estimated using your typical cycle and period lengths.',
        });
      }
    }
  }

  for (const entry of overview.periodEntries) {
    const recordedEnd =
      entry.ended_on ?? addDaysToDateOnly(entry.started_on, Math.max(periodLength, 1) - 1);

    for (const date of getDateRange(entry.started_on, recordedEnd)) {
      setDayInsight(days, {
        date,
        kind: 'recorded_period',
        emoji: '🩸',
        title: 'Recorded period',
        description: entry.ended_on
          ? 'This date is part of a recorded bleeding range.'
          : 'This date is displayed using your typical period duration because an end date was not recorded.',
      });
    }
  }

  upcoming.sort((first, second) => first.date.localeCompare(second.date));

  return {
    days,
    upcoming: upcoming.slice(0, 8),
    fertilityAvailable,
    fertilityMessage,
    rangeStart,
    rangeEnd,
  };
}
