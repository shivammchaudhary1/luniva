export type GenderOption = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';

export type Profile = {
  id: string;
  display_name: string;
  gender: GenderOption | null;
  age_confirmed_at: string | null;
  timezone: string;
  cycle_module_enabled: boolean;
  journal_module_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};
