import { z } from 'zod';

export const relationshipCategories = [
  'partner',
  'spouse',
  'dating',
  'casual',
  'other',
  'prefer_not_to_say',
] as const;

export const aliasColorKeys = ['plum', 'orchid', 'rose', 'lavender', 'slate'] as const;

export const partnerAliasSchema = z.object({
  aliasName: z
    .string()
    .trim()
    .min(1, 'Enter a private alias name.')
    .max(40, 'Alias names must contain 40 characters or fewer.')
    .refine((value) => !/[\r\n]/.test(value), 'Alias names must remain on one line.'),

  relationshipCategory: z.enum(relationshipCategories).nullable(),

  emoji: z
    .string()
    .trim()
    .max(8, 'Choose one short emoji.')
    .transform((value) => (value.length > 0 ? value : null)),

  colorKey: z.enum(aliasColorKeys),

  privateNote: z
    .string()
    .trim()
    .max(500, 'Private notes must contain 500 characters or fewer.')
    .transform((value) => (value.length > 0 ? value : null)),
});

export type PartnerAliasFormInput = z.input<typeof partnerAliasSchema>;

export type PartnerAliasResult = z.output<typeof partnerAliasSchema>;
