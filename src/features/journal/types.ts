export type RelationshipCategory =
  | 'partner'
  | 'spouse'
  | 'dating'
  | 'casual'
  | 'other'
  | 'prefer_not_to_say';

export type AliasColorKey = 'plum' | 'orchid' | 'rose' | 'lavender' | 'slate';

export type PartnerAlias = {
  id: string;
  owner_user_id: string;
  alias_name: string;
  relationship_category: RelationshipCategory | null;
  emoji: string | null;
  color_key: AliasColorKey;
  private_note: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PartnerAliasWriteInput = {
  aliasName: string;
  relationshipCategory: RelationshipCategory | null;
  emoji: string | null;
  colorKey: AliasColorKey;
  privateNote: string | null;
};

export type JournalLocationCategory =
  | 'home'
  | 'partner_home'
  | 'hotel'
  | 'travel'
  | 'other'
  | 'prefer_not_to_say';

export type ProtectionMethod =
  | 'barrier'
  | 'hormonal'
  | 'barrier_and_hormonal'
  | 'other'
  | 'none_recorded'
  | 'prefer_not_to_say';

export type ConsentStatus = 'consensual' | 'unsure' | 'prefer_not_to_say';

export type JournalMood =
  | 'very_low'
  | 'low'
  | 'neutral'
  | 'good'
  | 'very_good'
  | 'prefer_not_to_say';

export type IntimacyCategory =
  | 'affection'
  | 'intimacy'
  | 'sexual_activity'
  | 'other'
  | 'prefer_not_to_say';

export type IntimacyEntry = {
  id: string;
  owner_user_id: string;
  partner_alias_id: string | null;
  occurred_on: string;
  approximate_time: string | null;
  location_category: JournalLocationCategory | null;
  protection_method: ProtectionMethod | null;
  consent_status: ConsentStatus;
  mood_before: JournalMood | null;
  mood_after: JournalMood | null;
  intimacy_category: IntimacyCategory | null;
  tags: string[];
  private_note: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalAliasSummary = {
  id: string;
  alias_name: string;
  emoji: string | null;
  color_key: AliasColorKey;
  is_archived: boolean;
};

export type IntimacyEntryWithAlias = IntimacyEntry & {
  partner_alias: JournalAliasSummary | null;
};

export type IntimacyEntryWriteInput = {
  partnerAliasId: string | null;
  occurredOn: string;
  approximateTime: string | null;
  locationCategory: JournalLocationCategory | null;
  protectionMethod: ProtectionMethod | null;
  consentStatus: ConsentStatus;
  moodBefore: JournalMood | null;
  moodAfter: JournalMood | null;
  intimacyCategory: IntimacyCategory | null;
  tags: string[];
  privateNote: string | null;
};
