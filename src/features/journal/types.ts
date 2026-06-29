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
