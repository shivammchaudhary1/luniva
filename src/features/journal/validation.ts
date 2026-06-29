import { z } from 'zod';
import { getTodayDateOnly, parseDisplayDateToDateOnly } from '../../lib/date';

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

export const journalLocationCategories = [
  'home',
  'partner_home',
  'hotel',
  'travel',
  'other',
  'prefer_not_to_say',
] as const;

export const protectionMethods = [
  'barrier',
  'hormonal',
  'barrier_and_hormonal',
  'other',
  'none_recorded',
  'prefer_not_to_say',
] as const;

export const consentStatuses = ['consensual', 'unsure', 'prefer_not_to_say'] as const;

export const journalMoods = [
  'very_low',
  'low',
  'neutral',
  'good',
  'very_good',
  'prefer_not_to_say',
] as const;

export const intimacyCategories = [
  'affection',
  'intimacy',
  'sexual_activity',
  'other',
  'prefer_not_to_say',
] as const;

const journalDateSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use the date format DD/MM/YYYY.')
  .superRefine((value, context) => {
    const internalDate = parseDisplayDateToDateOnly(value);

    if (!internalDate) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a valid calendar date.',
      });

      return;
    }

    if (internalDate > getTodayDateOnly()) {
      context.addIssue({
        code: 'custom',
        message: 'A journal entry cannot be in the future.',
      });
    }
  })
  .transform((value) => parseDisplayDateToDateOnly(value) ?? value);

const approximateTimeSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    'Use time format HH:MM.',
  )
  .transform((value) => (value.length > 0 ? value : null));

const tagsSchema = z
  .string()
  .transform((value) => {
    const uniqueTags = new Map<string, string>();

    for (const rawTag of value.split(',')) {
      const tag = rawTag.trim();

      if (!tag) {
        continue;
      }

      const normalizedTag = tag.toLocaleLowerCase();

      if (!uniqueTags.has(normalizedTag)) {
        uniqueTags.set(normalizedTag, tag);
      }
    }

    return [...uniqueTags.values()];
  })
  .refine((tags) => tags.length <= 10, 'Add no more than 10 tags.')
  .refine(
    (tags) => tags.every((tag) => tag.length <= 30),
    'Each tag must contain 30 characters or fewer.',
  );

export const intimacyEntrySchema = z.object({
  partnerAliasId: z.string().uuid().nullable(),

  occurredOn: journalDateSchema,

  approximateTime: approximateTimeSchema,

  locationCategory: z.enum(journalLocationCategories).nullable(),

  protectionMethod: z.enum(protectionMethods).nullable(),

  consentStatus: z.enum(consentStatuses),

  moodBefore: z.enum(journalMoods).nullable(),

  moodAfter: z.enum(journalMoods).nullable(),

  intimacyCategory: z.enum(intimacyCategories).nullable(),

  tagsInput: tagsSchema,

  privateNote: z
    .string()
    .trim()
    .max(2000, 'Private notes must contain 2,000 characters or fewer.')
    .transform((value) => (value.length > 0 ? value : null)),
});

export type IntimacyEntryFormInput = z.input<typeof intimacyEntrySchema>;

export type IntimacyEntryResult = z.output<typeof intimacyEntrySchema>;
