import { supabase } from '../../lib/supabase/client';

import type {
  IntimacyEntryWithAlias,
  IntimacyEntryWriteInput,
  PartnerAlias,
  PartnerAliasWriteInput,
} from './types';

const partnerAliasColumns = `
  id,
  owner_user_id,
  alias_name,
  relationship_category,
  emoji,
  color_key,
  private_note,
  is_archived,
  created_at,
  updated_at
`;

const intimacyEntryColumns = `
  id,
  owner_user_id,
  partner_alias_id,
  occurred_on,
  approximate_time,
  location_category,
  protection_method,
  consent_status,
  mood_before,
  mood_after,
  intimacy_category,
  tags,
  private_note,
  created_at,
  updated_at,
  partner_alias:partner_aliases (
    id,
    alias_name,
    emoji,
    color_key,
    is_archived
  )
`;

export async function getPartnerAliases(ownerUserId: string): Promise<PartnerAlias[]> {
  const { data, error } = await supabase
    .from('partner_aliases')
    .select(partnerAliasColumns)
    .eq('owner_user_id', ownerUserId)
    .order('is_archived', {
      ascending: true,
    })
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PartnerAlias[];
}

export async function createPartnerAlias(
  ownerUserId: string,
  input: PartnerAliasWriteInput,
): Promise<PartnerAlias> {
  const { data, error } = await supabase
    .from('partner_aliases')
    .insert({
      owner_user_id: ownerUserId,
      alias_name: input.aliasName,
      relationship_category: input.relationshipCategory,
      emoji: input.emoji,
      color_key: input.colorKey,
      private_note: input.privateNote,
    })
    .select(partnerAliasColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PartnerAlias;
}

export async function updatePartnerAlias(
  aliasId: string,
  ownerUserId: string,
  input: PartnerAliasWriteInput,
): Promise<PartnerAlias> {
  const { data, error } = await supabase
    .from('partner_aliases')
    .update({
      alias_name: input.aliasName,
      relationship_category: input.relationshipCategory,
      emoji: input.emoji,
      color_key: input.colorKey,
      private_note: input.privateNote,
    })
    .eq('id', aliasId)
    .eq('owner_user_id', ownerUserId)
    .select(partnerAliasColumns)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('The private alias could not be updated.');
  }

  return data as PartnerAlias;
}

export async function setPartnerAliasArchived(
  aliasId: string,
  ownerUserId: string,
  isArchived: boolean,
): Promise<PartnerAlias> {
  const { data, error } = await supabase
    .from('partner_aliases')
    .update({
      is_archived: isArchived,
    })
    .eq('id', aliasId)
    .eq('owner_user_id', ownerUserId)
    .select(partnerAliasColumns)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('The private alias could not be changed.');
  }

  return data as PartnerAlias;
}

export async function deletePartnerAlias(aliasId: string, ownerUserId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_aliases')
    .delete()
    .eq('id', aliasId)
    .eq('owner_user_id', ownerUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getRecentIntimacyEntries(
  ownerUserId: string,
  limit = 20,
): Promise<IntimacyEntryWithAlias[]> {
  const { data, error } = await supabase
    .from('intimacy_entries')
    .select(intimacyEntryColumns)
    .eq('owner_user_id', ownerUserId)
    .order('occurred_on', {
      ascending: false,
    })
    .order('created_at', {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as IntimacyEntryWithAlias[];
}

export async function createIntimacyEntry(
  ownerUserId: string,
  input: IntimacyEntryWriteInput,
): Promise<IntimacyEntryWithAlias> {
  const { data, error } = await supabase
    .from('intimacy_entries')
    .insert({
      owner_user_id: ownerUserId,
      partner_alias_id: input.partnerAliasId,
      occurred_on: input.occurredOn,
      approximate_time: input.approximateTime,
      location_category: input.locationCategory,
      protection_method: input.protectionMethod,
      consent_status: input.consentStatus,
      mood_before: input.moodBefore,
      mood_after: input.moodAfter,
      intimacy_category: input.intimacyCategory,
      tags: input.tags,
      private_note: input.privateNote,
    })
    .select(intimacyEntryColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as IntimacyEntryWithAlias;
}

export async function updateIntimacyEntry(
  entryId: string,
  ownerUserId: string,
  input: IntimacyEntryWriteInput,
): Promise<IntimacyEntryWithAlias> {
  const { data, error } = await supabase
    .from('intimacy_entries')
    .update({
      partner_alias_id: input.partnerAliasId,

      occurred_on: input.occurredOn,

      approximate_time: input.approximateTime,

      location_category: input.locationCategory,

      protection_method: input.protectionMethod,

      consent_status: input.consentStatus,

      mood_before: input.moodBefore,

      mood_after: input.moodAfter,

      intimacy_category: input.intimacyCategory,

      tags: input.tags,

      private_note: input.privateNote,
    })
    .eq('id', entryId)
    .eq('owner_user_id', ownerUserId)
    .select(intimacyEntryColumns)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('The private entry could not be updated.');
  }

  return data as unknown as IntimacyEntryWithAlias;
}

export async function deleteIntimacyEntry(entryId: string, ownerUserId: string): Promise<void> {
  const { error } = await supabase
    .from('intimacy_entries')
    .delete()
    .eq('id', entryId)
    .eq('owner_user_id', ownerUserId);

  if (error) {
    throw new Error(error.message);
  }
}
