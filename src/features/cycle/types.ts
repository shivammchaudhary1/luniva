export type CyclePreferences = {
  user_id: string;
  typical_cycle_length: number;
  typical_period_length: number;
  cycle_regular: boolean;
  fertility_insights_enabled: boolean;
  setup_completed_at: string;
  created_at: string;
  updated_at: string;
};

export type PeriodEntry = {
  id: string;
  owner_user_id: string;
  started_on: string;
  ended_on: string | null;
  created_at: string;
  updated_at: string;
};

export type CycleOverview = {
  preferences: CyclePreferences | null;
  latestPeriod: PeriodEntry | null;
};

export type CompleteCycleSetupInput = {
  typicalCycleLength: number;
  typicalPeriodLength: number;
  cycleRegular: boolean;
  fertilityInsightsEnabled: boolean;
  lastPeriodStartedOn: string;
};
