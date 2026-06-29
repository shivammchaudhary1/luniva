import { supabase } from '../../lib/supabase/client';

import type { PartnerAlias, PartnerAliasWriteInput } from './types';

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
