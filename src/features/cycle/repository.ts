import { supabase } from '../../lib/supabase/client';

import type {
  CompleteCycleSetupInput,
  CycleOverview,
  CyclePreferences,
  PeriodEntry,
} from './types';

const preferenceColumns = `
  user_id,
  typical_cycle_length,
  typical_period_length,
  cycle_regular,
  fertility_insights_enabled,
  setup_completed_at,
  created_at,
  updated_at
`;

const periodColumns = `
  id,
  owner_user_id,
  started_on,
  ended_on,
  created_at,
  updated_at
`;

export async function getCycleOverview(userId: string): Promise<CycleOverview> {
  const [preferencesResult, latestPeriodResult] = await Promise.all([
    supabase
      .from('cycle_preferences')
      .select(preferenceColumns)
      .eq('user_id', userId)
      .maybeSingle(),

    supabase
      .from('period_entries')
      .select(periodColumns)
      .eq('owner_user_id', userId)
      .order('started_on', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  if (preferencesResult.error) {
    throw new Error(preferencesResult.error.message);
  }

  if (latestPeriodResult.error) {
    throw new Error(latestPeriodResult.error.message);
  }

  return {
    preferences: preferencesResult.data as CyclePreferences | null,

    latestPeriod: latestPeriodResult.data as PeriodEntry | null,
  };
}

export async function saveCycleSetup(input: CompleteCycleSetupInput): Promise<void> {
  const { error } = await supabase.rpc('complete_cycle_setup', {
    p_typical_cycle_length: input.typicalCycleLength,

    p_typical_period_length: input.typicalPeriodLength,

    p_cycle_regular: input.cycleRegular,

    p_fertility_insights_enabled: input.fertilityInsightsEnabled,

    p_last_period_started_on: input.lastPeriodStartedOn,
  });

  if (error) {
    throw new Error(error.message);
  }
}
