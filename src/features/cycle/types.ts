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
  periodEntries: PeriodEntry[];
};

export type CompleteCycleSetupInput = {
  typicalCycleLength: number;
  typicalPeriodLength: number;
  cycleRegular: boolean;
  fertilityInsightsEnabled: boolean;
  lastPeriodStartedOn: string;
};

export type CyclePredictionResponse =
  | 'started_on_predicted_date'
  | 'not_started_yet'
  | 'started_on_another_date';

export type CyclePredictionCheckin = {
  id: string;
  owner_user_id: string;
  predicted_start_on: string;
  response: CyclePredictionResponse;
  actual_start_on: string | null;
  responded_at: string;
  created_at: string;
  updated_at: string;
};

export type RespondToCyclePredictionInput = {
  predictedStartOn: string;
  response: CyclePredictionResponse;
  actualStartOn: string | null;
};

export type CyclePredictionResponseResult = {
  checkin: CyclePredictionCheckin;
  periodEntry: PeriodEntry | null;
};

export type CycleFlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type CycleDailyMood = 'very_low' | 'low' | 'neutral' | 'good' | 'very_good';

export type CycleEnergyLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type CycleSymptom =
  | 'cramps'
  | 'bloating'
  | 'headache'
  | 'backache'
  | 'fatigue'
  | 'breast_tenderness'
  | 'nausea'
  | 'acne'
  | 'cravings'
  | 'mood_changes'
  | 'sleep_changes'
  | 'other';

export type DailyCycleLog = {
  id: string;
  owner_user_id: string;
  logged_on: string;
  flow_level: CycleFlowLevel | null;
  mood: CycleDailyMood | null;
  energy_level: CycleEnergyLevel | null;
  symptoms: CycleSymptom[];
  private_note: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyCycleLogWriteInput = {
  loggedOn: string;
  flowLevel: CycleFlowLevel | null;
  mood: CycleDailyMood | null;
  energyLevel: CycleEnergyLevel | null;
  symptoms: CycleSymptom[];
  privateNote: string | null;
};
