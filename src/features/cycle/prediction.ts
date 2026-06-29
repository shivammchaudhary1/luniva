import { addDaysToDateOnly } from '../../lib/date';

import type { CycleOverview } from './types';

const minimumCycleLength = 15;
const maximumCycleLength = 60;
const maximumRecentIntervals = 6;

function differenceInDays(laterDate: string, earlierDate: string): number {
  const laterTime = Date.parse(`${laterDate}T00:00:00Z`);

  const earlierTime = Date.parse(`${earlierDate}T00:00:00Z`);

  return Math.round((laterTime - earlierTime) / (24 * 60 * 60 * 1000));
}

function getMedian(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((first, second) => first - second);

  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex] ?? null;
  }

  const firstMiddleValue = sortedValues[middleIndex - 1];

  const secondMiddleValue = sortedValues[middleIndex];

  if (firstMiddleValue === undefined || secondMiddleValue === undefined) {
    return null;
  }

  return Math.round((firstMiddleValue + secondMiddleValue) / 2);
}

export function getEffectiveCycleLength(overview: CycleOverview): number | null {
  const configuredCycleLength = overview.preferences?.typical_cycle_length;

  if (!configuredCycleLength) {
    return null;
  }

  const uniqueStartDates = [
    ...new Set(overview.periodEntries.map((entry) => entry.started_on)),
  ].sort((first, second) => first.localeCompare(second));

  const validIntervals: number[] = [];

  for (let index = 1; index < uniqueStartDates.length; index += 1) {
    const currentStartDate = uniqueStartDates[index];

    const previousStartDate = uniqueStartDates[index - 1];

    if (!currentStartDate || !previousStartDate) {
      continue;
    }

    const interval = differenceInDays(currentStartDate, previousStartDate);

    if (interval >= minimumCycleLength && interval <= maximumCycleLength) {
      validIntervals.push(interval);
    }
  }

  const recentIntervals = validIntervals.slice(-maximumRecentIntervals);

  if (recentIntervals.length >= 2) {
    return getMedian(recentIntervals) ?? configuredCycleLength;
  }

  return configuredCycleLength;
}

export function getNextPredictedPeriodStart(overview: CycleOverview): string | null {
  if (!overview.preferences || !overview.latestPeriod) {
    return null;
  }

  const effectiveCycleLength = getEffectiveCycleLength(overview);

  if (!effectiveCycleLength) {
    return null;
  }

  return addDaysToDateOnly(overview.latestPeriod.started_on, effectiveCycleLength);
}
