import { supabase } from '../../lib/supabase/client';

import type {
  CompleteCycleSetupInput,
  CycleOverview,
  CyclePreferences,
  PeriodEntry,
  CyclePredictionCheckin,
  CyclePredictionResponseResult,
  RespondToCyclePredictionInput,
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

const cyclePredictionCheckinColumns = `
  id,
  owner_user_id,
  predicted_start_on,
  response,
  actual_start_on,
  responded_at,
  created_at,
  updated_at
`;

export async function getCycleOverview(userId: string): Promise<CycleOverview> {
  const [preferencesResult, periodEntriesResult] = await Promise.all([
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
      .limit(24),
  ]);

  if (preferencesResult.error) {
    throw new Error(preferencesResult.error.message);
  }

  if (periodEntriesResult.error) {
    throw new Error(periodEntriesResult.error.message);
  }

  const periodEntries = (periodEntriesResult.data ?? []) as PeriodEntry[];

  return {
    preferences: preferencesResult.data as CyclePreferences | null,

    latestPeriod: periodEntries[0] ?? null,

    periodEntries,
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

export type SavePeriodEntryInput = {
  ownerUserId: string;
  startedOn: string;
  endedOn: string | null;
};

export async function createPeriodEntry(input: SavePeriodEntryInput): Promise<PeriodEntry> {
  const { data, error } = await supabase
    .from('period_entries')
    .insert({
      owner_user_id: input.ownerUserId,
      started_on: input.startedOn,
      ended_on: input.endedOn,
    })
    .select(periodColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PeriodEntry;
}

export async function updatePeriodEntry(
  periodEntryId: string,
  input: SavePeriodEntryInput,
): Promise<PeriodEntry> {
  const { data, error } = await supabase
    .from('period_entries')
    .update({
      started_on: input.startedOn,
      ended_on: input.endedOn,
    })
    .eq('id', periodEntryId)
    .eq('owner_user_id', input.ownerUserId)
    .select(periodColumns)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'The period could not be updated. It may no longer exist or you may not have permission to edit it.',
    );
  }

  return data as PeriodEntry;
}

export async function deletePeriodEntry(periodEntryId: string, ownerUserId: string): Promise<void> {
  const { error } = await supabase
    .from('period_entries')
    .delete()
    .eq('id', periodEntryId)
    .eq('owner_user_id', ownerUserId);

  if (error) {
    throw new Error(error.message);
  }
}

type PredictionRpcPayload = {
  checkin: {
    id: string;
    owner_user_id: string;
    predicted_start_on: string;
    response: RespondToCyclePredictionInput['response'];
    actual_start_on: string | null;
    responded_at: string;
    created_at: string;
    updated_at: string;
  };

  period_entry: {
    id: string;
    owner_user_id: string;
    started_on: string;
    ended_on: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};

export async function respondToCyclePrediction(
  input: RespondToCyclePredictionInput,
): Promise<CyclePredictionResponseResult> {
  const { data, error } = await supabase.rpc('respond_to_cycle_prediction', {
    p_predicted_start_on: input.predictedStartOn,

    p_response: input.response,

    p_actual_start_on: input.actualStartOn,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('The prediction response could not be saved.');
  }

  const payload = data as PredictionRpcPayload;

  return {
    checkin: payload.checkin,

    periodEntry: payload.period_entry,
  };
}

export async function getCyclePredictionCheckin(
  ownerUserId: string,
  predictedStartOn: string,
): Promise<CyclePredictionCheckin | null> {
  const { data, error } = await supabase
    .from('cycle_prediction_checkins')
    .select(cyclePredictionCheckinColumns)
    .eq('owner_user_id', ownerUserId)
    .eq('predicted_start_on', predictedStartOn)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CyclePredictionCheckin | null;
}
